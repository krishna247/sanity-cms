// Strips dataset values that no longer have a schema field (found by
// `sanity documents validate` after the 2026-09-03 dead-element removal).
// Snapshots every touched document to scripts/backups/2026-09-03-dead-content/<id>.orphans.json.
// Run: npx sanity exec scripts/remove-orphan-fields.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
import {writeFileSync, mkdirSync} from 'node:fs'

const client = getCliClient().withConfig({dataset: 'production'})
const dir = 'scripts/backups/2026-09-03-dead-content'
mkdirSync(dir, {recursive: true})

const plan = [] // [docId, [paths...]]
for (const id of await client.fetch('*[_type=="partner"]._id')) plan.push([id, ['discipline', 'country', 'shortCountry']])
for (const id of await client.fetch('*[_type=="projectUpdate"]._id')) plan.push([id, ['body', 'pdf']])
plan.push(['siteSettings', ['hours', 'phone', 'vrTourLabel', 'concierge.eyebrow']])
plan.push(['project-sas-itower', ['image', 'frameCaption', 'banksHeading', 'banks'].map((f) => `pageBuilder[_key=="itEng"].${f}`)])
// imageWithAlt objects carrying a stray object-level `asset` beside the real nested `image.asset`
plan.push(['person-gv-rao', ['image.asset']])
plan.push([
  'project-sas-crown',
  [
    'pageBuilder[_key=="k299"].image.asset',
    'pageBuilder[_key=="k303"].anchor.image.asset',
    ...['k262', 'k263', 'k264', 'k266', 'k267', 'k268'].map((k) => `pageBuilder[_key=="k296"].images[_key=="${k}"].image.asset`),
  ],
])

for (const [baseId, paths] of plan.filter(([id]) => !id.startsWith('drafts.'))) {
  for (const id of [baseId, `drafts.${baseId}`]) {
    const doc = await client.getDocument(id)
    if (!doc) continue
    // safety: a stray image-level asset must equal the nested one before it is dropped
    for (const p of paths.filter((x) => x.endsWith('.image.asset'))) {
      const obj = await client.fetch(`*[_id==$id][0].${p.replace(/\.asset$/, '')}`, {id})
      if (obj?.asset?._ref && obj?.image?.asset?._ref && obj.asset._ref !== obj.image.asset._ref) {
        throw new Error(`${id} ${p}: flat/nested asset differ — refusing`)
      }
    }
    writeFileSync(`${dir}/${id}.orphans.json`, JSON.stringify(doc, null, 2))
    const res = await client.patch(id).unset(paths).commit()
    console.log(id, '→ unset', paths.length, 'path(s); rev', res._rev.slice(0, 8))
  }
}
console.log('done; snapshots in', dir)
