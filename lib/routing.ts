export type RoutableDocument = {
  _type?: string
  title?: string
  route?: {
    section?: string
    segment?: {
      current?: string
    }
  }
  slug?: {
    current?: string
  }
}

export const RESERVED_TOP_LEVEL_SEGMENTS = ['blog', 'projects', 'legal'] as const
export const RESERVED_PROJECT_SEGMENTS = ['updates'] as const
export const RESERVED_SECTIONS = ['legal'] as const

function routeSegment(doc: RoutableDocument): string {
  return doc.route?.segment?.current || doc.slug?.current || ''
}

export function resolveHref(doc: RoutableDocument | null | undefined): string {
  if (!doc?._type) return '#'

  const segment = routeSegment(doc)

  switch (doc._type) {
    case 'homePage':
      return '/'
    case 'blogIndexPage':
      return '/blog'
    case 'updatesIndexPage':
      return '/projects/updates'
    case 'blogPost':
      return segment ? `/blog/${segment}` : '/blog'
    case 'project':
      return segment ? `/projects/${segment}` : '/projects'
    case 'projectUpdate':
      return segment ? `/projects/updates#${segment}` : '/projects/updates'
    case 'page': {
      const parts = [doc.route?.section, segment].filter(Boolean)
      return `/${parts.join('/')}`
    }
    default:
      return '#'
  }
}

