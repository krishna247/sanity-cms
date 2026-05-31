import {
  BlockContentIcon,
  ComposeIcon,
  DocumentTextIcon,
  ImageIcon,
  PinIcon,
  PlayIcon,
  StarIcon,
  ThListIcon,
  TiersIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

const iconTokenOptions = [
  {title: 'Building', value: 'building'},
  {title: 'Bank', value: 'bank'},
  {title: 'EV Charging', value: 'ev'},
  {title: 'Pool', value: 'pool'},
  {title: 'Theatre', value: 'theatre'},
  {title: 'Spa', value: 'spa'},
  {title: 'Yoga', value: 'yoga'},
  {title: 'Cricket', value: 'cricket'},
  {title: 'Retail', value: 'retail'},
  {title: 'Parking', value: 'parking'},
  {title: 'Security', value: 'security'},
  {title: 'Fallback', value: 'fallback'},
]

const richTextMember = defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}]})

const headField = defineField({
  name: 'head',
  title: 'Section Head',
  type: 'object',
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
  ],
})

const ctaField = defineField({
  name: 'cta',
  title: 'CTA',
  type: 'link',
})

const ctasField = defineField({
  name: 'ctas',
  title: 'CTAs',
  type: 'array',
  of: [defineArrayMember({type: 'link'})],
})

const mediaField = defineField({
  name: 'media',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      initialValue: 'image',
      options: {
        layout: 'radio',
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'imageWithAlt',
      hidden: ({parent}) => parent?.kind !== 'image',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      options: {accept: 'video/*'},
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
    defineField({
      name: 'poster',
      title: 'Poster',
      type: 'imageWithAlt',
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
  ],
})

export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'editorial',
      options: {list: ['editorial', 'minimal']},
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
    mediaField,
    ctasField,
  ],
  preview: {select: {title: 'title', subtitle: 'eyebrow', media: 'media.image.image'}},
})

export const proseBlock = defineType({
  name: 'proseBlock',
  title: 'Prose',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    headField,
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'head.eyebrow'}},
})

export const statsStripBlock = defineType({
  name: 'statsStripBlock',
  title: 'Stats Strip',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({name: 'countUp', title: 'Animate numbers', type: 'boolean', initialValue: false}),
    defineField({
      name: 'items',
      title: 'Stats',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'suffix', title: 'Suffix', type: 'string'}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const timelineBlock = defineType({
  name: 'timelineBlock',
  title: 'Timeline',
  type: 'object',
  icon: ThListIcon,
  fields: [
    headField,
    defineField({
      name: 'milestones',
      title: 'Milestones',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'year', title: 'Year', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title', subtitle: 'year'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const peopleBlock = defineType({
  name: 'peopleBlock',
  title: 'People',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    headField,
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'grid',
      options: {list: ['grid', 'featured']},
    }),
    defineField({
      name: 'people',
      title: 'People',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'person'}]})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'variant'}},
})

export const logoWallBlock = defineType({
  name: 'logoWallBlock',
  title: 'Logo Wall',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({
      name: 'partners',
      title: 'Partners',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'partner'}]})],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const galleryBlock = defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  icon: ImageIcon,
  fields: [
    headField,
    ctaField,
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'grid',
      options: {list: ['grid', 'carousel']},
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
            defineField({
              name: 'size',
              title: 'Tile Size',
              type: 'string',
              initialValue: 'default',
              options: {list: ['default', 'tall']},
            }),
          ],
          preview: {select: {title: 'image.alt', media: 'image.image', subtitle: 'size'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'variant'}},
})

export const specsRefBlock = defineType({
  name: 'specsRefBlock',
  title: 'Project Specs',
  type: 'object',
  icon: ThListIcon,
  fields: [headField, ctaField],
  preview: {select: {title: 'head.heading'}},
})

export const amenitiesRefBlock = defineType({
  name: 'amenitiesRefBlock',
  title: 'Project Amenities',
  type: 'object',
  icon: StarIcon,
  fields: [headField, ctaField],
  preview: {select: {title: 'head.heading'}},
})

