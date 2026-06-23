import {getCliClient} from 'sanity/cli'

// Embed the original bespoke <em>/<br> accents into the seeded About headings so
// the rewired AboutPage stays pixel-identical when it set:html's them.
const client = getCliClient().withConfig({dataset: 'production'})

const res = await client
  .patch('page-about')
  .set({
    'pageBuilder[_key=="k82"].title':
      'Twenty-five years<br />building <em>what Hyderabad</em><br />will be known for.',
    'pageBuilder[_key=="k89"].head.heading':
      'An <em>industry outsider</em> who chose to build for the long term.',
    'pageBuilder[_key=="k98"].head.heading':
      'A leadership group<br />with <em>operating depth</em>.',
    'pageBuilder[_key=="k117"].head.heading': 'From <em>2000</em> to today.',
    'pageBuilder[_key=="k120"].head.heading':
      'Come see <em>what we have built</em>,<br />and what we are building next.',
  })
  .commit()
console.log('patched', res._id, 'rev', res._rev)
