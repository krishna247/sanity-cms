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
      name: 'officeLabel',
      title: 'Office column heading',
      description: 'Heading of the footer address column (defaults to "Office"). The address itself comes from Site Settings → Address.',
      type: 'string',
      placeholder: 'Office',
    }),
    defineField({
      name: 'footer',
      title: 'Footer Menu',
      description:
        "The footer menu — four groups in this order: Quick Links, Projects, Contact, Legal. Each group's Label is a column heading and its Children are the links under it. Contact is heading-only (its phone and email rows come from Site Settings → Phones / Email); Legal is the small link row in the bottom bar. A group with no children falls back to the site's built-in list.",
      validation: (rule) => rule.max(4),
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})

