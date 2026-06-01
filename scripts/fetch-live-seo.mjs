// Re-fetch the EXACT on-page SEO strings from live sasinfra.com (WordPress +
// Rank Math) and freeze them to scripts/seo-live-meta.json — the verbatim source
// of truth for the migration patch scripts. We fetch + HTML-unescape here (NOT
// from the .md tables, which carry markdown escaping). Run with plain node:
//   node scripts/fetch-live-seo.mjs
import {writeFileSync} from 'node:fs'

// Map: Sanity doc id -> live URL to harvest its meta from.
const TARGETS = {
  homePage: 'https://sasinfra.com/',
  'page-contact': 'https://sasinfra.com/contact/',
  'page-privacy': 'https://sasinfra.com/privacy-policy/',
  'page-cookies': 'https://sasinfra.com/cookie-policy/',
  'page-terms': 'https://sasinfra.com/terms-conditions/',
  'page-media': 'https://sasinfra.com/media/',
  'page-careers': 'https://sasinfra.com/sas-infra-careers/',
  updatesIndexPage: 'https://sasinfra.com/project-updates/',
  blogIndexPage: 'https://sasinfra.com/sas-infra-blog/',
  // About DOES exist on live: /about/ and /about-sas-infra/ both 301 to this
  // canonical WP+RankMath page (manifest §2 was wrong to call it net-new).
  'page-about': 'https://sasinfra.com/about-sas-infra-hyderabad/',
  // canonical project doorway pages (5 -> 2)
  'project-sas-crown': 'https://sasinfra.com/tallest-residential-tower-in-south-india/',
  'project-sas-itower': 'https://sasinfra.com/sas-itower-commercial-spaces-nanakramguda-khajaguda/',
}

// Minimal, dependency-free HTML entity decode. Meta content here is mostly raw
// UTF-8 with the odd &amp; / numeric entity; this covers the named ones Rank Math
// emits plus all numeric (&#NN; / &#xNN;) forms.
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#039': "'", nbsp: ' ',
  raquo: '»', laquo: '«', hellip: '…', mdash: '—', ndash: '–',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', '#038': '&',
}
function decode(s) {
  if (s == null) return s
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+|#\d+);/g, (m, name) => (name in NAMED ? NAMED[name] : m))
}

function attr(html, re) {
  const m = html.match(re)
  return m ? decode(m[1]) : null
}

const out = {}
for (const [id, url] of Object.entries(TARGETS)) {
  const res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 SEO-migration-fetch'}})
  const html = await res.text()
  const head = html.slice(0, html.indexOf('</head>') + 7 || html.length)
  out[id] = {
    url,
    status: res.status,
    title: attr(head, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: attr(head, /<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/i),
    ogTitle: attr(head, /<meta\s+property="og:title"\s+content="([\s\S]*?)"\s*\/?>/i),
    ogDescription: attr(head, /<meta\s+property="og:description"\s+content="([\s\S]*?)"\s*\/?>/i),
    ogImage: attr(head, /<meta\s+property="og:image"\s+content="([\s\S]*?)"\s*\/?>/i),
    ogImageAlt: attr(head, /<meta\s+property="og:image:alt"\s+content="([\s\S]*?)"\s*\/?>/i),
  }
  console.log(`${res.status}  ${id}`)
}

const dest = new URL('./seo-live-meta.json', import.meta.url)
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log('\nwrote', dest.pathname)
console.log(JSON.stringify(out, null, 2))
