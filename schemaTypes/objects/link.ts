import {LinkIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

const TARGET_FIELDS = ['reference', 'href', 'file', 'email', 'phone'] as const

function validateLink(value: Record<string, unknown> | undefined) {
  // An absent or empty link is valid — `cta`/`link` fields are usually optional,
  // and the Studio runs this custom validator even when the field is undefined.
  // Only start validating once the editor has actually begun filling it in.
  if (!value) return true
  const hasContent = Object.keys(value).some((key) => !key.startsWith('_') && value[key] != null)
  if (!hasContent) return true

  if (!value.kind) return 'Choose a link kind.'

  const kind = value.kind
  const hasReference = Boolean(value.reference)
  const hasAnchor = Boolean(value.anchorId)
  const hasHref = Boolean(value.href)
  const hasFile = Boolean(value.file)
  const hasEmail = Boolean(value.email)
  const hasPhone = Boolean(value.phone)

  const targetCount = TARGET_FIELDS.filter((field) => Boolean(value[field])).length
  if (targetCount !== 1) return 'Set exactly one target for this link.'

  if ((kind === 'internal' || kind === 'anchor') && !hasReference) return 'Choose an internal document.'
  if (kind === 'anchor' && !hasAnchor) return 'Anchor links need an anchor id.'
  if (kind === 'external' && !hasHref) return 'External links need a URL.'
  if (kind === 'file' && !hasFile) return 'File links need a file.'
  if (kind === 'email' && !hasEmail) return 'Email links need an email address.'
  if (kind === 'phone' && !hasPhone) return 'Phone links need a phone number.'

  return true
}

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      initialValue: 'internal',
      options: {
        layout: 'radio',
        list: [
          {title: 'Internal', value: 'internal'},
          {title: 'External', value: 'external'},
          {title: 'Anchor', value: 'anchor'},
          {title: 'File', value: 'file'},
          {title: 'Email', value: 'email'},
          {title: 'Phone', value: 'phone'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reference',
      title: 'Internal Document',
      type: 'reference',
      to: [
        {type: 'homePage'},
        {type: 'blogIndexPage'},
        {type: 'page'},
        {type: 'project'},
        {type: 'blogPost'},
      ],
      hidden: ({parent}) => !['internal', 'anchor'].includes(parent?.kind),
    }),
    defineField({
      name: 'anchorId',
      title: 'Anchor ID',
      type: 'string',
      description: 'Do not include #. Example: projects',
      hidden: ({parent}) => parent?.kind !== 'anchor',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          return /^[a-z0-9-]+$/.test(value) || 'Use lowercase letters, numbers, and hyphens only.'
        }),
    }),
    defineField({
      name: 'href',
      title: 'External URL',
      type: 'url',
      hidden: ({parent}) => parent?.kind !== 'external',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      hidden: ({parent}) => parent?.kind !== 'file',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      hidden: ({parent}) => parent?.kind !== 'email',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'emailSubject',
      title: 'Email Subject',
      type: 'string',
      description: 'Optional. Prefills the mailto ?subject=.',
      hidden: ({parent}) => parent?.kind !== 'email',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      hidden: ({parent}) => parent?.kind !== 'phone',
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'primary',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
          {title: 'Outline', value: 'outline'},
          {title: 'Text', value: 'text'},
        ],
      },
    }),
  ],
  validation: (rule) => rule.custom(validateLink),
  preview: {
    select: {
      title: 'label',
      kind: 'kind',
      anchorId: 'anchorId',
      external: 'href',
    },
    prepare({title, kind, anchorId, external}) {
      return {
        title: title || 'Link',
        subtitle: kind === 'anchor' ? `anchor: #${anchorId || ''}` : external || kind,
      }
    },
  },
})

