import {ThListIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'
import {validateProjectUpdateAnchor} from '../utils/routing'

export default defineType({
  name: 'projectUpdate',
  title: 'Project Update',
  type: 'document',
  icon: ThListIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{type: 'project'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      title: 'Anchor',
      type: 'route',
      description: 'This is an anchor on /projects/updates, not a standalone page.',
      validation: (rule) => rule.custom(validateProjectUpdateAnchor),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Construction', value: 'construction'},
          {title: 'Milestone', value: 'milestone'},
          {title: 'Media', value: 'media'},
          {title: 'RERA', value: 'rera'},
        ],
      },
    }),
    defineField({name: 'headline', title: 'Headline', type: 'string', validation: (rule) => rule.required()}),
    textStyleField('headlineStyle', 'Headline', 'Wins over the feed default wherever this update is shown.'),
    textStyleField('metaStyle', 'Meta', 'Category · date.'),
    defineField({
      name: 'cardLink',
      title: 'Card link',
      type: 'link',
      description:
        'Where the update card links to on the home page — a blog post, the media page, any internal document, or an external URL. Leave empty to link to the update’s project page.',
    }),
    defineField({name: 'body', title: 'Body', type: 'portableText'}),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'object',
      fields: [
        defineField({
          name: 'kind',
          title: 'Kind',
          type: 'string',
          initialValue: 'image',
          options: {list: ['image', 'youtube']},
        }),
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt', hidden: ({parent}) => parent?.kind !== 'image'}),
        defineField({name: 'youtubeUrl', title: 'YouTube URL', type: 'url', hidden: ({parent}) => parent?.kind !== 'youtube'}),
      ],
    }),
    defineField({name: 'pdf', title: 'PDF', type: 'file', options: {accept: 'application/pdf'}}),
  ],
  orderings: [{title: 'Newest', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'headline', subtitle: 'date', media: 'media.image.image'},
  },
})

