import blogPost from './documents/blogPost'
import project from './documents/project'
import page from './documents/page'
import homePage from './documents/homePage'
import blogIndexPage from './documents/blogIndexPage'
import navigation from './documents/navigation'
import person from './documents/person'
import partner from './documents/partner'
import pressItem from './documents/pressItem'
import projectUpdate from './documents/projectUpdate'
import category from './documents/category'
import siteSettings from './singletons/siteSettings'
import seo from './objects/seo'
import portableText from './objects/portableText'
import imageWithAlt from './objects/imageWithAlt'
import cta from './objects/cta'
import route from './objects/route'
import link from './objects/link'
import navItem from './objects/navItem'
import location from './objects/location'
import socialLink from './objects/socialLink'
import {blockTypes} from './objects/blocks'

export const schemaTypes = [
  // URL-bearing documents
  homePage,
  blogIndexPage,
  page,
  project,
  blogPost,
  projectUpdate,
  // Reusable library documents
  person,
  partner,
  pressItem,
  category,
  // Legacy document kept readable while the greenfield model moves to person.
  // Singletons
  siteSettings,
  navigation,
  // Objects
  seo,
  portableText,
  imageWithAlt,
  cta,
  route,
  link,
  navItem,
  location,
  socialLink,
  ...blockTypes,
]
