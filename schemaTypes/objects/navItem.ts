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
      description: 'The menu text visitors see. (The link below asks for its own label too; the menu uses this one.)',
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
      name: 'projectsFlyout',
      title: 'Show project cards on hover',
      description:
        'Desktop only: the project cards drop down under this item on hover. Meant for the Projects item — only the first item with this on gets the cards.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'children',
      title: 'Children',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
      // Nested menus are not rendered anywhere on the site; hidden so the editor
      // is not invited to build a structure that never appears.
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'link.kind',
    },
  },
})

