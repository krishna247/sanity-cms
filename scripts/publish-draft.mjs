// Publish one document's draft from the CLI — the Studio's Publish action as a
// single transaction (createOrReplace the published copy from the draft, delete
// the draft), so the publish webhook rebuilds the site exactly as a Studio
// publish would. For a draft that has already been reviewed in the Studio and
// just needs the button pressed (first use: drafts.navigation, 2026-09-08).
//   DOC=navigation npx sanity exec scripts/publish-draft.mjs --with-user-token
import {getCliClient} from 'sanity/cli'
const id = process.env.DOC
if (!id || id.startsWith('drafts.')) throw new Error('DOC=<published id> (without the drafts. prefix) is required')
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const draft = await client.getDocument(`drafts.${id}`)
if (!draft) { console.log(`no drafts.${id} — nothing to publish`); process.exit(0) }
const {_id, _rev, _updatedAt, _createdAt, ...body} = draft
const res = await client.transaction().createOrReplace({...body, _id: id}).delete(`drafts.${id}`).commit()
console.log(`published ${id}; tx ${res.transactionId}`)
