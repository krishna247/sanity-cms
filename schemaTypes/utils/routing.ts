import type {ValidationContext} from 'sanity'
import {resolveHref, RESERVED_PROJECT_SEGMENTS, RESERVED_TOP_LEVEL_SEGMENTS} from '../../lib/routing'

export const SINGLETON_IDS = [
  'siteSettings',
  'navigation',
  'homePage',
  'blogIndexPage',
  'updatesIndexPage',
] as const

export const FIXED_PAGE_IDS = [
  'page-about',
  'page-careers',
  'page-contact',
  'page-media',
  'page-privacy',
  'page-terms',
  'page-cookies',
] as const

export const GUARDED_DOCUMENT_IDS = [...SINGLETON_IDS, ...FIXED_PAGE_IDS] as const

type RouteValue = {
  section?: string
  segment?: {
    current?: string
  }
}

type ValidationDocument = {
  _id?: string
  _type?: string
  title?: string
  route?: RouteValue
  slug?: {
    current?: string
  }
  project?: {
    _ref?: string
  }
}

function cleanId(id: string | undefined): string {
  return (id || '').replace(/^drafts\./, '')
}

function titleFor(doc: ValidationDocument): string {
  return doc.title || doc._id || doc._type || 'Untitled document'
}

function hasBadSegment(segment: string): boolean {
  return /[/?#\\]/.test(segment)
}

export async function validateRoute(value: RouteValue | undefined, context: ValidationContext) {
  const document = context.document as ValidationDocument | undefined
  const type = document?._type
  const segment = value?.segment?.current || ''
  const section = value?.section

  if (!type || !['page', 'project', 'blogPost'].includes(type)) return true
  if (!segment) return 'Route segment is required'
  if (hasBadSegment(segment)) return 'Use a single path segment only. Do not include slashes, query strings, or anchors.'

  if (type === 'project' && RESERVED_PROJECT_SEGMENTS.includes(segment as never)) {
    return '`updates` is reserved for /projects/updates.'
  }

  if (type === 'page' && !section && RESERVED_TOP_LEVEL_SEGMENTS.includes(segment as never)) {
    return `/${segment} is reserved by the site route model.`
  }

  const candidateHref = resolveHref({_type: type, route: value})
  const staticHrefs = new Set(['/', '/blog', '/projects/updates'])
  if (staticHrefs.has(candidateHref)) return `${candidateHref} is owned by an index singleton.`

  const id = cleanId(document?._id)
  const client = context.getClient({apiVersion: '2026-05-31'})
  const docs = await client.fetch<ValidationDocument[]>(
    `*[_type in ["page", "project", "blogPost"] && defined(route.segment.current) && !(_id in [$id, $draftId])]{
      _id,
      _type,
      title,
      route{section, segment},
      slug
    }`,
    {id, draftId: `drafts.${id}`},
  )

  const collision = docs.find((doc) => resolveHref(doc) === candidateHref)
  return collision ? `${candidateHref} is already owned by ${titleFor(collision)}.` : true
}

export async function validateProjectUpdateAnchor(value: RouteValue | undefined, context: ValidationContext) {
  const document = context.document as ValidationDocument | undefined
  const segment = value?.segment?.current || ''

  if (!segment) return 'Anchor id is required'
  if (hasBadSegment(segment)) return 'Use a single anchor segment only. Do not include slashes, query strings, or #.'
  if (!document?.project?._ref) return true

  const id = cleanId(document._id)
  const client = context.getClient({apiVersion: '2026-05-31'})
  const count = await client.fetch<number>(
    `count(*[
      _type == "projectUpdate" &&
      project._ref == $projectId &&
      route.segment.current == $segment &&
      !(_id in [$id, $draftId])
    ])`,
    {projectId: document.project._ref, segment, id, draftId: `drafts.${id}`},
  )

  return count === 0 || 'This update anchor is already used for this project.'
}

