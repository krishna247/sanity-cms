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
import {deadHere} from '../utils/renderMatrix'

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
  {title: 'Dining', value: 'dining'},
  {title: 'Gym', value: 'gym'},
  {title: 'Home · Dividers (design)', value: 'home-design'},
  {title: 'Home · Map pin (location)', value: 'home-location'},
  {title: 'Home · Gridded globe (global standard)', value: 'home-global'},
  {title: 'Home · Skyline + spire (future-ready)', value: 'home-future'},
  {title: 'Home · Open ledger (transparent)', value: 'home-transparent'},
  {title: 'Home · Interlocking rings (partnership)', value: 'home-partnership'},
  {title: 'Home · Globe on horizon (global, local)', value: 'home-global-local'},
  {title: 'Home · Truss (engineering)', value: 'home-engineering'},
  {title: 'Crown · Status (clock)', value: 'crown-status'},
  {title: 'Crown · Land plot (grid)', value: 'crown-land'},
  {title: 'Crown · Towers (cube)', value: 'crown-towers'},
  {title: 'Crown · Flats (house)', value: 'crown-flats'},
  {title: 'Crown · Configuration (panels)', value: 'crown-configuration'},
  {title: 'Crown · Type (star)', value: 'crown-type'},
  {title: 'Crown · Banquet (cloche)', value: 'crown-banquet'},
  {title: 'Crown · EV charging (van)', value: 'crown-ev'},
  {title: 'Crown · Car wash (car)', value: 'crown-car-wash'},
  {title: 'Crown · Games (controller)', value: 'crown-games'},
  {title: 'Crown · Mini mart (bag)', value: 'crown-mini-mart'},
  {title: 'Crown · Swimming pool (waves)', value: 'crown-pool'},
  {title: 'Crown · Theatre (screen)', value: 'crown-theatre'},
  {title: 'Crown · Spa (steam)', value: 'crown-spa'},
  {title: 'Crown · Yoga (figure)', value: 'crown-yoga'},
  {title: 'Crown · Massage (waves + head)', value: 'crown-massage'},
]

const richTextMember = defineArrayMember({type: 'block', styles: [{title: 'Normal', value: 'normal'}]})

const headField = defineField({
  name: 'head',
  title: 'Section Head',
  type: 'object',
  fieldsets: [textStylesFieldset],
  fields: [
    // hidden → see utils/renderMatrix.ts: a bespoke page that never renders a
    // slot does not offer it in the Studio.
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', hidden: deadHere('head.eyebrow')}),
    defineField({name: 'heading', title: 'Heading', type: 'string', hidden: deadHere('head.heading')}),
    defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3, hidden: deadHere('head.dek')}),
    defineField({...textStyleField('eyebrowStyle', 'Eyebrow'), hidden: deadHere('head.eyebrowStyle')}),
    defineField({...textStyleField('headingStyle', 'Heading'), hidden: deadHere('head.headingStyle')}),
    defineField({...textStyleField('dekStyle', 'Deck'), hidden: deadHere('head.dekStyle')}),
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
      hidden: deadHere('partners'),
      title: 'Partners',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'partner'}]})],
      validation: (rule) => rule.min(1),
    }),
    defineField({...textStyleField('nameStyle', 'Partner name', 'Shown only when a partner has no logo.'), hidden: deadHere('nameStyle')}),
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
    defineField({...ctaField, hidden: deadHere('cta')}),
    defineField({
      name: 'variant',
      hidden: deadHere('variant'),
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
            defineField({...textStyleField('captionStyle', 'Caption'), hidden: deadHere('images[].captionStyle')}),
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
  fields: [headField],
  preview: {select: {title: 'head.heading'}},
})

export const amenitiesRefBlock = defineType({
  name: 'amenitiesRefBlock',
  title: 'Project Amenities',
  type: 'object',
  icon: StarIcon,
  fields: [headField],
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
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({name: 'actions', title: 'Actions', type: 'array', of: [defineArrayMember({type: 'link'})], hidden: deadHere('actions')}),
    defineField({name: 'note', title: 'Note', type: 'string', description: 'Optional short line under the actions. On the Media page it precedes the press-desk email link (default: “or write to”).', hidden: deadHere('note')}),
    defineField({...textStyleField('noteStyle', 'Note'), hidden: deadHere('noteStyle')}),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'head.eyebrow'}},
})

