import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {API_VERSION} from './useDrafts'

// Who made the latest change to a draft, from the dataset's transaction log
// (the same history the document's "Edited 3 hr. ago" footer reads). One
// request per draft revision, memoised for the session: the answer only changes
// when `_updatedAt` does. Failures (403 for a role without history access,
// throttling, offline) are NOT cached, so the next revision retries; the cache
// is capped so a long session cannot grow it without bound.

export interface LastEdit {
  author: string | null
  timestamp: string | null
}

interface Transaction {
  author?: string
  timestamp?: string
}

const cache = new Map<string, Promise<LastEdit>>()
const CACHE_MAX = 500
const UNKNOWN: LastEdit = {author: null, timestamp: null}

function parseFirstLine(body: unknown): LastEdit {
  // The history endpoint answers NDJSON; with limit=1 that is one JSON line.
  // Depending on the content type the client hands back parsed JSON or text.
  let tx: Transaction | undefined
  if (typeof body === 'string') {
    const line = body.trim().split('\n')[0]
    tx = line ? (JSON.parse(line) as Transaction) : undefined
  } else if (body && typeof body === 'object') {
    tx = body as Transaction
  }
  return {author: tx?.author ?? null, timestamp: tx?.timestamp ?? null}
}

export function useLastEdit(draftId: string, updatedAt: string): LastEdit | null {
  const client = useClient({apiVersion: API_VERSION})
  const [state, setState] = useState<LastEdit | null>(null)
  const dataset = client.config().dataset

  useEffect(() => {
    // A new revision means a possibly different author: never show the old one.
    setState(null)
    if (!draftId || !updatedAt) return undefined
    let cancelled = false
    const key = `${dataset}/${draftId}@${updatedAt}`
    let pending = cache.get(key)
    if (!pending) {
      if (cache.size >= CACHE_MAX) cache.clear()
      pending = client
        .request<unknown>({
          uri: `/data/history/${dataset}/transactions/${encodeURIComponent(draftId)}?excludeContent=true&limit=1&reverse=true`,
          tag: 'publishing.last-edit',
        })
        .then(parseFirstLine)
        .catch((): LastEdit => {
          cache.delete(key)
          return UNKNOWN
        })
      cache.set(key, pending)
    }
    pending.then((value) => {
      if (!cancelled) setState(value)
    })
    return () => {
      cancelled = true
    }
  }, [client, dataset, draftId, updatedAt])

  return state
}
