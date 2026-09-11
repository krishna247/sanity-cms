// Migrate the /media wall from standalone `pressItem` documents to an inline
// `mediaWallBlock` on the Media page (page-media), so every entry is authored,
// added, removed and reordered in the Page Builder itself.
//
// What it does (idempotent):
//   1. reads every PUBLISHED pressItem, newest first (the wall's current order);
//   2. builds one `mediaWallItem` per pressItem (fields copied verbatim — same
//      image asset ref, so the thumbnail is byte-identical);
//   3. replaces the press `feedBlock` (or an existing mediaWallBlock, on a re-run)
//      at its own position in page-media.pageBuilder with a `mediaWallBlock` that
//      carries the old chrome (filterLabel / allLabel / countNoun[Plural]) + items;
//   4. writes the result to the DRAFT (drafts.page-media) — review in the Studio,
//      then publish (that triggers the rebuild). It never publishes or deletes.
//
//   DRY=1 npx sanity exec scripts/migrate-media-wall.mjs --with-user-token   (preview only)
//         npx sanity exec scripts/migrate-media-wall.mjs --with-user-token   (writes the draft)
import {getCliClient} from 'sanity/cli'

const DRY = !!process.env.DRY
const PAGE_ID = 'page-media'
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})

const keyFrom = (id) => String(id).replace(/^drafts\./, '').replace(/[^A-Za-z0-9_-]/g, '-')
const defined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))

// ── 1. pressItems, newest first (matches getMediaWall's `order(publishedAt desc)`)
const press = await client.fetch(
  `*[_type == "pressItem" && !(_id in path("drafts.**"))] | order(publishedAt desc){
    _id, title, titleStyle, metaStyle, kind, category, publication, publishedAt,
    image, youtubeUrl, duration, link
  }`,
)
if (!press.length) throw new Error('no published pressItem documents found — nothing to migrate')

// ── 2. one mediaWallItem per pressItem (fields verbatim; image/link refs preserved)
const items = press.map((p) =>
  defined({
    _type: 'mediaWallItem',
    _key: keyFrom(p._id),
    title: p.title,
    titleStyle: p.titleStyle,
    metaStyle: p.metaStyle,
    kind: p.kind,
    category: p.category,
    publication: p.publication,
    publishedAt: p.publishedAt,
    image: p.image,
    youtubeUrl: p.youtubeUrl,
    duration: p.duration,
    link: p.link,
  }),
)

// ── 3. find the block to replace (legacy press feedBlock, or an existing
//       mediaWallBlock on a re-run) and build the mediaWallBlock in its place.
const published = await client.getDocument(PAGE_ID)
if (!published) throw new Error(`${PAGE_ID} not found`)
const pb = published.pageBuilder || []
const target =
  pb.find((b) => b._type === 'feedBlock' && b.source === 'press') ||
  pb.find((b) => b._type === 'feedBlock') ||
  pb.find((b) => b._type === 'mediaWallBlock')
if (!target) throw new Error(`${PAGE_ID} has no feedBlock or mediaWallBlock to migrate`)

const mediaWallBlock = defined({
  _type: 'mediaWallBlock',
  _key: target._key, // reuse the block's key → same position, no churn
  filterLabel: target.filterLabel,
  allLabel: target.allLabel,
  countNoun: target.countNoun,
  countNounPlural: target.countNounPlural,
  filterLabelStyle: target.filterLabelStyle,
  allLabelStyle: target.allLabelStyle,
  countNounStyle: target.countNounStyle,
  itemTitleStyle: target.itemTitleStyle,
  itemMetaStyle: target.itemMetaStyle,
  items,
})

// ── report ────────────────────────────────────────────────────────────────────
console.log(`pressItems: ${press.length}`)
console.log(`target block: ${target._type} (_key=${target._key})`)
console.log(`chrome: filterLabel=${JSON.stringify(target.filterLabel)} allLabel=${JSON.stringify(target.allLabel)} countNoun=${JSON.stringify(target.countNoun)}/${JSON.stringify(target.countNounPlural)}`)
for (const it of items) {
  console.log(`  · [${it.kind}/${it.category}] ${it.title?.slice(0, 56)}  img:${it.image ? 'y' : 'n'} yt:${it.youtubeUrl ? 'y' : 'n'} link:${it.link ? 'y' : 'n'}`)
}

if (DRY) {
  console.log('\nDRY run — no write. Block to be set at pageBuilder[_key=="' + target._key + '"]:')
  console.log(JSON.stringify(mediaWallBlock, null, 2).slice(0, 1200) + ' …')
  process.exit(0)
}

// ── 4. write to the DRAFT (base it on any existing draft, else the published doc),
//       replacing just the one array element by key. Never publishes.
const draftId = `drafts.${PAGE_ID}`
const existingDraft = await client.getDocument(draftId)
if (!existingDraft) {
  const {_rev, ...body} = published
  await client.createIfNotExists({...body, _id: draftId})
  console.log(`created ${draftId} from the published doc`)
}
const res = await client
  .patch(draftId)
  .set({[`pageBuilder[_key=="${target._key}"]`]: mediaWallBlock})
  .commit()
console.log(`\npatched ${draftId} (rev ${res._rev}) — review in the Studio, then publish.`)
