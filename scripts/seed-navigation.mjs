import {getCliClient} from 'sanity/cli'
// Re-seed the `navigation` singleton's header menu to match the menu the site
// actually renders, and set the mobile "Call" label.
//
// Until 2026-09-02 the frontend never read this document: both nav surfaces
// rendered from the hardcoded NAV_LINKS in src/lib/nav.ts, and the CMS copy had
// gone stale (Projects / About / Updates / Blog / Contact — "Updates" is a
// retired route, "Contact" was replaced by "Careers", "Media" was missing). The
// frontend now reads navigation.header (with NAV_LINKS as the empty-list
// fallback), so this MUST match NAV_LINKS byte-for-byte before that frontend
// ships, or the live menu would regress to the stale list.
//
// Direct published write (same pattern as set-rera-line.mjs). There is no draft
// of `navigation`; this patch is itself the publish and fires the
// sanity-publish repository_dispatch webhook (a harmless rebuild).
//   npx sanity exec scripts/seed-navigation.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})

const link = (label, kind, ref, anchorId) => ({
  _type: 'link',
  label,
  kind,
  reference: {_type: 'reference', _ref: ref},
  ...(anchorId ? {anchorId} : {}),
})
const item = (key, label, l, extra = {}) => ({_type: 'navItem', _key: key, label, link: l, ...extra})

// Mirrors src/lib/nav.ts NAV_LINKS: /#projects · /about · /media · /blog · /careers
const header = [
  item('nav-projects', 'Projects', link('Projects', 'anchor', 'homePage', 'projects'), {projectsFlyout: true}),
  item('nav-about', 'About', link('About', 'internal', 'page-about')),
  item('nav-media', 'Media', link('Media', 'internal', 'page-media')),
  item('nav-blog', 'Blog', link('Blog', 'internal', 'blogIndexPage')),
  item('nav-careers', 'Careers', link('Careers', 'internal', 'page-careers')),
]

const q = '*[_id == "navigation"][0]{callLabel, "header": header[]{label, projectsFlyout, "kind": link.kind, "ref": link.reference._ref, "anchor": link.anchorId}}'
console.log('before:', JSON.stringify(await client.fetch(q), null, 1))
await client.patch('navigation').set({header, callLabel: 'Call'}).commit()
console.log('after: ', JSON.stringify(await client.fetch(q), null, 1))
