import {useEffect, useRef, useState} from 'react'
import {Box, Button, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {PublishIcon} from '@sanity/icons'
import {
  useDocumentOperation,
  useEditState,
  useUser,
  useValidationStatus,
  type InputProps,
  type Path,
} from 'sanity'
import {formatDay, formatStamp, timeAgo} from './time'
import {useLastEdit} from './useLastEdit'
import {useOperationRunner} from './useOperationRunner'

// A banner at the top of any document form that has unpublished changes. Wraps
// the document-level (root) input only; every other input renders as before.
// The form is the same in Structure and in the Presentation pane, so the banner
// appears in both: the moment an editor sees a change "done" in the preview is
// the moment this tells them the live site does not have it yet.
export function DocumentDraftBanner(props: InputProps) {
  const isDocumentRoot = props.id === 'root' && props.schemaType.type?.name === 'document'
  const value = props.value as {_id?: string; _type?: string} | undefined
  if (!isDocumentRoot || !value?._id || !value._type) return props.renderDefault(props)
  const onPathFocus = 'onPathFocus' in props ? (props.onPathFocus as (path: Path) => void) : undefined
  const onPathOpen = 'onPathOpen' in props ? (props.onPathOpen as (path: Path) => void) : undefined
  return (
    <Stack gap={5}>
      <RootBanner
        publishedId={value._id.replace(/^drafts\./, '')}
        type={value._type}
        onPathFocus={onPathFocus}
        onPathOpen={onPathOpen}
      />
      {props.renderDefault(props)}
    </Stack>
  )
}

const DAY_MS = 24 * 3600e3
const REBUILD_NOTE = 'The site rebuilds automatically, usually within a few minutes. Check the page after that.'

/** The error to send an editor to: the deepest path wins, because focusing a
 *  leaf input (a text field) scrolls it into view, while "focusing" an object
 *  such as a whole link does nothing visible. */
export function fixableError<T extends {path: Path}>(errors: T[]): T | undefined {
  return errors.reduce<T | undefined>(
    (best, marker) => (!best || marker.path.length > best.path.length ? marker : best),
    undefined,
  )
}

function RootBanner({
  publishedId,
  type,
  onPathFocus,
  onPathOpen,
}: {
  publishedId: string
  type: string
  onPathFocus?: (path: Path) => void
  onPathOpen?: (path: Path) => void
}) {
  const editState = useEditState(publishedId, type)
  const ops = useDocumentOperation(publishedId, type)
  // Validate the draft (the version that would be published), not the published copy.
  const {validation, isValidating, revision: validatedRevision} = useValidationStatus(`drafts.${publishedId}`, type)
  const run = useOperationRunner(publishedId, type)
  const toast = useToast()
  const draft = editState.draft
  const lastEdit = useLastEdit(`drafts.${publishedId}`, draft?._updatedAt ?? '')
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  if (!editState.ready || !draft || editState.liveEdit) return null

  const published = editState.published
  const errors = validation.filter((marker) => marker.level === 'error')
  // Only trust validation once it reports the revision we would publish (the
  // hook starts out "no markers, not validating", which is "not checked yet").
  const validationFresh = !isValidating && validatedRevision === draft._rev
  const canPublish = ops.publish.disabled === false && validationFresh && errors.length === 0
  // Calm until the change has sat for a day; then the banner earns its colour.
  const stale = Date.now() - Date.parse(draft._updatedAt) > DAY_MS
  const editedAt = lastEdit?.timestamp ?? draft._updatedAt
  const target = fixableError(errors)
  const goToError = () => {
    if (!target) return
    onPathOpen?.(target.path)
    onPathFocus?.(target.path)
  }

  const publish = async () => {
    setBusy(true)
    const result = await run('publish', () => ops.publish.execute())
    if (alive.current) setBusy(false)
    toast.push(
      result.ok
        ? {status: 'success', title: 'Published', description: REBUILD_NOTE}
        : {status: 'error', title: 'Could not publish', description: result.error, duration: 10_000},
    )
  }

  return (
    <Card tone={stale ? 'caution' : 'transparent'} border padding={3} radius={2}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1} style={{minWidth: 260}}>
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              {published ? 'Not on the live site yet' : 'New: not on the site yet'}
            </Text>
            <Text size={1}>
              Saved <span title={formatStamp(editedAt)}>{timeAgo(editedAt)}</span>
              {lastEdit?.author ? (
                <>
                  {' by '}
                  <EditorName id={lastEdit.author} />
                </>
              ) : null}
              .{' '}
              {published ? (
                <>
                  The site still shows the version from{' '}
                  <span title={formatStamp(published._updatedAt)}>{formatDay(published._updatedAt)}</span>.
                </>
              ) : (
                'Nobody can see this until you publish it.'
              )}
              {errors.length > 0
                ? ` ${errors.length} ${errors.length === 1 ? 'thing' : 'things'} to fix first.`
                : ''}
            </Text>
          </Stack>
        </Box>
        {target && onPathFocus ? (
          <Button mode="ghost" tone="critical" text="Go to the first error" onClick={goToError} />
        ) : (
          <Button
            mode="ghost"
            tone="positive"
            icon={PublishIcon}
            text={busy ? 'Publishing…' : 'Publish'}
            disabled={!canPublish || busy}
            onClick={publish}
          />
        )}
      </Flex>
    </Card>
  )
}

function EditorName({id}: {id: string}) {
  const [user, loading] = useUser(id)
  if (loading) return <>…</>
  return <>{user?.displayName || 'someone'}</>
}
