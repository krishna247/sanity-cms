import {getCliClient} from 'sanity/cli'

// One-off: embed the original bespoke design's inline accents (<em>, <br>) into
// the seeded SAS Crown headings + fix the hero CTA label, so the rewired
// CrownPage.astro (which renders these via set:html) stays pixel-identical.
const client = getCliClient().withConfig({dataset: 'production'})

const patch = {
  'pageBuilder[_key=="k282"].title': "South India's <em>tallest</em><br />residential tower.",
  'pageBuilder[_key=="k282"].ctas[_key=="k274"].label': 'Contact Us',
  'pageBuilder[_key=="k288"].head.heading': 'Every detail defined. Every <em>number</em> that matters.',
  'pageBuilder[_key=="k295"].head.heading': 'Luxury apartments in <em>Kokapet</em>, Hyderabad.',
  'pageBuilder[_key=="k299"].heading': "The <em>Sky Club</em> — India's first at this height.",
  'pageBuilder[_key=="k304"].head.heading': 'Everything we have <em>on offer</em>.',
}

const res = await client.patch('project-sas-crown').set(patch).commit()
console.log('patched', res._id, 'rev', res._rev)
