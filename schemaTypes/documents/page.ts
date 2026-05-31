import {DocumentIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {FIXED_PAGE_IDS} from '../utils/routing'

function isFixedPage(documentId: string | undefined): boolean {
  return FIXED_PAGE_IDS.includes((documentId || '').replace(/^drafts\./, '') as never)
}

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'builder', title: 'Page Builder'},
    {name: 'seo', title: 'SEO'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'route',
      group: 'settings',
      readOnly: ({document}) => isFixedPage(document?._id),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'pagePageBuilder',
      group: 'builder',
    }),
    defineField({
      name: 'body',
      title: 'Legacy Body',
      type: 'portableText',
      group: 'content',
      deprecated: {reason: 'Use Page Builder blocks instead.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'featuredImage',
      title: 'Legacy Featured Image',
      type: 'imageWithAlt',
      group: 'content',
      deprecated: {reason: 'Use a Hero or Gallery block instead.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'pageType',
      title: 'Legacy Page Type',
      type: 'string',
      group: 'settings',
      deprecated: {reason: 'Studio structure and route.section now carry page placement.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'slug',
      title: 'Legacy Slug',
      type: 'slug',
      group: 'settings',
      deprecated: {reason: 'Use route.segment instead.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      section: 'route.section',
      segment: 'route.segment.current',
    },
    prepare({title, section, segment}) {
      const parts = [section, segment].filter(Boolean)
      return {
        title,
        subtitle: parts.length ? `/${parts.join('/')}` : 'No route',
      }
    },
  },
})

