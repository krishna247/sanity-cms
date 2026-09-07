import {getCliClient} from 'sanity/cli'
// Seeds the three values that were still code-only on 2026-09-07, when the
// frontend retired every editorial code fallback (the CMS is authoritative —
// see the workspace CLAUDE.md, "CMS content" rule 3). Values are the EXACT
// literals the site rendered, so the build stays byte-identical:
//   page-contact        contactFormBlock[k146].formCopy   (the Contact form labels/placeholders)
//   project-sas-itower  contactFormBlock[k358].formCopy   (the iTower enquiry form)
//   siteSettings        addressShort  — now carries the "12th Floor, " prefix the
//                       Careers page used to prepend in code
// Draft-safe (a drafts.* copy is patched identically so a later publish cannot
// revert it) and re-runnable (plain `set`).
//   npx sanity exec scripts/seed-cms-authoritative.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01'})

const CONTACT_FORM = {
  "_type": "object",
  "nameLabel": "Your Name",
  "namePlaceholder": "Full name",
  "phoneLabel": "Phone",
  "phonePlaceholder": "+91 9XXXX XXXXX",
  "emailLabel": "Email",
  "emailPlaceholder": "you@email.com",
  "interestLabel": "Project of interest",
  "interestPlaceholder": "Select a project",
  "messageLabel": "Message",
  "messagePlaceholder": "Tell us about what you're looking for…",
  "submitLabel": "Send message"
}
const ITOWER_FORM = {
  "_type": "object",
  "nameLabel": "Name",
  "namePlaceholder": "Your name",
  "companyLabel": "Company",
  "companyPlaceholder": "Your organisation",
  "emailLabel": "Email",
  "emailPlaceholder": "you@company.com",
  "phoneLabel": "Phone",
  "phonePlaceholder": "+91",
  "interestLabel": "I'm Interested In",
  "interestPlaceholder": "Select an option",
  "messageLabel": "Message (optional)",
  "messagePlaceholder": "Tell us about your headcount, layout requirements, and target possession date",
  "submitLabel": "Send Enquiry →"
}
const ADDRESS_SHORT = '12th Floor, ACE Tech Park · Financial District · Hyderabad 500032'

const PLAN = [
  ['page-contact', {'pageBuilder[_key=="k146"].formCopy': CONTACT_FORM}],
  ['project-sas-itower', {'pageBuilder[_key=="k358"].formCopy': ITOWER_FORM}],
  ['siteSettings', {addressShort: ADDRESS_SHORT}],
]

for (const [id, fields] of PLAN) {
  const ids = await client.fetch('*[_id in [$id, $draft]]._id', {id, draft: `drafts.${id}`})
  if (!ids.includes(id)) throw new Error(`${id}: published document not found — refusing to seed`)
  const tx = client.transaction()
  for (const target of ids) tx.patch(target, (p) => p.set(fields))
  await tx.commit()
  console.log(`seeded ${id} (${ids.join(', ')}):`, Object.keys(fields).join(', '))
}
const check = await client.fetch(`{
  "contact": *[_id=="page-contact"][0].pageBuilder[_key=="k146"][0].formCopy.submitLabel,
  "itower": *[_id=="project-sas-itower"][0].pageBuilder[_key=="k358"][0].formCopy.interestPlaceholder,
  "addressShort": *[_id=="siteSettings"][0].addressShort
}`)
console.log('verify:', check)
