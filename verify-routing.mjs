// Read-only verification that every routable document in Sanity is configured
// the way the frontend's getStaticPaths + resolveHref expect — fixed IDs, route
// segments, no collisions, no dangling refs — and that the resulting URL set
// matches the built sitemap (repos/frontend/dist/sitemap-0.xml).
//
//   SANITY_MCP_TOKEN=<token> node verify-routing.mjs
//
import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'

const token = process.env.SANITY_MCP_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token) throw new Error('Set SANITY_MCP_TOKEN')

const client = createClient({
  projectId: 'ajw4irs3',
  dataset: 'production',
  apiVersion: '2026-05-31',
  token,
  useCdn: false,
  perspective: 'published',
})

const SITEMAP = '/Users/krishna/sasinfra/repos/frontend/dist/sitemap-0.xml'

// Mirror of repos/frontend/src/schemaTypes/utils/routing + lib/routing
const SINGLETON_IDS = ['siteSettings', 'navigation', 'homePage', 'blogIndexPage', 'updatesIndexPage']
const FIXED_PAGE_IDS = [
  'page-about', 'page-careers', 'page-contact', 'page-media',
  'page-privacy', 'page-terms', 'page-cookies',
]
const EXPECTED_FIXED_HREF = {
  'page-about': '/about', 'page-careers': '/careers', 'page-contact': '/contact',
  'page-media': '/media', 'page-privacy': '/legal/privacy', 'page-terms': '/legal/terms',
  'page-cookies': '/legal/cookies',
}

const seg = (d) => d?.route?.segment?.current || d?.slug?.current || ''
function resolveHref(d) {
  if (!d?._type) return '#'
  const s = seg(d)
  switch (d._type) {
    case 'homePage': return '/'
    case 'blogIndexPage': return '/blog'
    case 'updatesIndexPage': return '/projects/updates'
    case 'blogPost': return s ? `/blog/${s}` : '/blog'
    case 'project': return s ? `/projects/${s}` : '/projects'
    case 'projectUpdate': return s ? `/projects/updates#${s}` : '/projects/updates'
    case 'page': return `/${[d.route?.section, s].filter(Boolean).join('/')}`
    default: return '#'
  }
}

const pass = []
const warn = []
const fail = []
const ok = (m) => pass.push(m)
const wn = (m) => warn.push(m)
const er = (m) => fail.push(m)

function sitemapPaths() {
  const xml = readFileSync(SITEMAP, 'utf8')
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  return new Set(locs.map((u) => new URL(u).pathname.replace(/\/$/, '') || '/'))
}

