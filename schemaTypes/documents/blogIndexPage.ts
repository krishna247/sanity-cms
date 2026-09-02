import {DocumentTextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

export default defineType({
  name: 'blogIndexPage',
  title: 'Blog Index',
  type: 'document',
  icon: DocumentTextIcon,
  fieldsets: [
    {name: 'labels', title: 'Labels — fixed wording around the posts', options: {collapsible: true, collapsed: true}},
    textStylesFieldset,
  ],
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
    defineField({name: 'filterAllLabel', title: '“All” pill', type: 'string', fieldset: 'labels', placeholder: 'All', description: 'Text of the "All" filter pill.'}),
    defineField({name: 'cardCtaLabel', title: 'Card link text', type: 'string', fieldset: 'labels', placeholder: 'Read essay', description: 'Link text under every post card.'}),
    defineField({name: 'emptyLabel', title: 'Empty state', type: 'string', fieldset: 'labels', placeholder: 'No posts in this category yet.', description: 'Shown when a filter matches no posts.'}),
    defineField({name: 'bylinePrefix', title: 'Byline prefix', type: 'string', fieldset: 'labels', placeholder: 'By', description: 'The word before the author name on a post.'}),
    defineField({name: 'backLabel', title: 'Back link', type: 'string', fieldset: 'labels', placeholder: 'All essays', description: 'The back link at the foot of every post.'}),
    defineField({name: 'emptyBodyLabel', title: 'Empty body', type: 'string', fieldset: 'labels', placeholder: 'This essay is being prepared.', description: 'Shown in place of the body of a post that has no body yet.'}),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('headingStyle', 'Heading'),
    textStyleField('emptyLabelStyle', 'Empty state'),
    textStyleField('emptyBodyLabelStyle', 'Empty body'),
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

