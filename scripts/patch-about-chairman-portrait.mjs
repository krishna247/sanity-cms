import {getCliClient} from 'sanity/cli'
// Tier D: seed the chairman portrait image asset on person-gv-rao so the About
// portrait can render from the CMS (natural-size CDN URL = pixel-identical to
// /images/chairman-gv-rao.webp). alt is already set.
const client = getCliClient().withConfig({dataset: 'production'})
await client
  .patch('person-gv-rao')
  .set({'image.asset': {_type: 'reference', _ref: 'image-8f7745b1350a06434e4cf7f8133338aecdc98006-841x1024-webp'}})
  .commit()
console.log('seeded person-gv-rao.image.asset -> chairman-gv-rao.webp')