async function main() {
  // ── pull every routable doc + singletons (published) ──
  const docs = await client.fetch(`{
    "singletons": *[_id in $sing]{_id, _type},
    "pages": *[_type=="page" && defined(route.segment.current)]{_id, _type, title, route, slug},
    "projects": *[_type=="project"]{_id, _type, title, route, slug},
    "blog": *[_type=="blogPost"]{_id, _type, title, route, slug, "hasSlug": defined(slug.current)},
    "updates": *[_type=="projectUpdate"]{
      _id, _type, route,
      "projRef": project._ref,
      "projOk": defined(project->._id),
      "projType": project->._type,
      "projSeg": project->route.segment.current
    },
    "projectCount": count(*[_type=="project"]),
    "pageNoSeg": *[_type=="page" && !defined(route.segment.current)]{_id, title},
    "projNoSeg": *[_type=="project" && !defined(route.segment.current)]{_id, title},
    "blogNoSeg": *[_type=="blogPost" && !defined(route.segment.current) && !defined(slug.current)]{_id, title}
  }`, {sing: SINGLETON_IDS})

  // ── 1. singletons present & correct type ──
  for (const id of SINGLETON_IDS) {
    const d = docs.singletons.find((x) => x._id === id)
    if (!d) er(`singleton MISSING: ${id}`)
    else if (d._type !== id) er(`singleton ${id} has wrong _type ${d._type}`)
    else ok(`singleton ${id} (${d._type})`)
  }

  // ── 2. fixed-ID pages present at expected IDs with expected hrefs ──
  for (const id of FIXED_PAGE_IDS) {
    const d = docs.pages.find((x) => x._id === id)
    if (!d) { er(`fixed page MISSING: ${id}`); continue }
    const href = resolveHref(d)
    if (href !== EXPECTED_FIXED_HREF[id]) er(`fixed page ${id} -> ${href} (expected ${EXPECTED_FIXED_HREF[id]})`)
    else ok(`fixed page ${id} -> ${href}`)
  }
  // any page doc NOT at a fixed id?
  for (const d of docs.pages) {
    if (!FIXED_PAGE_IDS.includes(d._id)) wn(`extra page doc not in FIXED_PAGE_IDS: ${d._id} -> ${resolveHref(d)}`)
  }

  // ── 3. projects ──
  if (docs.projectCount !== 2) er(`expected 2 projects, found ${docs.projectCount}`)
  else ok(`project count = 2`)
  const EXPECT_PROJ = {'project-sas-crown': '/projects/sas-crown', 'project-sas-itower': '/projects/sas-itower'}
  for (const [id, href] of Object.entries(EXPECT_PROJ)) {
    const d = docs.projects.find((x) => x._id === id)
    if (!d) er(`project MISSING at friendly id: ${id}`)
    else if (resolveHref(d) !== href) er(`project ${id} -> ${resolveHref(d)} (expected ${href})`)
    else ok(`project ${id} -> ${href}`)
  }
  for (const d of docs.projects) {
    if (!EXPECT_PROJ[d._id]) wn(`unexpected project id (random UUID?): ${d._id} -> ${resolveHref(d)}`)
  }

  // ── 4. missing-route checks ──
  for (const d of docs.pageNoSeg) er(`page without route.segment: ${d._id} "${d.title}"`)
  for (const d of docs.projNoSeg) er(`project without route.segment: ${d._id} "${d.title}"`)
  for (const d of docs.blogNoSeg) er(`blogPost without route.segment or slug: ${d._id} "${d.title}"`)
  ok(`blogPosts buildable: ${docs.blog.filter((b) => seg(b)).length}/${docs.blog.length}`)

  // ── 5. projectUpdate refs resolve to a real project (+ anchor present) ──
  for (const u of docs.updates) {
    if (!u.route?.segment?.current) er(`projectUpdate ${u._id} missing anchor segment`)
    if (!u.projRef) er(`projectUpdate ${u._id} has no project ref`)
    else if (!u.projOk) er(`projectUpdate ${u._id} -> DANGLING project ref ${u.projRef}`)
    else if (u.projType !== 'project') er(`projectUpdate ${u._id} ref is not a project (${u.projType})`)
  }
  const badU = docs.updates.filter((u) => !u.projOk || !u.route?.segment?.current)
  if (!badU.length) ok(`${docs.updates.length} projectUpdates: anchors set + project refs resolve`)
  // anchor uniqueness per project
  const anchorSeen = new Map()
  for (const u of docs.updates) {
    const k = `${u.projRef}#${u.route?.segment?.current}`
    if (anchorSeen.has(k)) er(`duplicate update anchor for project: ${k} (${anchorSeen.get(k)} & ${u._id})`)
    else anchorSeen.set(k, u._id)
  }

  // ── 6. href collisions across all page-producing docs ──
  const byHref = new Map()
  const producers = [
    ...docs.pages,
    ...docs.projects,
    ...docs.blog.filter((b) => seg(b)),
  ]
  for (const d of producers) {
    const h = resolveHref(d)
    if (!byHref.has(h)) byHref.set(h, [])
    byHref.get(h).push(d._id)
  }
  for (const [h, ids] of byHref) if (ids.length > 1) er(`href COLLISION ${h}: ${ids.join(', ')}`)
  ok(`no href collisions across ${producers.length} page docs`)

  // ── 7. compute expected URL set & diff vs built sitemap ──
  const expected = new Set([
    '/',                      // homePage singleton
    '/blog',                  // blogIndexPage singleton
    '/projects/updates',      // updatesIndexPage singleton
    ...docs.pages.map(resolveHref),
    ...docs.projects.map(resolveHref),
    ...docs.blog.filter((b) => seg(b)).map(resolveHref),
  ])
  const sm = sitemapPaths()
  const missingFromSitemap = [...expected].filter((u) => !sm.has(u)).sort()
  const extraInSitemap = [...sm].filter((u) => !expected.has(u)).sort()

  // ── REPORT ──
  console.log('\n══════════ ROUTING / ID VERIFICATION ══════════')
  console.log(`\nPASS (${pass.length}):`)
  for (const m of pass) console.log('  ✓', m)
  if (warn.length) { console.log(`\nWARN (${warn.length}):`); for (const m of warn) console.log('  ⚠', m) }
  if (fail.length) { console.log(`\nFAIL (${fail.length}):`); for (const m of fail) console.log('  ✗', m) }

  console.log('\n── Sanity-expected URLs vs built sitemap ──')
  console.log(`  Sanity expects ${expected.size} URLs · sitemap has ${sm.size} URLs`)
  if (missingFromSitemap.length) {
    console.log(`  ⚠ in Sanity but NOT in built sitemap (${missingFromSitemap.length}) — dist is stale or unbuilt:`)
    for (const u of missingFromSitemap) console.log('      +', u)
  }
  if (extraInSitemap.length) {
    console.log(`  ⚠ in built sitemap but NOT producible from Sanity (${extraInSitemap.length}):`)
    for (const u of extraInSitemap) console.log('      -', u)
  }
  if (!missingFromSitemap.length && !extraInSitemap.length) console.log('  ✓ exact match')

  console.log(`\nRESULT: ${fail.length ? `❌ ${fail.length} failure(s)` : '✅ all routing/ID checks passed'}`)
  process.exit(fail.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
