import fs from 'node:fs'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

// Replace the partner-carimali logo with the correct SANITARY-brand Carimali mark
// (carimali.it — CARIMALI design water_space, by Calflex). The previously shipped
// /images/partners/carimali.svg was the logo of Carimali S.p.A., the COFFEE-MACHINE
// maker — wrong company. The frontend now serves the corrected file code-side
// (public/images/partners/carimali.png); this script gives the partner doc its own
// matching CMS asset so the wall stays correct when the code fallback is retired.
//
// Direct published write (same pattern as seed-home-global-firms.mjs); prod is
// static until the next frontend deploy, so publishing ahead of the deploy is safe.
const client = getCliClient().withConfig({dataset: 'production'})

const file = path.resolve(process.cwd(), '../frontend/public/images/partners/carimali.png')
const asset = await client.assets.upload('image', fs.createReadStream(file), {
  filename: 'carimali.png',
})
console.log('uploaded asset', asset._id, `${asset.metadata?.dimensions?.width}x${asset.metadata?.dimensions?.height}`)

await client
  .patch('partner-carimali')
  .set({
    logo: {
      _type: 'imageWithAlt',
      alt: 'Carimali logo',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
    },
  })
  .commit()
console.log('partner-carimali.logo set')
