import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// SEO migration — PROJECT OG images (SEO_MIGRATION.md §3). Import each canonical
// live doorway page's real og:image into the project doc's seo.ogImage:
//   project-sas-crown  <- SAS-Crown-Clubhouse-1-1024x596.webp
//   project-sas-itower <- Blog_Image-copy.jpg
// URLs + alt text come from the frozen live snapshot (seo-live-meta.json). The
// ogImage field is `imageWithAlt` (alt is required), so we carry the live
// og:image:alt verbatim. Idempotent: reuses an asset already uploaded with the
// same originalFilename.
//
// Run: sanity exec scripts/import-project-og-images.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})
const live = JSON.parse(readFileSync(new URL('./seo-live-meta.json', import.meta.url)))

const DOCS = ['project-sas-crown', 'project-sas-itower']

async function assetForUrl(url) {
  const filename = decodeURIComponent(url.split('/').pop().split('?')[0])
  const existing = await client.fetch(
    `*[_type=="sanity.imageAsset" && originalFilename == $f][0]._id`,
    {f: filename},
  )
  if (existing) {
    console.log(`   reuse asset ${filename} -> ${existing}`)
    return existing
  }
  const res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 SEO-migration-fetch'}})
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buf, {filename, source: {name: 'live-sasinfra', id: url}})
  console.log(`   upload asset ${filename} -> ${asset._id}`)
  return asset._id
}

for (const id of DOCS) {
  const src = live[id]
  if (!src?.ogImage) {
    console.error(`SKIP ${id}: no live og:image in snapshot`)
    continue
  }
  const assetId = await assetForUrl(src.ogImage)
  const alt = src.ogImageAlt || src.title
  await client
    .patch(id)
    .setIfMissing({seo: {_type: 'seo'}})
    .set({
      'seo.ogImage': {
        _type: 'imageWithAlt',
        image: {_type: 'image', asset: {_type: 'reference', _ref: assetId}},
        alt,
      },
    })
    .commit()
  console.log(`patched ${id} seo.ogImage (alt: ${alt})\n`)
}

console.log(`done — ${DOCS.length} project OG images`)
