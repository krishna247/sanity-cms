import {getCliClient} from 'sanity/cli'

// Embed the original bespoke <em>/<br> accents into the seeded map + contact
// headings so the rewired CrownPage stays pixel-identical when it set:html's them.
const client = getCliClient().withConfig({dataset: 'production'})

const res = await client
  .patch('project-sas-crown')
  .set({
    'pageBuilder[_key=="k305"].overture.heading': 'The Kokapet <em>spine</em>.',
    'pageBuilder[_key=="k305"].locationCard.heading': 'SAS <em>Crown</em>.',
    'pageBuilder[_key=="k312"].head.heading': 'Tour <em>SAS Crown</em><br />at Kokapet.',
  })
  .commit()
console.log('patched', res._id, 'rev', res._rev)
