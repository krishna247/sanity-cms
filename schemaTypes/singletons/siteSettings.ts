import {defineType, defineField, defineArrayMember} from 'sanity'
import {textStyleField, textStylesFieldset} from '../objects/textStyle'

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
      description: 'Brand tagline. Used with the company name as the share-card alt text.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Fallback meta description, used only by a page that has no description of its own.',
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
      description: 'Site-wide defaults for pages without their own SEO. The share image should be 1200×630.',
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
      name: 'concierge',
      title: 'Concierge Widget',
      type: 'object',
      fields: [
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
      name: 'enquiries',
      title: 'Enquiry Desks',
      description:
        'The contact-page “desk” cards (e.g. Retail, Other enquiries). Each renders as a card ' +
        'with its own email + phone. Leave empty to use the built-in defaults.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fieldsets: [textStylesFieldset],
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string'}),
            defineField({name: 'desc', title: 'Subtitle', type: 'string'}),
            defineField({name: 'email', title: 'Email', type: 'string'}),
            defineField({name: 'phoneDisplay', title: 'Phone — Display', type: 'string'}),
            defineField({name: 'phoneTel', title: 'Phone — tel: href', type: 'string'}),
            textStyleField('titleStyle', 'Title'),
            textStyleField('descStyle', 'Subtitle'),
          ],
          preview: {select: {title: 'title', subtitle: 'email'}},
        }),
      ],
    }),
    defineField({
      name: 'projectEmail',
      title: 'Project Email',
      type: 'string',
      description: 'Project/legal contact email.',
    }),
    defineField({
      name: 'notFound',
      title: 'Not Found (404)',
      type: 'object',
      fieldsets: [textStylesFieldset],
      fields: [
        defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
        defineField({name: 'heading', title: 'Heading', type: 'string'}),
        defineField({name: 'body', title: 'Body', type: 'text'}),
        defineField({name: 'links', title: 'Recovery links', type: 'array', of: [defineArrayMember({type: 'link'})], description: 'The "Try one of these instead" links under the 404 body, in order (defaults to Home · SAS Crown · SAS iTower · Blog · Contact).'}),
        defineField({name: 'seoTitle', title: 'SEO Title', type: 'string'}),
        defineField({name: 'seoDescription', title: 'SEO Description', type: 'text'}),
        textStyleField('eyebrowStyle', 'Eyebrow'),
        textStyleField('headingStyle', 'Heading'),
        textStyleField('bodyStyle', 'Body'),
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
