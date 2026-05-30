import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'projectType',
      title: 'Project Type',
      type: 'string',
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
      options: {
        list: [
          {title: 'Upcoming', value: 'upcoming'},
          {title: 'Under Construction', value: 'under-construction'},
          {title: 'Ready to Move', value: 'ready-to-move'},
          {title: 'Completed', value: 'completed'},
        ],
      },
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'portableText',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'imageWithAlt',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{type: 'imageWithAlt'}],
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'location',
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'reraNumber',
      title: 'RERA Number',
      type: 'string',
      validation: (rule) => rule.required().error('RERA number is required'),
    }),
    defineField({
      name: 'brochure',
      title: 'Brochure',
      type: 'file',
      options: {
        accept: 'application/pdf',
      },
    }),
    defineField({
      name: 'ctaButtons',
      title: 'CTA Buttons',
      type: 'array',
      of: [{type: 'cta'}],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),

    // ─── Structured data (project JSON-LD) ───────────────────────────────
    // Powers the ApartmentComplex / LocalBusiness schema on the project page.
    // Geo comes from `location.geopoint`; amenities from `amenities[].name`;
    // RERA from `reraNumber`.
    defineField({
      name: 'seoDescription',
      title: 'SEO Description (1–2 sentence pitch)',
      type: 'text',
      rows: 3,
      fieldset: 'structuredData',
      description:
        'Canonical pitch Google + AI search read. Separate from the on-page description.',
    }),
    defineField({
      name: 'seoSchemaType',
      title: 'Schema Type',
      type: 'string',
      fieldset: 'structuredData',
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
      fieldset: 'structuredData',
      description: 'Total floors incl. ground, e.g. G+57 → 58.',
    }),
    defineField({
      name: 'unitConfiguration',
      title: 'Unit Configuration',
      type: 'string',
      fieldset: 'structuredData',
      description: 'Residential only, e.g. "4 BHK". Maps to numberOfAccommodationUnits.',
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      fieldset: 'structuredData',
      description: 'Optional, e.g. "Starts from ₹X cr". Published as priceRange if set.',
    }),
  ],
  fieldsets: [
    {
      name: 'structuredData',
      title: 'Structured Data (project JSON-LD)',
      options: {collapsible: true, collapsed: true},
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tagline',
      media: 'heroImage.image',
    },
  },
})
