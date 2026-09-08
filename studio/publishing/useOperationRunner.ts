import {useCallback, useEffect, useRef} from 'react'
import {useDocumentOperationEvent} from 'sanity'

// Turn a fire-and-forget document operation (`ops.publish.execute()`) into a
// promise that settles on the operation's success/error event, so the queue
// can report a result, run bulk publishes one at a time, and never leave a
// button stuck on "Publishing…" after a failure.
//
// Limits, and how they are handled:
// - Events carry no invocation id, only document + op. Callers therefore hold a
//   per-document lock (one operation at a time per row); a second call while
//   one is pending is refused rather than racing it.
// - A 20 s timeout settles the promise as a failure with `timedOut: true`, and
//   the caller reconciles against the document state (a publish whose draft is
//   gone did succeed, whatever the event stream said).
// - Unmount settles a pending promise as `{ok: true, via: 'unmount'}`: a queue
//   row only unmounts when its draft has left the queue, which for publish /
//   discard / delete is the success condition itself.

export type OpResult =
  | {ok: true; via: 'event' | 'unmount'}
  | {ok: false; error: string; timedOut?: boolean}

interface Pending {
  op: string
  resolve: (result: OpResult) => void
  timer: number
}

const TIMEOUT_MS = 20_000

export function useOperationRunner(publishedId: string, type: string) {
  const event = useDocumentOperationEvent(publishedId, type)
  const pending = useRef<Pending | null>(null)
  // The hook replays the last event on mount; only react to NEW ones.
  const seen = useRef(event)

  useEffect(() => {
    if (event === seen.current) return
    seen.current = event
    const current = pending.current
    if (!event || !current || event.op !== current.op) return
    window.clearTimeout(current.timer)
    pending.current = null
    current.resolve(
      event.type === 'success' ? {ok: true, via: 'event'} : {ok: false, error: event.error.message},
    )
  }, [event])

  useEffect(
    () => () => {
      const current = pending.current
      if (!current) return
      window.clearTimeout(current.timer)
      pending.current = null
      current.resolve({ok: true, via: 'unmount'})
    },
    [],
  )

  return useCallback(
    (op: string, execute: () => void): Promise<OpResult> =>
      new Promise<OpResult>((resolve) => {
        if (pending.current) {
          resolve({ok: false, error: 'Another action on this document is still running'})
          return
        }
        const timer = window.setTimeout(() => {
          pending.current = null
          resolve({ok: false, error: 'No answer from the Studio after 20 seconds', timedOut: true})
        }, TIMEOUT_MS)
        pending.current = {op, resolve, timer}
        try {
          execute()
        } catch (err) {
          window.clearTimeout(timer)
          pending.current = null
          resolve({ok: false, error: err instanceof Error ? err.message : String(err)})
        }
      }),
    [],
  )
}
