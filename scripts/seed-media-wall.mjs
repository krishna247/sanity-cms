import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Seed the /media wall: 3 SAS Infra films (YouTube) + 17 press clippings, as
// `pressItem` docs (extended with kind/category + the video fields). Content is
// the finalized set from the media-redesign/v2 mock. INTERIM ART: each press
// item owns its OWN dedicated `image` field, seeded with the project render the
// mock used as a rough fit — an editor can swap any of them later. Films carry
// no image; the frontend derives the YouTube still. Idempotent: reuses assets by
// originalFilename, createOrReplace on stable ids, and prunes stray pressItems.
const client = getCliClient().withConfig({dataset: 'production'})
const IMG_DIR = '/Users/krishna/sasinfra/repos/frontend/public/images/'

// ── FILMS (kind: video · category Films · no image → derived YT still) ──
const films = [
  {
    _id: 'media-film-block1-25th',
    publishedAt: '2026-03-15',
    category: 'Films',
    publication: 'SAS Infra Films',
    title: "Block 1 crosses the 25th storey — Hyderabad's tallest commercial frame takes shape",
    youtubeUrl: 'https://youtu.be/UibIqbVFNuE',
    duration: '2:41',
  },
  {
    _id: 'media-film-block2-wellness',
    publishedAt: '2026-02-10',
    category: 'Films',
    publication: 'SAS Infra Films',
    title: 'Block 2 wellness deck shell complete — pool basin pour scheduled',
    youtubeUrl: 'https://youtu.be/-2vWU5XjI3E',
    duration: '1:58',
  },
  {
    _id: 'media-film-facade-led',
    publishedAt: '2026-01-20',
    category: 'Films',
    publication: 'SAS Infra Films',
    title: 'Digital façade panels arrive — first commercial LED skin in Hyderabad',
    youtubeUrl: 'https://youtu.be/F9e1Sv2ELDQ',
    duration: '3:12',
  },
]

// ── PRESS (kind: press) — [_id, date, category, publication, title, file, alt] ──
// The 5 ids that reuse existing placeholder docs are kept so no orphans remain.
const press = [
  ['pressItem-crown-tallest', '2026-04-15', 'Recognition', 'The Economic Times',
    "SAS Crown crowned South India's tallest residential tower",
    'crown-tower-day.webp', 'SAS Crown tower by day'],
  ['pressItem-itower-groundbreak', '2024-12-12', 'Milestones', 'The Times of India',
    "SAS iTower breaks ground in Hyderabad's Financial District",
    'itower-render-night.webp', 'SAS iTower at night'],
  ['pressItem-the-address', '2025-06-04', 'Milestones', 'Deccan Chronicle',
    'The Address — a premium retail destination joins the SAS portfolio',
    'address-retail-interior.webp', 'The Address — retail interior'],
  ['media-press-itower-led', '2026-03-01', 'Milestones', 'Telangana Today',
    "iTower's LED skin sets a new civic landmark for the Financial District",
    'itower-drone-led-panel.webp', 'SAS iTower LED façade panel'],
  ['media-press-crown-clubhouse', '2026-02-01', 'Milestones', 'Telangana Today',
    "Inside Crown's sky clubhouse: amenity as address",
    'crown-clubhouse-perspective.webp', 'SAS Crown sky clubhouse'],
  ['media-press-fd-anchor', '2025-11-15', 'Milestones', 'The Hindu',
    "Financial District's next skyline anchor rises at dusk",
    'itower-drone-dusk.webp', 'SAS iTower at dusk'],
  ['pressItem-doctor-profile', '2025-11-22', 'Press', 'Business Today',
    'How a doctor rewrote the rules of Hyderabad real estate',
    'itower-render-dusk.webp', 'SAS iTower render at dusk'],
  ['pressItem-highrise-capital', '2025-09-10', 'Press', 'Hindu BusinessLine',
    "Hyderabad is rising as India's high-rise capital",
    'itower-drone-aerial.webp', 'SAS iTower aerial view'],
  ['media-press-ctbuh', '2026-01-01', 'Recognition', 'CTBUH',
    "SAS Crown recognised among India's tallest completed towers",
    'crown-gallery-tower.webp', 'SAS Crown tower'],
  ['media-press-luxury-surge', '2025-08-15', 'Press', 'The Economic Times',
    'Luxury high-rise demand surges across west Hyderabad',
    'crown-interior-2.webp', 'SAS Crown interior'],
  ['media-press-archello', '2025-07-10', 'Recognition', 'Archello',
    'SAS iTower featured in a global tall-building index',
    'itower-drone-facade.webp', 'SAS iTower façade'],
  ['media-press-eenadu', '2026-05-15', 'Press', 'Eenadu',
    'హైదరాబాద్‌లో ఎత్తైన టవర్‌గా ఎస్‌ఏఎస్ క్రౌన్',
    'crown-render.jpg', 'SAS Crown tower render'],
  ['media-press-sakshi', '2026-04-20', 'Press', 'Sakshi',
    'ఫైనాన్షియల్ డిస్ట్రిక్ట్‌లో ఐటవర్ నిర్మాణం వేగంగా',
    'itower-render-podium.webp', 'SAS iTower podium'],
  ['media-press-toi-vertical', '2025-10-15', 'Press', 'The Times of India',
    "Times of India spotlights Hyderabad's vertical turn",
    'itower-render-tower.webp', 'SAS iTower tower render'],
  ['media-press-crown-aerial', '2026-01-10', 'Milestones', 'Deccan Chronicle',
    'Crown aerial: the tower against the western skyline',
    'crown-tower-aerial.webp', 'SAS Crown aerial view'],
  ['media-press-itower-plaza', '2025-12-15', 'Milestones', 'Telangana Today',
    'iTower plaza and podium take civic shape',
    'itower-render-plaza.webp', 'SAS iTower plaza'],
  ['media-press-address-mix', '2025-06-20', 'Milestones', 'The Hindu',
    'The Address retail mix: a curated high-street',
    'address-retail-mix.webp', 'The Address — retail mix'],
]

