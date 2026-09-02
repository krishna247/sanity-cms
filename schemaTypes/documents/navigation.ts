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
      description:
        'The main menu at the top of every page, left to right. Label is the text visitors see. Desktop and mobile menus both read this list. If the list is empty the site falls back to its built-in menu, and an item whose link cannot be resolved is left out rather than shown broken.',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
    defineField({
      name: 'callLabel',
      title: 'Call button label',
      description:
        'Text on the phone button in the mobile menu (defaults to "Call"). The number it dials comes from Site Settings → Phones (sales). The main "Contact Us" button label lives in Site Settings → CTA label.',
      type: 'string',
      placeholder: 'Call',
    }),
    defineField({
      name: 'footer',
      title: 'Footer Menu',
      description: 'Not used by the site yet — the footer links are still fixed in code.',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})

