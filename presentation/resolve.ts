import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'
import {resolveHref, type RoutableDocument} from '../lib/routing'

type LocationDoc = RoutableDocument & {
  title?: string
  headline?: string
}

function titleFor(doc: LocationDoc | undefined, fallback: string): string {
  return doc?.title || doc?.headline || fallback
}

function locationFor(type: string, fallback: string) {
  return defineLocations({
    select: {
      title: 'title',
      headline: 'headline',
      route: 'route',
      slug: 'slug',
    },
    resolve: (doc: LocationDoc | undefined) => ({
      locations: [
        {
          title: titleFor(doc, fallback),
          href: resolveHref({_type: type, ...doc}),
        },
      ],
    }),
  })
}

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    homePage: locationFor('homePage', 'Home'),
    blogIndexPage: locationFor('blogIndexPage', 'Blog'),
    page: locationFor('page', 'Page'),
    project: locationFor('project', 'Project'),
    blogPost: locationFor('blogPost', 'Blog Post'),
    projectUpdate: locationFor('projectUpdate', 'Project Update'),
  },
}

