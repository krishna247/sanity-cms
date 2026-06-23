import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Homepage bespoke-restore content writes (W1 + W2). Patches the PUBLISHED docs
// directly (per instruction — the draft homePage is left untouched). Idempotent:
// assets reused by originalFilename; the logoWallBlock is inserted only if absent.
//
//   W1  homePage  — seed <em> emphasis into the 7 section headings + hero title +
//                   8 feature-pillar titles (so the bespoke set:html headings show
//                   the golden italics) AND insert the partner-marquee logoWallBlock
//                   between the "Why Choose" block (k72) and the mapBlock (k73).
//   W2  3 updates — upload + attach the 3 editorial shots to the latest updates so
//                   the homepage news cards are image-led (they had media:null).
//
// Run:  npx sanity exec scripts/restore-homepage.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})
const IMG_DIR = '/Users/krishna/sasinfra/repos/frontend/public/images/'

// ── W2: upload images ──────────────────────────────────────────────────────
const updateImages = [
  {file: 'itower-render.png',       updateId: 'pu-itower-2026-03', alt: 'SAS iTower construction progress, March 2026'},
  {file: 'crown-render.jpg',        updateId: 'pu-crown-2026-02',  alt: 'SAS Crown construction progress, February 2026'},
  {file: 'building-render-2.png',   updateId: 'pu-itower-2026-02', alt: 'SAS iTower progress overview, February 2026'},
]
const files = [...new Set(updateImages.map((u) => u.file))]
const existing = await client.fetch(
  `*[_type=="sanity.imageAsset" && originalFilename in $names]{originalFilename, _id}`,
  {names: files},
)
const byName = new Map(existing.map((a) => [a.originalFilename, a._id]))
const assetId = {}
for (const f of files) {
  if (byName.has(f)) {
    assetId[f] = byName.get(f)
    console.log('reuse ', f, '->', assetId[f])
  } else {
    const asset = await client.assets.upload('image', readFileSync(IMG_DIR + f), {filename: f})
    assetId[f] = asset._id
    console.log('upload', f, '->', asset._id)
  }
}

// ── W2: attach to the published projectUpdate docs ──────────────────────────
for (const {file, updateId, alt} of updateImages) {
  const res = await client
    .patch(updateId)
    .set({
      media: {
        kind: 'image',
        image: {
          _type: 'imageWithAlt',
          image: {_type: 'image', asset: {_type: 'reference', _ref: assetId[file]}},
          alt,
        },
      },
    })
    .commit()
  console.log('update media', res._id, 'rev', res._rev)
}

// ── W1: the partner marquee logoWallBlock (golden order, 16 partners) ───────
const ORDER = [
  'kone', 'toto', 'saint-gobain', 'schueco', 'schindler', 'otis', 'mitsubishi',
  'kohler', 'duravit', 'hansgrohe', 'daikin', 'carrier', 'siemens', 'honeywell',
  'bosch', 'arup',
]
const logoWallBlock = {
  _type: 'logoWallBlock',
  _key: 'lwhome',
  head: {
    eyebrow: 'Trusted Collaborations',
    heading: 'Global expertise <em>behind every landmark</em> we create.',
  },
  partners: ORDER.map((slug) => ({
    _key: `lwp-${slug}`,
    _type: 'reference',
    _ref: `partner-${slug}`,
  })),
}

// ── W1: <em> emphasis (matches the golden bespoke markup verbatim) ──────────
const emFields = {
  'pageBuilder[_key=="k56"].title': 'Creating <em>landmarks</em> that define Hyderabad.',
  'pageBuilder[_key=="k66"].head.heading': 'Building what Hyderabad will be <em>known for</em>.',
  'pageBuilder[_key=="k66"].features[0].title': 'Premium <em>Design</em>',
  'pageBuilder[_key=="k66"].features[1].title': 'Strategic <em>Locations</em>',
  'pageBuilder[_key=="k66"].features[2].title': 'Global <em>Standards</em>',
  'pageBuilder[_key=="k66"].features[3].title': '<em>Future</em>-Ready',
  'pageBuilder[_key=="k67"].head.heading': 'A portfolio of <em>defining</em> places, shaping the skyline of Hyderabad.',
  'pageBuilder[_key=="k72"].head.heading': 'Four commitments, <em>kept on every project.</em>',
  'pageBuilder[_key=="k72"].features[0].title': '<em>Transparent</em> Process',
  'pageBuilder[_key=="k72"].features[1].title': 'Long-Term <em>Partnership</em>',
  'pageBuilder[_key=="k72"].features[2].title': 'Global Expertise, <em>Local Roots</em>',
  'pageBuilder[_key=="k72"].features[3].title': '<em>Engineering</em> Excellence',
  'pageBuilder[_key=="k73"].head.heading': "Anchored on Hyderabad's <em>most connected</em> corridor.",
  'pageBuilder[_key=="k75"].head.heading': 'Construction milestones, <em>news, and insights.</em>',
  'pageBuilder[_key=="k81"].head.heading': 'Begin your <em>journey</em><br />with SAS Infra.',
}

const home = await client.getDocument('homePage')
const hasLogoWall = (home?.pageBuilder ?? []).some((b) => b._type === 'logoWallBlock')
let patch = client.patch('homePage').set(emFields)
if (!hasLogoWall) {
  patch = patch.insert('after', 'pageBuilder[_key=="k72"]', [logoWallBlock])
  console.log('inserting logoWallBlock after k72')
} else {
  console.log('logoWallBlock already present — skipping insert (em fields still set)')
}
const res = await patch.commit()
console.log('patched homePage', res._id, 'rev', res._rev)
console.log('\nDONE')
