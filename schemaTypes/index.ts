import blogPost from './documents/blogPost'
import project from './documents/project'
import page from './documents/page'
import author from './documents/author'
import category from './documents/category'
import siteSettings from './singletons/siteSettings'
import seo from './objects/seo'
import portableText from './objects/portableText'
import imageWithAlt from './objects/imageWithAlt'
import cta from './objects/cta'
import location from './objects/location'
import socialLink from './objects/socialLink'

export const schemaTypes = [
  // Documents
  blogPost,
  project,
  page,
  author,
  category,
  // Singletons
  siteSettings,
  // Objects
  seo,
  portableText,
  imageWithAlt,
  cta,
  location,
  socialLink,
]
