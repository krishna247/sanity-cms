import {getCliClient} from 'sanity/cli'

// The signature-feature block is rendered in the "cinema" variant on SAS Crown,
// whose body copy is shorter than the seeded (inline-variant) text. Set the
// seeded body to the shown cinema copy so the rewired component stays
// pixel-identical when it reads sig.body from Sanity.
const client = getCliClient().withConfig({dataset: 'production'})

const res = await client
  .patch('project-sas-crown')
  .set({
    'pageBuilder[_key=="k299"].body':
      'One lakh+ sq ft of curated amenity within Tower 2. The highest residential clubhouse on the subcontinent — a measured retreat in the upper third of the tower.',
  })
  .commit()
console.log('patched', res._id, 'rev', res._rev)
