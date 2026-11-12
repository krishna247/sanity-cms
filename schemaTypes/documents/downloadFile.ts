import {DownloadIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

// A file served at https://files.sasinfra.com/<filename> by the `sasinfra-files`
// Worker (repos/frontend/workers/files). The Worker looks the PUBLISHED document
// up by `filename.current` and streams `file.asset` from Sanity's CDN, so the
// public link never changes when an editor uploads a new version of the file.
export const FILES_ORIGIN = 'https://files.sasinfra.com'

const FILENAME_RE = /^[a-z0-9][a-z0-9-]*\.[a-z0-9]+$/

function slugifyPart(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

// "SAS Crown Brochure.PDF" -> "sas-crown-brochure.pdf". Keeps (and slugifies) the
// last ".ext" so the source `title.ext` survives; everything else becomes dashes.
function slugifyFilename(input: string): string {
  const m = /^(.*)\.([A-Za-z0-9]+)$/.exec(input.trim())
  if (!m) return slugifyPart(input)
  const base = slugifyPart(m[1])
  const ext = m[2].toLowerCase()
  return base ? `${base}.${ext}` : ''
}

// Sanity file asset refs look like `file-<sha1>-<ext>`, so the uploaded file's
// extension is known without fetching the asset document.
function extensionFromRef(ref: unknown): string | undefined {
  if (typeof ref !== 'string') return undefined
  return /^file-[a-f0-9]+-([a-z0-9]+)$/i.exec(ref)?.[1]?.toLowerCase()
}

export default defineType({
  name: 'downloadFile',
  title: 'Downloadable file',
  type: 'document',
  icon: DownloadIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'For editors only, e.g. "SAS Crown brochure". Used to suggest the filename.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      description:
        'Upload the file here. To publish a new version (e.g. an updated brochure), replace the file on THIS document and publish: the public link stays the same and shows the new file within a few minutes.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'filename',
      title: 'Public filename',
      type: 'slug',
      description: `The public link is ${FILES_ORIGIN}/<filename>. Include the extension, e.g. "sas-crown-brochure.pdf" (lowercase letters, numbers and dashes, then ".pdf"). Click Generate after uploading the file to build it from the title. Changing this changes the link, so avoid editing it once the link has been shared.`,
      options: {
        source: (doc) => {
          const title = typeof doc.title === 'string' ? doc.title : ''
          const ext = extensionFromRef((doc.file as {asset?: {_ref?: string}} | undefined)?.asset?._ref)
          return ext ? `${title}.${ext}` : title
        },
        slugify: slugifyFilename,
        maxLength: 120,
      },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current
          if (!current) return true
          if (!FILENAME_RE.test(current)) {
            return /\.[a-z0-9]+$/.test(current)
              ? 'Use only lowercase letters, numbers and dashes before the extension, e.g. "sas-crown-brochure.pdf".'
              : 'Add the file extension, e.g. "sas-crown-brochure.pdf".'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {title: 'title', filename: 'filename.current'},
    prepare({title, filename}: {title?: string; filename?: string}) {
      return {
        title: title || 'Untitled file',
        subtitle: filename ? `${FILES_ORIGIN}/${filename}` : 'No public filename yet',
      }
    },
  },
})
