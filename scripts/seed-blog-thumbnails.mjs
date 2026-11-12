// Seed blogPost.thumbnail (QA Sr 48): each post gets its OWN 4:3 asset, cropped
// from its featured image (distinct bytes → distinct Sanity asset).
//   MANIFEST=<path to manifest.json> npx sanity exec scripts/seed-blog-thumbnails.mjs --with-user-token
// manifest: [{id, file}]. Patches the published doc and any open draft; skips a
// post that already has a thumbnail.
import {getCliClient} from 'sanity/cli'
import fs from 'node:fs'
import path from 'node:path'
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const jobs = JSON.parse(fs.readFileSync(process.env.MANIFEST, 'utf8'))
const results = await Promise.all(jobs.map(async ({id, file}) => {
  const doc = await client.getDocument(id)
  if (!doc) return `${id}: MISSING`
  if (doc.thumbnail?.image?.asset) return `${id}: already has thumbnail, skipped`
  const asset = await client.assets.upload('image', fs.createReadStream(file), {filename: path.basename(file)})
  if (asset._id === doc.featuredImage?.image?.asset?._ref) throw new Error(`${id}: deduped onto featured asset`)
  const thumbnail = {
    _type: 'imageWithAlt',
    image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
    alt: doc.featuredImage?.alt || doc.title,
  }
  const tx = client.transaction().patch(id, (p) => p.set({thumbnail}))
  const draft = await client.getDocument(`drafts.${id}`)
  if (draft) tx.patch(`drafts.${id}`, (p) => p.set({thumbnail}))
  await tx.commit()
  return `${id}: ${asset._id}${draft ? ' (+draft)' : ''}`
}))
console.log(results.join('\n'))
