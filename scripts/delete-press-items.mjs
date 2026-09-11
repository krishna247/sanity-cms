// Retire the standalone pressItem documents after their content was migrated
// into the Media page's inline mediaWallBlock (see migrate-media-wall.mjs).
// Deletes every pressItem (published + any draft). The /media wall now reads the
// inline block, so nothing references these any more.
//
//   DRY=1 npx sanity exec scripts/delete-press-items.mjs --with-user-token   (list only)
//         npx sanity exec scripts/delete-press-items.mjs --with-user-token   (deletes)
import {getCliClient} from 'sanity/cli'

const DRY = !!process.env.DRY
const client = getCliClient().withConfig({dataset: 'production', apiVersion: '2025-01-01', perspective: 'raw'})

// raw perspective returns published AND draft docs as distinct _ids.
const ids = (await client.fetch(`*[_type == "pressItem"]._id`)).sort()
console.log(`pressItem documents found: ${ids.length}`)
for (const id of ids) console.log('  · ' + id)

if (!ids.length) {
  console.log('nothing to delete.')
  process.exit(0)
}
if (DRY) {
  console.log('\nDRY run — no delete.')
  process.exit(0)
}

let tx = client.transaction()
for (const id of ids) tx = tx.delete(id)
const res = await tx.commit()
console.log(`\ndeleted ${ids.length} pressItem documents; tx ${res.transactionId}`)
