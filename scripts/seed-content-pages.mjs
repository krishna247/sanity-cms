import {getCliClient} from 'sanity/cli'
// Seed the content-page copy the frontend now reads from the CMS (2026-09-02
// CMS-coverage pass — content pages: media / contact / careers / legal).
//
// Every value is the EXACT literal the component ships as its fallback, so the
// built HTML is byte-identical before and after — the point is that an editor
// can now change it. The fields that are new in the schema (feedBlock.filterLabel
// / allLabel / countNoun / countNounPlural, ctaBlock.note, mapBlock.mapQuery —
// see scratchpad/schema-requests/content-pages.md) are written ahead of the
// schema deploy; Sanity stores them regardless and the Studio shows them once
// the schema lands.
//
//   npx sanity exec scripts/seed-content-pages.mjs --with-user-token
//
// Patches the published documents directly (same pattern as seed-navigation.mjs;
// this is itself the publish and fires the sanity-publish rebuild webhook — the
// deployed code ignores the new fields until the frontend ships). No drafts
// exist for these docs; if a drafts.<id> is found it is patched identically so
// a later publish from the Studio cannot revert the seed. Idempotent.
const client = getCliClient().withConfig({dataset: 'production'})

const keyOf = (doc, type) => doc.pageBuilder?.find((b) => b._type === type)?._key
const at = (key) => `pageBuilder[_key=="${key}"]`

// What the components read — printed before/after for each document.
const summary = (doc) =>
  (doc.pageBuilder ?? []).map((b) => ({
    _key: b._key,
    _type: b._type,
    ...(b.head?.dek !== undefined ? {dek: b.head.dek} : {}),
    ...(b.note !== undefined ? {note: b.note} : {}),
    ...(b.filterLabel !== undefined ? {filterLabel: b.filterLabel, allLabel: b.allLabel, countNoun: b.countNoun, countNounPlural: b.countNounPlural} : {}),
    ...(b.mapQuery !== undefined ? {mapQuery: b.mapQuery} : {}),
    ...(b.actions ? {actions: b.actions.map((a) => ({label: a.label, kind: a.kind, email: a.email, emailSubject: a.emailSubject, ref: a.reference?._ref}))} : {}),
  }))

async function targets(id) {
  const draft = await client.getDocument(`drafts.${id}`)
  return draft ? [id, `drafts.${id}`] : [id]
}

async function seed(id, build) {
  for (const target of await targets(id)) {
    const doc = await client.getDocument(target)
    if (!doc) {
      console.log(`skip ${target}: not found`)
      continue
    }
    console.log(`\nbefore ${target}:`, JSON.stringify(summary(doc), null, 1))
    await build(client.patch(target).setIfMissing({pageBuilder: []}), doc).commit()
    console.log(`after  ${target}:`, JSON.stringify(summary(await client.getDocument(target)), null, 1))
  }
}

// ── Media: wall chrome on the feedBlock + the "or write to" note on the CTA ──
await seed('page-media', (p, doc) => {
  const feed = keyOf(doc, 'feedBlock')
  const cta = keyOf(doc, 'ctaBlock')
  return p.set({
    [`${at(feed)}.filterLabel`]: 'Filter',
    [`${at(feed)}.allLabel`]: 'All',
    [`${at(feed)}.countNoun`]: 'item',
    [`${at(feed)}.countNounPlural`]: 'items',
    [`${at(cta)}.note`]: 'or write to',
  })
})

// ── Contact: the inline Google map's search query (plain words; the site
//    URL-encodes it — this is the decoded form of the original embed URL) ──
await seed('page-contact', (p, doc) =>
  p.set({[`${at(keyOf(doc, 'mapBlock'))}.mapQuery`]: 'ACE Tech Park Nanakramguda Financial District Hyderabad'}),
)

// ── Careers: the email action gains the subject the page always prefilled, so
//    resolveLinkHref(actions[0]) yields the exact current mailto ──
await seed('page-careers', (p, doc) => {
  const cta = doc.pageBuilder.find((b) => b._type === 'ctaBlock')
  const email = cta.actions.find((a) => a.kind === 'email')
  return p.set({[`${at(cta._key)}.actions[_key=="${email._key}"].emailSubject`]: 'Application — SAS Infra'})
})

// ── Legal: the footer line as a ctaBlock (head.dek = the sentence; emails /
//    phones auto-link; each action is linked where its label occurs) ──
const internal = (key, label, ref) => ({
  _type: 'link',
  _key: key,
  label,
  kind: 'internal',
  variant: 'text',
  reference: {_type: 'reference', _ref: ref},
})
const footer = (dek, actions = []) => (p, doc) => {
  const key = keyOf(doc, 'ctaBlock')
  if (key) return p.set({[`${at(key)}.head.dek`]: dek, ...(actions.length ? {[`${at(key)}.actions`]: actions} : {})})
  return p.insert('after', 'pageBuilder[-1]', [{_type: 'ctaBlock', _key: 'foot', head: {dek}, ...(actions.length ? {actions} : {})}])
}
await seed('page-privacy', footer('Questions about this policy? Email krishna.j@sasinfra.com or call +91 97186 62299.'))
await seed('page-terms', footer('Questions? Email krishna.j@sasinfra.com or call +91 97186 62299.'))
await seed(
  'page-cookies',
  footer('See also our Privacy Policy and Terms & Conditions.', [
    internal('foot-privacy', 'Privacy Policy', 'page-privacy'),
    internal('foot-terms', 'Terms & Conditions', 'page-terms'),
  ]),
)
