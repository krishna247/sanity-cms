import {defineType, defineField, defineArrayMember} from 'sanity'

const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'excerpt', type: 'text', rows: 3}),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                fields: [
                  {name: 'href', type: 'url'},
                  {name: 'blank', type: 'boolean', title: 'Open in new tab'},
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string', title: 'Alt text'}),
            defineField({name: 'caption', type: 'string', title: 'Caption'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featuredImage',
      type: 'image',
      title: 'Featured Image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt text'})],
    }),
    defineField({name: 'category', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'updatedAt', type: 'datetime'}),
    defineField({name: 'seo', type: 'seo'}),
    defineField({name: 'wpSlug', type: 'string', title: 'WordPress Slug', readOnly: true}),
  ],
  orderings: [{title: 'Published Date, New', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'excerpt', media: 'featuredImage'}},
})

const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string', title: 'Alt text'}),
            defineField({name: 'caption', type: 'string', title: 'Caption'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featuredImage',
      type: 'image',
      title: 'Featured Image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt text'})],
    }),
    defineField({
      name: 'pageType',
      type: 'string',
      title: 'Page Type',
      options: {
        list: [
          {title: 'About', value: 'about'},
          {title: 'Contact', value: 'contact'},
          {title: 'Project', value: 'project'},
          {title: 'Policy', value: 'policy'},
          {title: 'Careers', value: 'careers'},
          {title: 'Media', value: 'media'},
          {title: 'Project Updates', value: 'projectUpdates'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'seo', type: 'seo'}),
    defineField({name: 'wpSlug', type: 'string', title: 'WordPress Slug', readOnly: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageType'}},
})

const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'bio', type: 'text'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'description', type: 'text'}),
  ],
  preview: {select: {title: 'title'}},
})

const seo = defineType({
  name: 'seo',
  title: 'SEO Metadata',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string', title: 'SEO Title'}),
    defineField({name: 'description', type: 'text', title: 'SEO Description', rows: 3}),
    defineField({name: 'image', type: 'image', title: 'SEO Image', options: {hotspot: true}}),
    defineField({name: 'noIndex', type: 'boolean', title: 'No Index', initialValue: false}),
  ],
})

export const oldSchemaTypes = [post, page, author, category, seo]
