// Human time helpers for the publishing UI. Coarse on purpose: editors need
// "4 days", not "3 days 22 hours".

const UNITS: [label: string, ms: number][] = [
  ['year', 365 * 24 * 3600e3],
  ['month', 30 * 24 * 3600e3],
  ['week', 7 * 24 * 3600e3],
  ['day', 24 * 3600e3],
  ['hour', 3600e3],
  ['minute', 60e3],
]

/** "4 days", "3 hours", "moments" — the length of the span from `iso` to now. */
export function spanSince(iso: string | undefined, now: number = Date.now()): string {
  if (!iso) return 'a while'
  const ms = now - Date.parse(iso)
  if (!Number.isFinite(ms) || ms < 60e3) return 'moments'
  for (const [label, size] of UNITS) {
    if (ms >= size) {
      const n = Math.floor(ms / size)
      return `${n} ${label}${n === 1 ? '' : 's'}`
    }
  }
  return 'moments'
}

/** "4 days ago", "just now". */
export function timeAgo(iso: string | undefined, now: number = Date.now()): string {
  const span = spanSince(iso, now)
  return span === 'moments' ? 'just now' : `${span} ago`
}

/** "8 Sep 2026, 13:00" in the editor's locale. */
export function formatStamp(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "4 Jun", or "4 Jun 2025" when it is not this year. */
export function formatDay(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short', ...(sameYear ? {} : {year: 'numeric'})})
}
