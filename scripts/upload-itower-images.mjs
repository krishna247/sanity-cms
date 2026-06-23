import {getCliClient} from 'sanity/cli'
import {readFileSync, writeFileSync, existsSync} from 'node:fs'

// Upload the iTower set-piece images so the bespoke sections can be CMS-driven.
// Idempotent: reuses any asset already present with the same originalFilename.
// Writes scripts/itower-asset-ids.json (filename -> asset _id) for the seed
// scripts. Rendered via rawImageUrl() (natural size) so they stay pixel-parity
// with the local /images/*.webp originals (Tier D — proven lossless).
const client = getCliClient().withConfig({dataset: 'production'})
const IMG_DIR = '/Users/krishna/sasinfra/repos/frontend/public/images/'

const files = [
  'itower-render-night.webp',
  'itower-plan-master.webp',
  'itower-plan-typical.webp',
  'itower-plan-split.webp',
  'itower-plan-elev-north.webp',
  'itower-plan-elev-west.webp',
  'itower-render-tower.webp',
  'itower-drone-dusk.webp',
  'itower-interior-lobby.webp',
  'itower-interior-office.webp',
  'itower-interior-cafe.webp',
  'itower-render-dusk.webp',
]

const existing = await client.fetch(
  `*[_type=="sanity.imageAsset" && originalFilename in $names]{originalFilename, _id}`,
  {names: files},
)
const byName = new Map(existing.map((a) => [a.originalFilename, a._id]))

const map = {}
for (const f of files) {
  if (byName.has(f)) {
    map[f] = byName.get(f)
    console.log('reuse ', f, '->', map[f])
    continue
  }
  const asset = await client.assets.upload('image', readFileSync(IMG_DIR + f), {filename: f})
  map[f] = asset._id
  console.log('upload', f, '->', asset._id)
}

const out = '/Users/krishna/sasinfra/repos/sanity/scripts/itower-asset-ids.json'
writeFileSync(out, JSON.stringify(map, null, 2))
console.log('\nwrote', out, '(', Object.keys(map).length, 'assets )')
