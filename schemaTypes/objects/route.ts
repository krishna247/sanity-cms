import {defineField, defineType} from 'sanity'
import {validateRoute} from '../utils/routing'

export default defineType({
  name: 'route',
  title: 'Route',
  type: 'object',
  fields: [
    defineField({
      name: 'segment',
      title: 'URL Segment',
      type: 'slug',
      description: 'Single URL segment only, for example "privacy". Do not include slashes.',
      options: {
        source: (doc: {title?: string}) => doc.title || '',
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 96),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Reserved Section',
      type: 'string',
      description: 'Optional non-rendered route prefix. Legal pages use /legal/* without creating a /legal page.',
      options: {
        list: [{title: 'Legal', value: 'legal'}],
      },
    }),
  ],
  validation: (rule) => rule.custom(validateRoute),
  preview: {
    select: {
      section: 'section',
      segment: 'segment.current',
    },
    prepare({section, segment}) {
      const parts = [section, segment].filter(Boolean)
      return {title: parts.length ? `/${parts.join('/')}` : 'Route'}
    },
  },
})

