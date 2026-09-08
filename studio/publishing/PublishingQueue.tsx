import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import {EditIcon, EllipsisHorizontalIcon, PublishIcon, RestoreIcon, TrashIcon} from '@sanity/icons'
import {
  pathToString,
  Preview,
  PreviewCard,
  UserAvatar,
  useDocumentOperation,
  useEditState,
  useSchema,
  useUser,
  useValidationStatus,
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SchemaType,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {changedPaths, summarizeChanges} from './diff'
import {fixableError} from './DraftBanner'
import {formatDay, formatStamp, timeAgo} from './time'
import {useDrafts, type DraftRef} from './useDrafts'
import {useLastEdit} from './useLastEdit'
import {useOperationRunner, type OpResult} from './useOperationRunner'
import {whereItShows} from './whereItShows'

// The publishing queue: every document with a pending draft, who touched it and
// when, what changed, whether it can publish, and the one button to do so.
// Rendered as the "Publishing" tool (wide) and as a Structure pane (narrow).
// The list itself comes from useDrafts (ids only); each row subscribes to the
// Studio's document store, so draft/published state, validation and operations
// are exactly what the document editor sees, live.

interface RowStatus {
  title: string
  /** Document state says it can publish: draft present, validation fresh and
   *  clean, operation not disabled. Ignores the bulk lock on purpose. */
  publishable: boolean
  /** An operation from this row is in flight. */
  busy: boolean
  /** Publish through the row, which owns the per-document lock. */
  publish: () => Promise<OpResult>
}

type ReportStatus = (draftId: string, status: RowStatus | null) => void

export interface PublishingQueueProps {
  /** `pane` is the compact Structure column; `tool` has room for detail. */
  layout?: 'pane' | 'tool'
}

const REBUILD_NOTE = 'The site rebuilds automatically, usually within a few minutes. Check the page after that.'

interface BulkState {
  open: boolean
  running: boolean
  index: number
  total: number
}
const BULK_IDLE: BulkState = {open: false, running: false, index: 0, total: 0}

export function PublishingQueue({layout = 'pane'}: PublishingQueueProps) {
  const {items, loading, error, refresh} = useDrafts()
  const toast = useToast()
  const compact = layout === 'pane'

  // Rows report their publishability up so "Publish N ready" can act on them.
  const statuses = useRef(new Map<string, RowStatus>())
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const report = useCallback<ReportStatus>((draftId, status) => {
    if (status) statuses.current.set(draftId, status)
    else statuses.current.delete(draftId)
    bump()
  }, [])
  const known = items
    .map((item) => statuses.current.get(item.draftId))
    .filter((status): status is RowStatus => !!status)
  const ready = known.filter((status) => status.publishable && !status.busy)
  const blocked = known.filter((status) => !status.publishable)

  const [bulk, setBulk] = useState<BulkState>(BULK_IDLE)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const publishAll = useCallback(async () => {
    // Snapshot WHICH documents, not their state: each one is re-checked right
    // before its turn, so a document edited into an invalid state (or already
    // being published from its own row) while earlier ones publish is skipped,
    // never pushed through on a stale "ready".
    const targets = items
      .map((item) => item.draftId)
      .filter((draftId) => {
        const status = statuses.current.get(draftId)
        return !!status && status.publishable && !status.busy
      })
    setBulk({open: true, running: true, index: 0, total: targets.length})
    const failed: string[] = []
    const skipped: string[] = []
    for (let i = 0; i < targets.length; i++) {
      if (!alive.current) return
      setBulk((state) => ({...state, index: i + 1}))
      const status = statuses.current.get(targets[i])
      if (!status) continue // gone from the queue meanwhile (published elsewhere)
      if (!status.publishable || status.busy) {
        skipped.push(status.title)
        continue
      }
      const result = await status.publish()
      if (!result.ok) failed.push(`${status.title} (${result.error})`)
    }
    if (!alive.current) return
    setBulk(BULK_IDLE)
    const done = targets.length - failed.length - skipped.length
    const notes = [
      failed.length ? `Not published: ${failed.join('; ')}.` : '',
      skipped.length ? `Skipped, changed meanwhile: ${skipped.join(', ')}.` : '',
    ].filter(Boolean)
    toast.push(
      notes.length
        ? {
            status: 'warning',
            title: `Published ${done} of ${targets.length}`,
            description: notes.join(' '),
            duration: 12_000,
          }
        : {
            status: 'success',
            title: `Published ${done} ${done === 1 ? 'document' : 'documents'}`,
            description: REBUILD_NOTE,
          },
    )
    refresh()
  }, [items, refresh, toast])

  return (
    <Stack gap={4}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1} style={{minWidth: 220}}>
          <Stack gap={2}>
            <Flex align="center" gap={2}>
              <Text size={compact ? 2 : 3} weight="semibold">
                Publishing queue
              </Text>
              {!loading && !error && (
                <Badge tone={items.length ? 'primary' : 'default'}>{items.length}</Badge>
              )}
            </Flex>
            <Text size={1} muted>
              Saved in the Studio, not on the live site yet. Publishing sends a document to the site.
            </Text>
          </Stack>
        </Box>
        {items.length > 0 && (
          <Button
            icon={PublishIcon}
            mode="ghost"
            tone="positive"
            text={`Publish ${ready.length} ready`}
            disabled={ready.length === 0 || bulk.running}
            onClick={() => setBulk({open: true, running: false, index: 0, total: ready.length})}
          />
        )}
      </Flex>

      {loading && (
        <Flex align="center" gap={3} padding={3}>
          <Spinner muted />
          <Text size={1} muted>
            Loading…
          </Text>
        </Flex>
      )}

      {error && (
        <Card tone="critical" padding={3} radius={2}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Text size={1}>Could not load the queue.</Text>
            </Box>
            <Button mode="ghost" text="Try again" onClick={refresh} />
          </Flex>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card tone="transparent" border padding={4} radius={2}>
          <Text size={1} muted align="center">
            Nothing waiting. The live site matches the Studio.
          </Text>
        </Card>
      )}

      {items.length > 0 && (
        <Stack gap={2}>
          {items.map((item) => (
            <QueueRow
              key={item.draftId}
              item={item}
              compact={compact}
              locked={bulk.running}
              onStatus={report}
            />
          ))}
        </Stack>
      )}

      {bulk.open && (
        <Dialog
          id="publishing-queue-publish-all"
          header={`Publish ${bulk.total} ${bulk.total === 1 ? 'document' : 'documents'}?`}
          width={1}
          onClose={bulk.running ? undefined : () => setBulk(BULK_IDLE)}
          footer={
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button mode="ghost" text="Cancel" disabled={bulk.running} onClick={() => setBulk(BULK_IDLE)} />
              <Button
                mode="ghost"
                tone="positive"
                icon={PublishIcon}
                text={bulk.running ? `Publishing ${bulk.index} of ${bulk.total}…` : 'Publish'}
                disabled={bulk.running || ready.length === 0}
                onClick={publishAll}
              />
            </Flex>
          }
        >
          <Box padding={4}>
            <Stack gap={4}>
              <Text size={1}>These go to the live site. {REBUILD_NOTE}</Text>
              <Stack as="ul" gap={2} style={{margin: 0, paddingLeft: '1.2em'}}>
                {ready.map((status, index) => (
                  <Text as="li" key={index} size={1}>
                    {status.title}
                  </Text>
                ))}
              </Stack>
              {blocked.length > 0 && (
                <Text size={1} muted>
                  {blocked.length === 1
                    ? `1 document stays here: “${blocked[0].title}” still needs fixing.`
                    : `${blocked.length} documents stay here, they still need fixing: ${blocked
                        .map((status) => `“${status.title}”`)
                        .join(', ')}.`}
                </Text>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}

// ─── Rows ────────────────────────────────────────────────────────────────────

function QueueRow({
  item,
  compact,
  locked,
  onStatus,
}: {
  item: DraftRef
  compact: boolean
  locked: boolean
  onStatus: ReportStatus
}) {
  const schema = useSchema()
  const schemaType = schema.get(item.type)
  if (!schemaType) return <UnknownTypeRow item={item} />
  return <KnownRow item={item} schemaType={schemaType} compact={compact} locked={locked} onStatus={onStatus} />
}

function UnknownTypeRow({item}: {item: DraftRef}) {
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          {item.publishedId}
        </Text>
        <Text size={1} muted>
          This document's type was removed from the site. Ask a developer to clean it up. Last edited{' '}
          {timeAgo(item.updatedAt)}.
        </Text>
      </Stack>
    </Card>
  )
}

const DISABLED_REASONS: Record<string, string> = {
  NO_CHANGES: 'Nothing to publish',
  ALREADY_PUBLISHED: 'Already live',
  LIVE_EDIT_ENABLED: 'Goes live as you type, nothing to publish',
  NOT_READY: 'Checking…',
}

function KnownRow({
  item,
  schemaType,
  compact,
  locked,
  onStatus,
}: {
  item: DraftRef
  schemaType: SchemaType
  compact: boolean
  /** A bulk publish is running: this row's own actions wait. */
  locked: boolean
  onStatus: ReportStatus
}) {
  const editState = useEditState(item.publishedId, item.type)
  const ops = useDocumentOperation(item.publishedId, item.type)
  // The validation target is the VERSION being published: the draft id (the
  // Studio's own publish action does the same). The published id would validate
  // the copy already on the site, which is valid by definition.
  const {validation, isValidating, revision: validatedRevision} = useValidationStatus(item.draftId, item.type)
  const run = useOperationRunner(item.publishedId, item.type)
  const router = useRouter()
  const toast = useToast()
  const lastEdit = useLastEdit(item.draftId, item.updatedAt)
  const [confirm, setConfirm] = useState<'discard' | 'delete' | null>(null)
  const [busy, setBusy] = useState<'publish' | 'discard' | 'delete' | null>(null)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const draft = editState.draft
  const published = editState.published
  const doc = draft ?? published
  const errors = validation.filter((marker) => marker.level === 'error')
  const fieldTitles = useMemo(() => fieldTitleMap(schemaType), [schemaType])
  const changed = useMemo(
    () => summarizeChanges(draft && published ? changedPaths(draft, published) : [], fieldTitles),
    [draft, published, fieldTitles],
  )
  const title = docTitle(doc, schemaType, item.publishedId)
  const where = whereItShows(doc)
  const isNew = editState.ready && !published
  const publishDisabled = ops.publish.disabled
  // Validation is only trustworthy once it reports the revision we would
  // publish: the hook starts out as "no markers, not validating", which looks
  // clean but means "not checked yet". Same gate as the Studio's publish action.
  const validationFresh = !isValidating && !!draft && validatedRevision === draft._rev
  const checking = !editState.ready || (!!draft && !validationFresh)
  const publishable = !checking && !!draft && publishDisabled === false && errors.length === 0
  const canPublish = publishable && busy === null && !locked

  // One operation per document at a time. The row owns the lock, and the bulk
  // flow publishes THROUGH the row, so the two can never race each other.
  const busyRef = useRef(false)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const runLocked = useCallback(
    async (kind: 'publish' | 'discard' | 'delete', op: string, execute: () => void): Promise<OpResult> => {
      if (busyRef.current) return {ok: false, error: 'Another action on this document is still running'}
      busyRef.current = true
      setBusy(kind)
      let result = await run(op, execute)
      // A publish that timed out but left no draft behind did succeed.
      if (!result.ok && result.timedOut && kind !== 'delete' && !draftRef.current) result = {ok: true, via: 'unmount'}
      busyRef.current = false
      if (alive.current) setBusy(null)
      return result
    },
    [run],
  )
  // Registered with the parent for "Publish N ready". No toast here: the bulk
  // flow reports once at the end; the row's own button reports per document.
  const publishQuietly = useCallback(
    () => runLocked('publish', 'publish', () => ops.publish.execute()),
    [ops.publish, runLocked],
  )
  const publishRef = useRef(publishQuietly)
  publishRef.current = publishQuietly
  useEffect(() => {
    onStatus(item.draftId, {title, publishable, busy: busy !== null, publish: () => publishRef.current()})
  }, [item.draftId, title, publishable, busy, onStatus])
  useEffect(() => () => onStatus(item.draftId, null), [item.draftId, onStatus])

  const open = () => router.navigateIntent('edit', {id: item.publishedId, type: item.type})
  const openChanges = () =>
    router.navigateIntent('edit', {id: item.publishedId, type: item.type, inspect: 'sanity/structure/history'})
  const fixFirstError = () => {
    const target = fixableError(errors)
    router.navigateIntent('edit', {
      id: item.publishedId,
      type: item.type,
      ...(target?.path.length ? {path: pathToString(target.path)} : {}),
    })
  }

  const publish = async () => {
    const result = await publishQuietly()
    toast.push(
      result.ok
        ? {status: 'success', title: `Published “${title}”`, description: REBUILD_NOTE}
        : {status: 'error', title: `Could not publish “${title}”`, description: result.error, duration: 10_000},
    )
  }
  const discard = async () => {
    setConfirm(null)
    const result = await runLocked('discard', 'discardChanges', () => ops.discardChanges.execute())
    if (!result.ok) toast.push({status: 'error', title: `Could not discard “${title}”`, description: result.error})
  }
  const deleteDraft = async () => {
    setConfirm(null)
    const result = await runLocked('delete', 'delete', () => ops.delete.execute())
    if (!result.ok) toast.push({status: 'error', title: `Could not delete “${title}”`, description: result.error})
  }

  const editedAt = lastEdit?.timestamp ?? item.updatedAt
  // Styled like the document pane's own footer ("(P) Edited 5 hr. ago"): a
  // small avatar and muted text, so it reads as provenance, not as content.
  const editorLine = (
    <Flex align="center" gap={2}>
      {lastEdit?.author && <UserAvatar user={lastEdit.author} size={0} />}
      <Text size={1} muted>
        edited <span title={formatStamp(editedAt)}>{timeAgo(editedAt)}</span>
        {lastEdit?.author && (
          <>
            {' by '}
            <EditorName id={lastEdit.author} />
          </>
        )}
      </Text>
    </Flex>
  )
  const liveLine = published ? (
    <>
      live version from{' '}
      <span title={formatStamp(published._updatedAt)}>{formatDay(published._updatedAt)}</span>
    </>
  ) : (
    'not on the site yet'
  )
  const MAX_LINES = 5

  return (
    <Card padding={2} radius={2} border>
      <Stack gap={2}>
        <Flex align="center" gap={2}>
          <Box flex={1} style={{minWidth: 0}}>
            <PreviewCard
              as="button"
              onClick={open}
              padding={2}
              radius={2}
              tone="inherit"
              __unstable_focusRing
              style={{width: '100%', textAlign: 'left'}}
            >
              {doc ? (
                <Preview
                  value={doc as SanityDocument}
                  schemaType={schemaType}
                  layout="default"
                  status={
                    <Badge fontSize={0} tone={isNew ? 'primary' : 'default'}>
                      {isNew ? 'New' : schemaType.title || item.type}
                    </Badge>
                  }
                />
              ) : (
                <Text size={1}>{title}</Text>
              )}
            </PreviewCard>
          </Box>
          <MenuButton
            id={`queue-menu-${item.publishedId}`}
            button={
              <Button
                mode="bleed"
                icon={EllipsisHorizontalIcon}
                aria-label="More actions"
                disabled={busy !== null || locked}
              />
            }
            popover={{portal: true, placement: 'bottom-end'}}
            menu={
              <Menu>
                <MenuItem icon={EditIcon} text="Open" onClick={open} />
                {published && <MenuItem icon={RestoreIcon} text="See what changed" onClick={openChanges} />}
                <MenuDivider />
                {published ? (
                  <MenuItem
                    icon={TrashIcon}
                    tone="critical"
                    text="Discard changes"
                    disabled={ops.discardChanges.disabled !== false}
                    onClick={() => setConfirm('discard')}
                  />
                ) : (
                  <MenuItem
                    icon={TrashIcon}
                    tone="critical"
                    text="Delete draft"
                    disabled={ops.delete.disabled !== false}
                    onClick={() => setConfirm('delete')}
                  />
                )}
              </Menu>
            }
          />
          <Button
            icon={PublishIcon}
            mode="ghost"
            tone="positive"
            text={compact ? undefined : busy === 'publish' ? 'Publishing…' : 'Publish'}
            aria-label="Publish"
            title="Publish"
            disabled={!canPublish}
            onClick={publish}
          />
        </Flex>

        <Flex align="center" gap={2} paddingX={2} wrap="wrap">
          {editorLine}
          {!compact && (
            <Text size={1} muted>
              {where ? `· ${where} ` : ''}· {liveLine}
            </Text>
          )}
        </Flex>

        {!compact && !checking && draft && published && (
          <Box paddingX={2}>
            <Text size={1} muted>
              {changed.fields.length === 0
                ? 'Same as the live site.'
                : `Changed: ${changed.fields.slice(0, MAX_LINES).join(', ')}${
                    changed.fields.length > MAX_LINES ? ` +${changed.fields.length - MAX_LINES} more` : ''
                  }`}
            </Text>
          </Box>
        )}

        {!checking && errors.length > 0 && (
          <Flex align="flex-start" gap={2} paddingX={2} wrap="wrap">
            <Box paddingTop={1}>
              <Badge tone="critical" fontSize={0}>
                Needs fixing
              </Badge>
            </Box>
            <Box flex={1} style={{minWidth: 160}}>
              <Stack gap={2}>
                {errors.slice(0, MAX_LINES).map((marker, index) => (
                  <Text key={index} size={1}>
                    {marker.message}
                    {!compact && marker.path?.length ? ` (${pathLabel(marker.path, fieldTitles)})` : ''}
                  </Text>
                ))}
                {errors.length > MAX_LINES && (
                  <Text size={1} muted>
                    +{errors.length - MAX_LINES} more
                  </Text>
                )}
              </Stack>
            </Box>
            <Button mode="bleed" fontSize={1} padding={2} text="Fix it" onClick={fixFirstError} />
          </Flex>
        )}

        {!checking && errors.length === 0 && publishDisabled && (
          <Box paddingX={2}>
            <Text size={1} muted>
              {DISABLED_REASONS[publishDisabled] || publishDisabled}
            </Text>
          </Box>
        )}

        {checking && (
          <Flex align="center" gap={2} paddingX={2}>
            <Spinner muted />
            <Text size={1} muted>
              Checking…
            </Text>
          </Flex>
        )}
      </Stack>

      {confirm && (
        <Dialog
          id={`queue-confirm-${item.publishedId}`}
          header={confirm === 'discard' ? `Discard changes to “${title}”?` : `Delete the draft “${title}”?`}
          width={0}
          onClose={() => setConfirm(null)}
          footer={
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button text="Cancel" onClick={() => setConfirm(null)} />
              <Button
                mode="ghost"
                tone="critical"
                icon={TrashIcon}
                text={confirm === 'discard' ? 'Discard changes' : 'Delete draft'}
                onClick={confirm === 'discard' ? discard : deleteDraft}
              />
            </Flex>
          }
        >
          <Box padding={4}>
            <Text size={1}>
              {confirm === 'discard'
                ? 'This throws away the unpublished edits and puts the document back to the version on the live site. This cannot be undone.'
                : 'This document has never been published, so deleting the draft removes it completely. This cannot be undone.'}
            </Text>
          </Box>
        </Dialog>
      )}
    </Card>
  )
}

function EditorName({id}: {id: string}) {
  const [user, loading] = useUser(id)
  if (loading) return <>…</>
  return <>{user?.displayName || 'someone'}</>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isObjectType(type: SchemaType): type is ObjectSchemaType {
  return type.jsonType === 'object'
}

function fieldTitleMap(schemaType: SchemaType): Map<string, string> {
  const map = new Map<string, string>()
  if (isObjectType(schemaType)) {
    for (const field of schemaType.fields) map.set(field.name, field.type.title || field.name)
  }
  return map
}

function getAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, value)
}

/** A plain-text title for dialogs and toasts: the schema's preview title path,
 *  else the common title/name fields, else the id. */
function docTitle(doc: unknown, schemaType: SchemaType, fallback: string): string {
  if (!doc || typeof doc !== 'object') return fallback
  const select = isObjectType(schemaType) ? schemaType.preview?.select : undefined
  const titlePath = select && typeof select.title === 'string' ? select.title : undefined
  const candidates = [
    titlePath ? getAtPath(doc, titlePath) : undefined,
    (doc as Record<string, unknown>).title,
    (doc as Record<string, unknown>).name,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.replace(/<[^>]+>/g, '').trim()
  }
  return fallback
}

function pathLabel(path: Path, fieldTitles: Map<string, string>): string {
  return path
    .map((segment, index) => {
      if (typeof segment === 'string') return index === 0 ? fieldTitles.get(segment) || segment : segment
      if (typeof segment === 'number') return `[${segment}]`
      if (segment && typeof segment === 'object' && '_key' in segment) return `[${segment._key}]`
      return String(segment)
    })
    .join(' › ')
}
