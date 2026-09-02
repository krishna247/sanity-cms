import {
  BlockContentIcon,
  ComposeIcon,
  DocumentTextIcon,
  ImageIcon,
  PinIcon,
  PlayIcon,
  StarIcon,
  TagIcon,
  ThListIcon,
  TiersIcon,
} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {textStyleField, textStylesFieldset} from './textStyle'

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
  {title: 'Cafe', value: 'cafe'},
  {title: 'Promenade', value: 'promenade'},
  {title: 'Kids', value: 'kids'},
  {title: 'Medical', value: 'medical'},
  {title: 'Fallback', value: 'fallback'},
]

const richTextMember = defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}]})

const headField = defineField({
  name: 'head',
  title: 'Section Head',
  type: 'object',
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('headingStyle', 'Heading'),
    textStyleField('dekStyle', 'Deck'),
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
  fieldsets: [textStylesFieldset],
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
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('titleStyle', 'Title'),
    textStyleField('dekStyle', 'Deck'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({
              name: 'prefix',
              title: 'Prefix',
              type: 'string',
              description: 'Static text before the number, e.g. "G+" (the number itself stays numeric so it can count up).',
            }),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'suffix', title: 'Suffix', type: 'string'}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            textStyleField('valueStyle', 'Value', 'Prefix and suffix follow it.'),
            textStyleField('labelStyle', 'Label'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'year', title: 'Year', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            textStyleField('yearStyle', 'Year'),
            textStyleField('titleStyle', 'Title'),
            textStyleField('bodyStyle', 'Body'),
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
  fieldsets: [textStylesFieldset],
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
    textStyleField('nameStyle', 'Name'),
    textStyleField('jobTitleStyle', 'Job title'),
    textStyleField('bioStyle', 'Bio'),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'variant'}},
})

