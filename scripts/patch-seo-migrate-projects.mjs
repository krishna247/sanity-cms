import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// SEO migration — PROJECTS (SEO_MIGRATION.md §3). Crown/iTower currently have
// empty seo. Fill seo.metaTitle + seo.metaDescription VERBATIM from the strongest
// live doorway page (the canonical sources, already mapped in fetch-live-seo.mjs):
//   project-sas-crown  <- /tallest-residential-tower-in-south-india/
//   project-sas-itower <- /sas-itower-commercial-spaces-nanakramguda-khajaguda/
// The retired doorway slugs are 301'd to these in public/_redirects.
//
// OG images are imported by import-project-og-images.mjs (separate, §7).
// ⚠ BHK CONFLICT (flagged, NOT fixed here): the Crown live meta says "3 & 4 BHK";
// Sanity unitConfiguration = "4 BHK". We migrate the meta text verbatim and leave
// unitConfiguration untouched — Krishna reconciles the factual unit mix.
//
// Run: sanity exec scripts/patch-seo-migrate-projects.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})
const live = JSON.parse(readFileSync(new URL('./seo-live-meta.json', import.meta.url)))

const DOCS = ['project-sas-crown', 'project-sas-itower']

for (const id of DOCS) {
  const src = live[id]
  if (!src || !src.title || !src.description) {
    console.error(`SKIP ${id}: missing live title/description in snapshot`)
    continue
  }
  await client
    .patch(id)
    .setIfMissing({seo: {_type: 'seo'}})
    .set({'seo.metaTitle': src.title, 'seo.metaDescription': src.description})
    .commit()
  console.log(`patched ${id}`)
  console.log(`   title: ${src.title}`)
  console.log(`   desc : ${src.description}`)
}

console.log(`\ndone — ${DOCS.length} docs (unitConfiguration left untouched — BHK conflict flagged)`)
