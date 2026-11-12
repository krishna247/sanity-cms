// QA Sr 45/46: point the project brochure buttons (link kind "file", raw
// cdn.sanity.io URL) at downloadFile docs → https://files.sasinfra.com/<filename>.
// Each button keeps the exact PDF it served before. Idempotent.
//
// ORDER MATTERS — run only AFTER (1) the sasinfra-files Worker answers on
// files.sasinfra.com and (2) the frontend that understands link kind
// "download" is live. Old frontend code resolves an unknown kind to "#", and
// this write triggers a rebuild.
//   npx sanity exec scripts/migrate-brochure-ctas.mjs --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})

await client.createIfNotExists({
  _id: 'downloadFile-sas-itower-brochure-sharing',
  _type: 'downloadFile',
  title: 'SAS iTower Brochure (sharing edition)',
  filename: {_type: 'slug', current: 'sas-itower-brochure-sharing.pdf'},
  file: {_type: 'file', asset: {_type: 'reference', _ref: 'file-f39c07a83af1c04115ad0ec1d8746467cd7ab3d6-pdf'}},
})

const MOVES = [
  ['project-sas-crown', 'pageBuilder[_key=="k282"].ctas[_key=="k275"]', 'downloadFile-sas-crown-brochure'],
  ['project-sas-crown', 'pageBuilder[_key=="k298"].cta', 'downloadFile-sas-crown-brochure'],
  ['project-sas-itower', 'pageBuilder[_key=="k337"].ctas[_key=="k330"]', 'downloadFile-sas-itower-brochure'],
  ['project-sas-itower', 'pageBuilder[_key=="itPlans"].cta', 'downloadFile-sas-itower-brochure-sharing'],
]

for (const docId of [...new Set(MOVES.map((m) => m[0]))]) {
  const draft = await client.getDocument(`drafts.${docId}`)
  const ids = draft ? [docId, `drafts.${docId}`] : [docId]
  const moves = MOVES.filter((m) => m[0] === docId)
  const tx = client.transaction()
  for (const id of ids) {
    for (const [, path, ref] of moves) {
      tx.patch(id, (p) =>
        p
          .set({[`${path}.kind`]: 'download', [`${path}.download`]: {_type: 'reference', _ref: ref}})
          .unset([`${path}.file`]),
      )
    }
  }
  await tx.commit()
  console.log(`${ids.join(' + ')}: ${moves.length} buttons → download`)
}
