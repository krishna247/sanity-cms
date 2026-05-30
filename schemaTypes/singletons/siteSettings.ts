import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) =>
        rule.regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, {
          name: 'email',
          invert: false,
        }),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'location',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{type: 'socialLink'}],
      description:
        'Single source of truth for the footer social bar AND the Organization JSON-LD "sameAs" list.',
    }),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
    }),

    // ─── Structured data (Organization JSON-LD) ──────────────────────────
    // These power the sitewide Organization schema that search engines and AI
    // crawlers read. Edits here update every page's JSON-LD on the next build.
    defineField({
      name: 'legalName',
      title: 'Legal Name',
      type: 'string',
      fieldset: 'structuredData',
      description: 'Registered entity name, e.g. "SRIAS DEVELOPERS LLP".',
    }),
    defineField({
      name: 'organizationType',
      title: 'Organization Schema Type',
      type: 'string',
      fieldset: 'structuredData',
      options: {
        list: [
          {title: 'Real Estate Agent', value: 'RealEstateAgent'},
          {title: 'Real Estate Developer', value: 'RealEstateDeveloper'},
          {title: 'Organization', value: 'Organization'},
        ],
      },
      initialValue: 'RealEstateAgent',
      description: 'schema.org @type for the Organization record.',
    }),
    defineField({
      name: 'foundingDate',
      title: 'Founding Year',
      type: 'string',
      fieldset: 'structuredData',
      description: 'Year the company was founded, e.g. "2000".',
    }),
    defineField({
      name: 'founder',
      title: 'Founder',
      type: 'object',
      fieldset: 'structuredData',
      fields: [
        defineField({name: 'name', title: 'Name', type: 'string'}),
        defineField({name: 'title', title: 'Title / Honorific', type: 'string'}),
      ],
    }),
    defineField({
      name: 'areaServed',
      title: 'Area Served',
      type: 'string',
      fieldset: 'structuredData',
      description: 'Primary city/area served, e.g. "Hyderabad".',
    }),
    defineField({
      name: 'contactPoints',
      title: 'Contact Points',
      type: 'array',
      fieldset: 'structuredData',
      description: 'Phone/email lines exposed in the Organization JSON-LD contactPoint array.',
      of: [
        {
          type: 'object',
          name: 'contactPoint',
          fields: [
            defineField({
              name: 'contactType',
              title: 'Contact Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Sales', value: 'sales'},
                  {title: 'Customer Support', value: 'customer support'},
                  {title: 'Leasing', value: 'leasing'},
                  {title: 'Reservations', value: 'reservations'},
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'telephone', title: 'Telephone', type: 'string'}),
            defineField({name: 'email', title: 'Email', type: 'string'}),
          ],
          preview: {select: {title: 'contactType', subtitle: 'telephone'}},
        },
      ],
    }),
  ],
  fieldsets: [
    {
      name: 'structuredData',
      title: 'Structured Data (Organization JSON-LD)',
      options: {collapsible: true, collapsed: true},
    },
  ],
})
