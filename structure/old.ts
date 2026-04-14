import type {StructureResolver} from 'sanity/structure'

const singleton = (S: any, id: string, schemaType: string, title: string) =>
  S.listItem()
    .title(title)
    .id(id)
    .child(S.document().schemaType(schemaType).documentId(id))

export const oldStructure: StructureResolver = (S) =>
  S.list()
    .title('SAS Infra (Old)')
    .items([
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              singleton(S, 'homePage', 'homePage', 'Home Page'),
              singleton(S, 'aboutPage', 'aboutPage', 'About Page'),
              singleton(S, 'mediaPage', 'mediaPage', 'Media Page'),
              singleton(S, 'contactPage', 'contactPage', 'Contact Page'),
              singleton(S, 'careersPage', 'careersPage', 'Careers Page'),
              singleton(S, 'projectUpdatesPage', 'projectUpdatesPage', 'Project Updates Page'),
              S.divider(),
              S.listItem()
                .title('Policy Pages')
                .schemaType('page')
                .child(S.documentTypeList('page').title('Policy Pages')),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Projects')
        .child(
          S.list()
            .title('Projects')
            .items([
              S.listItem()
                .title('All Projects')
                .schemaType('project')
                .child(
                  S.documentTypeList('project')
                    .title('All Projects')
                    .defaultOrdering([{field: 'orderRank', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Project Updates')
                .schemaType('projectUpdate')
                .child(
                  S.documentTypeList('projectUpdate')
                    .title('Project Updates')
                    .defaultOrdering([
                      {field: 'year', direction: 'desc'},
                      {field: 'month', direction: 'desc'},
                    ]),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('People')
        .child(
          S.list()
            .title('People')
            .items([
              S.listItem()
                .title('Team Members')
                .schemaType('teamMember')
                .child(
                  S.documentTypeList('teamMember')
                    .title('Team Members')
                    .defaultOrdering([{field: 'orderRank', direction: 'asc'}]),
                ),
              S.listItem()
                .title('Authors')
                .schemaType('author')
                .child(S.documentTypeList('author').title('Authors')),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.listItem()
                .title('Posts')
                .schemaType('post')
                .child(
                  S.documentTypeList('post')
                    .title('Posts')
                    .defaultOrdering([{field: 'publishedAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('Categories')
                .schemaType('category')
                .child(S.documentTypeList('category').title('Categories')),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Press')
        .child(
          S.list()
            .title('Press')
            .items([
              S.listItem()
                .title('Media Items')
                .schemaType('mediaItem')
                .child(
                  S.documentTypeList('mediaItem')
                    .title('Media Items')
                    .defaultOrdering([{field: 'orderRank', direction: 'asc'}]),
                ),
            ]),
        ),
    ])
