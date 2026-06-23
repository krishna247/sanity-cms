import {getCliClient} from 'sanity/cli'

// Embed the original <em> accents into the Crown "Life at Crown" (amenityZonesBlock,
// k303) headings so the wired bespoke section stays pixel-identical (rendered with
// set:html). Block content was already seeded; only the accents were missing.
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('project-sas-crown')
  .set({
    'pageBuilder[_key=="k303"].head.heading': 'Everything we have <em>on offer</em>.',
    'pageBuilder[_key=="k303"].anchor.heading': 'Where ten amenities <em>belong</em>.',
  })
  .commit()

console.log('patched Crown amenityZones headings (on offer / belong)')