export const logoWallBlock = defineType({
  name: 'logoWallBlock',
  title: 'Logo Wall',
  type: 'object',
  icon: TiersIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({
      name: 'partners',
      title: 'Partners',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'partner'}]})],
      validation: (rule) => rule.min(1),
    }),
    textStyleField('nameStyle', 'Partner name', 'Shown only when a partner has no logo.'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'image', title: 'Image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
            defineField({
              name: 'size',
              title: 'Tile Size',
              type: 'string',
              initialValue: 'default',
              options: {list: ['default', 'tall']},
            }),
            textStyleField('captionStyle', 'Caption'),
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
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({name: 'quote', title: 'Quote', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'person', title: 'Person', type: 'reference', to: [{type: 'person'}]}),
    defineField({name: 'nameOverride', title: 'Name Override', type: 'string'}),
    defineField({name: 'roleOverride', title: 'Role Override', type: 'string'}),
    textStyleField('quoteStyle', 'Quote'),
    textStyleField('nameStyle', 'Name'),
    textStyleField('jobTitleStyle', 'Role'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: iconTokenOptions}}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
            textStyleField('titleStyle', 'Title'),
            textStyleField('textStyle', 'Text'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
            defineField({name: 'link', title: 'Link', type: 'link'}),
            textStyleField('titleStyle', 'Title'),
            textStyleField('bodyStyle', 'Body'),
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
  fieldsets: [textStylesFieldset],
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
    // List feeds (Updates / Press) render title + meta + excerpt per item.
    defineField({
      ...textStyleField('itemTitleStyle', 'Item title', 'Updates and Press feeds.'),
      hidden: ({parent}) => !['updates', 'press'].includes(parent?.source),
    }),
    defineField({
      ...textStyleField('itemMetaStyle', 'Item meta', 'Updates and Press feeds.'),
      hidden: ({parent}) => !['updates', 'press'].includes(parent?.source),
    }),
    defineField({
      ...textStyleField('itemExcerptStyle', 'Item excerpt', 'Updates and Press feeds.'),
      hidden: ({parent}) => !['updates', 'press'].includes(parent?.source),
    }),
    // The Projects feed renders catalogue cards.
    defineField({
      ...textStyleField('cardNameStyle', 'Card name', 'Projects feed.'),
      hidden: ({parent}) => parent?.source !== 'projects',
    }),
    defineField({
      ...textStyleField('cardStatusStyle', 'Card status', 'Projects feed.'),
      hidden: ({parent}) => parent?.source !== 'projects',
    }),
    defineField({
      ...textStyleField('cardTitleStyle', 'Card title', 'Projects feed.'),
      hidden: ({parent}) => parent?.source !== 'projects',
    }),
    defineField({
      ...textStyleField('cardStatLabelStyle', 'Card stat label', 'Projects feed.'),
      hidden: ({parent}) => parent?.source !== 'projects',
    }),
    defineField({
      ...textStyleField('cardStatValueStyle', 'Card stat value', 'Projects feed.'),
      hidden: ({parent}) => parent?.source !== 'projects',
    }),
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
      name: 'formCopy',
      title: 'Form Field Copy',
      description:
        'Optional overrides for the field labels, placeholders and submit button. ' +
        'Leave any field empty to use the built-in default.',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'nameLabel', title: 'Name — Label', type: 'string'}),
        defineField({name: 'namePlaceholder', title: 'Name — Placeholder', type: 'string'}),
        defineField({name: 'emailLabel', title: 'Email — Label', type: 'string'}),
        defineField({name: 'emailPlaceholder', title: 'Email — Placeholder', type: 'string'}),
        defineField({name: 'phoneLabel', title: 'Phone — Label', type: 'string'}),
        defineField({name: 'phonePlaceholder', title: 'Phone — Placeholder', type: 'string'}),
        defineField({name: 'interestLabel', title: 'Interest — Label', type: 'string'}),
        defineField({name: 'interestPlaceholder', title: 'Interest — Default Option', type: 'string'}),
        defineField({name: 'messageLabel', title: 'Message — Label', type: 'string'}),
        defineField({name: 'messagePlaceholder', title: 'Message — Placeholder', type: 'string'}),
        defineField({name: 'submitLabel', title: 'Submit Button', type: 'string'}),
      ],
    }),
    defineField({
      name: 'asideCopy',
      title: 'Aside Card Titles',
      description:
        'Headings for the contact-page aside cards (the "Visit us" address card and the ' +
        '"Follow the journey" social card). Leave any field empty to use the built-in default.',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'visitTitle', title: 'Visit-us Card — Title', type: 'string'}),
        defineField({name: 'followTitle', title: 'Follow Card — Title', type: 'string'}),
        textStyleField('visitTitleStyle', 'Visit-us card title'),
        textStyleField('followTitleStyle', 'Follow card title'),
      ],
    }),
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
    defineField({name: 'footnote', title: 'Footnote', type: 'string'}),
    defineField({
      name: 'markerCategories',
      title: 'Marker Categories',
      description:
        'Palette for the home locality map. Each category sets a marker colour + glyph ' +
        'icon token. Leave empty to use the built-in defaults (healthcare, education, ' +
        'corporate, hospitality, retail, leisure, heritage, convention, transit).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'markerCategory',
          fields: [
            defineField({name: 'key', title: 'Key', type: 'string', description: 'Lowercase id referenced by each POI, e.g. "healthcare".', validation: (rule) => rule.required()}),
            defineField({name: 'label', title: 'Label', type: 'string', description: 'Shown in the hover tip, e.g. "Healthcare".'}),
            defineField({name: 'color', title: 'Colour', type: 'string', description: 'Hex, e.g. #C0524F.'}),
            defineField({
              name: 'icon',
              title: 'Icon token',
              type: 'string',
              description: 'Glyph token: cross, cap, building, dining, bag, flag, dome, star, train, dot.',
              options: {list: ['cross', 'cap', 'building', 'dining', 'bag', 'flag', 'dome', 'star', 'train', 'dot']},
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'key'}},
        }),
      ],
    }),
    defineField({
      name: 'pointsOfInterest',
      title: 'Points of Interest',
      description:
        'Curated landmarks for the home locality map, rendered as category-coloured ' +
        'markers. `category` must match a Marker Category key. Coordinates are geocoded ' +
        'via Google Places. Use the projects + corporate office for SAS pins ' +
        '(category "project" / "office").',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'localityPoi',
          icon: PinIcon,
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'category', title: 'Category key', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'location', title: 'Location', type: 'geopoint', validation: (rule) => rule.required()}),
            defineField({name: 'driveMinutes', title: 'Drive time (min)', type: 'number', description: 'Optional. Shown in the hover tip; falls back to straight-line distance.', validation: (rule) => rule.min(0).integer()}),
            defineField({
              name: 'labelSide',
              title: 'Label side',
              type: 'string',
              description: 'Which side the name label sits. Auto keeps it inside the frame.',
              initialValue: 'auto',
              options: {layout: 'radio', list: ['auto', 'left', 'right']},
            }),
            defineField({name: 'labelNudge', title: 'Label vertical nudge (px)', type: 'number', description: 'Optional. Nudge the label up (negative) / down (positive) to de-clutter clusters.'}),
          ],
          preview: {
            select: {title: 'name', category: 'category', mins: 'driveMinutes'},
            prepare({title, category, mins}) {
              const bits = [category, mins != null ? `${mins} min` : null].filter(Boolean)
              return {title, subtitle: bits.join(' · ')}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'hiddenLocalities',
      title: 'Hidden locality labels',
      description: 'Basemap neighbourhood labels to hide (cuts noise). Leave empty for the built-in default set.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const projectHeroBlock = defineType({
  name: 'projectHeroBlock',
  title: 'Project Hero',
  type: 'object',
  icon: StarIcon,
  fieldsets: [textStylesFieldset],
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
            textStyleField('labelStyle', 'Label'),
            textStyleField('valueStyle', 'Value'),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('titleStyle', 'Title'),
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
      name: 'metrics',
      title: 'Metrics Strip',
      description: 'The four key/value tiles above the floor-plate tabs (e.g. Typical Plate · 1,20,000 sq ft).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
            textStyleField('labelStyle', 'Label'),
            textStyleField('valueStyle', 'Value'),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({
      name: 'plans',
      title: 'Plans',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'seq', title: 'Sequence', type: 'number'}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'size', title: 'Size', type: 'string'}),
            defineField({
              name: 'planImage',
              title: 'Plan Image',
              type: 'imageWithAlt',
              description: 'Leave empty to render the placeholder card instead (e.g. plates not yet released).',
            }),
            defineField({
              name: 'placeholder',
              title: 'Placeholder Card',
              description: 'Rendered only when Plan Image is empty.',
              type: 'object',
              fieldsets: [textStylesFieldset],
              fields: [
                defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
                defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
                defineField({name: 'ctaLabel', title: 'CTA Label', type: 'string'}),
                defineField({name: 'ctaPrefill', title: 'CTA Prefill', type: 'string'}),
                textStyleField('eyebrowStyle', 'Eyebrow'),
                textStyleField('bodyStyle', 'Body'),
              ],
            }),
            textStyleField('labelStyle', 'Label'),
            textStyleField('sizeStyle', 'Size'),
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
  fieldsets: [textStylesFieldset],
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
    textStyleField('eyebrowStyle', 'Eyebrow'),
    textStyleField('headingStyle', 'Heading'),
    textStyleField('bodyStyle', 'Body'),
    textStyleField('itemsStyle', 'List items', 'One style for every item.'),
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
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 4}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Body'),
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
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'seq', title: 'Sequence', type: 'number'}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'items', title: 'Items', type: 'array', of: [defineArrayMember({type: 'string'})]}),
            textStyleField('titleStyle', 'Title'),
            textStyleField('itemsStyle', 'Items', 'One style for the whole list.'),
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
  fieldsets: [textStylesFieldset],
  fields: [
    defineField({
      name: 'overture',
      title: 'Overture',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('dekStyle', 'Deck'),
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
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('dekStyle', 'Deck'),
      ],
    }),
    defineField({name: 'footnote', title: 'Footnote', type: 'string'}),
    defineField({
      name: 'editorialCard',
      title: 'Editorial Card Heading',
      description: 'The overlay headline on the map (allows inline <em> html), e.g. "Anchored in Hyderabad\'s CBD spine."',
      type: 'string',
    }),
    defineField({name: 'address', title: 'Street Address', type: 'text', rows: 2}),
    defineField({
      name: 'travelTimes',
      title: 'Travel Times',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'distance', title: 'Distance', type: 'string'}),
            defineField({name: 'time', title: 'Time', type: 'string'}),
            defineField({name: 'destination', title: 'Destination', type: 'string'}),
          ],
          preview: {select: {title: 'destination', subtitle: 'time'}},
        }),
      ],
    }),
    defineField({
      name: 'connectivity',
      title: 'Connectivity Highlights',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'pointsOfInterest',
      title: 'Points of Interest',
      description:
        'Curated nearby landmarks, rendered as the location-map leader ring + legend ' +
        '(sorted by drive time). Coordinates are geocoded via Google Places; drive ' +
        'times are Google Routes API traffic-aware medians from this project.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'poi',
          icon: PinIcon,
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'category',
              title: 'Category',
              type: 'string',
              description: 'Short label, e.g. Metro Station, Airport, Hospital, Hotel, Retail.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'driveMinutes',
              title: 'Drive time (min)',
              type: 'number',
              validation: (rule) => rule.min(0).integer(),
            }),
            defineField({name: 'location', title: 'Location', type: 'geopoint', validation: (rule) => rule.required()}),
          ],
          preview: {
            select: {title: 'name', category: 'category', mins: 'driveMinutes'},
            prepare({title, category, mins}) {
              const bits = [category, mins != null ? `${mins} min` : null].filter(Boolean)
              return {title, subtitle: bits.join(' · ')}
            },
          },
        }),
      ],
    }),
    textStyleField('editorialCardStyle', 'Editorial card heading'),
    textStyleField('footnoteStyle', 'Footnote'),
  ],
  preview: {select: {title: 'overture.heading', subtitle: 'mapConfig.mapProject'}},
})

