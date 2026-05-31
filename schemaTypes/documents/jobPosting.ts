import {UsersIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'jobPosting',
  title: 'Job Posting',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'department', title: 'Department', type: 'string'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'open',
      options: {list: ['open', 'paused', 'closed']},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({name: 'body', title: 'Body', type: 'portableText'}),
    defineField({name: 'applyLink', title: 'Apply Link', type: 'link'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'status'},
  },
})

