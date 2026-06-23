import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Phase 2 — seed the seven NEW iTower block types (schema just deployed) with
// the verbatim 626a165 copy. Idempotent: strips prior copies by _key, re-appends.
const client = getCliClient().withConfig({dataset: 'production'})
const ids = JSON.parse(
  readFileSync('/Users/krishna/sasinfra/repos/sanity/scripts/itower-asset-ids.json', 'utf8'),
)
const img = (file, alt) => ({
  _type: 'imageWithAlt',
  image: {_type: 'image', asset: {_type: 'reference', _ref: ids[file]}},
  alt,
})

const masterPlan = {
  _key: 'itMaster',
  _type: 'masterPlanBlock',
  head: {
    eyebrow: 'Master Plan',
    heading: 'One site. Four <em>buildings</em>. A complete ecosystem.',
    dek: '10.36 acres at the spine of Nanakramguda — three-sided road access, separate office and retail entries, and 6.0 million sq ft of mixed-use development phased across two towers, an annexe block, and a podium retail building.',
  },
  image: img('itower-plan-master.webp', 'SAS iTower master plan — top-down site plan with Tower A (Block 1 + 2), Tower B and the retail block'),
  cinema: {
    eyebrow: 'III — Master Plan',
    heading: 'Tower A (Block 1 + 2), <em>Tower B</em>, and a podium retail block.',
    body: 'Block 1 holds 37 floors and the headline 1.2 L sq ft plate. Block 2 carries an 18-floor office stack plus a Floor 7 wellness deck. Tower B is reserved for Phase 2. The retail block sits separately on G+6.',
  },
}

const anatomy = {
  _key: 'itAnatomy',
  _type: 'towerAnatomyBlock',
  head: {
    eyebrow: 'IV — The Vertical Program',
    heading: 'The <em>anatomy</em> of a 171-metre tower.',
    dek: "Five distinct programs stacked across G + 37 floors — pulled straight from Aedas's north-facing elevation drawing.",
  },
  image: img('itower-plan-elev-north.webp', 'North-facing elevation of Tower A1 and A2'),
  bands: [
    {_key: 'ab1', band: 'sky', range: 'L17 — L36', cat: 'Office', heading: 'The headline plates.', body: 'Twenty floors of 1.2 lakh sq ft floor plate — the tallest, deepest commercial offer in Hyderabad. 4.1 m floor-to-ceiling, refuge cuts on alternating storeys, a dedicated sky-rise lift bank.'},
    {_key: 'ab2', band: 'food', range: 'L15 — L16', cat: 'Food Courts', heading: 'A two-floor sky lobby.', body: 'Multi-cuisine food courts and tenant-only lounges on a sky-deck level that doubles as the mid-rise / sky-rise lift transfer floor.'},
    {_key: 'ab3', band: 'midrise', range: 'L7 — L14', cat: 'Office', heading: 'Mid-rise office stack.', body: 'Eight floors served by a dedicated low/mid-rise lift bank — ideal for full-floor BFSI and GCC tenants who want podium proximity without sky-rise commute.'},
    {_key: 'ab4', band: 'podium', range: 'G — L6', cat: 'Retail · Plaza', heading: 'The podium retail spine.', body: 'Six retail levels with luxury anchors, food & beverage, multi-cuisine courts, a nine-screen multiplex, and the digital-façade-front plaza.'},
    {_key: 'ab5', band: 'basement', range: 'B1 — B5', cat: 'Basement Parking', heading: 'App-based, multi-level parking.', body: 'Five basement levels of app-controlled parking with EV charging, valet drop-off, and direct lift-lobby access for tenants and retail visitors alike.'},
  ],
}

const plate = {
  _key: 'itPlate',
  _type: 'plateAnatomyBlock',
  head: {
    eyebrow: 'V — Inside the Plate',
    heading: 'Anatomy of a <em>1.2 lakh sq ft</em> plate.',
    dek: "Five features that make Block 1's typical plate the city's most lease-able floor.",
  },
  image: img('itower-plan-typical.webp', 'Typical floor plate · annotated'),
  pins: [
    {_key: 'pp1', title: 'Central Core', body: 'Lift banks, service shafts, washrooms and staircases — concentrated to maximise leasable perimeter.'},
    {_key: 'pp2', title: 'Refuge Cut · West', body: 'Code-compliant refuge floor cut on alternating storeys — entered through the same core-side fire lobby.'},
    {_key: 'pp3', title: 'Service Lifts & Pantries', body: 'Five service lifts isolated from the passenger banks; service pantries on every floor for F&B tenants.'},
    {_key: 'pp4', title: 'Perimeter Office Band', body: 'Continuous 4.1 m floor-to-ceiling glazing. Daylight to a depth of ~12 m before any partition — best in class for the city.'},
    {_key: 'pp5', title: 'Column Grid', body: 'Wide-bay structural grid pulled to the core line — only the perimeter columns interrupt the open plan.'},
  ],
}

