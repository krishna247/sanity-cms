// Migrate the two flagship project docs onto the friendly IDs the Studio
// structure pins (structure/index.ts -> flagshipProject(S, 'project-sas-crown' …)).
// The docs were seeded with random UUIDs, so the pinned shortcuts open an empty
// "create new" form. This moves the data to the expected IDs and repoints every
// referencing document, then deletes the old UUID docs.
//
// Idempotent. Read-only by default; pass APPLY=1 to mutate:
//   SANITY_MCP_TOKEN=<token> node migrate-flagship-ids.mjs          # dry-run / inspect
//   SANITY_MCP_TOKEN=<token> APPLY=1 node migrate-flagship-ids.mjs  # migrate
//
import {createClient} from '@sanity/client'

const token = process.env.SANITY_MCP_TOKEN || process.env.SANITY_AUTH_TOKEN
if (!token) throw new Error('Set SANITY_MCP_TOKEN')

const APPLY = process.env.APPLY === '1'

const base = {
  projectId: 'ajw4irs3',
  dataset: 'production',
  apiVersion: '2026-05-31',
  token,
  useCdn: false,
}
const client = createClient(base) // mutations
const raw = createClient({...base, perspective: 'raw'}) // reads incl. drafts

// oldUUID -> newFriendlyId
const MAP = [
  ['aa5e687c-43db-4b4c-8b2c-9e685a02d459', 'project-sas-crown', 'SAS Crown'],
  ['d25b2baa-cb72-44f8-b687-adad7ebda338', 'project-sas-itower', 'SAS iTower'],
]
const OLD_IDS = MAP.map((m) => m[0])
const NEW_IDS = MAP.map((m) => m[1])
// docs we will delete at the end — never repoint/createOrReplace these
const DELETE_SET = new Set([...OLD_IDS, ...OLD_IDS.map((id) => `drafts.${id}`)])

const strip = (d) => {
  const {_id, _rev, _createdAt, _updatedAt, ...rest} = d
  return rest
}

async function preflight() {
  console.log('── PRE-FLIGHT ──────────────────────────────────────────')
  for (const [oldId, newId, title] of MAP) {
    const [pub, draft, newPub, newDraft] = await Promise.all([
      raw.getDocument(oldId),
      raw.getDocument(`drafts.${oldId}`),
      raw.getDocument(newId),
      raw.getDocument(`drafts.${newId}`),
    ])
    console.log(`\n[${title}]`)
    console.log(
      '  old published :',
      pub ? `${pub._type} "${pub.title}" pb=${pub.pageBuilder?.length} specs=${pub.specifications?.length} amen=${pub.amenities?.length} seg=${pub.route?.segment?.current}` : 'MISSING',
    )
    console.log('  old draft     :', draft ? 'present' : 'none')
    console.log('  new published :', newPub ? `${newPub._type} "${newPub.title}"` : 'none')
    console.log('  new draft     :', newDraft ? 'present' : 'none')
  }
  console.log('\n── live references (raw perspective) ───────────────────')
  for (const oldId of OLD_IDS) {
    const refs = await raw.fetch('*[references($id)]._id', {id: oldId})
    console.log(`  references(${oldId.slice(0, 8)}…):`, JSON.stringify(refs))
  }
}

async function migrate() {
  // 1 ── COPY each old doc to its new bare ID (published, verbatim minus system fields)
  console.log('\n── 1. COPY to friendly IDs ─────────────────────────────')
  for (const [oldId, newId, title] of MAP) {
    const pub = await raw.getDocument(oldId)
    if (!pub) {
      console.warn(`  ! skip copy: ${oldId} missing`)
      continue
    }
    await client.createOrReplace({...strip(pub), _id: newId})
    console.log(`  ✓ ${title}: ${oldId} -> ${newId} (pb=${pub.pageBuilder?.length})`)
  }

  // 2 ── REPOINT every referencing doc via deep string replace of the UUID
  console.log('\n── 2. REPOINT references ───────────────────────────────')
  for (const [oldId, newId] of MAP) {
    const refIds = await raw.fetch('*[references($id)]._id', {id: oldId})
    for (const rid of refIds) {
      if (DELETE_SET.has(rid)) continue // these get deleted; don't bother
      const doc = await raw.getDocument(rid)
      if (!doc) continue
      const updated = JSON.parse(JSON.stringify(doc).split(oldId).join(newId))
      await client.createOrReplace(updated)
      console.log(`  ↻ ${rid}: ${oldId.slice(0, 8)}… -> ${newId}`)
    }
  }

  // 3 ── DELETE old UUID docs + leftover drafts (old + new). Drafts first.
  console.log('\n── 3. DELETE old docs + leftover drafts ────────────────')
  const toDelete = [
    ...OLD_IDS.map((id) => `drafts.${id}`),
    ...NEW_IDS.map((id) => `drafts.${id}`),
    ...OLD_IDS,
  ]
  for (const id of toDelete) {
    try {
      const res = await client.delete(id)
      const removed = res?.results?.some((r) => r.operation === 'delete')
      console.log(removed ? `  ✓ deleted ${id}` : `  · nothing at ${id}`)
    } catch (e) {
      console.warn(`  ! could not delete ${id}: ${e.message}`)
    }
  }
}

async function verify() {
  console.log('\n── VERIFY ──────────────────────────────────────────────')
  const a = await client.fetch(
    '*[_id in ["project-sas-crown","project-sas-itower"]]{_id,title,"seg":route.segment.current,"pb":count(pageBuilder),"specs":count(specifications),"amen":count(amenities)}',
  )
  console.log('  flagship docs:', JSON.stringify(a, null, 2))
  const count = await client.fetch('count(*[_type=="project"])')
  console.log('  count(project):', count)
  const stillRef = await raw.fetch(
    '*[references("aa5e687c-43db-4b4c-8b2c-9e685a02d459") || references("d25b2baa-cb72-44f8-b687-adad7ebda338")]._id',
  )
  console.log('  still referencing old UUIDs (raw):', JSON.stringify(stillRef))
  const oldStill = await raw.fetch(
    '*[_id in ["aa5e687c-43db-4b4c-8b2c-9e685a02d459","d25b2baa-cb72-44f8-b687-adad7ebda338","drafts.aa5e687c-43db-4b4c-8b2c-9e685a02d459","drafts.d25b2baa-cb72-44f8-b687-adad7ebda338"]]._id',
  )
  console.log('  old UUID docs remaining (raw):', JSON.stringify(oldStill))
  const spot = await client.fetch('*[_id=="pu-crown-2026-02"]{ "proj": project->{_id,title} }')
  console.log('  pu-crown-2026-02 ->', JSON.stringify(spot))
}

async function main() {
  console.log(`whoami target: project ajw4irs3 / dataset production · APPLY=${APPLY}`)
  await preflight()
  if (!APPLY) {
    console.log('\n(dry-run — re-run with APPLY=1 to perform the migration)')
    return
  }
  await migrate()
  await verify()
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
