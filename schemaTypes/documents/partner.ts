import {UsersIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  icon: UsersIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    textStyleField('nameStyle', 'Name', 'Wins over the block-level style wherever this partner is shown as text.'),
    defineField({name: 'discipline', title: 'Discipline', type: 'string'}),
    defineField({name: 'country', title: 'Country', type: 'string'}),
    defineField({
      name: 'shortCountry',
      title: 'Short Country',
      type: 'string',
      description: 'Abbreviated label shown under the logo on the partner wall, e.g. "UK / HK". Falls back to Country.',
    }),
    defineField({name: 'logo', title: 'Logo', type: 'imageWithAlt'}),
    defineField({name: 'website', title: 'Website', type: 'url', validation: (rule) => rule.uri({scheme: ['http', 'https']})}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'discipline', media: 'logo.image'},
  },
})

