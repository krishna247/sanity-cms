import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Break the "Inside the Plate" silent reuse: plateAnatomyBlock previously fell
// back to itower-plan-typical.webp (the Floor-Plans Tab-I plate). Give it its own
// dedicated asset (a distinct-byte copy) so the two sections never share an image.
const client = getCliClient().withConfig({dataset: 'production'})
const FILE = '/Users/krishna/sasinfra/repos/frontend/public/images/itower-plate-annotated.webp'
const DOC = 'project-sas-itower'
const DRAFT = `drafts.${DOC}`

const asset = await client.assets.upload('image', readFileSync(FILE), {filename: 'itower-plate-annotated.webp'})
console.log('asset:', asset._id)

const pub = await client.getDocument(DOC)
const {_rev, _createdAt, _updatedAt, ...body} = pub
await client.createIfNotExists({...body, _id: DRAFT})

await client
  .patch(DRAFT)
  .set({
    'pageBuilder[_key=="itPlate"].image': {
      _type: 'imageWithAlt',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      alt: 'SAS iTower — annotated typical floor plate',
    },
  })
  .commit({autoGenerateArrayKeys: false})
console.log('patched plateAnatomyBlock.image on', DRAFT)
