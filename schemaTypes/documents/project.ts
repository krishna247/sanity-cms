import {HomeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {iconTokenOptions} from '../objects/blocks'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'builder', title: 'Page Builder'},
    {name: 'structuredData', title: 'SEO and Structured Data'},
    {name: 'settings', title: 'Settings'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'route',
      title: 'Route',
      type: 'route',
      group: 'settings',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Legacy Slug',
      type: 'slug',
      group: 'settings',
      deprecated: {reason: 'Use route.segment instead.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
    }),
    defineField({
      name: 'projectType',
      title: 'Project Type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Residential', value: 'residential'},
          {title: 'Commercial', value: 'commercial'},
          {title: 'Mixed Use', value: 'mixed-use'},
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Upcoming', value: 'upcoming'},
          {title: 'Under Construction', value: 'under-construction'},
          {title: 'Ready to Move', value: 'ready-to-move'},
          {title: 'Completed', value: 'completed'},
        ],
      },
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'string', group: 'content'}),
    defineField({name: 'description', title: 'Description', type: 'portableText', group: 'content'}),
    defineField({name: 'heroImage', title: 'Hero Image', type: 'imageWithAlt', group: 'content'}),
    defineField({name: 'gallery', title: 'Legacy Gallery', type: 'array', of: [{type: 'imageWithAlt'}], group: 'content'}),
    defineField({name: 'location', title: 'Location', type: 'location', group: 'content'}),
    defineField({
      name: 'pageBuilder',
      title: 'Page Builder',
      type: 'projectPageBuilder',
      group: 'builder',
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: iconTokenOptions}}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'icon', title: 'Icon', type: 'string', options: {list: iconTokenOptions}}),
            defineField({name: 'description', title: 'Description', type: 'text'}),
          ],
          preview: {select: {title: 'name', subtitle: 'icon'}},
        }),
      ],
    }),
    defineField({
      name: 'reraNumber',
      title: 'RERA Number',
      type: 'string',
      group: 'structuredData',
      validation: (rule) => rule.required().error('RERA number is required'),
    }),
    defineField({
      name: 'brochure',
      title: 'Brochure',
      type: 'file',
      options: {accept: 'application/pdf'},
      group: 'content',
    }),
    defineField({
      name: 'ctaButtons',
      title: 'CTA Buttons',
      type: 'array',
      of: [{type: 'link'}],
      group: 'content',
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo', group: 'structuredData'}),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description (1-2 sentence pitch)',
      type: 'text',
      rows: 3,
      group: 'structuredData',
      description: 'Canonical pitch Google and AI search read. Separate from the on-page description.',
    }),
    defineField({
      name: 'seoSchemaType',
      title: 'Schema Type',
      type: 'string',
      group: 'structuredData',
      options: {
        list: [
          {title: 'Apartment Complex (residential)', value: 'ApartmentComplex'},
          {title: 'Local Business (commercial)', value: 'LocalBusiness'},
        ],
      },
      description: 'schema.org @type for this project.',
    }),
    defineField({
      name: 'numberOfFloors',
      title: 'Number of Floors',
      type: 'number',
      group: 'structuredData',
      description: 'Total floors incl. ground, e.g. G+57 -> 58.',
    }),
    defineField({
      name: 'unitConfiguration',
      title: 'Unit Configuration',
      type: 'string',
      group: 'structuredData',
      description: 'Residential only, e.g. "4 BHK". Maps to numberOfAccommodationUnits.',
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      group: 'structuredData',
      description: 'Optional, e.g. "Starts from INR X cr". Published as priceRange if set.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tagline',
      media: 'heroImage.image',
    },
  },
})

