import {getCliClient} from 'sanity/cli'
// Client QA round 4 (OnGoing Tasks sheet, 2026-09-21) — the two content changes.
//
// Sr 37 — Home stats strip: add a fifth stat, "3 · Projects under development".
//   Key-scoped insert after the last item of homePage statsStripBlock `k61`, so
//   no existing `_key` churns. It is an ordinary stat item: editors raise or
//   lower the number in the Studio like the other four.
//   ORDER MATTERS: the frontend must already be deployed with the variable
//   column count (`--stat-cols`, global.css) — the old stylesheet hard-codes four
//   columns, so a fifth stat would wrap onto a second desktop row.
//
// Sr 44 — Blog: retire the "News & Articles" filter. The pills are derived from
//   the categories the posts carry, so moving its two posts to "Blogs" removes
//   the pill (and, with one category left, the frontend drops the filter row).
//   The posts themselves stay published. Pass --delete-category to also delete
//   the now-unused `category-news-articles` document so it cannot be re-picked.
//
// Direct published writes in ONE transaction (same pattern as
// fix-nav-about-link.mjs): the commit IS the publish and fires the
// sanity-publish rebuild. Refuses to run if any touched document has a draft —
// a later Studio publish of that draft would silently overwrite the patch.
//
// Dry run (default):  npx sanity exec scripts/patch-qa-round4-content.mjs --with-user-token
// Apply:              npx sanity exec scripts/patch-qa-round4-content.mjs --with-user-token -- --apply [--delete-category]
const APPLY = process.argv.includes('--apply')
const DELETE_CATEGORY = process.argv.includes('--delete-category')
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})

const STRIP = 'k61'
const NEW_STAT = {_key: 'qa4-projects-dev', _type: 'statItem', value: '3', label: 'Projects under development'}
const NEWS = 'category-news-articles'
const BLOGS = 'category-blogs'

const state = await client.fetch(
  `{
    "strip": *[_id == "homePage"][0].pageBuilder[_key == $strip][0]{_type, "items": items[]{_key, _type, value, suffix, label}},
    "posts": *[_type == "blogPost" && !(_id in path("drafts.**")) && category._ref == $news]{_id, title},
    "blogs": defined(*[_id == $blogs][0]._id),
    "otherNewsRefs": *[references($news) && _type != "blogPost"]{_id, _type}
  }`,
  {strip: STRIP, news: NEWS, blogs: BLOGS},
)
if (state.strip?._type !== 'statsStripBlock') throw new Error(`homePage pageBuilder[_key=="${STRIP}"] is not the stats strip any more — re-check the key`)
if (!state.blogs) throw new Error(`${BLOGS} does not exist`)

const touched = ['homePage', ...state.posts.map((p) => p._id), ...(DELETE_CATEGORY ? [NEWS] : [])]
const drafts = await client.fetch(`*[_id in $ids]._id`, {ids: touched.map((id) => `drafts.${id}`)})
if (drafts.length) throw new Error(`Unpublished drafts exist — publish or discard them in the Studio first: ${drafts.join(', ')}`)

const tx = client.transaction()

// Match the _type the existing items carry (the array member name), not a guess.
const itemType = state.strip.items.at(-1)?._type
const already = state.strip.items.some((i) => i.label?.trim().toLowerCase() === NEW_STAT.label.toLowerCase())
if (already) console.log('Sr 37: a "Projects under development" stat already exists — skipping')
else {
  const lastKey = state.strip.items.at(-1)._key
  const item = {...NEW_STAT, ...(itemType ? {_type: itemType} : {})}
  if (!itemType) delete item._type
  console.log(`Sr 37: insert after items[_key=="${lastKey}"] →`, JSON.stringify(item))
  tx.patch('homePage', (p) => p.insert('after', `pageBuilder[_key=="${STRIP}"].items[_key=="${lastKey}"]`, [item]))
}

for (const post of state.posts) {
  console.log(`Sr 44: ${post._id} ("${post.title}") category → ${BLOGS}`)
  tx.patch(post._id, (p) => p.set({category: {_type: 'reference', _ref: BLOGS}}))
}
if (!state.posts.length) console.log('Sr 44: no published post is filed under News & Articles')

if (DELETE_CATEGORY) {
  if (state.otherNewsRefs.length) throw new Error(`Other documents still reference ${NEWS}: ${JSON.stringify(state.otherNewsRefs)}`)
  console.log(`Sr 44: delete ${NEWS}`)
  tx.delete(NEWS)
}

if (!APPLY) console.log('\nDry run — nothing written. Re-run with `-- --apply` to commit.')
else {
  await tx.commit()
  console.log('\nCommitted. The sanity-publish webhook rebuilds the site in ~1-2 min.')
}