// ─── iTower bespoke set-pieces ───────────────────────────────────────────
// Each models the VISIBLE content of one iTower section so it becomes
// CMS-editable while the component keeps the exact bespoke DOM. Images use the
// `image` / `anchor.image` / `cards[].image` field names already resolved by the
// content.ts PAGE_BUILDER projection — so no projection change is needed.

export const masterPlanBlock = defineType({
  name: 'masterPlanBlock',
  title: 'Master Plan',
  type: 'object',
  icon: PinIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({name: 'image', title: 'Plan Image', type: 'imageWithAlt'}),
    defineField({
      name: 'areaTables',
      title: 'Area statement tables',
      description: 'Rendered as real site-styled tables below the plan (replaces the tables baked into the old brochure image).',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Table title', type: 'string'}),
            defineField({
              name: 'columns',
              title: 'Column headings',
              type: 'array',
              of: [{type: 'string'}],
            }),
            defineField({
              name: 'rows',
              title: 'Rows',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'cells',
                      title: 'Cells (one per column)',
                      type: 'array',
                      of: [{type: 'string'}],
                    }),
                    defineField({
                      name: 'emphasis',
                      title: 'Emphasis row (e.g. Total)',
                      type: 'boolean',
                      initialValue: false,
                    }),
                  ],
                  preview: {select: {title: 'cells.0'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
    defineField({
      name: 'cinema',
      title: 'Cinema Caption',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Body'),
      ],
    }),
    defineField({
      name: 'annotations',
      title: 'Site-plan Annotations',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'building', title: 'Building', type: 'string'}),
            defineField({name: 'detail', title: 'Detail', type: 'string'}),
            textStyleField('buildingStyle', 'Building'),
            textStyleField('detailStyle', 'Detail (first segment)'),
            textStyleField('detailSubStyle', 'Detail (remaining segments)'),
          ],
          preview: {select: {title: 'building', subtitle: 'detail'}},
        }),
      ],
    }),
    textStyleField('tableTitleStyle', 'Table title', 'Area statement tables.'),
    textStyleField('tableHeadStyle', 'Table column headings', 'Area statement tables.'),
    textStyleField('tableCellStyle', 'Table cells', 'Area statement tables.'),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const towerAnatomyBlock = defineType({
  name: 'towerAnatomyBlock',
  title: 'Tower Anatomy',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({name: 'image', title: 'Elevation Image', type: 'imageWithAlt'}),
    defineField({
      name: 'bands',
      title: 'Program Bands',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'band', title: 'Band Key', type: 'string'}),
            defineField({name: 'range', title: 'Floor Range', type: 'string'}),
            defineField({name: 'cat', title: 'Category', type: 'string'}),
            defineField({name: 'heading', title: 'Heading', type: 'string'}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            defineField({
              name: 'image',
              title: 'Band Image',
              type: 'imageWithAlt',
              description: 'Shown in the elevation frame when this band is the active selection.',
            }),
            textStyleField('rangeStyle', 'Floor range'),
            textStyleField('catStyle', 'Category'),
            textStyleField('headingStyle', 'Heading'),
            textStyleField('bodyStyle', 'Body'),
          ],
          preview: {select: {title: 'heading', subtitle: 'range', media: 'image.image'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const plateAnatomyBlock = defineType({
  name: 'plateAnatomyBlock',
  title: 'Plate Anatomy',
  type: 'object',
  icon: ImageIcon,
  fields: [
    headField,
    defineField({name: 'image', title: 'Plate Image', type: 'imageWithAlt'}),
    defineField({
      name: 'pins',
      title: 'Annotation Pins',
      description: 'Text only — the pin coordinates stay in the component.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 2}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const tenantsBlock = defineType({
  name: 'tenantsBlock',
  title: 'Tenants',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    headField,
    defineField({
      name: 'anchor',
      title: 'Editorial Anchor',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Body'),
      ],
    }),
    defineField({
      name: 'zones',
      title: 'Tenant Zones',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'seq', title: 'Sequence', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 2}),
            textStyleField('seqStyle', 'Sequence'),
            textStyleField('titleStyle', 'Title'),
            textStyleField('bodyStyle', 'Body'),
          ],
          preview: {select: {title: 'title', subtitle: 'seq'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const engineeredNumbersBlock = defineType({
  name: 'engineeredNumbersBlock',
  title: 'Engineered Numbers',
  type: 'object',
  icon: ThListIcon,
  fields: [
    headField,
    defineField({name: 'image', title: 'Frame Image', type: 'imageWithAlt'}),
    defineField({name: 'frameCaption', title: 'Frame Caption', type: 'string'}),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'num', title: 'Number', type: 'string'}),
            defineField({name: 'lab', title: 'Label', type: 'string'}),
            textStyleField('numStyle', 'Number'),
            textStyleField('labStyle', 'Label'),
          ],
          preview: {select: {title: 'num', subtitle: 'lab'}},
        }),
      ],
    }),
    defineField({name: 'banksHeading', title: 'Lift Banks Heading', type: 'string'}),
    defineField({
      name: 'banks',
      title: 'Lift Banks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'zone', title: 'Zone', type: 'string'}),
            defineField({name: 'floors', title: 'Floors', type: 'string'}),
          ],
          preview: {select: {title: 'zone', subtitle: 'floors'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const consultantsBlock = defineType({
  name: 'consultantsBlock',
  title: 'Consultants',
  type: 'object',
  icon: TiersIcon,
  fields: [
    headField,
    defineField({
      name: 'cells',
      title: 'Consultants',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({name: 'role', title: 'Role', type: 'string'}),
          ],
          preview: {select: {title: 'name', subtitle: 'role'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const brochureBlock = defineType({
  name: 'brochureBlock',
  title: 'Brochure',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    headField,
    defineField({name: 'ctaLabel', title: 'CTA Label', type: 'string'}),
    defineField({
      name: 'cards',
      title: 'Brochure Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'num', title: 'Numeral', type: 'string'}),
            defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'sub', title: 'Subtitle', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'sub', media: 'image.image'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const addressSectionBlock = defineType({
  name: 'addressSectionBlock',
  title: 'The Address (Retail)',
  type: 'object',
  icon: TagIcon,
  description:
    'Composite block modelling the "The Address" luxury-retail section. ' +
    'The iTower component only renders block types it explicitly looks up, ' +
    'so this is invisible on the live site until render code is added.',
  fields: [
    defineField({name: 'wordmark', title: 'Wordmark', type: 'imageWithAlt'}),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string', description: 'Allows inline <em> html.'}),
        defineField({
          name: 'body',
          title: 'Body Paragraphs',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
        }),
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Paragraphs', 'One style for all paragraphs.'),
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
            textStyleField('valueStyle', 'Value'),
            textStyleField('labelStyle', 'Label'),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({
      name: 'mix',
      title: 'The Mix',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string', description: 'Allows inline <em> html.'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 4}),
        defineField({name: 'image', title: 'Image', type: 'imageWithAlt'}),
        defineField({
          name: 'cards',
          title: 'Mix Cards',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fieldsets: [textStylesFieldset],
              fields: [
                defineField({name: 'category', title: 'Category', type: 'string', validation: (rule) => rule.required()}),
                defineField({name: 'share', title: 'Share', type: 'string'}),
                defineField({name: 'gla', title: 'GLA', type: 'string'}),
                defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
                textStyleField('categoryStyle', 'Category'),
                textStyleField('shareStyle', 'Share'),
                textStyleField('glaStyle', 'GLA'),
                textStyleField('bodyStyle', 'Body'),
              ],
              preview: {select: {title: 'category', subtitle: 'share'}},
            }),
          ],
        }),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Body'),
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string', description: 'Allows inline <em> html.'}),
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fieldsets: [textStylesFieldset],
              fields: [
                defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
                defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: iconTokenOptions}}),
                textStyleField('nameStyle', 'Name'),
              ],
              preview: {select: {title: 'name', subtitle: 'icon'}},
            }),
          ],
        }),
        defineField({
          name: 'cta',
          title: 'CTA',
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({name: 'prefill', title: 'Prefill', type: 'string'}),
          ],
        }),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
      ],
    }),
  ],
  preview: {select: {title: 'intro.heading', subtitle: 'intro.eyebrow', media: 'wordmark.image'}},
})

export const constructionFeedBlock = defineType({
  name: 'constructionFeedBlock',
  title: 'Construction Progress',
  type: 'object',
  icon: PlayIcon,
  description: 'The "Watch It Rise" video feed — hand-curated cards with YouTube embeds.',
  fields: [
    headField,
    defineField({
      name: 'ctaLabel',
      title: 'Timeline CTA Label',
      description: 'The link above the cards (points to the Updates timeline).',
      type: 'string',
      initialValue: 'View Full Construction Timeline',
    }),
    defineField({
      name: 'items',
      title: 'Progress Cards',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({
              name: 'embedUrl',
              title: 'Video Embed URL',
              type: 'url',
              description: 'Full YouTube embed URL, e.g. https://www.youtube.com/embed/XXXX?rel=0&modestbranding=1',
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'category', title: 'Category', type: 'string'}),
            defineField({name: 'date', title: 'Date Label', type: 'string'}),
            defineField({name: 'headline', title: 'Headline', type: 'text', rows: 2, validation: (rule) => rule.required()}),
            defineField({name: 'ctaLabel', title: 'CTA Label', type: 'string', initialValue: 'Download PDF'}),
            textStyleField('categoryStyle', 'Category'),
            textStyleField('dateStyle', 'Date'),
            textStyleField('headlineStyle', 'Headline'),
          ],
          preview: {select: {title: 'headline', subtitle: 'date'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

export const partnerDisciplinesBlock = defineType({
  name: 'partnerDisciplinesBlock',
  title: 'Partner Disciplines',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    headField,
    defineField({
      name: 'disciplines',
      title: 'Disciplines',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'num', title: 'Numeral', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 3}),
            defineField({
              name: 'partners',
              title: 'Partners',
              type: 'array',
              of: [defineArrayMember({type: 'reference', to: [{type: 'partner'}]})],
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'num'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
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
    defineArrayMember({type: 'partnerDisciplinesBlock'}),
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
    defineArrayMember({type: 'masterPlanBlock'}),
    defineArrayMember({type: 'towerAnatomyBlock'}),
    defineArrayMember({type: 'plateAnatomyBlock'}),
    defineArrayMember({type: 'tenantsBlock'}),
    defineArrayMember({type: 'engineeredNumbersBlock'}),
    defineArrayMember({type: 'consultantsBlock'}),
    defineArrayMember({type: 'brochureBlock'}),
    defineArrayMember({type: 'addressSectionBlock'}),
    defineArrayMember({type: 'constructionFeedBlock'}),
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
  masterPlanBlock,
  towerAnatomyBlock,
  plateAnatomyBlock,
  tenantsBlock,
  engineeredNumbersBlock,
  consultantsBlock,
  brochureBlock,
  addressSectionBlock,
  constructionFeedBlock,
  partnerDisciplinesBlock,
  homePageBuilder,
  pagePageBuilder,
  projectPageBuilder,
]

export {iconTokenOptions}

