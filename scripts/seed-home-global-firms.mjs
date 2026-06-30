import {getCliClient} from 'sanity/cli'

// Home "Global firms, at every layer of the building" wall (Image-#1 layout).
// Rebuilds the homePage logoWallBlock as a curated, discipline-grouped set of 14
// firms. The frontend groups the wall by each partner's `discipline`, so this
// script's job is purely data: ensure the 14 partner docs exist with the right
// discipline, then point the wall at them (in order) and set the heading.
//
// SAFETY — the About page (page-about) shares 5 of these partner docs
// (aedas, godrej, honeywell, mitsubishi, schindler) and renders their LOGO +
// shortCountry on its pixel-parity-tracked wall. About takes its row LABELS from
// a separate partnerDisciplinesBlock and does NOT read partner.discipline, so
// changing `discipline` is safe. We therefore touch ONLY `discipline` on the
// shared docs and never their logo/shortCountry/name. The logos for this wall are
// served code-side from /images/partners/*, so nothing here uploads assets.
//
// Direct published writes (same pattern as seed-about-partners.mjs); prod is
// static until the next frontend deploy, so publishing this ahead of the deploy
// is safe.
const client = getCliClient().withConfig({dataset: 'production'})

// New docs to create (not referenced by About — safe to populate fully).
const NEW = [
  {id: 'partner-meinhardt', name: 'Meinhardt', discipline: 'Structural Engineering', country: 'Singapore', shortCountry: 'Singapore'},
  {id: 'partner-sterling', name: 'Sterling Structural', discipline: 'Structural Engineering', country: 'India', shortCountry: 'India'},
  {id: 'partner-tke', name: 'TKE', discipline: 'Vertical Transport', country: 'Germany', shortCountry: 'Germany'},
  {id: 'partner-alumil', name: 'Alumil', discipline: 'Façade & Glazing', country: 'Greece', shortCountry: 'Greece'},
  {id: 'partner-hitachi', name: 'Hitachi', discipline: 'HVAC', country: 'Japan', shortCountry: 'Japan'},
  {id: 'partner-carimali', name: 'Carimali', discipline: 'Finishes & Sanitaryware', country: 'Italy', shortCountry: 'Italy'},
  {id: 'partner-cbre', name: 'CBRE', discipline: 'Leasing & Advisory', country: 'United States', shortCountry: 'USA'},
  {id: 'partner-jll', name: 'JLL', discipline: 'Leasing & Advisory', country: 'United States', shortCountry: 'USA'},
]

// Existing docs — patch ONLY discipline (leave logo/shortCountry/name untouched
// so the About wall is byte-unchanged). toto is home-only but we still touch only
// discipline for consistency.
const DISCIPLINE_ONLY = {
  'partner-aedas': 'Architecture & Master Planning',
  'partner-honeywell': 'Building Systems & Automation',
  'partner-godrej': 'Building Systems & Automation',
  'partner-mitsubishi': 'Vertical Transport',
  'partner-schindler': 'Vertical Transport',
  'partner-toto': 'Finishes & Sanitaryware',
}

// Final wall order (drives the category order in Image #1).
const ORDER = [
  'partner-aedas',
  'partner-meinhardt',
  'partner-sterling',
  'partner-honeywell',
  'partner-godrej',
  'partner-mitsubishi',
  'partner-tke',
  'partner-schindler',
  'partner-alumil',
  'partner-hitachi',
  'partner-carimali',
  'partner-toto',
  'partner-cbre',
  'partner-jll',
]

for (const p of NEW) {
  await client.createIfNotExists({_id: p.id, _type: 'partner', name: p.name})
  await client
    .patch(p.id)
    .set({name: p.name, discipline: p.discipline, country: p.country, shortCountry: p.shortCountry})
    .commit()
  console.log('partner (new/upsert)', p.id, '→', p.discipline)
}

for (const [id, discipline] of Object.entries(DISCIPLINE_ONLY)) {
  await client.patch(id).set({discipline}).commit()
  console.log('partner (discipline only)', id, '→', discipline)
}

const partners = ORDER.map((id) => ({
  _type: 'reference',
  _ref: id,
  _key: 'gf-' + id.replace('partner-', ''),
}))

await client
  .patch('homePage')
  .set({
    'pageBuilder[_key=="logoWallHome01"].partners': partners,
    'pageBuilder[_key=="logoWallHome01"].head.heading':
      'Global firms, at every layer of the building.',
  })
  .unset(['pageBuilder[_key=="logoWallHome01"].head.eyebrow'])
  .commit()

console.log('\npatched homePage logoWallBlock → 14 firms, 8 disciplines, new heading')
