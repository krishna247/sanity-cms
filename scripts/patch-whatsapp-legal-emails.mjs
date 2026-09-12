// 2026-09-12 content changes requested by the owner:
//   · floating WhatsApp (Concierge) number  → +91 97045 32828  (siteSettings.concierge.whatsappNumber)
//   · Privacy + Cookie policy contact email → contactus@sasinfra.com (was krishna.j@sasinfra.com)
// The Terms page carries the same old email in its foot line and was NOT in the
// request, so it is left untouched (flagged in the session report).
// Published documents are patched directly (no draft exists for any of the three —
// the script refuses to run if one appears); one transaction → one rebuild.
// Run: npx sanity exec scripts/patch-whatsapp-legal-emails.mjs --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})
const OLD = 'krishna.j@sasinfra.com', NEW = 'contactus@sasinfra.com'
const OLD_WA = '919718662299', NEW_WA = '919704532828'
const IDS = ['siteSettings', 'page-privacy', 'page-cookies']
const [settings, privacy, cookies, ...drafts] = await Promise.all([...IDS, ...IDS.map((i) => `drafts.${i}`)].map((id) => client.getDocument(id)))
const open = drafts.map((d, i) => (d ? `drafts.${IDS[i]}` : null)).filter(Boolean)
if (open.length) throw new Error(`draft(s) exist — patch them too or resolve in the Studio first: ${open.join(', ')}`)

const block = (doc, key) => doc.pageBuilder.find((b) => b._key === key)
const span = (doc, blockKey, bodyKey, spanKey) => block(doc, blockKey).body.find((b) => b._key === bodyKey).children.find((c) => c._key === spanKey)
const cur = {
  waNumber: settings.concierge?.whatsappNumber,
  privacyFoot: block(privacy, 'foot').head.dek,
  privacyBody: span(privacy, 'k202', 'k196', 'k197').text,
  cookiesBody: span(cookies, 'k260', 'k258', 'k259').text,
}
if (cur.waNumber !== OLD_WA) throw new Error(`whatsappNumber is ${cur.waNumber}, expected ${OLD_WA}`)
for (const k of ['privacyFoot', 'privacyBody', 'cookiesBody']) if (!cur[k].includes(OLD)) throw new Error(`${k} does not contain ${OLD}: ${cur[k]}`)

const P_FOOT = 'pageBuilder[_key=="foot"].head.dek'
const P_BODY = 'pageBuilder[_key=="k202"].body[_key=="k196"].children[_key=="k197"].text'
const C_BODY = 'pageBuilder[_key=="k260"].body[_key=="k258"].children[_key=="k259"].text'
const res = await client.transaction()
  .patch('siteSettings', (p) => p.set({'concierge.whatsappNumber': NEW_WA}))
  .patch('page-privacy', (p) => p.set({[P_FOOT]: cur.privacyFoot.replaceAll(OLD, NEW), [P_BODY]: cur.privacyBody.replaceAll(OLD, NEW)}))
  .patch('page-cookies', (p) => p.set({[C_BODY]: cur.cookiesBody.replaceAll(OLD, NEW)}))
  .commit()
console.log('committed tx', res.transactionId)
const [s2, p2, c2] = await Promise.all(IDS.map((id) => client.getDocument(id)))
console.log('AFTER:')
console.log('  whatsappNumber :', s2.concierge.whatsappNumber)
console.log('  privacy foot   :', block(p2, 'foot').head.dek)
console.log('  privacy body   :', span(p2, 'k202', 'k196', 'k197').text.slice(-120))
console.log('  cookies body   :', span(c2, 'k260', 'k258', 'k259').text)
