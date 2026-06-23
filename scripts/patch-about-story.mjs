import {getCliClient} from 'sanity/cli'

// Rebuild the About "Our Story" prose body as marked portable text so the
// rewired AboutPage (rendering it via portableToHtml) reproduces the original
// inline <strong>/<em> accents and stays pixel-identical.
const client = getCliClient().withConfig({dataset: 'production'})

const span = (key, text, marks = []) => ({_key: key, _type: 'span', marks, text})
const para = (key, children) => ({_key: key, _type: 'block', style: 'normal', markDefs: [], children})

const body = [
  para('k83', [
    span('k83a', 'SAS Infra was founded in 2000 by '),
    span('k83b', 'Dr. G.V. Rao', ['strong']),
    span('k83c', ' — not from within the real estate industry, but from a conviction that Hyderabad deserved developments built with the same precision and integrity that he brought from his earlier career.'),
  ]),
  para('k85', [
    span('k85a', 'Over two decades, the company has navigated economic downturns, volatile market cycles, and a global pandemic — each time emerging with a stronger conviction about what it takes to build developments that last. The approach has always been the same: assemble the best professional talent, partner with global firms, execute with discipline, and let the buildings speak.'),
  ]),
  para('k87', [
    span('k87a', "Today, SAS Infra's portfolio includes "),
    span('k87b', "South India's tallest residential tower", ['em']),
    span('k87c', ' (SAS Crown, Kokapet), '),
    span('k87d', "Hyderabad's tallest commercial development", ['em']),
    span('k87e', " (SAS iTower, Nanakramguda), and a premium retail destination (The Address). The company is headquartered at ACE Tech Park in Hyderabad's Financial District."),
  ]),
]

const res = await client.patch('page-about').set({'pageBuilder[_key=="k89"].body': body}).commit()
console.log('patched', res._id, 'rev', res._rev)
