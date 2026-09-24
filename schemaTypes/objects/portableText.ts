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
            // No "open in new tab" checkbox: the frontend applies one rule to
            // every CMS link — an off-site URL (YouTube, a press article, a
            // PDF on the asset CDN) opens in a new tab, anything on
            // sasinfra.com stays in the tab. See isOffSiteHref() in the
            // frontend's src/lib/routing.ts. (The former `blank` flag was
            // never set on any stored link.)
            fields: [
              {
                name: 'href',
                title: 'URL',
                type: 'url',
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
                // Weak on purpose: an in-body link is a courtesy, not a
                // dependency. As a strong reference it made 21 of the 31 blog
                // posts undeletable — every post another post linked to was
                // refused by the API ("Not able to delete Blogs", client QA
                // Sr 42). The frontend renders a link whose target is gone as
                // plain text. Links created before this flag carry no `_weak`
                // on the stored value — scripts/weaken-internal-links.mjs
                // backfills them.
                weak: true,
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
