import {getCliClient} from 'sanity/cli'
// The project hero's primary CTA ("Contact Us" / "Get in Touch") targets the
// on-page enquiry form (#contact) by design — the bespoke pages had that as a
// literal. The CMS link pointed at the Contact page instead, which the frontend
// used to ignore. Now that the frontend honours CMS links, make the CMS say what
// the design does: an anchor to this project's own `contact` id. The frontend
// collapses a same-page anchor to '#contact', so the output stays identical.
const client = getCliClient().withConfig({dataset: 'production'})
for (const id of ['project-sas-crown', 'project-sas-itower']) {
  for (const docId of [id, 'drafts.' + id]) {
    const doc = await client.getDocument(docId)
    if (!doc) continue
    const hero = (doc.pageBuilder || []).find((b) => b._type === 'projectHeroBlock')
    const cta = hero?.ctas?.[0]
    if (!cta) { console.log(docId, 'no hero cta'); continue }
    const path = `pageBuilder[_key=="${hero._key}"].ctas[_key=="${cta._key}"]`
    console.log(docId, 'before', {label: cta.label, kind: cta.kind, ref: cta.reference?._ref, anchorId: cta.anchorId})
    await client.patch(docId)
      .set({[`${path}.kind`]: 'anchor', [`${path}.reference`]: {_type: 'reference', _ref: id}, [`${path}.anchorId`]: 'contact'})
      .unset([`${path}.href`])
      .commit()
    const after = (await client.getDocument(docId)).pageBuilder.find((b) => b._key === hero._key).ctas.find((c) => c._key === cta._key)
    console.log(docId, 'after ', {label: after.label, kind: after.kind, ref: after.reference?._ref, anchorId: after.anchorId})
  }
}
