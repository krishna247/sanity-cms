import {getCliClient} from 'sanity/cli'

// Embed the original <em> accents into the Crown gallery (k296) + floor-plans
// (k298) headings so the wired bespoke heads stay pixel-identical (set:html).
// Also reset the floor-plans head.dek to the original .cwp-sub copy ALONE — the
// seed had crammed the 4-item .cwp-meta info onto the end of the dek, but the meta
// has no schema field and stays code-driven, so the dek must be just the sub.
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('project-sas-crown')
  .set({
    'pageBuilder[_key=="k296"].head.heading': 'An <em>uninterrupted</em> view of the city.',
    'pageBuilder[_key=="k298"].head.heading': "A bird's-eye view of the <em>residence</em>.",
    'pageBuilder[_key=="k298"].head.dek':
      'Five configurations across the tower — through-light layouts with east and west orientations. Sky villas occupy entire upper floors for whole-floor privacy.',
  })
  .commit()

console.log('patched Crown gallery + floor-plans heads (em accents + decoupled floor-plans dek)')
