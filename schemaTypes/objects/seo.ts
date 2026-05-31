import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'seo',
  title: 'SEO Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      validation: (rule) =>
        rule.max(60).warning('Meta titles longer than 60 characters may be truncated in search results.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      validation: (rule) =>
        rule
          .max(160)
          .warning('Meta descriptions longer than 160 characters may be truncated in search results.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'imageWithAlt',
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'If enabled, this page will be hidden from search engines.',
      initialValue: false,
    }),
  ],
})
