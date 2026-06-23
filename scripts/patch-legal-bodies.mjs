import {getCliClient} from 'sanity/cli'

// Make the legal-page BODIES CMS-driven (rendered by frontend legalToHtml()):
//  - The proseBlock should hold ONLY the h2-grouped sections. The trailing
//    "Questions? ..." contact line in privacy (k200) / terms (k228) is the
//    bespoke .lg-foot footer, which stays code-driven — remove it from the seed
//    so the serializer doesn't render it as an extra section paragraph (and so
//    the code-driven footer isn't duplicated).
//  - Terms block k208 has an inline "Privacy Policy" link (→ /legal/privacy).
//    Encode it as an internalLink annotation (reference to page-privacy) by
//    splitting the single span into before / link / after.
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('page-privacy')
  .unset(['pageBuilder[_key=="k202"].body[_key=="k200"]'])
  .commit()

await client
  .patch('page-terms')
  .unset(['pageBuilder[_key=="k230"].body[_key=="k228"]'])
  .set({
    'pageBuilder[_key=="k230"].body[_key=="k208"].markDefs': [
      {_key: 'lnkpriv', _type: 'internalLink', reference: {_type: 'reference', _ref: 'page-privacy'}},
    ],
    'pageBuilder[_key=="k230"].body[_key=="k208"].children': [
      {
        _key: 'k208a',
        _type: 'span',
        marks: [],
        text: 'You may not republish, reproduce, duplicate, copy, sell, sublicense, or redistribute any material without prior written permission. Certain features may rely on cookies and similar technologies to improve functionality and user experience. Continued browsing indicates consent to such use as described in our ',
      },
      {_key: 'k208b', _type: 'span', marks: ['lnkpriv'], text: 'Privacy Policy'},
      {_key: 'k208c', _type: 'span', marks: [], text: '.'},
    ],
  })
  .commit()

console.log('patched legal bodies: privacy (footer block removed), terms (footer block removed + Privacy Policy internalLink)')
