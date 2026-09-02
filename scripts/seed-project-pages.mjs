import {getCliClient} from 'sanity/cli'
// Project pages (SAS Crown / SAS iTower) — CMS-coverage seed, 2026-09-02.
//
// 1. project-sas-crown: the six specification cards and ten amenity chips now
//    render their CMS icon token through ICONS (src/lib/pageBuilder.ts) instead
//    of hand-indexed per-position SVGs. The bespoke Crown glyphs are registered
//    there as `crown-*` tokens; this seeds them onto the rows so the grids stay
//    byte-identical (the old generic tokens — fallback / building / ev / … —
//    never rendered on this page and are overwritten; printed below for record).
// 2. project-sas-itower: delete the five stat rows the frontend used to hide by
//    label filter (engineeredNumbersBlock es3 + es4, addressSectionBlock st3 +
//    st4 + st5) and the stale feedBlock k353 — none of these has ever rendered;
//    their content is printed below for the record.
// 3. Both: `navCtaLabel` = 'Book a Tour' (the header button label the page
//    hard-coded; schema field requested in scratchpad/schema-requests/projects.md).
// 4. drafts.project-sas-itower (stale, 2026-08-05, behind the 2026-08-28
//    published doc) receives the SAME patch, plus the published masterPlanBlock
//    areaTables it lacks — so a Studio publish can no longer wipe the live area
//    tables. (Its masterPlanBlock.image still differs from published — reported,
//    not touched.)
//
// Direct published write (same pattern as seed-navigation.mjs); fires the
// sanity-publish repository_dispatch webhook (a harmless rebuild).
//   npx sanity exec scripts/seed-project-pages.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', perspective: 'raw'})

const CROWN = 'project-sas-crown'
const ITOWER = 'project-sas-itower'
const ITOWER_DRAFT = `drafts.${ITOWER}`
const NAV_CTA_LABEL = 'Book a Tour'

const CROWN_SPEC_ICONS = {
  k323: 'crown-status', k324: 'crown-land', k325: 'crown-towers',
  k326: 'crown-flats', k327: 'crown-configuration', k328: 'crown-type',
}
const CROWN_AMENITY_ICONS = {
  k313: 'crown-banquet', k314: 'crown-ev', k315: 'crown-car-wash', k316: 'crown-games',
  k317: 'crown-mini-mart', k318: 'crown-pool', k319: 'crown-theatre', k320: 'crown-spa',
  k321: 'crown-yoga', k322: 'crown-massage',
}
const ITOWER_DELETE = [
  'pageBuilder[_key=="itEng"].stats[_key=="es3"]',
  'pageBuilder[_key=="itEng"].stats[_key=="es4"]',
  'pageBuilder[_key=="itAddress"].stats[_key=="st3"]',
  'pageBuilder[_key=="itAddress"].stats[_key=="st4"]',
  'pageBuilder[_key=="itAddress"].stats[_key=="st5"]',
  'pageBuilder[_key=="k353"]',
]

const q = (id) => client.fetch(
  `*[_id == $id][0]{
    _id, _updatedAt, navCtaLabel,
    "specs": specifications[]{_key, icon, label},
    "amenities": amenities[]{_key, icon, name},
    "engStats": pageBuilder[_key=="itEng"][0].stats[]{_key, num, lab},
    "addrStats": pageBuilder[_key=="itAddress"][0].stats[]{_key, label, value},
    "feedBlocks": pageBuilder[_type=="feedBlock"]{_key, source, limit, head, cta{label, kind, variant, "ref": reference._ref}},
    "areaTableKeys": pageBuilder[_key=="itMaster"][0].areaTables[]._key,
    "masterImage": pageBuilder[_key=="itMaster"][0].image.image.asset._ref
  }`, {id})
const show = (label, doc) => console.log(`\n── ${label}\n${JSON.stringify(doc, null, 1)}`)

// ── before ──
const crownBefore = await q(CROWN)
const itowerBefore = await q(ITOWER)
const draftBefore = await q(ITOWER_DRAFT)
show('BEFORE crown', crownBefore)
show('BEFORE itower', itowerBefore)
show('BEFORE itower DRAFT', draftBefore)

// ── Crown: icon tokens + nav CTA label ──
{
  let p = client.patch(CROWN).set({navCtaLabel: NAV_CTA_LABEL})
  for (const [k, icon] of Object.entries(CROWN_SPEC_ICONS)) p = p.set({[`specifications[_key=="${k}"].icon`]: icon})
  for (const [k, icon] of Object.entries(CROWN_AMENITY_ICONS)) p = p.set({[`amenities[_key=="${k}"].icon`]: icon})
  await p.commit()
}

// ── iTower published: delete never-rendered rows + stale feedBlock; nav CTA label ──
await client.patch(ITOWER).set({navCtaLabel: NAV_CTA_LABEL}).unset(ITOWER_DELETE).commit()

// ── iTower DRAFT (if present): the identical patch + the missing areaTables ──
if (draftBefore) {
  const areaTables = await client.fetch('*[_id == $id][0].pageBuilder[_key=="itMaster"][0].areaTables', {id: ITOWER})
  await client.patch(ITOWER_DRAFT)
    .set({navCtaLabel: NAV_CTA_LABEL, 'pageBuilder[_key=="itMaster"].areaTables': areaTables})
    .unset(ITOWER_DELETE)
    .commit()
  console.log(`\n${ITOWER_DRAFT}: patched identically + areaTables copied from published (${areaTables?.length ?? 0} tables)`)
} else {
  console.log(`\n${ITOWER_DRAFT}: not present — nothing to reconcile`)
}

// ── after ──
show('AFTER crown', await q(CROWN))
show('AFTER itower', await q(ITOWER))
show('AFTER itower DRAFT', await q(ITOWER_DRAFT))
