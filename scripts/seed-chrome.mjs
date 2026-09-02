import {getCliClient} from 'sanity/cli'
// Seed the chrome copy the frontend now reads from the CMS, EXACTLY as the site
// renders it today, so the switch to CMS-driven markup is byte-identical:
//   navigation.footer            4 groups: Quick Links / Projects / Contact / Legal
//   navigation.officeLabel       "Office"
//   siteSettings.notFound.links  the five 404 recovery links
//   blogIndexPage labels         filterAllLabel / cardCtaLabel / emptyLabel /
//                                bylinePrefix / backLabel / emptyBodyLabel
//
// The footer groups replace the stale 2026-06 seed (Quick Links carried a
// retired "Updates" item and no "Media"; Contact carried phone / email /
// "Send a message" children — the Contact column's rows come from Site
// Settings → Phones / Email, so the group is heading-only now). Group keys are
// kept; children get descriptive keys (nothing references them).
//
// Direct published writes (pattern: seed-navigation.mjs). If a draft of a
// document exists it is patched identically so a later publish cannot revert.
//   cd repos/sanity && npx sanity exec scripts/seed-chrome.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2024-01-01'})

const internal = (label, ref) => ({_type: 'link', label, kind: 'internal', reference: {_type: 'reference', _ref: ref}})
const anchor = (label, ref, anchorId) => ({_type: 'link', label, kind: 'anchor', anchorId, reference: {_type: 'reference', _ref: ref}})
const item = (key, label, link, extra = {}) => ({_type: 'navItem', _key: key, label, link, ...extra})
const keyed = (key, link) => ({...link, _key: key})

// Mirrors Footer.astro's literal fallbacks, column by column.
const footer = [
  item('k32', 'Quick Links', internal('Home', 'homePage'), {
    children: [
      item('fq-home', 'Home', internal('Home', 'homePage')),
      item('fq-about', 'About Us', internal('About Us', 'page-about')),
      item('fq-media', 'Media', internal('Media', 'page-media')),
      item('fq-blog', 'Blog', internal('Blog', 'blogIndexPage')),
      item('fq-careers', 'Careers', internal('Careers', 'page-careers')),
    ],
  }),
  item('k38', 'Projects', anchor('Projects', 'homePage', 'projects'), {
    children: [
      item('fp-crown', 'SAS Crown — Residential', internal('SAS Crown — Residential', 'project-sas-crown')),
      item('fp-itower', 'SAS iTower — Commercial', internal('SAS iTower — Commercial', 'project-sas-itower')),
    ],
  }),
  // Heading only: the phone / email rows are Site Settings contact details.
  item('k46', 'Contact', internal('Send a message', 'page-contact'), {children: []}),
  item('k54', 'Legal', internal('Privacy', 'page-privacy'), {
    children: [
      item('fl-terms', 'Terms', internal('Terms', 'page-terms')),
      item('fl-privacy', 'Privacy', internal('Privacy', 'page-privacy')),
      item('fl-cookies', 'Cookies', internal('Cookies', 'page-cookies')),
    ],
  }),
]

// Mirrors src/pages/404.astro's literal fallback list.
const notFoundLinks = [
  keyed('nf-home', internal('Home', 'homePage')),
  keyed('nf-crown', internal('SAS Crown', 'project-sas-crown')),
  keyed('nf-itower', internal('SAS iTower', 'project-sas-itower')),
  keyed('nf-blog', internal('Blog', 'blogIndexPage')),
  keyed('nf-contact', internal('Contact', 'page-contact')),
]

// Mirrors src/data/blog.ts LABEL_DEFAULTS.
const blogLabels = {
  filterAllLabel: 'All',
  cardCtaLabel: 'Read essay',
  emptyLabel: 'No posts in this category yet.',
  bylinePrefix: 'By',
  backLabel: 'All essays',
  emptyBodyLabel: 'This essay is being prepared.',
}

const PATCHES = [
  {
    id: 'navigation',
    set: {footer, officeLabel: 'Office'},
    q: '{officeLabel, "footer": footer[]{label, "children": children[]{label, "kind": link.kind, "ref": link.reference._ref}}}',
  },
  {
    id: 'siteSettings',
    set: {'notFound.links': notFoundLinks},
    q: '{"notFoundLinks": notFound.links[]{label, "kind": kind, "ref": reference._ref}}',
  },
  {
    id: 'blogIndexPage',
    set: blogLabels,
    q: '{filterAllLabel, cardCtaLabel, emptyLabel, bylinePrefix, backLabel, emptyBodyLabel}',
  },
]

for (const {id, set, q} of PATCHES) {
  const ids = await client.fetch('*[_id in [$id, "drafts." + $id]]._id', {id})
  if (!ids.includes(id)) throw new Error(`published ${id} not found`)
  for (const target of ids) {
    console.log(`\n── ${target}`)
    console.log('before:', JSON.stringify(await client.fetch(`*[_id == $t][0]${q}`, {t: target}), null, 1))
    await client.patch(target).set(set).commit()
    console.log('after: ', JSON.stringify(await client.fetch(`*[_id == $t][0]${q}`, {t: target}), null, 1))
  }
}
