import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'blogIndexPage',
  title: 'Blog Index',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Blog',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'Blog'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('headingStyle', 'Heading'),
    textStyleField('dekStyle', 'Deck'),
    textStyleField('cardTitleStyle', 'Card title'),
    textStyleField('cardExcerptStyle', 'Card excerpt'),
    textStyleField('cardMetaStyle', 'Card meta', 'Category, date, reading time.'),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Blog Index', subtitle: '/blog'}
    },
  },
})

