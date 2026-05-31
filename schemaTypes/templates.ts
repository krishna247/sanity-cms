import type {Template} from 'sanity'

const today = () => new Date().toISOString().slice(0, 10)

export const templates: Template[] = [
  {
    id: 'homePage',
    title: 'Home',
    schemaType: 'homePage',
    value: {title: 'Home'},
  },
  {
    id: 'blogIndexPage',
    title: 'Blog Index',
    schemaType: 'blogIndexPage',
    value: {title: 'Blog', eyebrow: 'Blog', heading: 'Notes on building Hyderabad.'},
  },
  {
    id: 'updatesIndexPage',
    title: 'Updates Index',
    schemaType: 'updatesIndexPage',
    value: {title: 'Project Updates', eyebrow: 'Updates', heading: "Here's what we're building, this month."},
  },
  {
    id: 'navigation',
    title: 'Navigation',
    schemaType: 'navigation',
    value: {title: 'Navigation'},
  },
  {
    id: 'page-about',
    title: 'About Page',
    schemaType: 'page',
    value: {title: 'About', route: {segment: {current: 'about'}}},
  },
  {
    id: 'page-careers',
    title: 'Careers Page',
    schemaType: 'page',
    value: {title: 'Careers', route: {segment: {current: 'careers'}}},
  },
  {
    id: 'page-contact',
    title: 'Contact Page',
    schemaType: 'page',
    value: {title: 'Contact', route: {segment: {current: 'contact'}}},
  },
  {
    id: 'page-media',
    title: 'Media Page',
    schemaType: 'page',
    value: {title: 'Media', route: {segment: {current: 'media'}}},
  },
  {
    id: 'page-privacy',
    title: 'Privacy Page',
    schemaType: 'page',
    value: {title: 'Privacy', route: {section: 'legal', segment: {current: 'privacy'}}},
  },
  {
    id: 'page-terms',
    title: 'Terms Page',
    schemaType: 'page',
    value: {title: 'Terms', route: {section: 'legal', segment: {current: 'terms'}}},
  },
  {
    id: 'page-cookies',
    title: 'Cookies Page',
    schemaType: 'page',
    value: {title: 'Cookies', route: {section: 'legal', segment: {current: 'cookies'}}},
  },
  {
    id: 'page-legal',
    title: 'Legal Page',
    schemaType: 'page',
    value: {route: {section: 'legal'}},
  },
  {
    id: 'person-author',
    title: 'Author',
    schemaType: 'person',
    value: {roles: ['author']},
  },
  {
    id: 'projectUpdate-today',
    title: 'Project Update',
    schemaType: 'projectUpdate',
    value: () => ({date: today()}),
  },
]

