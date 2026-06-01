import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// SEO migration — PAGES + SINGLETONS (SEO_MIGRATION.md §2).
// Overwrite seo.metaTitle + seo.metaDescription on the PUBLISHED docs with the
// VERBATIM live values captured in scripts/seo-live-meta.json (fetched directly
// from live sasinfra.com by fetch-live-seo.mjs — never copied from the .md tables).
// OG images for pages are NOT migrated: live pages use the generic logo or none
// (§2) — flagged as an Option-2-lite improvement, not a verbatim move. The live
// /project-updates/ page is the one exception with a real custom OG, flagged in
// the run summary but left for Krishna to decide (the manifest only directs OG
// imports for the two project docs).
//
// Run: sanity exec scripts/patch-seo-migrate-pages.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})
const live = JSON.parse(readFileSync(new URL('./seo-live-meta.json', import.meta.url)))

// Doc id -> the live-snapshot key to pull metaTitle/metaDescription from.
// page-about DOES have a live source: /about/ + /about-sas-infra/ 301 to the
// canonical /about-sas-infra-hyderabad/ (Krishna's correction; manifest §2 wrongly
// called it net-new). Its real photo og:image is left on fallback like the other
// pages (page-OG migration is deferred to the Option 2-lite card plan).
const DOCS = [
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

console.log(`\ndone — ${DOCS.length} docs`)
