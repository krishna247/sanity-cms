import {defineType, defineField, defineArrayMember} from 'sanity'

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

    // ─── Shared chrome (footer / nav / concierge) ────────────────────────
    // CMS-backed copy for components that render on every page. Each is
    // optional and falls back to the exact current literal in the component.
    defineField({
      name: 'reraLine',
      title: 'RERA Registration Line',
      type: 'string',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Header CTA Label',
      type: 'string',
    }),
    defineField({
      name: 'vrTourLabel',
      title: 'VR Tour Button Label',
      type: 'string',
    }),
    defineField({
      name: 'concierge',
      title: 'Concierge Widget',
      type: 'object',
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'contactLabel', title: 'Contact Label', type: 'string'}),
        defineField({name: 'whatsappLabel', title: 'WhatsApp Label', type: 'string'}),
        defineField({name: 'whatsappNumber', title: 'WhatsApp Number', type: 'string'}),
        defineField({name: 'prefilledMessage', title: 'Prefilled Message', type: 'string'}),
      ],
    }),

    // ─── Canonical contact details ───────────────────────────────────────
    // Single source of truth for the phones, emails, address and hours shown
    // across pages. Each is optional and falls back to the exact current
    // literal in the component.
    defineField({
      name: 'phones',
      title: 'Phones',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'role', title: 'Role', type: 'string'}),
            defineField({name: 'display', title: 'Display', type: 'string'}),
            defineField({name: 'tel', title: 'Tel (href)', type: 'string'}),
          ],
          preview: {select: {title: 'display', subtitle: 'role'}},
        }),
      ],
    }),
    defineField({
      name: 'careersEmail',
      title: 'Careers Email',
      type: 'string',
    }),
    defineField({
      name: 'addressLines',
      title: 'Address Lines',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'addressShort',
      title: 'Address (Short)',
      type: 'string',
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({name: 'value', title: 'Value', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
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
