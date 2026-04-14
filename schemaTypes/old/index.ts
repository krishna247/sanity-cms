import {defineType, defineField, defineArrayMember} from 'sanity'

const seo = defineType({
  name: 'seo',
  title: 'SEO Metadata',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string', title: 'SEO Title'}),
    defineField({name: 'description', type: 'text', title: 'SEO Description', rows: 3}),
    defineField({name: 'image', type: 'image', title: 'SEO Image', options: {hotspot: true}}),
    defineField({name: 'noIndex', type: 'boolean', title: 'No Index', initialValue: false}),
  ],
})

const location = defineType({
  name: 'location',
  title: 'Location',
  type: 'object',
  fields: [
    defineField({name: 'address', type: 'text', rows: 2}),
    defineField({name: 'city', type: 'string'}),
    defineField({name: 'state', type: 'string'}),
    defineField({name: 'pincode', type: 'string'}),
    defineField({name: 'mapUrl', type: 'url', title: 'Google Maps URL'}),
  ],
})

const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'alt', type: 'string', title: 'Alt Text'}),
    defineField({name: 'caption', type: 'string'}),
  ],
  preview: {
    select: {alt: 'alt', media: 'image'},
    prepare: ({alt, media}) => ({title: alt || 'Image', media}),
  },
})

const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'excerpt', type: 'text', rows: 3}),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                fields: [
                  {name: 'href', type: 'url'},
                  {name: 'blank', type: 'boolean', title: 'Open in new tab'},
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string', title: 'Alt text'}),
            defineField({name: 'caption', type: 'string', title: 'Caption'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'featuredImage',
      type: 'image',
      title: 'Featured Image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alt text'})],
    }),
    defineField({name: 'category', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'updatedAt', type: 'datetime'}),
    defineField({name: 'seo', type: 'seo'}),
    defineField({name: 'wpSlug', type: 'string', title: 'WordPress Slug', readOnly: true}),
  ],
  orderings: [{title: 'Published Date, New', name: 'publishedAtDesc', by: [{field: 'publishedAt', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'excerpt', media: 'featuredImage'}},
})

const page = defineType({
  name: 'page',
  title: 'Policy Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({
      name: 'body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', type: 'string', title: 'Alt text'}),
            defineField({name: 'caption', type: 'string', title: 'Caption'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'pageType',
      type: 'string',
      title: 'Page Type',
      options: {
        list: [
          {title: 'Cookie Policy', value: 'cookie-policy'},
          {title: 'Privacy Policy', value: 'privacy-policy'},
          {title: 'Terms & Conditions', value: 'terms-conditions'},
        ],
      },
    }),
    defineField({name: 'publishedAt', type: 'datetime'}),
    defineField({name: 'seo', type: 'seo'}),
    defineField({name: 'wpSlug', type: 'string', title: 'WordPress Slug', readOnly: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageType'}},
})

const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'bio', type: 'text'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'name', media: 'image'}},
})

const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'description', type: 'text'}),
  ],
  preview: {select: {title: 'title'}},
})

const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'bio', type: 'text', rows: 6}),
    defineField({name: 'image', type: 'imageWithAlt'}),
    defineField({name: 'isLeadership', type: 'boolean', initialValue: false, title: 'Leadership (Chairman/CEO)'}),
    defineField({name: 'orderRank', type: 'number', title: 'Display Order'}),
  ],
  orderings: [{title: 'Display Order', name: 'orderRankAsc', by: [{field: 'orderRank', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'role', media: 'image.image'}},
})

