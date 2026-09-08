// Repairs the array items scripts/scan-schema-mismatches.mjs found on 2026-09-08:
//
//   types    project.specifications[] / amenities[] items must carry the member
//            `_type` ('spec' / 'amenity' — named in schemaTypes/documents/project.ts
//            on 2026-09-08). iTower was seeded with them; Crown's rows had none
//            (resolved as the anonymous `object` member the schema used to have).
//            Run AFTER the Studio with the named members is deployed, or Crown's
//            rows become uneditable until it is.
//   orphans  page-builder items whose block type was retired from the schema on
//            2026-09-03 (plateAnatomyBlock / consultantsBlock / brochureBlock —
//            nothing in repos/frontend reads them) are removed. The whole document
//            is snapshotted to scripts/backups/2026-09-08-type-cleanup/ first.
//
// Draft-safe (a drafts.* copy is patched identically), idempotent, key-scoped
// patches (no array rewrite, `_key`s untouched). Run from repos/sanity:
//   DRY=1 npx sanity exec scripts/fix-array-item-types.mjs --with-user-token   # report only
//   ONLY=orphans npx sanity exec scripts/fix-array-item-types.mjs --with-user-token
//   ONLY=types   npx sanity exec scripts/fix-array-item-types.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {mkdirSync, writeFileSync} from 'node:fs'

const DRY = process.env.DRY === '1'
const ONLY = process.env.ONLY || 'all'
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const dir = 'scripts/backups/2026-09-08-type-cleanup'

const MEMBER_TYPE = {specifications: 'spec', amenities: 'amenity'}
const RETIRED_BLOCKS = new Set(['plateAnatomyBlock', 'consultantsBlock', 'brochureBlock'])

const projects = await client.fetch('*[_type == "project"]{_id, specifications, amenities, pageBuilder}')
let touched = 0
let snapshots = 0
for (const doc of projects) {
  const sets = {}
  const unsets = []
  if (ONLY === 'all' || ONLY === 'types') {
    for (const [field, type] of Object.entries(MEMBER_TYPE)) {
      for (const item of doc[field] || []) {
        if (!item?._key) throw new Error(`${doc._id} ${field}: item without _key — refusing to patch by index`)
        if (item._type !== type) sets[`${field}[_key=="${item._key}"]._type`] = type
      }
    }
  }
  if (ONLY === 'all' || ONLY === 'orphans') {
    for (const block of doc.pageBuilder || []) {
      if (block?._key && RETIRED_BLOCKS.has(block._type)) unsets.push(`pageBuilder[_key=="${block._key}"]`)
    }
  }
  const nSets = Object.keys(sets).length
  if (!nSets && !unsets.length) { console.log(doc._id, '— nothing to do'); continue }
  console.log(doc._id, `→ set ${nSets} _type(s)`, nSets ? Object.values(sets).join('/') : '', unsets.length ? `; remove ${unsets.join(', ')}` : '')
  if (DRY) continue
  if (unsets.length) {
    mkdirSync(dir, {recursive: true})
    writeFileSync(`${dir}/${doc._id}.json`, JSON.stringify(await client.getDocument(doc._id), null, 2))
    snapshots++
  }
  let patch = client.patch(doc._id)
  if (nSets) patch = patch.set(sets)
  if (unsets.length) patch = patch.unset(unsets)
  const res = await patch.commit()
  console.log('   rev', res._rev.slice(0, 8))
  touched++
}
console.log(DRY ? 'dry run — nothing written' : `done; ${touched} document(s) patched${snapshots ? `; ${snapshots} snapshot(s) in ${dir}` : ''}`)
