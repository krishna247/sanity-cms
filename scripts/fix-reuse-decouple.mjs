import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'

// Decouple the remaining CMS-level silent reuses (audit findings). Each borrower
// field shared an asset with another slot; give the borrower its own dedicated
// copy asset (distinct bytes) so the look is preserved but nothing is shared.
const client = getCliClient().withConfig({dataset: 'production'})
const IMG = '/Users/krishna/sasinfra/repos/frontend/public/images/'

const up = async (file) => (await client.assets.upload('image', readFileSync(IMG + file), {filename: file}))._id
const img = (id, alt) => ({_type: 'imageWithAlt', image: {_type: 'image', asset: {_type: 'reference', _ref: id}}, alt})

const tenants = await up('itower-tenants-anchor.webp')
const galTower = await up('crown-gallery-tower.webp')
const galClub = await up('crown-gallery-clubhouse.webp')
console.log('assets:', {tenants, galTower, galClub})

async function patchDraft(docId, sets) {
  const draft = `drafts.${docId}`
  const pub = await client.getDocument(docId)
  const {_rev, _createdAt, _updatedAt, ...body} = pub
  await client.createIfNotExists({...body, _id: draft})
  await client.patch(draft).set(sets).commit({autoGenerateArrayKeys: false})
  console.log('patched', draft, Object.keys(sets))
}

// iTower: tenants anchor (was sharing gallery-0's itower-render-tower.webp)
await patchDraft('project-sas-itower', {
  'pageBuilder[_key=="itTenants"].anchor.image': img(tenants, 'SAS iTower — tenants editorial anchor render'),
})

// Crown: gallery tile 0 (was sharing hero poster) + tile 4 (was sharing signature)
await patchDraft('project-sas-crown', {
  'pageBuilder[_key=="k296"].images[_key=="k261"].image': img(galTower, 'SAS Crown — tower by day'),
  'pageBuilder[_key=="k296"].images[_key=="k265"].image': img(galClub, 'SAS Crown — clubhouse perspective'),
})
