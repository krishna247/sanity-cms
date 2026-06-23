import {getCliClient} from 'sanity/cli'
// Tier D: seed the remaining Crown image asset refs so they render from the CMS
// (natural-size CDN URL = pixel-identical to the local /images originals):
//   galleryBlock (k296) 8 tiles, signatureFeatureBlock (k299) image, and
//   amenityZonesBlock (k303) anchor image.
// crown-interior-1 has no uploaded asset, but it is byte-identical (same sha256)
// to crown-interior-2, so tile k263 points at the interior-2 asset.
const client = getCliClient().withConfig({dataset: 'production'})
const ref = (id) => ({_type: 'reference', _ref: id})

const A = {
  towerDay:    'image-e1b8aafb4e5cc58ead1c8b07c4ef6474c89069a1-1600x830-webp',
  clubhouse:   'image-cadf8fa96d02872c1888f2a8b5d03f206e47aaaf-1600x932-webp',
  interior2:   'image-9dffa7928d0b299861e98760d3b60e84e1a0cc7f-1600x942-webp',
  towerAerial: 'image-0f97854c6a6a2a93be481adc2ffeb771ade7c056-1600x831-webp',
  clubPersp:   'image-ed34cca8413c92067b8a4beb25a2288bc42d9f9f-1600x973-webp',
  tagline:     'image-aff29ea400dbea4a9ab64e417540d529619d7534-1600x942-webp',
  interior3:   'image-ec90e8b4eda0a69aa6ea17e5fdb1f52e3ea0fefa-1600x942-webp',
  amenity:     'image-988b8a501e73a099a945f1b0cdf77de2fa7f61bb-1600x942-webp',
}
// gallery tile _key -> asset (in the component's tile order)
const GAL = {
  k261: A.towerDay, k262: A.clubhouse, k263: A.interior2, k264: A.towerAerial,
  k265: A.clubPersp, k266: A.interior2, k267: A.tagline,  k268: A.interior3,
}

let p = client.patch('project-sas-crown')
for (const [k, id] of Object.entries(GAL)) {
  p = p.set({[`pageBuilder[_key=="k296"].images[_key=="${k}"].image.asset`]: ref(id)})
}
p = p.set({'pageBuilder[_key=="k299"].image.asset': ref(A.clubPersp)})       // signature feature
p = p.set({'pageBuilder[_key=="k303"].anchor.image.asset': ref(A.amenity)})  // life-at-Crown anchor
await p.commit()
console.log('seeded Crown gallery (8) + signature + zones-anchor images')
