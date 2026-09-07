import {getCliClient} from 'sanity/cli'
// Seed the About page's formerly hard-coded editorial copy into `page-about`
// so AboutPage.astro can read it from the CMS (with the same literals kept as
// code fallbacks). Every string below is character-for-character the copy the
// component shipped with — including typographic quotes/dashes — so the built
// about.html is byte-identical before and after the seed.
//
// Blocks written (stable _keys, inserted in RENDERED order):
//   partnerDisciplines-about   partnerDisciplinesBlock — rebuilt to the deck p35
//                              8-discipline / 14-firm wall (inline `firms`, logos
//                              left unset → the site's own /images/partners files),
//                              MOVED from the tail of pageBuilder to after k110
//                              (logoWallBlock, whose head the wall renders)
//   about-credentials          credentialsBlock  after partnerDisciplines-about
//
// Images are NOT uploaded: laurel / source logo / badges / firm logos stay the
// Tier-D code fallbacks (each slot's own file under /public/images) until an
// editor uploads one.
//
// Draft-safe: if `drafts.page-about` exists it is patched identically to the
// published doc, so a later publish cannot revert the seed. Re-runnable: blocks
// already present are replaced in place instead of inserted twice.
//   npx sanity exec scripts/seed-about-copy.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01'})

const PUBLISHED = 'page-about'
const DRAFT = 'drafts.page-about'

// ── Partner wall (AboutPage.astro PARTNER_WALL — deck p35) ────────────────
// Firm _keys are the identity the component uses to find each firm's own
// /images/partners file while `logo` is unset — keep them stable.
const firm = (key, name) => ({_type: 'firm', _key: `firm-${key}`, name})
const row = (num, title, desc, firms) => ({_type: 'discipline', _key: `disc-${num}`, num, title, desc, firms})
const disciplines = [
  row('01', 'Architecture & Master Planning', 'Master planning, building form, and architectural vocabulary.', [
    firm('aedas', 'Aedas'),
  ]),
  row('02', 'Structural Engineering', 'Tower structure, seismic and wind engineering, and peer review.', [
    firm('meinhardt', 'Meinhardt'),
    firm('sterling', 'Sterling'),
  ]),
  row('03', 'Building Systems & Automation', 'Power, fire-life-safety, and intelligent building controls.', [
    firm('honeywell', 'Honeywell'),
    firm('godrej', 'Godrej'),
  ]),
  row('04', 'Vertical Transport', 'High-speed elevators, lift planning, and traffic analysis.', [
    firm('mitsubishi-electric', 'Mitsubishi Electric'),
    firm('tke', 'TKE'),
    firm('schindler', 'Schindler'),
  ]),
  row('05', 'Façade & Glazing', 'Curtain-wall systems, glazing, and the building envelope.', [
    firm('alumil', 'Alumil'),
  ]),
  row('06', 'HVAC', 'Climate, ventilation, and energy-efficient air systems.', [
    firm('hitachi', 'Hitachi'),
  ]),
  row('07', 'Finishes & Sanitaryware', 'Interior finishes, fittings, and premium sanitaryware.', [
    firm('carimali', 'Carimali'),
    firm('toto', 'TOTO'),
  ]),
  row('08', 'Leasing & Advisory', 'Commercial leasing, occupier strategy, and market advisory.', [
    firm('cbre', 'CBRE'),
    firm('jll', 'JLL'),
  ]),
]
const partnerWall = {
  _type: 'partnerDisciplinesBlock',
  _key: 'partnerDisciplines-about',
  disciplines,
}

// ── Recognition + Credentials (AboutPage.astro RECOGNITION / CREDENTIALS) ─
const credentials = {
  _type: 'credentialsBlock',
  _key: 'about-credentials',
  head: {
    eyebrow: 'Recognition & Credentials',
    heading: 'Recognised, and <em>certified</em>.',
  },
  award: {
    name: 'Times Business Awards 2025',
    line: 'Landmark Project in South India — SAS Crown',
    source: 'The Times of India',
    body: 'SAS Crown was honoured at the Times Business Awards 2025 as a Landmark Project in South India, recognised for its scale, design ambition, and contribution to the Hyderabad skyline.',
  },
  credentials: [
    {
      _type: 'credential',
      _key: 'cred-leed-gold',
      mark: 'LEED Gold',
      org: 'U.S. Green Building Council',
      body: 'SAS iTower is being designed and built to LEED Gold standards. The final rating is awarded by the USGBC upon completion.',
    },
    {
      _type: 'credential',
      _key: 'cred-well-silver',
      mark: 'WELL Silver',
      org: 'International WELL Building Institute',
      body: 'SAS iTower is being designed and built to WELL Silver standards. The final rating is awarded by the IWBI upon completion.',
    },
  ],
  reraHeading: 'RERA Registrations',
  rera: [
    {_type: 'reraRegistration', _key: 'rera-crown', project: 'SAS Crown', body: 'Telangana RERA registered — RERA No. P02400002786'},
    {_type: 'reraRegistration', _key: 'rera-itower', project: 'SAS iTower', body: 'Telangana RERA registered — RERA No. P02400000878'},
  ],
  reraNote: 'Full registration numbers available at telangana.rera.gov.in.',
}

// ── Apply ─────────────────────────────────────────────────────────────────
const ORDER_Q = 'pageBuilder[]{_key,_type,"heading":head.heading}'
const at = (key) => `pageBuilder[_key=="${key}"]`

async function seed(id) {
  const doc = await client.fetch(`*[_id==$id][0]{_id, ${ORDER_Q}}`, {id})
  if (!doc) return null
  const keys = new Set((doc.pageBuilder ?? []).map((b) => b._key))
  const need = (k) => {
    if (!keys.has(k)) throw new Error(`${id}: anchor block ${k} not found — refusing to seed`)
  }
  need('k91')
  need('k110')

  const tx = client.transaction()
  // (The chairman letterBlock this script used to insert after k91 was retired
  //  2026-09-07 — the About page no longer renders one.)
  // 1. partner wall — rebuild + move to right after the logoWallBlock (k110)
  if (keys.has(partnerWall._key)) tx.patch(id, (p) => p.unset([at(partnerWall._key)]))
  tx.patch(id, (p) => p.insert('after', at('k110'), [partnerWall]))
  // 2. credibility band — right after the wall
  if (keys.has(credentials._key)) tx.patch(id, (p) => p.set({[at(credentials._key)]: credentials}))
  else tx.patch(id, (p) => p.insert('after', at(partnerWall._key), [credentials]))
  await tx.commit()

  return client.fetch(`*[_id==$id][0]{_id, ${ORDER_Q}}`, {id})
}

const before = await client.fetch(`*[_id in [$p, $d]]{_id, ${ORDER_Q}}`, {p: PUBLISHED, d: DRAFT})
console.log('before:', JSON.stringify(before, null, 1))
const hasDraft = before.some((d) => d._id === DRAFT)
console.log(hasDraft ? `draft ${DRAFT} EXISTS — patching draft + published identically` : `no ${DRAFT} — patching published only`)

for (const id of hasDraft ? [PUBLISHED, DRAFT] : [PUBLISHED]) {
  const after = await seed(id)
  console.log(`after ${id}:`, JSON.stringify(after, null, 1))
}
