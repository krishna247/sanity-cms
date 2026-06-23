import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Phase 1 — add the four EXISTING block types iTower's projectPageBuilder
// already supports (so no schema deploy) to project-sas-itower, seeded with the
// verbatim 626a165 copy so the rewired ITowerPage stays pixel-identical:
//   • signatureFeatureBlock — digital façade (cinema variant is the visible one)
//   • galleryBlock          — 6 tiles (head measured; viewport harness-hidden)
//   • floorPlansBlock        — head + the two block-variant pane images
//   • locationMapBlock       — overture / disc location card / footnote
// Idempotent: strips any prior copy of these blocks by _key, then re-appends.
const client = getCliClient().withConfig({dataset: 'production'})
const ids = JSON.parse(
  readFileSync('/Users/krishna/sasinfra/repos/sanity/scripts/itower-asset-ids.json', 'utf8'),
)
const img = (file, alt) => ({
  _type: 'imageWithAlt',
  image: {_type: 'image', asset: {_type: 'reference', _ref: ids[file]}},
  alt,
})

const sig = {
  _key: 'itSig',
  _type: 'signatureFeatureBlock',
  variant: 'cinema',
  image: img('itower-render-night.webp', 'Digital façade · SAS iTower'),
  eyebrow: 'Signature · Digital Façade',
  heading: "South India's largest <em>LED façade</em>.",
  body: 'A 171-metre digital surface — the first for any commercial project in Hyderabad. Programmable, daylight-readable, and built to turn the building itself into a brand canvas for anchor tenants.',
  items: [
    'Programmable LED skin',
    'Daylight-readable luminance',
    'Tenant branding rights',
    'City-scale visibility',
    'Integrated wayfinding',
    'BMS-controlled scenes',
  ],
}

const gallery = {
  _key: 'itGal',
  _type: 'galleryBlock',
  variant: 'carousel',
  head: {eyebrow: 'Gallery', heading: 'An <em>uninterrupted</em> view of the CBD.'},
  cta: {_type: 'link', kind: 'anchor', label: 'View All'},
  images: [
    {_key: 'itg1', size: 'tall', image: img('itower-render-tower.webp', 'SAS iTower — slender tower at dawn')},
    {_key: 'itg2', size: 'default', image: img('itower-drone-dusk.webp', 'SAS iTower under construction at dusk, April 2026')},
    {_key: 'itg3', size: 'default', image: img('itower-interior-lobby.webp', 'SAS iTower main lobby')},
    {_key: 'itg4', size: 'default', image: img('itower-interior-office.webp', 'Typical office floor — perimeter glazing')},
    {_key: 'itg5', size: 'default', image: img('itower-interior-cafe.webp', 'On-site food court')},
    {_key: 'itg6', size: 'default', image: img('itower-render-dusk.webp', 'SAS iTower viewed across the lake at dusk')},
  ],
}

const plans = {
  _key: 'itPlans',
  _type: 'floorPlansBlock',
  mode: 'list',
  head: {
    eyebrow: 'Floor Plates',
    heading: "The city's largest <em>floor plate</em>.",
    dek: 'A 1.2 lakh sq ft typical plate, engineered for tenants who plan in whole floors. Half- and quarter-floor splits available for smaller occupiers.',
  },
  cta: {_type: 'link', kind: 'anchor', label: 'Download Plate Pack'},
  plans: [
    {_key: 'itp1', seq: 1, label: 'Tower A · Block 1', size: '1,20,000 sq ft', planImage: img('itower-plan-typical.webp', 'Tower A · Block 1 typical plate')},
    {_key: 'itp2', seq: 2, label: 'Refuge / Non-refuge split', size: 'Block 1 detail', planImage: img('itower-plan-split.webp', 'Block 1 — refuge and non-refuge floor split')},
  ],
}

const map = {
  _key: 'itMap',
  _type: 'locationMapBlock',
  overture: {
    eyebrow: 'III — Location',
    heading: 'A sentinel of the <em>CBD</em>.',
    dek: 'Seven minutes to the Financial District. Fifteen to HITEC City.',
  },
  mapConfig: {mapProject: 'itower', frameStyle: 'disc'},
  locationCard: {
    eyebrow: 'The Project',
    heading: 'SAS <em>iTower</em>.',
    dek: 'A majestic sentinel between the twin giants of commerce — HITEC City and the Financial District.',
  },
  footnote: 'Travel times by car at 10:00 IST · Google Maps median, April 2026.',
}

const NEW = [sig, gallery, plans, map]
const keys = new Set(NEW.map((b) => b._key))

const doc = await client.getDocument('project-sas-itower')
const kept = (doc.pageBuilder ?? []).filter((b) => !keys.has(b._key))
await client
  .patch('project-sas-itower')
  .set({pageBuilder: [...kept, ...NEW]})
  .commit()

console.log('seeded iTower phase 1 blocks:', NEW.map((b) => `${b._type}(${b._key})`).join(', '))