export const quoteBlock = defineType({
  name: 'quoteBlock',
  title: 'Quote',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'person', title: 'Person', type: 'reference', to: [{type: 'person'}]}),
    defineField({name: 'nameOverride', title: 'Name Override', type: 'string'}),
    defineField({name: 'roleOverride', title: 'Role Override', type: 'string'}),
  ],
  preview: {select: {title: 'quote', subtitle: 'person.name'}},
})

export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'CTA',
  type: 'object',
  icon: PlayIcon,
  fields: [headField, defineField({name: 'actions', title: 'Actions', type: 'array', of: [defineArrayMember({type: 'link'})]})],
  preview: {select: {title: 'head.heading', subtitle: 'head.eyebrow'}},
})

export const featureGridBlock = defineType({
  name: 'featureGridBlock',
  title: 'Feature Grid',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: iconTokenOptions}}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title', subtitle: 'icon'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const cardGridBlock = defineType({
  name: 'cardGridBlock',
  title: 'Card Grid',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
            defineField({name: 'link', title: 'Link', type: 'link'}),
          ],
          preview: {select: {title: 'title', media: 'image.image'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const feedBlock = defineType({
  name: 'feedBlock',
  title: 'Feed',
  type: 'object',
  icon: ThListIcon,
  fields: [
    headField,
    ctaField,
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      initialValue: 'projects',
      options: {
        list: [
          {title: 'Projects', value: 'projects'},
          {title: 'Updates', value: 'updates'},
          {title: 'Press', value: 'press'},
          {title: 'Jobs', value: 'jobs'},
          {title: 'Blog', value: 'blog'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'limit', title: 'Limit', type: 'number', initialValue: 3}),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'source'}},
})

export const contactFormBlock = defineType({
  name: 'contactFormBlock',
  title: 'Contact Form',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    headField,
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'sales',
      options: {list: ['sales', 'leasing', 'careers', 'general']},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'formTarget', title: 'Form Target', type: 'string'}),
    defineField({
      name: 'leadOptions',
      title: 'Lead Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'variant'}},
})

export const mapBlock = defineType({
  name: 'mapBlock',
  title: 'Map',
  type: 'object',
  icon: PinIcon,
  fields: [
    headField,
    defineField({name: 'location', title: 'Location', type: 'location'}),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const projectHeroBlock = defineType({
  name: 'projectHeroBlock',
  title: 'Project Hero',
  type: 'object',
  icon: StarIcon,
  fields: [
    mediaField,
    defineField({name: 'logo', title: 'Project Wordmark', type: 'imageWithAlt'}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    ctasField,
    defineField({
      name: 'stats',
      title: 'Hero Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'eyebrow', media: 'logo.image'}},
})

export const floorPlansBlock = defineType({
  name: 'floorPlansBlock',
  title: 'Floor Plans',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      initialValue: 'list',
      options: {layout: 'radio', list: [{title: 'List', value: 'list'}]},
      validation: (rule) => rule.required(),
    }),
    headField,
    ctaField,
    defineField({
      name: 'plans',
      title: 'Plans',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'seq', title: 'Sequence', type: 'number'}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'size', title: 'Size', type: 'string'}),
            defineField({name: 'planImage', title: 'Plan Image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'size', media: 'planImage.image'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const signatureFeatureBlock = defineType({
  name: 'signatureFeatureBlock',
  title: 'Signature Feature',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      initialValue: 'inline',
      options: {layout: 'radio', list: ['inline', 'cinema']},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'image', title: 'Image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'body', title: 'Body', type: 'text', rows: 4}),
    defineField({name: 'items', title: 'Items', type: 'array', of: [defineArrayMember({type: 'string'})]}),
  ],
  preview: {select: {title: 'heading', subtitle: 'variant', media: 'image.image'}},
})

export const amenityZonesBlock = defineType({
  name: 'amenityZonesBlock',
  title: 'Amenity Zones',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({
      name: 'anchor',
      title: 'Anchor Story',
      type: 'object',
      fields: [
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 4}),
      ],
    }),
    defineField({
      name: 'zones',
      title: 'Zones',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'seq', title: 'Sequence', type: 'number'}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'items', title: 'Items', type: 'array', of: [defineArrayMember({type: 'string'})]}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const locationMapBlock = defineType({
  name: 'locationMapBlock',
  title: 'Location Map',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'overture',
      title: 'Overture',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
      ],
    }),
    defineField({
      name: 'mapConfig',
      title: 'Map Config',
      type: 'object',
      fields: [
        defineField({name: 'mapProject', title: 'Map Project Key', type: 'string', validation: (rule) => rule.required()}),
        defineField({
          name: 'frameStyle',
          title: 'Frame Style',
          type: 'string',
          initialValue: 'disc',
          options: {list: ['disc', 'editorial']},
        }),
      ],
    }),
    defineField({
      name: 'locationCard',
      title: 'Location Card',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
      ],
    }),
    defineField({name: 'footnote', title: 'Footnote', type: 'string'}),
  ],
  preview: {select: {title: 'overture.heading', subtitle: 'mapConfig.mapProject'}},
})

export const homePageBuilder = defineType({
  name: 'homePageBuilder',
  title: 'Home Page Builder',
  type: 'array',
  of: [
    defineArrayMember({type: 'heroBlock'}),
    defineArrayMember({type: 'featureGridBlock'}),
    defineArrayMember({type: 'statsStripBlock'}),
    defineArrayMember({type: 'feedBlock'}),
    defineArrayMember({type: 'ctaBlock'}),
    defineArrayMember({type: 'contactFormBlock'}),
    defineArrayMember({type: 'mapBlock'}),
  ],
})

export const pagePageBuilder = defineType({
  name: 'pagePageBuilder',
  title: 'Page Builder',
  type: 'array',
  of: [
    defineArrayMember({type: 'heroBlock'}),
    defineArrayMember({type: 'proseBlock'}),
    defineArrayMember({type: 'featureGridBlock'}),
    defineArrayMember({type: 'statsStripBlock'}),
    defineArrayMember({type: 'timelineBlock'}),
    defineArrayMember({type: 'peopleBlock'}),
    defineArrayMember({type: 'logoWallBlock'}),
    defineArrayMember({type: 'galleryBlock'}),
    defineArrayMember({type: 'quoteBlock'}),
    defineArrayMember({type: 'ctaBlock'}),
    defineArrayMember({type: 'contactFormBlock'}),
    defineArrayMember({type: 'mapBlock'}),
    defineArrayMember({type: 'cardGridBlock'}),
    defineArrayMember({type: 'feedBlock'}),
  ],
})

export const projectPageBuilder = defineType({
  name: 'projectPageBuilder',
  title: 'Project Page Builder',
  type: 'array',
  of: [
    defineArrayMember({type: 'projectHeroBlock'}),
    defineArrayMember({type: 'proseBlock'}),
    defineArrayMember({type: 'statsStripBlock'}),
    defineArrayMember({type: 'galleryBlock'}),
    defineArrayMember({type: 'specsRefBlock'}),
    defineArrayMember({type: 'amenitiesRefBlock'}),
    defineArrayMember({type: 'floorPlansBlock'}),
    defineArrayMember({type: 'signatureFeatureBlock'}),
    defineArrayMember({type: 'amenityZonesBlock'}),
    defineArrayMember({type: 'locationMapBlock'}),
    defineArrayMember({type: 'quoteBlock'}),
    defineArrayMember({type: 'ctaBlock'}),
    defineArrayMember({type: 'contactFormBlock'}),
    defineArrayMember({type: 'feedBlock'}),
  ],
})

export const blockTypes = [
  heroBlock,
  proseBlock,
  statsStripBlock,
  timelineBlock,
  peopleBlock,
  logoWallBlock,
  galleryBlock,
  specsRefBlock,
  amenitiesRefBlock,
  quoteBlock,
  ctaBlock,
  featureGridBlock,
  cardGridBlock,
  feedBlock,
  contactFormBlock,
  mapBlock,
  projectHeroBlock,
  floorPlansBlock,
  signatureFeatureBlock,
  amenityZonesBlock,
  locationMapBlock,
  homePageBuilder,
  pagePageBuilder,
  projectPageBuilder,
]

export {iconTokenOptions}