const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({
      name: 'projectType',
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
    defineField({name: 'tagline', type: 'string'}),
    defineField({
      name: 'description',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                fields: [
                  {name: 'href', type: 'url'},
                  {name: 'blank', type: 'boolean', title: 'Open in new tab'},
                ],
              },
            ],
          },
        }),
      ],
    }),
    defineField({name: 'heroImage', type: 'imageWithAlt', title: 'Hero Image'}),
    defineField({name: 'heroVideo', type: 'file', title: 'Hero Video', options: {accept: 'video/*'}}),
    defineField({name: 'gallery', type: 'array', of: [{type: 'imageWithAlt'}]}),
    defineField({name: 'masterPlan', type: 'imageWithAlt', title: 'Master Plan'}),
    defineField({
      name: 'floorPlans',
      title: 'Floor Plans',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'image', type: 'imageWithAlt'}),
            defineField({name: 'pdf', type: 'file', options: {accept: 'application/pdf'}}),
          ],
          preview: {select: {title: 'title', media: 'image.image'}},
        }),
      ],
    }),
    defineField({name: 'location', type: 'location'}),
    defineField({
      name: 'specifications',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'value', type: 'string', validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
    defineField({
      name: 'amenities',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'icon', type: 'image'}),
            defineField({
              name: 'group',
              type: 'string',
              options: {
                list: [
                  {title: 'Clubdom', value: 'clubdom'},
                  {title: 'Amenities', value: 'amenities'},
                  {title: 'Special', value: 'special'},
                ],
              },
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'group', media: 'icon'}},
        }),
      ],
    }),
    defineField({
      name: 'connectivity',
      title: 'Connectivity (Landmarks + Travel Time)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'landmark', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'durationMinutes', type: 'number', title: 'Duration (minutes)'}),
            defineField({
              name: 'category',
              type: 'string',
              options: {
                list: [
                  {title: 'School', value: 'school'},
                  {title: 'College', value: 'college'},
                  {title: 'Hospital', value: 'hospital'},
                  {title: 'Transit', value: 'transit'},
                  {title: 'Airport', value: 'airport'},
                  {title: 'Business Hub', value: 'business-hub'},
                  {title: 'Other', value: 'other'},
                ],
              },
            }),
          ],
          preview: {
            select: {title: 'landmark', subtitle: 'durationMinutes'},
            prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? `${subtitle} min` : undefined}),
          },
        }),
      ],
    }),
    defineField({
      name: 'consultants',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'role', type: 'string'}),
            defineField({name: 'logo', type: 'image'}),
          ],
          preview: {select: {title: 'name', subtitle: 'role', media: 'logo'}},
        }),
      ],
    }),
    defineField({name: 'reraNumber', type: 'string', title: 'RERA Number'}),
    defineField({name: 'reraUrl', type: 'url', title: 'RERA Authority URL'}),
    defineField({name: 'brochure', type: 'file', options: {accept: 'application/pdf'}}),
    defineField({name: 'seo', type: 'seo'}),
    defineField({name: 'orderRank', type: 'number', title: 'Display Order'}),
  ],
  orderings: [{title: 'Display Order', name: 'orderRankAsc', by: [{field: 'orderRank', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'tagline', media: 'heroImage.image'}},
})

const projectUpdate = defineType({
  name: 'projectUpdate',
  title: 'Project Update',
  type: 'document',
  fields: [
    defineField({name: 'project', type: 'reference', to: [{type: 'project'}], validation: (rule) => rule.required()}),
    defineField({name: 'year', type: 'number', validation: (rule) => rule.required()}),
    defineField({
      name: 'month',
      type: 'string',
      options: {
        list: [
          {title: 'January', value: '01'},
          {title: 'February', value: '02'},
          {title: 'March', value: '03'},
          {title: 'April', value: '04'},
          {title: 'May', value: '05'},
          {title: 'June', value: '06'},
          {title: 'July', value: '07'},
          {title: 'August', value: '08'},
          {title: 'September', value: '09'},
          {title: 'October', value: '10'},
          {title: 'November', value: '11'},
          {title: 'December', value: '12'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'image', type: 'imageWithAlt'}),
    defineField({name: 'pdf', type: 'file', title: 'Update PDF', options: {accept: 'application/pdf'}}),
    defineField({name: 'notes', type: 'text', rows: 3}),
    defineField({name: 'orderRank', type: 'number', title: 'Display Order'}),
  ],
  orderings: [
    {title: 'Newest', name: 'newest', by: [{field: 'year', direction: 'desc'}, {field: 'month', direction: 'desc'}]},
  ],
  preview: {
    select: {project: 'project.title', year: 'year', month: 'month', media: 'image.image'},
    prepare: ({project, year, month, media}) => ({
      title: project || 'Project Update',
      subtitle: year && month ? `${month}/${year}` : undefined,
      media,
    }),
  },
})

const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({name: 'publication', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'headline', type: 'string'}),
    defineField({name: 'date', type: 'date'}),
    defineField({name: 'image', type: 'imageWithAlt', validation: (rule) => rule.required()}),
    defineField({name: 'externalUrl', type: 'url', title: 'Article URL'}),
    defineField({name: 'project', type: 'reference', to: [{type: 'project'}]}),
    defineField({name: 'orderRank', type: 'number', title: 'Display Order'}),
  ],
  orderings: [
    {title: 'Newest', name: 'newest', by: [{field: 'date', direction: 'desc'}]},
    {title: 'Display Order', name: 'orderRankAsc', by: [{field: 'orderRank', direction: 'asc'}]},
  ],
  preview: {select: {title: 'publication', subtitle: 'headline', media: 'image.image'}},
})

