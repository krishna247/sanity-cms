import {defineType, defineArrayMember} from 'sanity'

export default defineType({
  name: 'portableText',
  title: 'Portable Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'Blockquote', value: 'blockquote'},
        // Text-style picks for a single paragraph (see objects/textStyle.ts):
        // the frontend renders these as <p class="ts-role-…"> in the site's
        // Lede / Caption / Eyebrow styles.
        {title: 'Lede', value: 'lede'},
        {title: 'Caption', value: 'caption'},
        {title: 'Eyebrow', value: 'eyebrow'},
      ],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike-through', value: 'strike-through'},
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
              },
              {
                name: 'blank',
                title: 'Open in new tab',
                type: 'boolean',
                initialValue: false,
              },
            ],
          },
          {
            name: 'internalLink',
            title: 'Internal Link',
            type: 'object',
            fields: [
              {
                name: 'reference',
                title: 'Reference',
                type: 'reference',
                to: [{type: 'blogPost'}, {type: 'project'}, {type: 'page'}],
              },
            ],
          },
        ],
      },
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Number', value: 'number'},
      ],
    }),
    defineArrayMember({
      type: 'imageWithAlt',
    }),
  ],
})
