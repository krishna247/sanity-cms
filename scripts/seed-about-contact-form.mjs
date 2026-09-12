// Seed the About page's enquiry-form block (2026-09-12).
//
// Until now AboutPage.astro hard-coded the enquiry form's labels, placeholders,
// submit button and the whole "I'm Interested In" option list, and took only
// the section head from a ctaBlock. The literal option list passed the CMS gate
// purely because the home page's contactFormBlock.leadOptions happened to hold
// the same strings; when an editor renamed one of those the gate (correctly)
// started rejecting every deploy. This gives the About page its own
// contactFormBlock — the same shape Home / Crown / iTower / Contact use:
//   head        ← copied verbatim from the About ctaBlock (which it replaces)
//   formCopy    ← copied from the home page's block (identical wording today)
//   leadOptions ← copied from the home page's block, with About-owned _keys
//
// The swap is a path-scoped `insert replace` of the ctaBlock, applied in ONE
// transaction to the PUBLISHED document and — when an editor has one open — to
// drafts.page-about as well. Both are needed: a draft is a full copy of the
// document, so a draft published later would otherwise resurrect the ctaBlock
// and drop this block (and the CMS gate would block deploys again). The
// editor's own draft edits are left exactly as they are.
// Run: npx sanity exec scripts/seed-about-contact-form.mjs --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const [about, draft, home] = await Promise.all([
  client.getDocument('page-about'),
  client.getDocument('drafts.page-about'),
  client.getDocument('homePage'),
])
if (!about) throw new Error('page-about is missing')
if (about.pageBuilder.some((b) => b._type === 'contactFormBlock')) throw new Error('page-about already has a contactFormBlock')
const cta = about.pageBuilder.find((b) => b._type === 'ctaBlock')
const homeForm = home?.pageBuilder?.find((b) => b._type === 'contactFormBlock')
if (!cta?.head) throw new Error('page-about has no ctaBlock with a head to move')
if (!homeForm?.formCopy || !homeForm?.leadOptions?.length) throw new Error('homePage contactFormBlock is missing formCopy / leadOptions')
if (draft && !draft.pageBuilder?.some((b) => b._key === cta._key)) throw new Error(`drafts.page-about has no ctaBlock ${cta._key} — inspect it first`)

const block = {
  _key: 'about-contact-form',
  _type: 'contactFormBlock',
  variant: 'sales',
  formTarget: 'about-enquiry',
  head: structuredClone(cta.head),
  formCopy: structuredClone(homeForm.formCopy),
  leadOptions: homeForm.leadOptions.map((o) => ({...o, _key: `about-lead-${o.value || o._key}`})),
}
const path = `pageBuilder[_key=="${cta._key}"]`
const tx = client.transaction()
const targets = ['page-about', ...(draft ? ['drafts.page-about'] : [])]
for (const id of targets) tx.patch(id, (p) => p.insert('replace', path, [block]))
const res = await tx.commit()
console.log(`replaced ${path} with contactFormBlock#${block._key} in: ${targets.join(', ')}  (tx ${res.transactionId})`)
for (const id of targets) {
  const d = await client.getDocument(id)
  console.log(`${id}: ${d.pageBuilder.map((b) => `${b._type}#${b._key}`).join(', ')}`)
}
console.log('block:', JSON.stringify(block, null, 1))
