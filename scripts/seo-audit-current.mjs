import {getCliClient} from 'sanity/cli'

// Read-only: dump the current published SEO state of every doc the SEO migration
// touches, plus siteSettings.organizationType and the project fields the JSON-LD
// parity work reads. No writes. Run: sanity exec scripts/seo-audit-current.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})

const ids = [
  'homePage',
  'page-contact',
  'page-privacy',
  'page-cookies',
  'page-terms',
  'page-media',
  'page-careers',
  'page-about',
  'updatesIndexPage',
  'blogIndexPage',
]

const pages = await client.fetch(
  `*[_id in $ids]{_id, _type, title, "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription, "ogImageRef": seo.ogImage.image.asset._ref, "ogImageAlt": seo.ogImage.alt}`,
  {ids},
)
console.log('=== PAGES / SINGLETONS ===')
for (const id of ids) {
  const d = pages.find((p) => p._id === id)
  if (!d) { console.log(`MISSING: ${id}`); continue }
  console.log(JSON.stringify(d, null, 2))
}

console.log('\n=== PROJECTS (all) ===')
const projects = await client.fetch(
  `*[_type == "project"]{_id, title, "segment": route.segment.current, projectType, unitConfiguration, seoSchemaType, "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription, "ogImageRef": seo.ogImage.image.asset._ref}`,
)
console.log(JSON.stringify(projects, null, 2))

console.log('\n=== siteSettings ===')
const ss = await client.fetch(
  `*[_type == "siteSettings"][0]{_id, companyName, organizationType, "phone": contactPoints[0].telephone, areaServed, address, socialLinks}`,
)
console.log(JSON.stringify(ss, null, 2))

console.log('\n=== blogPost sample (hydra-explained) ===')
const bp = await client.fetch(
  `*[_type == "blogPost" && slug.current == "hydra-explained"][0]{_id, title, "slug": slug.current, "metaTitle": seo.metaTitle, excerpt, publishedAt, updatedAt, author, category}`,
)
console.log(JSON.stringify(bp, null, 2))
