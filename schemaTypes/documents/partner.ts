import {UsersIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'discipline', title: 'Discipline', type: 'string'}),
    defineField({name: 'country', title: 'Country', type: 'string'}),
    defineField({name: 'logo', title: 'Logo', type: 'imageWithAlt'}),
    defineField({name: 'website', title: 'Website', type: 'url', validation: (rule) => rule.uri({scheme: ['http', 'https']})}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'discipline', media: 'logo.image'},
  },
})

