import {getCliClient} from 'sanity/cli'

// About partner wall — make the logos + short country labels + section head
// CMS-driven while staying pixel-identical to 626a165. The partner docs already
// hold the (full) country + uploaded logo; we add an abbreviated `shortCountry`
// matching the bespoke wall, and patch the logoWallBlock head with the <em>/<br>
// accents + dek. The 4 curated discipline rows (num/title/desc) and the per-logo
// alt stay code-driven (the partner docs' granular disciplines + full names
// don't map to the wall's editorial grouping).
const client = getCliClient().withConfig({dataset: 'production'})

const shortCountry = {
  'partner-aedas': 'UK / HK',
  'partner-arup': 'UK',
  'partner-coffey': 'Australia',
  'partner-godrej': 'India',
  'partner-siemens': 'Germany',
  'partner-honeywell': 'USA',
  'partner-bosch': 'Germany',
  'partner-kone': 'Finland',
  'partner-schindler': 'Switzerland',
  'partner-otis': 'USA',
  'partner-mitsubishi': 'Japan',
}

for (const [id, sc] of Object.entries(shortCountry)) {
  await client.patch(id).set({shortCountry: sc}).commit()
  console.log('shortCountry', id, '->', sc)
}

await client
  .patch('page-about')
  .set({
    'pageBuilder[_key=="k110"].head.heading':
      'Global firms, <em>at every layer</em><br />of the building.',
    'pageBuilder[_key=="k110"].head.dek':
      'Architecture, engineering, building systems, and finishes — each layer of an SAS Infra development is the work of a globally recognised specialist.',
  })
  .commit()

console.log('patched logoWallBlock k110 head')
