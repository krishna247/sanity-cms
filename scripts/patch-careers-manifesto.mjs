import {getCliClient} from 'sanity/cli'

// Add the bespoke inline accents to the Careers manifesto (page-careers k130
// proseBlock) so the rewired CareersPage stays pixel-identical:
//   • <strong> on "learn, contribute, and grow" (para 1, span k123)
//   • <strong> on "excellence and expertise"   (para 3, span k127)
//   • <em>long term</em> in the section heading
// The paragraph text is already seeded verbatim; we only split the two spans
// to carry the strong mark. Straight apostrophes / en-dash preserved.
const client = getCliClient().withConfig({dataset: 'production'})

const para1 =
  'SAS Infra is a forward-looking team guided by a clear long-term vision. Roles here are built for talented individuals across functions who are eager to '
const para1strong = 'learn, contribute, and grow'
const para1tail =
  ' — in a collaborative, process-driven environment where initiative is encouraged, capability is strengthened, and performance is recognised.'

const para3 =
  'SAS Infra is an equal opportunity employer. We offer structured career paths, continuous learning, exposure to international partnerships, and a process-driven work culture focused on delivering high-quality work with '
const para3strong = 'excellence and expertise'
const para3tail = '.'

await client
  .patch('page-careers')
  .set({
    'pageBuilder[_key=="k130"].head.heading': 'A team built for the <em>long term</em>.',
    'pageBuilder[_key=="k130"].body[_key=="k122"].children': [
      {_type: 'span', _key: 'k123a', marks: [], text: para1},
      {_type: 'span', _key: 'k123b', marks: ['strong'], text: para1strong},
      {_type: 'span', _key: 'k123c', marks: [], text: para1tail},
    ],
    'pageBuilder[_key=="k130"].body[_key=="k126"].children': [
      {_type: 'span', _key: 'k127a', marks: [], text: para3},
      {_type: 'span', _key: 'k127b', marks: ['strong'], text: para3strong},
      {_type: 'span', _key: 'k127c', marks: [], text: para3tail},
    ],
  })
  .commit()

console.log('patched page-careers manifesto (k130)')
