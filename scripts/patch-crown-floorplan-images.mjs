import {getCliClient} from 'sanity/cli'
// Tier D: seed the Crown floor-plan plate images (planImage.asset) so the cw-plans
// panes render from the CMS. Natural-size CDN URL = pixel-identical to the local
// /images/crown-plan-*.webp originals. Order matches the component's tabs 1/3/5/6/7.
const client = getCliClient().withConfig({dataset: 'production'})
const ref = (id) => ({_type: 'reference', _ref: id})
const MAP = {
  k269: 'image-25464258df01cbaca5e1200d79158f5ff9bc105f-1080x1080-webp', // East Wing  -> crown-plan-1a
  k270: 'image-3b0b8bb823eaa1eadaba065e12dc9e6d62a989f2-1080x1080-webp', // West Wing  -> crown-plan-3a
  k271: 'image-9ee0c379ffa727ae9886e254d9ca5a37f8e0f5ec-1080x1080-webp', // Corner     -> crown-plan-5a
  k272: 'image-9c06cb7e97851fb25a3b9c1c7d5260fc69da405a-1080x1080-webp', // Sky Villa  -> crown-plan-6
  k273: 'image-c55d944cc260923f504d748a6a5dd02c01210d72-1080x1080-webp', // Full Floor -> crown-plan-7
}
let p = client.patch('project-sas-crown')
for (const [k, id] of Object.entries(MAP)) {
  p = p.set({[`pageBuilder[_key=="k298"].plans[_key=="${k}"].planImage.asset`]: ref(id)})
}
await p.commit()
console.log('seeded Crown floorPlansBlock plate images (k269..k273)')
