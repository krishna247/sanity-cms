import {getCliClient} from 'sanity/cli'

// Seed the home page locality map: pointsOfInterest + markerCategories +
// hiddenLocalities on the homePage mapBlock. Mirrors the code-fallback dataset
// in repos/frontend/public/locality-points.js + the CATEGORIES_DEFAULT palette
// in public/map-3d.js, so the CMS becomes the source of truth while the static
// file remains an identical fallback.
//
// Patches the PUBLISHED homePage directly (not drafts.homePage): the draft is
// known-stale and publishing it would revert unrelated content. The live site
// reads published, so this lights up the CMS POIs without that risk. If the
// stale draft is ever published, the map degrades gracefully to the static file.
//
// Run:  npx sanity exec scripts/seed-home-map-pois.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01'})

const DOC = 'homePage'
const BLOCK_KEY = 'k73' // mapBlock _key on homePage.pageBuilder

const gp = (lat, lng) => ({_type: 'geopoint', lat, lng})

const POIS = [
  {key: 'aig-hospitals',    name: 'AIG Hospitals',                     category: 'healthcare',  lat: 17.44327, lng: 78.36628, side: 'left',  dy: 4},
  {key: 'deloitte',         name: 'Deloitte Towers',                   category: 'corporate',   lat: 17.44191, lng: 78.36902, side: 'right'},
  {key: 'ikea',             name: 'IKEA Hyderabad',                    category: 'retail',      lat: 17.43918, lng: 78.37537, side: 'right'},
  {key: 'wells-fargo',      name: 'Wells Fargo India Tower 4',         category: 'corporate',   lat: 17.42518, lng: 78.37809, side: 'left'},
  {key: 'isb',              name: 'Indian School of Business',         category: 'education',   lat: 17.43513, lng: 78.34068, side: 'left'},
  {key: 'boulder-hills',    name: 'Boulder Hills Golf & Country Club', category: 'leisure',     lat: 17.43552, lng: 78.34685, side: 'right'},
  {key: 'wipro-gopanpally', name: 'Wipro Gopanpally Campus',           category: 'corporate',   lat: 17.43518, lng: 78.29837, side: 'right'},
  {key: 'nawaabs',          name: "The Nawaab's Restaurant",           category: 'hospitality', lat: 17.44893, lng: 78.36399, side: 'left',  dy: -6},
  {key: 'raidurg-metro',    name: 'Raidurg Metro Station',             category: 'transit',     lat: 17.44220, lng: 78.37730, side: 'right'},
  {key: 'wipro',            name: 'Wipro',                             category: 'corporate',   lat: 17.42661, lng: 78.34505},
  {key: 'sheraton',         name: 'Sheraton Hyderabad Hotel',          category: 'hospitality', lat: 17.42188, lng: 78.33727, side: 'left'},
  {key: 'amazon',           name: 'Amazon Development Centre',         category: 'corporate',   lat: 17.42005, lng: 78.34565, side: 'right', dy: 6},
  {key: 'sutherland',       name: 'Sutherland Global Services',        category: 'corporate',   lat: 17.41169, lng: 78.37062, side: 'right'},
  {key: 'moai-kitchen',     name: 'Moai Kitchen',                      category: 'hospitality', lat: 17.41528, lng: 78.32878},
  {key: 'cbit',             name: 'Chaitanya Bharathi Inst. of Tech',  category: 'education',   lat: 17.39209, lng: 78.31955},
  {key: 'fly-zone',         name: 'Fly Zone Hyderabad',                category: 'leisure',     lat: 17.39760, lng: 78.30870},
  {key: 'ocean-park',       name: 'Ocean Park',                        category: 'leisure',     lat: 17.38935, lng: 78.32912},
  {key: 'om-convention',    name: 'OM Convention',                     category: 'convention',  lat: 17.38325, lng: 78.35820},
  {key: 'qutub-shahi',      name: 'Qutub Shahi Tombs',                 category: 'heritage',    lat: 17.39551, lng: 78.39682},
  {key: 'sas-infra-office', name: 'SAS Infra · Corporate Office',      category: 'office',      lat: 17.41321, lng: 78.35343},
]

const CATS = [
  {key: 'healthcare',  label: 'Healthcare',     color: '#C0524F', icon: 'cross'},
  {key: 'education',   label: 'Education',       color: '#5667A0', icon: 'cap'},
  {key: 'corporate',   label: 'IT / Corporate',  color: '#3C8585', icon: 'building'},
  {key: 'hospitality', label: 'Hospitality',    color: '#C28A3A', icon: 'dining'},
  {key: 'retail',      label: 'Retail',         color: '#B07C2A', icon: 'bag'},
  {key: 'leisure',     label: 'Leisure',        color: '#6B9457', icon: 'flag'},
  {key: 'heritage',    label: 'Heritage',       color: '#8A5A99', icon: 'dome'},
  {key: 'convention',  label: 'Convention',     color: '#BC6444', icon: 'star'},
  {key: 'transit',     label: 'Transit',        color: '#4A78BC', icon: 'train'},
]

const HIDDEN = ['Borabanda', 'Jubilee Hills', 'Navirman Nagar', 'Osman Nagar', 'Tolichowki', 'Golconda', 'Ibrahim Bagh', 'Yousufguda']

const pointsOfInterest = POIS.map((p) => ({
  _key: p.key,
  _type: 'localityPoi',
  name: p.name,
  category: p.category,
  location: gp(p.lat, p.lng),
  ...(p.side ? {labelSide: p.side} : {}),
  ...(p.dy != null ? {labelNudge: p.dy} : {}),
}))

const markerCategories = CATS.map((c) => ({_key: `cat-${c.key}`, _type: 'markerCategory', ...c}))

async function main() {
  const doc = await client.getDocument(DOC)
  if (!doc) throw new Error(`${DOC} not found`)
  const block = (doc.pageBuilder || []).find((b) => b._key === BLOCK_KEY)
  if (!block || block._type !== 'mapBlock') throw new Error(`mapBlock ${BLOCK_KEY} not found on ${DOC}`)

  await client
    .patch(DOC)
    .set({
      [`pageBuilder[_key=="${BLOCK_KEY}"].pointsOfInterest`]: pointsOfInterest,
      [`pageBuilder[_key=="${BLOCK_KEY}"].markerCategories`]: markerCategories,
      [`pageBuilder[_key=="${BLOCK_KEY}"].hiddenLocalities`]: HIDDEN,
    })
    .commit()

  console.log(`✓ Seeded ${pointsOfInterest.length} POIs, ${markerCategories.length} categories, ${HIDDEN.length} hidden labels onto ${DOC} mapBlock[${BLOCK_KEY}]`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
