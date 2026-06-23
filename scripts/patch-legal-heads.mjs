import {getCliClient} from 'sanity/cli'

// Embed the original bespoke <em> accents into the legal-page heroBlock titles so
// the rewired bespoke .lg-header stays pixel-identical when it set:html's them.
// Terms' meta carries an inline <a> to sasinfra.com (underlined via .lg-doc a), so
// its dek gets the link embedded and is rendered with set:html. Privacy/Cookies
// metas stay plain text (rendered as text → click-to-edit preserved).
const client = getCliClient().withConfig({dataset: 'production'})

await client
  .patch('page-privacy')
  .set({'pageBuilder[_key=="k169"].title': '<em>Privacy</em> Policy.'})
  .commit()

await client
  .patch('page-cookies')
  .set({'pageBuilder[_key=="k231"].title': '<em>Cookie</em> Policy.'})
  .commit()

await client
  .patch('page-terms')
  .set({
    'pageBuilder[_key=="k203"].title': '<em>Terms</em> &amp; Conditions.',
    'pageBuilder[_key=="k203"].dek':
      'By accessing and using <a href="https://www.sasinfra.com/">sasinfra.com</a>, you agree to comply with these terms. References to "you" mean any visitor; "we" or "us" mean SAS Infra.',
  })
  .commit()

console.log('patched legal heads: privacy, cookies, terms')
