import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'blogIndexPage',
  title: 'Blog Index',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Blog',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'Blog'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Blog Index', subtitle: '/blog'}
    },
  },
})

