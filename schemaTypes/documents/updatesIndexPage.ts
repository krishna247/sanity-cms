import {ThListIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'updatesIndexPage',
  title: 'Updates Index',
  type: 'document',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Project Updates',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'Updates'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Updates Index', subtitle: '/projects/updates'}
    },
  },
})

