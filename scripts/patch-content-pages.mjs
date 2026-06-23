import {getCliClient} from 'sanity/cli'

// Embed the original bespoke <em>/<br> accents into the seeded content-page
// headings (careers / contact / media) so the rewired bespoke bodies stay
// pixel-identical when they set:html these. Legal pages stay code-driven.
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('page-careers')
  .set({
    'pageBuilder[_key=="k121"].title': 'Build what <em>Hyderabad</em><br />will be known for.',
    'pageBuilder[_key=="k137"].head.heading': 'Six disciplines.<br />One <em>operating culture</em>.',
    'pageBuilder[_key=="k140"].head.heading': 'Send us your <em>profile</em>.',
  })
  .commit()

await client
  .patch('page-contact')
  .set({'pageBuilder[_key=="k141"].title': 'Come see <em>what we are building</em>.'})
  .commit()

await client
  .patch('page-media')
  .set({
    'pageBuilder[_key=="k165"].title': 'Press &amp; <em>coverage</em>.',
    'pageBuilder[_key=="k168"].head.heading':
      'For interviews, image requests, or <em>media kit access</em>.',
  })
  .commit()

console.log('patched careers, contact, media')
