import {
  CogIcon,
  DocumentIcon,
  DocumentsIcon,
  DocumentTextIcon,
  HomeIcon,
  MenuIcon,
  PinIcon,
  ProjectsIcon,
  StarIcon,
  ThListIcon,
  UserIcon,
} from '@sanity/icons'
import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import type {ComponentType} from 'react'
import {FIXED_PAGE_IDS} from '../schemaTypes/utils/routing'

const projectStatuses = [
  {title: 'Upcoming', value: 'upcoming'},
  {title: 'Under Construction', value: 'under-construction'},
  {title: 'Ready to Move', value: 'ready-to-move'},
  {title: 'Completed', value: 'completed'},
]

function singleton(S: StructureBuilder, type: string, title: string, icon: ComponentType) {
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(type).documentId(type).title(title).initialValueTemplate(type))
}

function fixedPage(S: StructureBuilder, id: string, title: string) {
  return S.listItem()
    .id(id)
    .title(title)
    .icon(DocumentIcon)
    .child(S.document().schemaType('page').documentId(id).title(title).initialValueTemplate(id))
}

function flagshipProject(S: StructureBuilder, id: string, title: string) {
  return S.listItem()
    .id(id)
    .title(title)
    .icon(StarIcon)
    .child(S.document().schemaType('project').documentId(id).title(title))
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singleton(S, 'siteSettings', 'Site Settings', CogIcon),
      singleton(S, 'navigation', 'Navigation', MenuIcon),
      S.divider(),
      singleton(S, 'homePage', 'Home', HomeIcon),
      flagshipProject(S, 'project-sas-crown', 'SAS Crown'),
      flagshipProject(S, 'project-sas-itower', 'SAS iTower'),
      S.divider(),
      S.listItem()
        .id('blog')
        .title('Blog')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Blog')
            .items([
              singleton(S, 'blogIndexPage', 'Blog Index', DocumentTextIcon),
              S.documentTypeListItem('blogPost').title('Posts'),
              S.documentTypeListItem('category').title('Categories'),
              S.listItem()
                .id('authors')
                .title('Authors')
                .icon(UserIcon)
                .child(
                  S.documentList()
                    .title('Authors')
                    .schemaType('person')
                    .filter('_type == "person" && "author" in roles')
                    .initialValueTemplates([S.initialValueTemplateItem('person-author')]),
                ),
            ]),
        ),
      S.listItem()
        .id('projects')
        .title('Projects')
        .icon(ProjectsIcon)
        .child(
          S.list()
            .title('Projects')
            .items([
              S.listItem()
                .id('project-updates')
                .title('Updates')
                .icon(ThListIcon)
                .child(
                  S.list()
                    .title('Updates')
                    .items([
                      singleton(S, 'updatesIndexPage', 'Updates Index', ThListIcon),
                      S.listItem()
                        .id('project-update-items')
                        .title('Update Items')
                        .schemaType('projectUpdate')
                        .child(
                          S.documentList()
                            .title('Project Updates')
                            .schemaType('projectUpdate')
                            .filter('_type == "projectUpdate"')
                            .defaultOrdering([{field: 'date', direction: 'desc'}])
                            .initialValueTemplates([S.initialValueTemplateItem('projectUpdate-today')]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('all-projects')
                .title('All Projects')
                .icon(ProjectsIcon)
                .schemaType('project')
                .child(
                  S.list()
                    .title('All Projects')
                    .items([
                      ...projectStatuses.map((status) =>
                        S.listItem()
                          .id(`projects-${status.value}`)
                          .title(status.title)
                          .schemaType('project')
                          .child(
                            S.documentList()
                              .title(status.title)
                              .schemaType('project')
                              .filter('_type == "project" && status == $status')
                              .params({status: status.value}),
                          ),
                      ),
                      S.divider(),
                      S.documentTypeListItem('project').title('Every Project'),
                    ]),
                ),
            ]),
        ),
      S.listItem()
        .id('pages')
        .title('Pages')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              fixedPage(S, 'page-about', 'About'),
              fixedPage(S, 'page-careers', 'Careers'),
              fixedPage(S, 'page-contact', 'Contact'),
              fixedPage(S, 'page-media', 'Media'),
              S.listItem()
                .id('legal-pages')
                .title('Legal')
                .icon(DocumentIcon)
                .child(
                  S.list()
                    .title('Legal')
                    .items([
                      fixedPage(S, 'page-privacy', 'Privacy'),
                      fixedPage(S, 'page-terms', 'Terms'),
                      fixedPage(S, 'page-cookies', 'Cookies'),
                      S.divider(),
                      S.listItem()
                        .id('all-legal-pages')
                        .title('All Legal Pages')
                        .schemaType('page')
                        .child(
                          S.documentList()
                            .title('All Legal Pages')
                            .schemaType('page')
                            .filter('_type == "page" && route.section == "legal"')
                            .initialValueTemplates([S.initialValueTemplateItem('page-legal')]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('other-pages')
                .title('Other Pages')
                .schemaType('page')
                .child(
                  S.documentList()
                    .title('Other Pages')
                    .schemaType('page')
                    .filter('_type == "page" && !(_id in $fixedIds) && route.section != "legal"')
                    .params({fixedIds: [...FIXED_PAGE_IDS]}),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .id('library')
        .title('Library')
        .icon(PinIcon)
        .child(
          S.list()
            .title('Library')
            .items([
              S.documentTypeListItem('person').title('People'),
              S.documentTypeListItem('partner').title('Partners'),
              S.documentTypeListItem('pressItem').title('Press Items'),
              S.documentTypeListItem('jobPosting').title('Job Postings'),
            ]),
        ),
    ])
