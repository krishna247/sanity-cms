import {defineConfig} from 'sanity'
import type {DocumentActionComponent, Template} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {templates} from './schemaTypes/templates'
import {GUARDED_DOCUMENT_IDS, SINGLETON_IDS} from './schemaTypes/utils/routing'
import {structure} from './structure'
import {oldStructure} from './structure/old'
import {oldSchemaTypes} from './schemaTypes/old'
import {resolve} from './presentation/resolve'

const guardedIds = new Set<string>(GUARDED_DOCUMENT_IDS)
const singletonTypes = new Set<string>(SINGLETON_IDS)
const guardedActions = new Set(['delete', 'duplicate', 'unpublish'])
const templateIds = new Set(templates.map((template) => template.id))

function cleanId(id: string | undefined): string {
  return (id || '').replace(/^drafts\./, '')
}

function filterDocumentActions(prev: DocumentActionComponent[], context: {documentId?: string; schemaType: string}) {
  const isGuarded = guardedIds.has(cleanId(context.documentId)) || singletonTypes.has(context.schemaType)
  if (!isGuarded) return prev
  return prev.filter((action) => !action.action || !guardedActions.has(action.action))
}

function mergeTemplates(prev: Template[]) {
  return [...prev.filter((template) => !templateIds.has(template.id)), ...templates]
}

export default defineConfig([
  {
    name: 'production',
    title: 'SAS Infra CMS',
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: 'production',
    basePath: '/production',
    plugins: [
      structureTool({structure}),
      presentationTool({
        resolve,
        previewUrl: {
          initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
          // Draft-mode toggle: the frontend's preview build exposes this route
          // (validates the signed secret, sets the perspective cookie). See
          // LIVE_PREVIEW_PLAN.md §5 / Stage E.
          previewMode: {
            enable: '/api/draft-mode/enable',
          },
        },
      }),
      visionTool(),
    ],
    document: {
      actions: filterDocumentActions,
    },
    schema: {types: schemaTypes, templates: mergeTemplates},
  },
  {
    name: 'old',
    title: 'SAS Infra (Old WordPress)',
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: 'old',
    basePath: '/old',
    plugins: [
      structureTool({structure: oldStructure}),
      visionTool(),
    ],
    schema: {types: oldSchemaTypes},
  },
])
