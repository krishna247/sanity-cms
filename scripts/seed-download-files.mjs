// QA Sr 45/46: move project brochures onto downloadFile docs (files.sasinfra.com/<filename>).
// Reuses each project's existing brochure asset — no re-upload.
//   npx sanity exec scripts/seed-download-files.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const MAP = [
  {project: 'project-sas-crown', id: 'downloadFile-sas-crown-brochure', title: 'SAS Crown Brochure', filename: 'sas-crown-brochure.pdf'},
  {project: 'project-sas-itower', id: 'downloadFile-sas-itower-brochure', title: 'SAS iTower Brochure', filename: 'sas-itower-brochure.pdf'},
]
for (const m of MAP) {
  const p = await client.getDocument(m.project)
  const ref = p?.brochure?.asset?._ref
  if (!ref) { console.log(`${m.project}: no brochure asset, skipped`); continue }
  const tx = client.transaction()
    .createIfNotExists({_id: m.id, _type: 'downloadFile', title: m.title,
      filename: {_type: 'slug', current: m.filename},
      file: {_type: 'file', asset: {_type: 'reference', _ref: ref}}})
    .patch(m.project, (x) => x.set({brochureFile: {_type: 'reference', _ref: m.id}}))
  const draft = await client.getDocument(`drafts.${m.project}`)
  if (draft) tx.patch(`drafts.${m.project}`, (x) => x.set({brochureFile: {_type: 'reference', _ref: m.id}}))
  await tx.commit()
  console.log(`${m.project} → ${m.id} (${m.filename}, ${ref})${draft ? ' +draft' : ''}`)
}
