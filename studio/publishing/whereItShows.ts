// Where on the live site a document's changes will appear once published, for
// the queue row. Routable documents use the same resolver the schema's route
// validation uses; the rest are described by what reads them.
import {resolveHref, type RoutableDocument} from '../../lib/routing'

const BY_TYPE: Record<string, string> = {
  siteSettings: 'Every page (site settings)',
  navigation: 'Every page (header and footer)',
  pressItem: '/media',
  projectUpdate: '/media',
  partner: 'Home and About partner walls',
  person: 'About page and blog bylines',
  category: '/blog filter',
}

export function whereItShows(doc: RoutableDocument | null | undefined): string {
  if (!doc?._type) return ''
  if (doc._type in BY_TYPE) return BY_TYPE[doc._type]
  const href = resolveHref(doc)
  if (href === '/') return 'the home page'
  return href === '#' ? 'wherever it is referenced' : href
}