const singletonBody = (name: string) =>
  defineField({
    name,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        marks: {
          decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              fields: [
                {name: 'href', type: 'url'},
                {name: 'blank', type: 'boolean', title: 'Open in new tab'},
              ],
            },
          ],
        },
      }),
    ],
  })

const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'About SAS Infra'}),
    singletonBody('intro'),
    defineField({name: 'chairman', type: 'reference', to: [{type: 'teamMember'}]}),
    defineField({name: 'team', type: 'array', of: [{type: 'reference', to: [{type: 'teamMember'}]}]}),
    singletonBody('goals'),
    defineField({name: 'goalsHeading', type: 'string'}),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

const mediaPage = defineType({
  name: 'mediaPage',
  title: 'Media Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Media & Press Coverage'}),
    singletonBody('intro'),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Contact Us'}),
    singletonBody('intro'),
    defineField({name: 'address', type: 'location'}),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'email', type: 'string'}),
    defineField({name: 'mapEmbedUrl', type: 'url', title: 'Google Maps Embed URL'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

const careersPage = defineType({
  name: 'careersPage',
  title: 'Careers Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Careers'}),
    singletonBody('intro'),
    singletonBody('lifeAt'),
    defineField({name: 'applyEmail', type: 'string', title: 'Apply Email'}),
    defineField({name: 'office', type: 'location'}),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Home'}),
    defineField({name: 'headline', type: 'string', title: 'Hero Headline'}),
    defineField({name: 'subheadline', type: 'string', title: 'Hero Subheadline'}),
    singletonBody('heroBody'),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'heroVideo', type: 'file', options: {accept: 'video/*'}}),
    defineField({name: 'heroCta', type: 'object', title: 'Hero CTA', fields: [
      defineField({name: 'label', type: 'string'}),
      defineField({name: 'href', type: 'string'}),
    ]}),
    defineField({
      name: 'featuredProjects',
      title: 'Featured Projects',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'project', type: 'reference', to: [{type: 'project'}], validation: (rule) => rule.required()}),
            defineField({name: 'eyebrow', type: 'string', description: 'Small text above project name (e.g. "TALLEST COMMERCIAL TOWER IN HYDERABAD")'}),
            defineField({name: 'image', type: 'imageWithAlt'}),
            defineField({name: 'showVrLink', type: 'boolean', initialValue: false, title: 'Show "Explore VR" link'}),
          ],
          preview: {select: {title: 'project.title', subtitle: 'eyebrow', media: 'image.image'}},
        }),
      ],
    }),
    defineField({
      name: 'partnersSection',
      title: 'Our Partners',
      type: 'object',
      fields: [
        defineField({name: 'heading', type: 'string', initialValue: 'Our Partners'}),
        defineField({name: 'subheading', type: 'string'}),
        defineField({name: 'logos', type: 'array', of: [{type: 'imageWithAlt'}]}),
      ],
    }),
    defineField({
      name: 'contactSection',
      title: 'Write To Us',
      type: 'object',
      fields: [
        defineField({name: 'heading', type: 'string', initialValue: 'Write to Us'}),
        defineField({name: 'subheading', type: 'string'}),
      ],
    }),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

const projectUpdatesPage = defineType({
  name: 'projectUpdatesPage',
  title: 'Project Updates Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Project Updates'}),
    singletonBody('intro'),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title'}},
})

export const oldSchemaTypes = [
  // Objects
  seo,
  location,
  imageWithAlt,
  // Documents
  post,
  page,
  author,
  category,
  teamMember,
  project,
  projectUpdate,
  mediaItem,
  // Singletons
  homePage,
  aboutPage,
  mediaPage,
  contactPage,
  careersPage,
  projectUpdatesPage,
]
