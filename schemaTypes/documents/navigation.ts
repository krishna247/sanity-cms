import {MenuIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Navigation',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'header',
      title: 'Header Menu',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
    defineField({
      name: 'footer',
      title: 'Footer Menu',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})

