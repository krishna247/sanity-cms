import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'pressItem',
  title: 'Press Item',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'publication', title: 'Publication', type: 'string'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'date'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
    defineField({name: 'link', title: 'Link', type: 'link'}),
  ],
  orderings: [{title: 'Newest', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'publication', media: 'image.image'},
  },
})

