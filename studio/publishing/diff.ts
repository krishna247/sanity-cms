// A structural diff between a draft and its published copy, reduced to what an
// editor needs: which top-level fields changed and how many edits that is.
// Arrays of keyed objects (page builders, menus, lists) are matched by `_key`,
// so a reordered menu reads as one change on the array, not a change on every
// item; unkeyed arrays and primitives compare by value.

export type ChangeKind = 'added' | 'removed' | 'changed'
export interface Change {
  /** Dot path from the document root, array items as `field[_key]`. */
  path: string
  kind: ChangeKind
}

const ROOT_IGNORED = new Set(['_id', '_rev', '_type', '_createdAt', '_updatedAt', '_system'])

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const isKeyed = (v: unknown): v is Obj & {_key: string} => isObj(v) && typeof v._key === 'string'

function walk(draft: unknown, published: unknown, path: string, out: Change[]): void {
  if (draft === published) return
  if (isObj(draft) && isObj(published)) {
    const keys = new Set([...Object.keys(draft), ...Object.keys(published)])
    for (const key of keys) {
      if (path === '' && ROOT_IGNORED.has(key)) continue
      const p = path ? `${path}.${key}` : key
      if (!(key in published)) out.push({path: p, kind: 'added'})
      else if (!(key in draft)) out.push({path: p, kind: 'removed'})
      else walk(draft[key], published[key], p, out)
    }
    return
  }
  if (Array.isArray(draft) && Array.isArray(published)) {
    const keyed = draft.every(isKeyed) && published.every(isKeyed) && draft.length + published.length > 0
    if (keyed) {
      const d = new Map((draft as (Obj & {_key: string})[]).map((i) => [i._key, i]))
      const b = new Map((published as (Obj & {_key: string})[]).map((i) => [i._key, i]))
      for (const [key, item] of d) {
        const p = `${path}[${key}]`
        if (!b.has(key)) out.push({path: p, kind: 'added'})
        else walk(item, b.get(key), p, out)
      }
      for (const key of b.keys()) if (!d.has(key)) out.push({path: `${path}[${key}]`, kind: 'removed'})
      const sameSet = d.size === b.size && [...d.keys()].every((k) => b.has(k))
      if (sameSet && [...d.keys()].join(' ') !== [...b.keys()].join(' ')) out.push({path, kind: 'changed'})
      return
    }
    if (JSON.stringify(draft) !== JSON.stringify(published)) out.push({path, kind: 'changed'})
    return
  }
  // Primitive vs primitive, or a shape change (string vs object, null vs array).
  const draftEmpty = draft === undefined || draft === null
  const publishedEmpty = published === undefined || published === null
  if (draftEmpty && publishedEmpty) return
  if (draftEmpty) {
    out.push({path, kind: 'removed'})
    return
  }
  if (publishedEmpty) {
    out.push({path, kind: 'added'})
    return
  }
  out.push({path, kind: 'changed'})
}

/** Every leaf-level difference between `draft` and `published`. A missing
 *  `published` (never published) yields one 'added' change per root field. */
export function changedPaths(draft: unknown, published: unknown): Change[] {
  const out: Change[] = []
  walk(draft ?? {}, published ?? {}, '', out)
  return out
}

/** The root field a change lives in: `pageBuilder[k32].head.heading` is `pageBuilder`. */
export function rootField(path: string): string {
  const m = /^[^.[]+/.exec(path)
  return m ? m[0] : path
}

export interface ChangeSummary {
  count: number
  /** Root fields touched, in first-seen order, as display titles. */
  fields: string[]
}

/** Collapse changes to "N edits across these fields", using the schema's
 *  field titles when it has them. */
export function summarizeChanges(
  changes: Change[],
  fieldTitles: ReadonlyMap<string, string> | undefined,
): ChangeSummary {
  const seen: string[] = []
  for (const change of changes) {
    const root = rootField(change.path)
    if (!seen.includes(root)) seen.push(root)
  }
  return {count: changes.length, fields: seen.map((name) => fieldTitles?.get(name) || name)}
}
