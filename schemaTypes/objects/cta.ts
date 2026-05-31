import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'cta',
  title: 'Legacy Call to Action',
  type: 'object',
  deprecated: {
    reason: 'Use the discriminated link object instead.',
  },
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
    defineField({
      name: 'reference',
      title: 'Reference',
      type: 'reference',
      to: [{type: 'project'}, {type: 'page'}],
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
          {title: 'Outline', value: 'outline'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'variant',
    },
  },
})
