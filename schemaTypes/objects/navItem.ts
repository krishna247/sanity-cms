import {MenuIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'object',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'children',
      title: 'Children',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'link.kind',
    },
  },
})

