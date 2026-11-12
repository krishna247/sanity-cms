import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [textStylesFieldset],
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'route',
      group: 'settings',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Legacy Slug',
      type: 'slug',
      group: 'settings',
      deprecated: {reason: 'Use route.segment instead.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) => rule.max(500),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'imageWithAlt',
      group: 'content',
    }),
    // Card image — its own asset, never borrowed from featuredImage (image
    // integrity rule). Slots: /blog featured card 4:3, /blog grid cards 3:2,
    // page-builder blog feed 4:3. Hotspot drives the 3:2 trim.
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail (cards)',
      type: 'imageWithAlt',
      group: 'content',
      description:
        'Shown on blog cards (the Blog page and any blog feed). Upload a 4:3 image, 1200 × 900 px ' +
        '(minimum 800 × 600), JPG or WebP under 400 KB. Smaller cards trim it to 3:2, removing about ' +
        '1/9 of the height from the top and from the bottom, so keep text and faces inside the ' +
        'central 1200 × 800 band. Set the hotspot to move the trim. The Featured Image above stays ' +
        'the full-width banner on the post page.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
      group: 'content',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'content',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'person'}],
      group: 'content',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'settings',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
    // This document uses field groups, so the pickers are pinned to Content
    // (a field with no group would only surface under "All fields").
    defineField({...textStyleField('titleStyle', 'Title'), group: 'content'}),
    defineField({...textStyleField('excerptStyle', 'Excerpt'), group: 'content'}),
    defineField({
      ...textStyleField('metaStyle', 'Meta', 'Category, date, reading time, byline.'),
      group: 'content',
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'excerpt',
      media: 'featuredImage.image',
    },
  },
})

