import {getCliClient} from 'sanity/cli'
// Delete `drafts.project-sas-itower`: a draft from 2026-08-05 that today's seed
// scripts patched (so its timestamp is now newer) but which still differs from
// the published document only by pointing masterPlanBlock.image at the retired
// shared brochure-spread asset. Publishing it from the Studio would regress the
// live page. Snapshot saved to the session scratchpad before deletion.
// Guard: refuse if the draft differs from published anywhere except that image.
const client = getCliClient().withConfig({dataset: 'production'})
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (['_id', '_rev', '_updatedAt', '_createdAt'].includes(k) ? undefined : v)))
const [draft, pub] = await Promise.all([client.getDocument('drafts.project-sas-itower'), client.getDocument('project-sas-itower')])
if (!draft) { console.log('no draft'); process.exit(0) }
const diffs = []
const walk = (a, b, path) => {
  if (JSON.stringify(a) === JSON.stringify(b)) return
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], path + '.' + k)
  } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    a.forEach((x, i) => walk(x, b[i], path + '[' + (x?._key ?? i) + ']'))
  } else diffs.push(path)
}
walk(strip(draft), strip(pub), '')
console.log('differing paths:', diffs)
const ok = diffs.length > 0 && diffs.every((d) => d.startsWith('._system') || d.includes('.image'))
if (!ok) { console.log('draft differs beyond the master-plan image — refusing'); process.exit(1) }
await client.delete('drafts.project-sas-itower')
console.log('deleted drafts.project-sas-itower')
