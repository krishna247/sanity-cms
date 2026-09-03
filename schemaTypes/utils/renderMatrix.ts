import type {ConditionalPropertyCallbackContext} from 'sanity'

/**
 * Render matrix — which block fields a BESPOKE page never renders.
 *
 * The live routes are hand-built components (Home, About, Media, Careers,
 * Contact, the legal pages, SAS Crown, SAS iTower) that render a subset of each
 * block; the generic page builder renders every field. A field that is live on
 * one page can be dead on another, so it cannot be deleted from the shared
 * schema — instead it is hidden in the Studio on the documents whose page
 * ignores it. Keep this in step with the components (see
 * repos/frontend/TYPOGRAPHY.md “CMS text-style pickers”).
 *
 * Keys: document id → block type → field paths relative to the block
 * (`head.dek`, `images[].caption`, `locationCard.eyebrow`, …). A picker
 * `<field>Style` follows its field automatically.
 */
const HEAD_ALL = ['head.eyebrow', 'head.heading', 'head.dek']
const PROJECT = {
  statsStripBlock: HEAD_ALL,
  galleryBlock: ['cta', 'variant', 'images[].caption'],
  locationMapBlock: ['footnote', 'locationCard.eyebrow'],
}
export const DEAD_SLOTS: Record<string, Record<string, string[]>> = {
  homePage: {statsStripBlock: HEAD_ALL, feedBlock: ['cta']},
  'page-about': {logoWallBlock: ['partners', 'nameStyle'], ctaBlock: ['actions', 'note']},
  'page-careers': {
    proseBlock: ['head.heading', 'head.dek'],
    featureGridBlock: ['head.heading', 'head.dek', 'cta'],
    ctaBlock: ['head.heading', 'note'],
  },
  'page-contact': {
    contactFormBlock: ['head.eyebrow', 'head.heading', 'head.dek'],
    mapBlock: ['head.eyebrow', 'head.heading', 'head.dek', 'location', 'footnote', 'markerCategories', 'pointsOfInterest', 'hiddenLocalities'],
  },
  'page-media': {feedBlock: HEAD_ALL.concat(['cta'])},
  'page-privacy': {proseBlock: HEAD_ALL, ctaBlock: ['head.eyebrow', 'head.heading', 'note']},
  'page-terms': {proseBlock: HEAD_ALL, ctaBlock: ['head.eyebrow', 'head.heading', 'note']},
  'page-cookies': {proseBlock: HEAD_ALL, ctaBlock: ['head.eyebrow', 'head.heading', 'note']},
  'project-sas-crown': {...PROJECT, floorPlansBlock: ['plans[].placeholder']},
  'project-sas-itower': {...PROJECT},
}

const docId = (doc: any) => String(doc?._id || '').replace(/^drafts\./, '')

/** Find the page-builder block that contains `target` (a block, a nested object
 *  such as `head`, or an array item) by identity, `_key`, or structural equality. */
function blockOf(document: any, target: any): any | undefined {
  const blocks: any[] = document?.pageBuilder || []
  if (!target) return undefined
  const json = JSON.stringify(target)
  const key = target?._key
  const walk = (node: any): boolean => {
    if (node === target) return true
    if (node && typeof node === 'object') {
      if (key && node._key === key) return true
      if (!Array.isArray(node) && JSON.stringify(node) === json) return true
      for (const k of Object.keys(node)) if (walk(node[k])) return true
    }
    return false
  }
  return blocks.find((b) => b === target || walk(b))
}

/** `hidden` callback: true when `fieldPath` (relative to the block) is dead on this document's page. */
export const deadHere =
  (fieldPath: string) =>
  ({document, parent}: ConditionalPropertyCallbackContext): boolean => {
    const dead = DEAD_SLOTS[docId(document)]
    if (!dead) return false
    const block = blockOf(document, parent)
    if (!block) return false
    const list = dead[block._type] || []
    const base = fieldPath.replace(/Style$/, '')
    return list.includes(fieldPath) || list.includes(base)
  }
