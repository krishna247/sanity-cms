import {getCliClient} from 'sanity/cli'
import {writeFileSync, mkdirSync} from 'node:fs'
// Remove CMS content that NO code path renders (bespoke pages or the generic
// page builder), so the Studio stops offering controls that do nothing. Every
// affected document is snapshotted to scripts/backups/<date>/<id>.json first.
// Applies the same operations to the draft copy when one exists.
//   npx sanity exec scripts/remove-dead-content.mjs --with-user-token
const client = getCliClient().withConfig({dataset: 'production'})
const stamp = new Date().toISOString().slice(0, 10)
const dir = `scripts/backups/${stamp}-dead-content`; mkdirSync(dir, {recursive: true})

// docId → list of operations: {removeBlocks: [_type...], unset: [path...]}
const PLAN = {
  'project-sas-itower': {
    removeBlocks: ['plateAnatomyBlock', 'consultantsBlock', 'brochureBlock'],
    unsetInBlock: {
      engineeredNumbersBlock: ['image', 'frameCaption', 'banksHeading', 'banks'],
      locationMapBlock: ['address', 'travelTimes', 'connectivity', 'footnote', 'editorialCard', 'ruleLabel', 'editorialLabel', 'locationCard.eyebrow'],
      galleryBlock: ['cta'],
      statsStripBlock: ['head'],
    },
  },
  'project-sas-crown': {
    unsetInBlock: {
      locationMapBlock: ['address', 'travelTimes', 'connectivity', 'footnote', 'editorialCard', 'ruleLabel', 'editorialLabel', 'locationCard.eyebrow'],
      galleryBlock: ['cta'],
      statsStripBlock: ['head'],
    },
  },
  'page-about': {
    removeBlocks: ['quoteBlock'],
    unsetInBlock: {logoWallBlock: ['partners'], ctaBlock: ['actions']},
  },
  'page-contact': {
    removeBlocks: ['proseBlock'],
    unsetInBlock: {mapBlock: ['head', 'location', 'footnote', 'markerCategories', 'pointsOfInterest', 'hiddenLocalities'], contactFormBlock: ['head']},
  },
  'page-careers': {
    unsetInBlock: {proseBlock: ['head.heading', 'head.dek'], featureGridBlock: ['head.heading', 'head.dek'], ctaBlock: ['head.heading']},
    trimActions: {ctaBlock: 1},
  },
  'page-media': {unsetInBlock: {feedBlock: ['head']}},
  'homePage': {unsetInBlock: {statsStripBlock: ['head']}, unsetInBlockWhere: [{type: 'feedBlock', where: (b) => b.source === 'updates', fields: ['cta']}]},
}

const blocksOf = (doc, type) => (doc.pageBuilder || []).filter((b) => b._type === type)
for (const [id, plan] of Object.entries(PLAN)) {
  for (const docId of [id, 'drafts.' + id]) {
    const doc = await client.getDocument(docId)
    if (!doc) { if (docId === id) console.log(id, 'MISSING'); continue }
    writeFileSync(`${dir}/${docId}.json`, JSON.stringify(doc, null, 2))
    let patch = client.patch(docId); const log = []
    for (const type of plan.removeBlocks || []) for (const b of blocksOf(doc, type)) { patch = patch.unset([`pageBuilder[_key=="${b._key}"]`]); log.push(`- block ${type} (${b._key})`) }
    for (const [type, fields] of Object.entries(plan.unsetInBlock || {})) for (const b of blocksOf(doc, type)) {
      const present = fields.filter((f) => f.split('.').reduce((o, k) => (o == null ? undefined : o[k]), b) !== undefined)
      if (present.length) { patch = patch.unset(present.map((f) => `pageBuilder[_key=="${b._key}"].${f}`)); log.push(`- ${type}.${present.join(',')} (${b._key})`) }
    }
    for (const rule of plan.unsetInBlockWhere || []) for (const b of blocksOf(doc, rule.type).filter(rule.where)) {
      const present = rule.fields.filter((f) => b[f] !== undefined)
      if (present.length) { patch = patch.unset(present.map((f) => `pageBuilder[_key=="${b._key}"].${f}`)); log.push(`- ${rule.type}.${present.join(',')} (${b._key})`) }
    }
    for (const [type, keep] of Object.entries(plan.trimActions || {})) for (const b of blocksOf(doc, type)) {
      const extra = (b.actions || []).slice(keep)
      if (extra.length) { patch = patch.unset(extra.map((a) => `pageBuilder[_key=="${b._key}"].actions[_key=="${a._key}"]`)); log.push(`- ${type}.actions[${keep}..] (${extra.map((a) => a.label).join(' / ')})`) }
    }
    if (log.length) { await patch.commit(); console.log(docId + '\n  ' + log.join('\n  ')) } else console.log(docId, 'nothing to remove')
  }
}
console.log('snapshots in', dir)
