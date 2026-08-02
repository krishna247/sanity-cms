import {getCliClient} from 'sanity/cli'
// Correction to patch-hero-films.mjs: the schema field is media.video (file
// REFERENCE — the frontend projects "videoUrl": video.asset->url); the first
// script wrote an orphan media.videoUrl string. Point media.video.asset at the
// squeezed uploads and drop the orphan field.
const client = getCliClient().withConfig({dataset: 'production'})

const SWAPS = [
  {doc: 'project-sas-crown', assetId: 'file-374cb638a15926d8e3234efd4e91f44024dd3b8b-mp4'},
  {doc: 'project-sas-itower', assetId: 'file-06e0c2f266d20f8ab3d888cefd77c6599ee54af4-mp4'},
]

for (const {doc, assetId} of SWAPS) {
  // Confirm the asset exists before touching the doc.
  const asset = await client.fetch(`*[_id == $id][0]{_id, url, size}`, {id: assetId})
  if (!asset) throw new Error(`asset ${assetId} not found`)
  const before = await client.fetch(
    `*[_id == $id][0].pageBuilder[_type == "projectHeroBlock"][0].media.video.asset->{_id, size}`,
    {id: doc},
  )
  await client
    .patch(doc)
    .set({'pageBuilder[_type=="projectHeroBlock"].media.video.asset': {_type: 'reference', _ref: assetId}})
    .unset(['pageBuilder[_type=="projectHeroBlock"].media.videoUrl'])
    .commit()
  const after = await client.fetch(
    `*[_id == $id][0].pageBuilder[_type == "projectHeroBlock"][0].media{video{asset->{_id, url, size}}, videoUrl}`,
    {id: doc},
  )
  console.log(`${doc}\n  was: ${JSON.stringify(before)}\n  now: ${JSON.stringify(after)}`)
}
