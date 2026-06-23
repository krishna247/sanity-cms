import {getCliClient} from 'sanity/cli'

// Seed the /media press list as `pressItem` docs so the bespoke year-grouped
// list reads from Sanity. Content is the verbatim placeholder set from
// frontend/src/data/media.ts (626a165) so the page stays pixel-identical —
// straight apostrophes + em-dashes preserved. No `link` field → resolveLinkHref
// returns '#', which keeps the row's `data-placeholder="true"`.
const client = getCliClient().withConfig({dataset: 'production'})

const items = [
  {
    _id: 'pressItem-crown-tallest',
    publishedAt: '2026-04-15',
    publication: 'Placeholder Publication',
    title: "SAS Crown crowned South India's tallest residential tower",
    summary:
      'Coverage of the topping-out of SAS Crown at Kokapet — a 171-metre, G+59 ultra-luxury landmark.',
  },
  {
    _id: 'pressItem-itower-foundation',
    publishedAt: '2026-02-08',
    publication: 'Placeholder Publication',
    title: 'SAS iTower foundation milestone in Nanakramguda',
    summary:
      "On structural progress at Hyderabad's tallest commercial tower, designed with Aedas and engineered by Arup.",
  },
  {
    _id: 'pressItem-doctor-profile',
    publishedAt: '2025-11-22',
    publication: 'Placeholder Publication',
    title: 'How a doctor rewrote the rules of Hyderabad real estate',
    summary:
      'A profile of Dr. G.V. Rao on building SAS Infra from the ground up — without inherited industry connections.',
  },
  {
    _id: 'pressItem-highrise-capital',
    publishedAt: '2025-09-10',
    publication: 'Placeholder Publication',
    title: "Hyderabad rising as India's high-rise capital",
    summary:
      "Industry feature on the city's vertical growth, with SAS Crown and iTower cited as landmarks.",
  },
  {
    _id: 'pressItem-the-address',
    publishedAt: '2025-06-04',
    publication: 'Placeholder Publication',
    title: 'The Address — a premium retail destination joins SAS Infra portfolio',
    summary:
      'Announcement coverage of the curated retail destination announced as part of the iTower mixed-use ecosystem.',
  },
  {
    _id: 'pressItem-itower-groundbreak',
    publishedAt: '2024-12-12',
    publication: 'Placeholder Publication',
    title: 'SAS iTower breaks ground in Hyderabad Financial District',
    summary:
      'On foundation work commencing for the 171-metre commercial tower — building systems by Siemens, Honeywell, Bosch.',
  },
]

for (const it of items) {
  await client.createOrReplace({_type: 'pressItem', ...it})
  console.log('seeded', it._id)
}
console.log('done — seeded', items.length, 'pressItem docs')
