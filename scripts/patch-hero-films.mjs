import {getCliClient} from 'sanity/cli'
import {createReadStream} from 'node:fs'
// Replace the CMS-hosted hero films with the visually-lossless squeezed
// re-encodes (2026-08-02 perf pass): the videoUrl string fields on the two
// project heroes point at Sanity file assets — crown was ~5.8 MB and iTower
// ~9.9 MB; the replacements are 4.9 / 4.4 MB (veryslow CRF-33 + denoise from
// the originals, frame-checked). Old assets are left in place (other drafts
// may reference them); only the videoUrl strings are repointed.
const client = getCliClient().withConfig({dataset: 'production'})

const FILMS = [
  {
    doc: 'project-sas-crown',
    file: '../frontend/public/images/crown-hero.mp4',
    filename: 'crown-hero-2026-08.mp4',
  },
  {
    doc: 'project-sas-itower',
    file: '../frontend/public/images/itower-hero.mp4',
    filename: 'itower-hero-2026-08.mp4',
  },
]

for (const {doc, file, filename} of FILMS) {
  const before = await client.fetch(
    `*[_id == $id][0].pageBuilder[_type == "projectHeroBlock"][0].media.videoUrl`,
    {id: doc},
  )
  const asset = await client.assets.upload('file', createReadStream(file), {
    filename,
    contentType: 'video/mp4',
  })
  await client
    .patch(doc)
    .set({'pageBuilder[_type=="projectHeroBlock"].media.videoUrl': asset.url})
    .commit()
  console.log(`${doc}:\n  was ${before}\n  now ${asset.url}`)
}
