import {getCliClient} from 'sanity/cli'

// CMS-drive the About chairman profile (bespoke featured layout):
//  - person-gv-rao.profile: the 3 long-form bio paragraphs as portable text with
//    the original strong/em marks (rendered by portableToHtml in the bespoke
//    .au-chair-body). The portrait image stays a local /images/ file.
//  - peopleBlock[0].head.heading (k91): add the <em> accent on the name.
//  - quoteBlock (k92): add the <em>2000</em> accent to the pull-quote (set:html)
//    and set roleOverride to the bespoke "Chairman, SAS Infra" attribution line.
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('person-gv-rao')
  .set({
    profile: [
      {
        _key: 'cp1',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_key: 'cp1a', _type: 'span', marks: [], text: 'Dr. G.V. Rao entered real estate in 2000 — an industry outsider with a background in '},
          {_key: 'cp1b', _type: 'span', marks: ['strong'], text: 'veterinary science'},
          {_key: 'cp1c', _type: 'span', marks: [], text: ' and a deep interest in '},
          {_key: 'cp1d', _type: 'span', marks: ['strong'], text: 'organic farming'},
          {_key: 'cp1e', _type: 'span', marks: [], text: '. Without an inherited real estate portfolio or industry connections, he built SAS Infra from the ground up by assembling professional talent and forging partnerships with global architecture and engineering firms.'},
        ],
      },
      {
        _key: 'cp2',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_key: 'cp2a', _type: 'span', marks: [], text: 'Under his leadership, the organisation has grown from a single development into a portfolio that includes the tallest residential and commercial towers in its region. He has led the company through multiple economic cycles — including the 2008 downturn and the COVID-19 pandemic — with a consistent focus on long-term value over short-term volume.'},
        ],
      },
      {
        _key: 'cp3',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_key: 'cp3a', _type: 'span', marks: [], text: 'His operating philosophy is straightforward: '},
          {_key: 'cp3b', _type: 'span', marks: ['em'], text: 'think globally, execute locally, never compromise on structural integrity.'},
          {_key: 'cp3c', _type: 'span', marks: [], text: ' He advocates sustainable building practices and is personally involved in land selection, master planning, and partner selection for every SAS Infra development.'},
        ],
      },
    ],
  })
  .commit()

await client
  .patch('page-about')
  .set({
    'pageBuilder[_key=="k91"].head.heading': '<em>Dr. G.V. Rao</em> · Chairman.',
    'pageBuilder[_key=="k92"].quote':
      'When I entered real estate in <em>2000</em>, I had no background in the industry. What I had was a belief that Hyderabad deserved developments built with honesty — where the specifications promised in the brochure are the specifications delivered on site.',
    'pageBuilder[_key=="k92"].roleOverride': 'Chairman, SAS Infra',
  })
  .commit()

console.log('patched About chairman: person-gv-rao.profile + h2 <em> + quote <em>2000</em> + roleOverride')