export const featureGridBlock = defineType({
  name: 'featureGridBlock',
  title: 'Feature Grid',
  type: 'object',
  icon: TiersIcon,
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({...ctaField, description: "Optional link under the section intro (home: 'Know more about SAS Infra' → About page).", hidden: deadHere('cta')}),
    defineField({...textStyleField('ctaStyle', 'CTA label'), hidden: deadHere('ctaStyle')}),
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
    defineField({...ctaField, hidden: deadHere('cta')}),
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
          {title: 'Blog', value: 'blog'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'limit', title: 'Limit', type: 'number', initialValue: 3}),
    defineField({
      name: 'itemCtaLabel', title: 'Item link text', type: 'string', placeholder: 'Read more',
      description: 'Text of the link at the foot of each card in an Updates / Press / Blog / Jobs feed (defaults to "Read more").',
      hidden: ({parent}) => ['projects', 'press'].includes(parent?.source),
    }),
    // Media-wall chrome — only the bespoke /media wall renders these.
    defineField({name: 'filterLabel', title: 'Filter label', type: 'string', description: 'The small kicker before the category pills on the media wall (default: “Filter”).', hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({name: 'allLabel', title: '“All” pill label', type: 'string', description: 'Text of the first filter pill, which shows every item (default: “All”). The other pills are the press items’ categories.', hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({name: 'countNoun', title: 'Item count — singular noun', type: 'string', description: 'The noun after the count when it is 1, e.g. “item” → “1 item” (default: “item”).', hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({name: 'countNounPlural', title: 'Item count — plural noun', type: 'string', description: 'The noun after the count otherwise, e.g. “items” → “20 items” (default: “items”).', hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({...textStyleField('itemCtaLabelStyle', 'Item link text', 'Updates feeds.'), hidden: ({parent}) => ['projects', 'press'].includes(parent?.source)}),
    defineField({...textStyleField('filterLabelStyle', 'Filter label'), hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({...textStyleField('allLabelStyle', 'Filter pills', 'One style for every pill, incl. All.'), hidden: ({parent}) => parent?.source !== 'press'}),
    defineField({...textStyleField('countNounStyle', 'Item count', 'The “20 items” counter.'), hidden: ({parent}) => parent?.source !== 'press'}),
    // List feeds (Updates / Press) render title + meta + excerpt per item.
    defineField({
      ...textStyleField('itemTitleStyle', 'Item title', 'Updates and Press feeds.'),
      hidden: ({parent}) => parent?.source === 'projects',
    }),
    defineField({
      ...textStyleField('itemMetaStyle', 'Item meta', 'Updates and Press feeds.'),
      hidden: ({parent}) => parent?.source === 'projects',
    }),
    defineField({
      ...textStyleField('itemExcerptStyle', 'Item excerpt', 'Updates and Press feeds.'),
      hidden: ({parent}) => parent?.source !== 'blog',  // an excerpt renders only on the generic Blog feed cards
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
        defineField({name: 'companyLabel', title: 'Company — Label', type: 'string'}),
        defineField({name: 'companyPlaceholder', title: 'Company — Placeholder', type: 'string'}),
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
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({name: 'location', title: 'Location', type: 'location', hidden: deadHere('location')}),
    defineField({name: 'footnote', title: 'Footnote', type: 'string', hidden: deadHere('footnote')}),
    defineField({name: 'mapQuery', title: 'Map search query', type: 'string', description: 'Google Maps search query for the embedded map on the Contact page — plain words, e.g. “ACE Tech Park Nanakramguda Financial District Hyderabad”. The site URL-encodes it (spaces → +).'}),
    defineField({...textStyleField('footnoteStyle', 'Footnote'), hidden: deadHere('footnoteStyle')}),
    defineField({
      name: 'markerCategories',
      hidden: deadHere('markerCategories'),
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
      hidden: deadHere('pointsOfInterest'),
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
            defineField({name: 'category', title: 'Category key', type: 'string', description: 'One of the marker categories above. Two values are reserved: “project” draws the SAS project pin (wordmark / logo lockup, see Project mark) and “office” draws the SAS Infra logo marker — neither is a category disc.', validation: (rule) => rule.required()}),
            defineField({name: 'projectKey', title: 'Project mark', type: 'string', description: 'For category "project" points only: which SAS mark to draw — crown (the SAS Crown wordmark) or itower (the iTower logo lockup). Derived from the name when left unset ("SAS iTower" → itower).', options: {layout: 'radio', list: ['crown', 'itower']}, hidden: ({parent}) => parent?.category !== 'project'}),
            defineField({name: 'location', title: 'Location', type: 'geopoint', validation: (rule) => rule.required()}),
            defineField({name: 'driveMinutes', title: 'Drive time (min)', type: 'number', description: 'Optional. Shown in the hover tip; falls back to straight-line distance.', validation: (rule) => rule.min(0).integer()}),
            defineField({name: 'showOnMobile', title: 'Show on mobile', type: 'boolean', description: 'Also show this point on phones (the mobile map shows a handful of anchors).', initialValue: false}),
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
      hidden: deadHere('hiddenLocalities'),
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
              hidden: deadHere('plans[].placeholder'),
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
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', hidden: deadHere('locationCard.eyebrow')}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'dek', title: 'Deck', type: 'text', rows: 3}),
        defineField({...textStyleField('eyebrowStyle', 'Eyebrow'), hidden: deadHere('locationCard.eyebrowStyle')}),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('dekStyle', 'Deck'),
      ],
    }),
    defineField({name: 'footnote', title: 'Footnote', type: 'string', hidden: deadHere('footnote')}),
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
    defineField({...textStyleField('footnoteStyle', 'Footnote'), hidden: deadHere('footnoteStyle')}),
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
            defineField({name: 'link', title: 'Card link', type: 'link', description: 'Where the card\'s CTA ("Download PDF") goes — e.g. a File link to the month\'s progress PDF. Empty = the enquiry form (#contact).'}),
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
          // Named so seeded items (`_type: 'discipline'`) resolve in the Studio —
          // an anonymous member only accepts `_type: 'object'`.
          name: 'discipline',
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'num', title: 'Numeral', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Description', type: 'text', rows: 3}),
            defineField({
              name: 'firms',
              title: 'Firms',
              description:
                'The logos shown on this row (About partner wall). Name doubles as the logo alt text. ' +
                'A firm seeded from the site keeps its own /images/partners file until a logo is uploaded here.',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'firm',
                  type: 'object',
                  fields: [
                    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
                    defineField({name: 'logo', title: 'Logo', type: 'imageWithAlt'}),
                  ],
                  preview: {select: {title: 'name', media: 'logo.image'}},
                }),
              ],
            }),
            defineField({
              name: 'partners',
              title: 'Partners (legacy references)',
              description: 'Superseded by Firms above — the About wall no longer reads these.',
              type: 'array',
              of: [defineArrayMember({type: 'reference', to: [{type: 'partner'}]})],
            }),
            textStyleField('titleStyle', 'Title'),
            textStyleField('descStyle', 'Description'),
          ],
          preview: {select: {title: 'title', subtitle: 'num'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'head.heading'}},
})

// ─── About bespoke set-pieces ────────────────────────────────────────────
// Models the VISIBLE content of the About page's Phase-3 sections so it becomes
// CMS-editable while AboutPage.astro keeps the exact bespoke DOM.

export const credentialsBlock = defineType({
  name: 'credentialsBlock',
  title: 'Recognition & Credentials',
  type: 'object',
  icon: StarIcon,
  description: 'One credibility band: an award, certification marks, and RERA registrations.',
  fieldsets: [textStylesFieldset],
  fields: [
    headField,
    defineField({
      name: 'award',
      title: 'Award',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'name', title: 'Award', type: 'string'}),
        defineField({name: 'line', title: 'Citation', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
        defineField({name: 'source', title: 'Awarding body', type: 'string', description: 'Also the alt text of the source logo.'}),
        defineField({name: 'laurel', title: 'Award laurel', type: 'imageWithAlt'}),
        defineField({name: 'sourceLogo', title: 'Source logo', type: 'imageWithAlt'}),
        textStyleField('nameStyle', 'Award'),
        textStyleField('lineStyle', 'Citation'),
        textStyleField('bodyStyle', 'Body'),
      ],
    }),
    defineField({
      name: 'credentials',
      title: 'Certifications',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'credential',
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'mark', title: 'Mark', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'org', title: 'Certifying body', type: 'string'}),
            defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
            defineField({name: 'image', title: 'Badge', type: 'imageWithAlt'}),
            textStyleField('markStyle', 'Mark'),
            textStyleField('orgStyle', 'Certifying body'),
            textStyleField('bodyStyle', 'Body'),
          ],
          preview: {select: {title: 'mark', subtitle: 'org', media: 'image.image'}},
        }),
      ],
    }),
    defineField({name: 'reraHeading', title: 'Registrations heading', type: 'string'}),
    defineField({
      name: 'rera',
      title: 'RERA registrations',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'reraRegistration',
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'project', title: 'Project', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'body', title: 'Registration line', type: 'string'}),
            textStyleField('projectStyle', 'Project'),
            textStyleField('bodyStyle', 'Registration line'),
          ],
          preview: {select: {title: 'project', subtitle: 'body'}},
        }),
      ],
    }),
    defineField({name: 'reraNote', title: 'Registrations note', type: 'text', rows: 2}),
    textStyleField('reraHeadingStyle', 'Registrations heading'),
    textStyleField('reraNoteStyle', 'Registrations note'),
  ],
  preview: {select: {title: 'head.heading', subtitle: 'award.name'}},
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
    defineArrayMember({type: 'credentialsBlock'}),
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
    defineArrayMember({type: 'tenantsBlock'}),
    defineArrayMember({type: 'engineeredNumbersBlock'}),
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
  tenantsBlock,
  engineeredNumbersBlock,
  addressSectionBlock,
  constructionFeedBlock,
  partnerDisciplinesBlock,
  credentialsBlock,
  homePageBuilder,
  pagePageBuilder,
  projectPageBuilder,
]

export {iconTokenOptions}

