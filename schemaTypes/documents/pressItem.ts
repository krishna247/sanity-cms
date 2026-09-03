import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'pressItem',
  title: 'Press Item',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    textStyleField('titleStyle', 'Title', 'Wins over the media wall default for this item.'),
    textStyleField('metaStyle', 'Meta', 'Outlet · date · duration.'),
    // press = a clipping/feature; video = a SAS Infra film (YouTube). Drives the
    // /media wall card (play badge + duration chip) and the derived thumbnail.
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {list: ['press', 'video'], layout: 'radio'},
      initialValue: 'press',
      validation: (rule) => rule.required(),
    }),
    // Filter group for the /media wall (never shown on the card).
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: ['Films', 'Recognition', 'Milestones', 'Press']},
      initialValue: 'Press',
    }),
    defineField({name: 'publication', title: 'Publication', type: 'string'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'date'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    // Card thumbnail. Required for press; videos may leave it empty to derive the
    // YouTube still (i.ytimg.com/vi/<id>/maxresdefault.jpg) from `youtubeUrl`.
    defineField({
      name: 'image',
      title: 'Image',
      type: 'imageWithAlt',
      validation: (rule) =>
        rule.custom((value, context) => {
          const kind = (context.document as {kind?: string} | undefined)?.kind
          if (kind === 'video') return true
          return value ? true : 'Thumbnail is required for press items'
        }),
    }),
    // Video-only. When kind === 'video' the card links here (opens in a new tab)
    // and, absent a poster `image`, the thumbnail is the derived YouTube still.
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      description: 'Video items only — e.g. https://youtu.be/UibIqbVFNuE',
      hidden: ({document}) => document?.kind !== 'video',
      validation: (rule) =>
        rule.custom((value, context) => {
          const kind = (context.document as {kind?: string} | undefined)?.kind
          if (kind === 'video' && !value) return 'YouTube URL is required for video items'
          return true
        }),
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Video items only — e.g. 2:41 (shown as the corner chip).',
      hidden: ({document}) => document?.kind !== 'video',
    }),
    // Press link (article URL). Videos ignore this and use `youtubeUrl`.
    defineField({name: 'link', title: 'Link', type: 'link'}),
  ],
  orderings: [{title: 'Newest', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'publication', kind: 'kind', media: 'image.image'},
    prepare: ({title, subtitle, kind, media}) => ({
      title,
      subtitle: [kind === 'video' ? '▶ Film' : subtitle].filter(Boolean).join(' · '),
      media,
    }),
  },
})
