import {getCliClient} from 'sanity/cli'
// Seed the home-page CMS fields the frontend now reads (2026-09-02 CMS-coverage
// fixes, HomePage.astro + data/projects.ts), each with the EXACT text/state the
// page renders today so the build stays byte-identical:
//
//   homePage (published + drafts.homePage, patched identically when present)
//   • heroBlock k56      media.kind = 'video' — the live hero is the film; the
//                         published doc said 'image' (with an uploaded still) but
//                         the page never read `kind`. Now that it does, 'image'
//                         would swap the film for the still. The image asset is
//                         left in place.
//   • featureGridBlock k66  cta = internal link → page-about, label
//                         'Know more about SAS Infra' (was a code literal).
//   • feedBlock k75      itemCtaLabel = 'Read More' (updates cards; was a literal).
//   • features[].icon    the eight bespoke home glyph tokens (registered in the
//                         frontend ICONS map; the schema's iconTokenOptions gets
//                         the same keys). k64 'Global Standard' was seeded 'spa'
//                         — a generic amenity glyph the page never rendered — and
//                         is OVERWRITTEN with its bespoke token 'home-global'.
//
//   project docs (project-sas-crown, project-sas-itower + drafts.*)
//   • flyoutTitleHtml    the nav-flyout title with its designed <br> (was a
//                         code literal in projects.ts).
//   • catalogueOrder     1 = iTower, 2 = Crown — the designed catalogue/flyout
//                         order (the feed itself is alphabetical: Crown first).
//
// Fields not yet in the schema (cta on featureGridBlock, itemCtaLabel,
// flyoutTitleHtml, catalogueOrder, the new icon tokens) are requested in
// scratchpad/schema-requests/home.md; seeding does not need the schema deployed.
//   cd repos/sanity && npx sanity exec scripts/seed-home-cms.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})

const FEATURE_ICONS = {
  // featureGridBlock k66 — about pillars
  k62: 'home-design', // Premium Design — architect's dividers
  k63: 'home-location', // Strategic Locations — map-pin
  k64: 'home-global', // Global Standard — gridded globe (overwrites 'spa')
  k65: 'home-future', // Future-Ready — skyline + spire
  // featureGridBlock k72 — why choose
  k68: 'home-transparent', // Transparent Process — open ledger
  k69: 'home-partnership', // Long-Term Partnership — interlocking rings
  k70: 'home-global-local', // Global Expertise, Local Roots — globe on horizon
  k71: 'home-engineering', // Engineering Excellence — truss
}
const FEATURE_BLOCK = {k62: 'k66', k63: 'k66', k64: 'k66', k65: 'k66', k68: 'k72', k69: 'k72', k70: 'k72', k71: 'k72'}

const KNOW_MORE = {
  _type: 'link',
  label: 'Know more about SAS Infra',
  kind: 'internal',
  reference: {_type: 'reference', _ref: 'page-about'},
}

const FLYOUT_TITLES = {
  'project-sas-itower': {flyoutTitleHtml: 'Tallest commercial<br>tower in <em>Hyderabad</em>.', catalogueOrder: 1},
  'project-sas-crown': {flyoutTitleHtml: "South India's <em>tallest</em><br>residential tower.", catalogueOrder: 2},
}

const homeQ = `*[_id == $id][0]{
  "heroKind": pageBuilder[_key=="k56"][0].media.kind,
  "heroImage": pageBuilder[_key=="k56"][0].media.image.image.asset._ref,
  "aboutCta": pageBuilder[_key=="k66"][0].cta{label, kind, "ref": reference._ref},
  "itemCtaLabel": pageBuilder[_key=="k75"][0].itemCtaLabel,
  "aboutIcons": pageBuilder[_key=="k66"][0].features[]{_key, title, icon},
  "whyIcons": pageBuilder[_key=="k72"][0].features[]{_key, title, icon}
}`
const projectQ = `*[_id == $id][0]{_id, title, flyoutTitleHtml, catalogueOrder}`

const exists = async (id) => Boolean(await client.fetch(`defined(*[_id == $id][0]._id)`, {id}))

for (const id of ['homePage', 'drafts.homePage']) {
  if (!(await exists(id))) {
    console.log(`-- ${id}: not present, skipped`)
    continue
  }
  console.log(`== ${id} before:`, JSON.stringify(await client.fetch(homeQ, {id}), null, 1))
  let patch = client
    .patch(id)
    .set({
      'pageBuilder[_key=="k56"].media.kind': 'video',
      'pageBuilder[_key=="k66"].cta': KNOW_MORE,
      'pageBuilder[_key=="k75"].itemCtaLabel': 'Read More',
    })
  for (const [key, icon] of Object.entries(FEATURE_ICONS)) {
    patch = patch.set({[`pageBuilder[_key=="${FEATURE_BLOCK[key]}"].features[_key=="${key}"].icon`]: icon})
  }
  await patch.commit()
  console.log(`== ${id} after: `, JSON.stringify(await client.fetch(homeQ, {id}), null, 1))
}

for (const [base, fields] of Object.entries(FLYOUT_TITLES)) {
  for (const id of [base, `drafts.${base}`]) {
    if (!(await exists(id))) {
      console.log(`-- ${id}: not present, skipped`)
      continue
    }
    console.log(`== ${id} before:`, JSON.stringify(await client.fetch(projectQ, {id})))
    await client.patch(id).set(fields).commit()
    console.log(`== ${id} after: `, JSON.stringify(await client.fetch(projectQ, {id})))
  }
}
