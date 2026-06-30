import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Replace the iTower page media (per "ITower Page Media" tracker sheet) with the
// new Drive-sourced renders/photos. Uploads the optimized assets from
// public/images, then patches the DRAFT of project-sas-itower with key-scoped
// set paths (no whole-array writes -> no _key churn). Verify the draft, then
// publish separately. Idempotent: Sanity content-addresses assets by hash, and
// the sets target stable _keys.
const client = getCliClient().withConfig({dataset: 'production'})
const IMG_DIR = '/Users/krishna/sasinfra/repos/frontend/public/images/'
const DOC = 'project-sas-itower'
const DRAFT = `drafts.${DOC}`

// filename -> [field-path, alt]. Order doubles as the upload list.
const MEDIA = [
  ['itower-logo.png',            `pageBuilder[_key=="k337"].logo`,                       'SAS iTower'],
  ['itower-drone-front.webp',    `pageBuilder[_key=="k337"].media.poster`,              'SAS iTower commercial tower in Nanakramguda'],
  ['itower-render-night.webp',   `pageBuilder[_key=="itSig"].image`,                     'Digital façade · SAS iTower'],
  ['itower-anatomy-sky.webp',    `pageBuilder[_key=="itAnatomy"].bands[_key=="ab1"].image`,      'SAS iTower — Sky (L17–L36 · Office)'],
  ['itower-anatomy-skylobby.webp',`pageBuilder[_key=="itAnatomy"].bands[_key=="ab2"].image`,     'SAS iTower — Sky-lobby (L15–L16 · Food Courts)'],
  ['itower-anatomy-midrise.webp',`pageBuilder[_key=="itAnatomy"].bands[_key=="ab3"].image`,      'SAS iTower — Mid-rise (L7–L14 · Office)'],
  ['itower-anatomy-podium.webp', `pageBuilder[_key=="itAnatomy"].bands[_key=="ab4"].image`,      'SAS iTower — Podium (G–L6 · The Address)'],
  ['itower-anatomy-basement.webp',`pageBuilder[_key=="itAnatomy"].bands[_key=="ab5"].image`,     'SAS iTower — Basement (B1–B5 · Parking)'],
  ['the-address-logo.png',       `pageBuilder[_key=="itAddress"].wordmark`,              'The Address'],
  ['address-retail-interior.webp',`pageBuilder[_key=="itAddress"].intro.image`,         'The Address — retail interior'],
  ['address-retail-mix.webp',    `pageBuilder[_key=="itAddress"].mix.image`,            'The Address — the retail mix'],
]

// 1) Upload assets (hash-addressed: unchanged bytes return the same asset).
const ids = {}
for (const [file] of MEDIA) {
  const asset = await client.assets.upload('image', readFileSync(IMG_DIR + file), {filename: file})
  ids[file] = asset._id
  console.log('upload', file.padEnd(30), '->', asset._id)
}

const img = (file, alt) => ({
  _type: 'imageWithAlt',
  image: {_type: 'image', asset: {_type: 'reference', _ref: ids[file]}},
  alt,
})

// 2) Ensure a draft exists, cloned from published (no draft existed at write time).
const pub = await client.getDocument(DOC)
if (!pub) throw new Error(`${DOC} not found`)
const {_rev, _createdAt, _updatedAt, ...body} = pub
await client.createIfNotExists({...body, _id: DRAFT})
console.log('\ndraft ready:', DRAFT)

// 3) Patch the draft with key-scoped sets.
const sets = {}
for (const [file, path, alt] of MEDIA) sets[path] = img(file, alt)
await client.patch(DRAFT).set(sets).commit({autoGenerateArrayKeys: false})
console.log('patched', Object.keys(sets).length, 'image fields on', DRAFT)
