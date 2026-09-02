import {getCliClient} from 'sanity/cli'
// Seed the LAST code-only data on the home locality map into the CMS so
// public/map-3d.js can drive everything from homePage mapBlock.pointsOfInterest:
//
//   1. The 11 landmarks that lived in the hard-coded SUPPLEMENTAL_POIS array in
//      map-3d.js (Microsoft, Salesforce, Nvidia, …) — appended AFTER the existing
//      CMS points, in the array's order, so the runtime marker order (= DOM
//      stacking) equals the old CMS-then-supplemental merge exactly.
//   2. The two SAS project pins (SAS Crown / SAS iTower) — category "project" +
//      `projectKey`, at the SAS_CROWN / SAS_ITOWER constants map-3d.js falls back to.
//   3. `showOnMobile` on every point: TRUE only for the 5 anchors of the old
//      MOBILE_POI_KEYS allow-list (office, Raidurg Metro, ISB, Qutub Shahi Tombs,
//      Ocean Park) + the two project pins (always drawn on phones); FALSE for all
//      others. NB: the per-entry `mobile:` flag in SUPPLEMENTAL_POIS was dead code
//      (never consulted on desktop, superseded by MOBILE_POI_KEYS on phones), so
//      the seed mirrors the RENDERED phone map (5 anchors + 2 pins), not that flag.
//
// Key-scoped patches only (`pointsOfInterest[_key=="…"].showOnMobile`, insert
// after the last item) — existing `_key`s are kept; new items get stable keys.
// Patches the PUBLISHED homePage and, if it exists, drafts.homePage identically.
// Idempotent: re-running skips points whose _key is already present.
//   npx sanity exec scripts/seed-home-map.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01'})

const BLOCK_KEY = 'k73' // mapBlock _key on homePage.pageBuilder
const gp = (lat, lng) => ({_type: 'geopoint', lat, lng})

// Mirrors (verbatim) the deleted SUPPLEMENTAL_POIS in public/map-3d.js — same
// names, coordinates, categories, order. None carried a labelSide / labelNudge.
const SUPPLEMENTAL = [
  {key: 'microsoft',            name: 'Microsoft India',               category: 'corporate',   lat: 17.43410, lng: 78.37420},
  {key: 'salesforce',           name: 'Salesforce',                    category: 'corporate',   lat: 17.42338, lng: 78.37754},
  {key: 'nvidia',               name: 'Nvidia',                        category: 'corporate',   lat: 17.41606, lng: 78.34319},
  {key: 'continental-hospital', name: 'Continental Hospitals',         category: 'healthcare',  lat: 17.41290, lng: 78.34790},
  {key: 'inorbit-mall',         name: 'Inorbit Mall',                  category: 'retail',      lat: 17.43454, lng: 78.38669},
  {key: 'qualcomm',             name: 'Qualcomm',                      category: 'corporate',   lat: 17.42932, lng: 78.38011},
  {key: 'novartis',             name: 'Novartis',                      category: 'corporate',   lat: 17.43511, lng: 78.38143},
  {key: 'honeywell',            name: 'Honeywell',                     category: 'corporate',   lat: 17.41877, lng: 78.34415},
  {key: 'lemon-tree',           name: 'Lemon Tree Hotel',              category: 'hospitality', lat: 17.42286, lng: 78.33079},
  {key: 'rockwell-school',      name: 'Rockwell International School', category: 'education',   lat: 17.38672, lng: 78.33475},
  {key: 'ratnadeep',            name: 'Ratnadeep Supermarket',         category: 'retail',      lat: 17.38704, lng: 78.34045},
]

// The SAS pins — SAS_CROWN / SAS_ITOWER constants in map-3d.js, drawn in this order.
const PROJECT_PINS = [
  {key: 'sas-crown',  name: 'SAS Crown',  category: 'project', projectKey: 'crown',  lat: 17.401836,          lng: 78.338721,          showOnMobile: true},
  {key: 'sas-itower', name: 'SAS iTower', category: 'project', projectKey: 'itower', lat: 17.419178012275573, lng: 78.36055538892053,  showOnMobile: true},
]

// The old MOBILE_POI_KEYS allow-list, by NAME (the runtime keyed it by the
// slugified name): the only points the ≤640px map rendered.
const MOBILE_NAMES = new Set([
  'SAS Infra · Corporate Office', // centre — the anchor (SAS Infra logo marker)
  'Raidurg Metro Station',        // NE — the "connected corridor" (metro)
  'Indian School of Business',    // NW — marquee institution
  'Qutub Shahi Tombs',            // SE — heritage landmark, orientation
  'Ocean Park',                   // SW — rounds out the spread
])

const toItem = (p) => ({
  _key: p.key,
  _type: 'localityPoi',
  name: p.name,
  category: p.category,
  location: gp(p.lat, p.lng),
  ...(p.projectKey ? {projectKey: p.projectKey} : {}),
  showOnMobile: p.showOnMobile === true || MOBILE_NAMES.has(p.name),
})

const POIS = `pageBuilder[_key=="${BLOCK_KEY}"].pointsOfInterest`
const q = (id) => `*[_id == "${id}"][0].pageBuilder[_key=="${BLOCK_KEY}"].pointsOfInterest[]{_key, name, category, projectKey, showOnMobile, "lat": location.lat, "lng": location.lng}`
const show = (label, pts) => {
  console.log(`${label}: ${pts.length} points`)
  pts.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p._key.padEnd(22)} ${p.name.padEnd(32)} ${p.category.padEnd(12)} ${p.projectKey ? ('pin=' + p.projectKey).padEnd(11) : ''.padEnd(11)} mobile=${p.showOnMobile === true ? 'true ' : String(p.showOnMobile)}  ${p.lat},${p.lng}`))
}

async function seed(id) {
  const before = await client.fetch(q(id))
  if (!before) { console.log(`\n${id}: no mapBlock ${BLOCK_KEY} / not found — skipped`); return }
  console.log(`\n=== ${id} ===`)
  show('before', before)

  const have = new Set(before.map((p) => p._key))
  const add = [...SUPPLEMENTAL, ...PROJECT_PINS].filter((p) => !have.has(p.key)).map(toItem)

  let patch = client.patch(id)
  // Existing points: showOnMobile = was it in the old MOBILE_POI_KEYS anchor set.
  const flags = {}
  for (const p of before) flags[`${POIS}[_key=="${p._key}"].showOnMobile`] = MOBILE_NAMES.has(p.name)
  patch = patch.set(flags)
  if (add.length) patch = patch.insert('after', `${POIS}[-1]`, add)
  await patch.commit()

  const after = await client.fetch(q(id))
  show('after ', after)
  console.log(`✓ ${id}: flagged ${before.length} existing, appended ${add.length} (${add.map((p) => p._key).join(', ') || 'none'}); mobile set = ${after.filter((p) => p.showOnMobile === true).map((p) => p.name).join(' | ')}`)
}

const ids = ['homePage', ...((await client.fetch('*[_id == "drafts.homePage"][0]._id')) ? ['drafts.homePage'] : [])]
console.log('targets:', ids.join(', '))
for (const id of ids) await seed(id)