const tenants = {
  _key: 'itTenants',
  _type: 'tenantsBlock',
  head: {
    eyebrow: 'Built For',
    heading: 'Designed for the <em>occupiers</em> who set the standard.',
    dek: 'Three tenant categories at the core of every Grade-A pitch in the CBD — and the layouts and floor splits engineered for each.',
  },
  anchor: {
    image: img('itower-render-tower.webp', 'SAS iTower anchor render'),
    eyebrow: 'For Whom We Build',
    heading: "Where the city's <em>top occupiers</em> belong.",
    body: 'Three tenant categories at the heart of Grade-A demand in Hyderabad — each matched to a floor-split, lift-bank, and amenity stack tuned for their workflow.',
  },
  zones: [
    {_key: 'tz1', seq: 'I', title: 'BFSI & Insurance', body: 'Full-floor leases (1.2 L sq ft) · dedicated lift banks · executive arrival sequence · tenant-controlled access.'},
    {_key: 'tz2', seq: 'II', title: 'Global Capability Centres', body: 'Half-floor splits (60 K sq ft) · BMS-integrated tenant zones · LEED Gold + WELL Silver target · 4.1 m ceilings throughout.'},
    {_key: 'tz3', seq: 'III', title: 'Indian Corporates', body: 'Quarter-floor splits (30 K sq ft) · shared lobby · Block 2 floor-7 wellness deck · podium retail at the ground.'},
  ],
}

const engineered = {
  _key: 'itEng',
  _type: 'engineeredNumbersBlock',
  image: img('itower-plan-split.webp', 'Tower A · refuge / non-refuge floor split with lift bank schedule'),
  frameCaption: 'Aedas · typical-floor split for Tower A · Block 1',
  head: {
    eyebrow: 'VI — Engineered for Scale',
    heading: 'Forty high-speed lifts. <em>Numbers</em> that move a city.',
    dek: "Pulled directly from the architects' typical-floor split — the vertical-transport, life-safety and air-handling figures behind a 50,000-employee day.",
  },
  stats: [
    {_key: 'es1', num: '40', lab: 'High-speed passenger lifts'},
    {_key: 'es2', num: '5', lab: 'Service lifts'},
    {_key: 'es3', num: '5', lab: 'Staircases · 2.2 m wide'},
    {_key: 'es4', num: '3', lab: 'AHU rooms · 2 AHUs each'},
    {_key: 'es5', num: '9', lab: 'Parking lifts'},
    {_key: 'es6', num: '20', lab: 'Retail escalators'},
  ],
  banksHeading: 'Lift banks · floors served',
  banks: [
    {_key: 'eb1', zone: 'Low', floors: 'G — L11'},
    {_key: 'eb2', zone: 'Low-Mid', floors: 'G · L11 — L20'},
    {_key: 'eb3', zone: 'High-Mid', floors: 'G · L11, L15 · L20 — L28'},
    {_key: 'eb4', zone: 'High', floors: 'G · L11, L15 · L20, L28 — L36'},
  ],
}

const consultants = {
  _key: 'itConsult',
  _type: 'consultantsBlock',
  head: {
    eyebrow: 'Consultants',
    heading: 'Empowering every dream that <em>builds</em> our world.',
  },
  cells: [
    {_key: 'cc1', name: 'Aedas', role: 'Architecture'},
    {_key: 'cc2', name: 'CBRE', role: 'Leasing'},
    {_key: 'cc3', name: 'Coffey', role: 'Geotechnical'},
    {_key: 'cc4', name: 'Exova', role: 'Façade & Fire'},
    {_key: 'cc5', name: 'Godrej', role: 'Lifts & Security'},
    {_key: 'cc6', name: "L'Avenir", role: 'MEP'},
  ],
}

const brochure = {
  _key: 'itBrochure',
  _type: 'brochureBlock',
  head: {
    eyebrow: "VII — The Architects' Deck",
    heading: 'Read the building like a <em>brochure</em>.',
    dek: "Five plates pulled directly from Aedas's design package — the master plan, the typical 1.2 lakh sq ft plate, the refuge split, and the tower elevations on both axes.",
  },
  ctaLabel: 'Download Full Brochure (PDF)',
  cards: [
    {_key: 'bc1', num: 'i', image: img('itower-plan-master.webp', 'Master Plan'), title: 'Master Plan', sub: '10.36 acres · four buildings · area schedules'},
    {_key: 'bc2', num: 'ii', image: img('itower-plan-typical.webp', 'Typical Floor Plan'), title: 'Typical Floor Plan', sub: '1,20,000 sq ft plate · structural grid'},
    {_key: 'bc3', num: 'iii', image: img('itower-plan-split.webp', 'Refuge Split'), title: 'Refuge Split — Tower A · Block 1', sub: 'Refuge / non-refuge floors · lift bank schedule'},
    {_key: 'bc4', num: 'iv', image: img('itower-plan-elev-north.webp', 'North-facing Elevation'), title: 'North-facing Elevation', sub: 'Tower A1 + A2 · floor-by-floor program'},
    {_key: 'bc5', num: 'v', image: img('itower-plan-elev-west.webp', 'West-facing Elevation'), title: 'West-facing Elevation', sub: 'Tower A1 · long-axis section'},
  ],
}

const NEW = [masterPlan, anatomy, plate, tenants, engineered, consultants, brochure]
const keys = new Set(NEW.map((b) => b._key))

const doc = await client.getDocument('project-sas-itower')
const kept = (doc.pageBuilder ?? []).filter((b) => !keys.has(b._key))
await client
  .patch('project-sas-itower')
  .set({pageBuilder: [...kept, ...NEW]})
  .commit()

console.log('seeded iTower phase 2 blocks:', NEW.map((b) => `${b._type}(${b._key})`).join(', '))
