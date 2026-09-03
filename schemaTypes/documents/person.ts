import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
    }),
    defineField({
      name: 'roles',
      title: 'Roles',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Author', value: 'author'},
          {title: 'Leadership', value: 'leadership'},
          {title: 'Founder', value: 'founder'},
        ],
      },
    }),
    defineField({name: 'jobTitle', title: 'Job Title', type: 'string'}),
    textStyleField('nameStyle', 'Name', 'Wins over the block-level Name style wherever this person is shown.'),
    textStyleField('jobTitleStyle', 'Role'),
    textStyleField('bioStyle', 'Bio'),
    defineField({name: 'bio', title: 'Bio', type: 'text', rows: 4}),
    defineField({
      name: 'profile',
      title: 'Profile (long-form bio)',
      type: 'portableText',
      description:
        'Rich, multi-paragraph profile used by the featured/chairman leadership layout (strong/em supported). The short Bio above is still used by the leadership grid.',
    }),
    defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
  ],
  preview: {
    select: {title: 'name', roles: 'roles', subtitle: 'jobTitle', media: 'image.image'},
    prepare({title, roles, subtitle, media}) {
      return {
        title,
        subtitle: subtitle || (Array.isArray(roles) ? roles.join(', ') : undefined),
        media,
      }
    },
  },
})

