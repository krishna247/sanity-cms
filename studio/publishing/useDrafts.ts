import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'

// The list of documents with a pending draft, kept live. Only ids and stamps
// are fetched here; each row subscribes to the document store for content, so
// the list stays cheap however large the documents are (the Crown project doc
// is hundreds of KB).

export interface DraftRef {
  draftId: string
  publishedId: string
  type: string
  createdAt: string
  updatedAt: string
}

export const API_VERSION = '2025-01-01'

// System documents that are drafts by nature but never "content".
const EXCLUDED_TYPES = ['sanity.previewUrlSecret', 'sanity.imageAsset', 'sanity.fileAsset']

const FILTER = `_id in path("drafts.**") && !(_type in $excluded)`
const PARAMS = {excluded: EXCLUDED_TYPES}
const QUERY = `*[${FILTER}] | order(_updatedAt desc) { _id, _type, _createdAt, _updatedAt }`
const COUNT_QUERY = `count(*[${FILTER}])`

interface Row {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

export interface DraftsState {
  items: DraftRef[]
  loading: boolean
  error: string | null
  refresh: () => void
}

/** A raw-perspective client: the Studio client may default to a drafts
 *  perspective that folds drafts.* ids onto their published ids, which would
 *  empty every query here. Stable per component instance. */
function useRawClient() {
  const studioClient = useClient({apiVersion: API_VERSION})
  return useRef(studioClient.withConfig({perspective: 'raw'})).current
}

/** Re-run `load` after any mutation to a draft, coalescing bursts (every
 *  keystroke is one event) and re-checking when the tab becomes visible. */
function useDraftWatcher(load: () => void, onError: (message: string) => void) {
  const client = useRawClient()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(load, 400)
    }
    load()
    const subscription = client
      .listen(`*[${FILTER}]`, PARAMS, {
        events: ['mutation', 'reconnect'],
        includeResult: false,
        visibility: 'query',
        tag: 'publishing.drafts',
      })
      .subscribe({
        next: schedule,
        error: (err: unknown) => onError(err instanceof Error ? err.message : String(err)),
      })
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [client, load, onError])
}

export function useDrafts(): DraftsState {
  const client = useRawClient()
  const [items, setItems] = useState<DraftRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // Loads can overlap (initial, debounced mutation, visibility, manual refresh);
  // only the newest one may write, so a slow pre-publish response cannot
  // resurrect a draft the next response already dropped.
  const generation = useRef(0)
  const load = useCallback(() => {
    const mine = ++generation.current
    client
      .fetch<Row[]>(QUERY, PARAMS, {tag: 'publishing.drafts'})
      .then((rows) => {
        if (!alive.current || mine !== generation.current) return
        setItems(
          rows.map((row) => ({
            draftId: row._id,
            publishedId: row._id.replace(/^drafts\./, ''),
            type: row._type,
            createdAt: row._createdAt,
            updatedAt: row._updatedAt,
          })),
        )
        setError(null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!alive.current || mine !== generation.current) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
  }, [client])

  const onError = useCallback((message: string) => {
    if (alive.current) setError(message)
  }, [])

  useDraftWatcher(load, onError)

  return {items, loading, error, refresh: load}
}

/** Just the number of pending drafts, live — for the tool tab's badge. */
export function useDraftCount(): number {
  const client = useRawClient()
  const [count, setCount] = useState(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const generation = useRef(0)
  const load = useCallback(() => {
    const mine = ++generation.current
    client
      .fetch<number>(COUNT_QUERY, PARAMS, {tag: 'publishing.count'})
      .then((n) => {
        if (alive.current && mine === generation.current) setCount(n)
      })
      .catch(() => undefined)
  }, [client])
  const ignore = useCallback(() => undefined, [])
  useDraftWatcher(load, ignore)
  return count
}
