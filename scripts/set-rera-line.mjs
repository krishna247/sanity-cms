import {getCliClient} from 'sanity/cli'

// Replace the placeholder RERA registration line on the siteSettings singleton.
//
// The seeded value listed three projects with dummy numbers —
//   "SAS Crown: P02400006XXX · SAS iTower: P02400007XXX · The Address: P02400008XXX"
// — which the footer renders on every page of the site. Crown and iTower have
// real allotted registrations (P02400002786 / P02400000878, previously hardcoded
// as a per-project override in the frontend's projects/[slug].astro); The Address
// has none yet, so it is dropped from the line entirely rather than shipping a
// "P024000…XXX" placeholder that reads like a real registration number.
//
// This string is byte-identical to the fallback literal in the frontend's
// src/components/Footer.astro, so the CMS value and the code fallback can never
// render differently. If The Address gets a number, update BOTH.
//
// Direct published write (same pattern as set-carimali-logo.mjs). There is no
// draft of siteSettings, so this patch is itself the publish — and it fires the
// sanity-publish repository_dispatch webhook, which rebuilds the frontend.
const client = getCliClient().withConfig({dataset: 'production'})

const RERA_LINE =
  'RERA registration · SAS Crown: P02400002786 · SAS iTower: P02400000878. Project information available at telangana.rera.gov.in.'

const before = await client.fetch('*[_id == "siteSettings"][0].reraLine')
console.log('before:', before)

await client.patch('siteSettings').set({reraLine: RERA_LINE}).commit()

const after = await client.fetch('*[_id == "siteSettings"][0].reraLine')
console.log('after: ', after)
