// Finds dataset values the Studio cannot edit because they do not match the
// deployed schema — the class of problem `sanity documents validate` does NOT
// report (it runs field validation rules; it stays silent when an array item's
// `_type` is not one of the array's member types, which the Studio shows as
// "Item of type X not valid for this list" and refuses to open).
//
//   A  array item whose `_type` is not a member of that array
//   B  object field whose stored `_type` differs from the schema's type name
//   C  key present in the data that the schema does not define ("Unknown field")
//   D  object array item without a `_key`
//   E  document of a type the schema no longer has
//
// Reads published AND draft documents. Run from repos/sanity:
//   npx sanity schema extract --workspace production --path /tmp/schema.json
//   npx sanity exec scripts/scan-schema-mismatches.mjs --with-user-token
// (SCHEMA_JSON overrides the extract path; exit code 1 when anything is found.)
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

const schemaPath = process.env.SCHEMA_JSON || '/tmp/schema.json'
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const docs = await client.fetch('*[!(_id in path("_.**")) && !(_type match "sanity.*")]')

const byName = new Map(schema.map((t) => [t.name, t]))
const findings = []
const SYS = new Set(['_id', '_type', '_key', '_rev', '_createdAt', '_updatedAt', '_system', '_weak', '_ref', '_strengthenOnPublish', '_dataset', '_projectId', '_sanityAsset', '_upload', '_originalId'])
// Values that legitimately carry a built-in `_type` inside an object field.
const BUILTIN = new Set(['reference', 'image', 'file', 'slug', 'block', 'span', 'geopoint'])

// Follow `type` wrappers and `inline` names; merge `rest` (a named type spread into an array member).
function norm(node, depth = 0) {
  if (!node || depth > 12) return node
  if (node.type === 'type') return norm(node.value, depth + 1)
  if (node.type === 'inline') {
    const t = byName.get(node.name)
    return t ? {...norm(t, depth + 1), __name: node.name} : node
  }
  if (node.type === 'object' && node.rest) {
    const rest = norm(node.rest, depth + 1)
    return {...node, attributes: {...(rest?.attributes || {}), ...(node.attributes || {})}, __name: node.__name || rest?.__name || node.rest.name, rest: undefined}
  }
  return node
}
// The `_type` a stored value of this member is expected to carry.
function typeNameOf(node) {
  const n = norm(node)
  const lit = n?.attributes?._type?.value
  if (lit && lit.type === 'string' && typeof lit.value === 'string') return lit.value
  if (node?.type === 'inline') return node.name
  if (node?.type === 'object' && node.rest?.type === 'inline') return node.rest.name
  if (n?.__name) return n.__name
  if (n?.type === 'object') return n.attributes?._ref ? 'reference' : 'object'
  return n?.type
}
const members = (arr) => (arr.of ? (arr.of.type === 'union' ? arr.of.of : [arr.of]) : [])

function walk(value, node, path, docId) {
  const def = norm(node)
  if (!def || value == null) return
  if (def.type === 'object' || def.type === 'document') {
    if (typeof value !== 'object' || Array.isArray(value)) return
    const attrs = def.attributes || {}
    const expected = typeNameOf(node)
    if (def.type !== 'document' && value._type && expected && expected !== 'object' && value._type !== expected && !BUILTIN.has(value._type)) {
      findings.push({docId, kind: 'B-field-type-mismatch', path: path.join('.'), detail: `_type "${value._type}" but schema expects "${expected}"`})
    }
    for (const k of Object.keys(value)) {
      if (SYS.has(k)) continue
      if (!(k in attrs)) findings.push({docId, kind: 'C-unknown-field', path: [...path, k].join('.'), detail: `not in schema type "${expected || def.name || 'object'}"`})
    }
    for (const [k, a] of Object.entries(attrs)) {
      if (value[k] === undefined || value[k] === null) continue
      walk(value[k], a.value, [...path, k], docId)
    }
    return
  }
  if (def.type === 'array') {
    if (!Array.isArray(value)) return
    const mems = members(def)
    const names = mems.map(typeNameOf)
    value.forEach((item, i) => {
      const key = item && typeof item === 'object' ? (item._key ?? i) : i
      const p = [...path, `[${key}]`]
      if (item && typeof item === 'object') {
        const t = item._type ?? (item._ref ? 'reference' : 'object')
        const idx = names.indexOf(t)
        if (idx < 0) findings.push({docId, kind: 'A-bad-array-item-type', path: p.join('.'), detail: `_type "${item._type ?? '(none)'}" not in [${names.join(', ')}]`})
        if (item._key === undefined) findings.push({docId, kind: 'D-missing-key', path: p.join('.'), detail: 'object item without _key'})
        if (idx >= 0) walk(item, mems[idx], p, docId)
      } else if (!names.includes(typeof item)) {
        findings.push({docId, kind: 'A-bad-array-item-type', path: p.join('.'), detail: `primitive ${typeof item} not in [${names.join(', ')}]`})
      }
    })
  }
}

let scanned = 0
for (const d of docs) {
  const def = byName.get(d._type)
  if (!def) { findings.push({docId: d._id, kind: 'E-unknown-doc-type', path: '', detail: d._type}); continue }
  scanned++
  walk(d, def, [], d._id)
}

const groups = new Map()
for (const f of findings) {
  const k = `${f.kind} | ${f.docId} | ${f.detail}`
  const g = groups.get(k) || {n: 0, paths: []}
  g.n++
  if (g.paths.length < 3) g.paths.push(f.path)
  groups.set(k, g)
}
console.log(`scanned ${scanned} documents (published + drafts); ${findings.length} mismatch(es)`)
for (const [k, g] of groups) console.log(`${String(g.n).padStart(3)}x ${k}  e.g. ${g.paths.join(' ; ')}`)
process.exit(findings.length ? 1 : 0)
