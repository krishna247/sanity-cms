import {Box} from '@sanity/ui'
import type {UserComponent} from 'sanity/structure'
import {PublishingQueue} from './PublishingQueue'

// The queue as a Structure pane (Content → Publishing queue).
export const PublishingQueuePane: UserComponent = () => (
  <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
    <PublishingQueue layout="pane" />
  </Box>
)