// 1) Upload the press thumbnails (dedupe by originalFilename → reuse assets).
const files = [...new Set(press.map((p) => p[5]))]
const existing = await client.fetch(
  `*[_type=="sanity.imageAsset" && originalFilename in $names]{originalFilename, _id}`,
  {names: files},
)
const assetId = new Map(existing.map((a) => [a.originalFilename, a._id]))
for (const f of files) {
  if (assetId.has(f)) {
    console.log('reuse ', f, '->', assetId.get(f))
    continue
  }
  const asset = await client.assets.upload('image', readFileSync(IMG_DIR + f), {filename: f})
  assetId.set(f, asset._id)
  console.log('upload', f, '->', asset._id)
}

// 2) Build + write all docs (createOrReplace publishes directly, mirroring the
//    existing seed-press-items.mjs CLI pattern).
const docs = [
  ...films.map((f) => ({_type: 'pressItem', kind: 'video', ...f})),
  ...press.map(([_id, publishedAt, category, publication, title, file, alt]) => ({
    _type: 'pressItem',
    _id,
    kind: 'press',
    category,
    publishedAt,
    publication,
    title,
    image: {
      _type: 'imageWithAlt',
      image: {_type: 'image', asset: {_type: 'reference', _ref: assetId.get(file)}},
      alt,
    },
  })),
]

for (const doc of docs) {
  await client.createOrReplace(doc)
  console.log('seeded', doc._id)
}

// 3) Prune any pre-existing pressItem doc NOT in this set (old placeholders) so
//    the wall shows only real content.
const keep = new Set(docs.map((d) => d._id))
const all = await client.fetch(`*[_type=="pressItem"]._id`)
const stray = all.filter((id) => !keep.has(id) && !keep.has(id.replace(/^drafts\./, '')))
for (const id of stray) {
  await client.delete(id)
  console.log('pruned', id)
}

console.log('\ndone —', docs.length, 'media docs seeded,', stray.length, 'pruned')
