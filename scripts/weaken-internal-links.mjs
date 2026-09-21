import {getCliClient} from 'sanity/cli'
// Backfill `_weak: true` onto every stored in-body `internalLink` reference.
//
// Client QA Sr 42 ("Not able to delete Blogs"): the WordPress migration wired
// the blog posts to each other through `internalLink` annotations, and the
// reference was strong — so the API refused to delete any post another post
// linked to (21 of 31 on 2026-09-21; every referrer was itself a blogPost).
// schemaTypes/objects/portableText.ts now declares the reference `weak: true`,
// but weakness lives on the STORED value (`_weak`), so the flag only reaches
// links created from now on. This sets it on the existing ones.
//
// Scope: the top-level `body[]` of every document (blogPost / page — the only
// place internalLinks exist today). Links found anywhere else are reported, not
// patched. Published docs and drafts are both patched, each key-scoped
// (`body[_key==…].markDefs[_key==…].reference._weak`) so no array is rewritten
// and no `_key` churns. One transaction → one sanity-publish rebuild; the built
// HTML is unchanged (hrefs resolve exactly as before).
//
// Dry run (default — prints what it would do, writes nothing):
//   npx sanity exec scripts/weaken-internal-links.mjs --with-user-token
// Apply:
//   npx sanity exec scripts/weaken-internal-links.mjs --with-user-token -- --apply
const APPLY = process.argv.includes('--apply')
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})

const docs = await client.fetch(`*[count(body[].markDefs[_type == "internalLink" && defined(reference._ref) && reference._weak != true]) > 0]{
  _id, _type,
  "links": body[]{"block": _key, "defs": markDefs[_type == "internalLink" && defined(reference._ref) && reference._weak != true]{_key, "ref": reference._ref}}[count(defs) > 0]
}`)

// Anything the body-scoped paths above cannot reach (e.g. a proseBlock inside a
// pageBuilder): surface it rather than silently leave a strong reference behind.
const elsewhere = await client.fetch(`*[references(*[_type == "blogPost"]._id) && _type != "blogPost"]{_id, _type}`)

const tx = client.transaction()
let count = 0
for (const doc of docs) {
  const set = {}
  for (const block of doc.links) {
    for (const def of block.defs) {
      set[`body[_key=="${block.block}"].markDefs[_key=="${def._key}"].reference._weak`] = true
      count++
    }
  }
  console.log(`${doc._id} (${doc._type}): ${Object.keys(set).length} link(s)`)
  tx.patch(doc._id, (p) => p.set(set))
}

console.log(`\n${count} strong internalLink reference(s) in ${docs.length} document(s).`)
if (elsewhere.length) console.log('Non-post documents still referencing a blogPost (not handled here):', JSON.stringify(elsewhere))

if (!APPLY) {
  console.log('Dry run — nothing written. Re-run with `-- --apply` to commit.')
} else if (count) {
  await tx.commit()
  // GROQ references() matches weak references too, so re-count the stored flag.
  const left = await client.fetch(`count(*[].body[].markDefs[_type == "internalLink" && defined(reference._ref) && reference._weak != true])`)
  console.log(`Committed. Strong in-body internalLink references left: ${left}`)
}
