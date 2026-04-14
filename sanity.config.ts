import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {oldStructure} from './structure/old'
import {oldSchemaTypes} from './schemaTypes/old'

export default defineConfig([
  {
    name: 'production',
    title: 'SAS Infra CMS',
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: 'production',
    basePath: '/production',
    plugins: [
      structureTool({structure}),
      visionTool(),
    ],
    schema: {types: schemaTypes},
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
