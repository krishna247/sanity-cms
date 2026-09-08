import {Box} from '@sanity/ui'
import {PublishIcon} from '@sanity/icons'
import type {Tool} from 'sanity'
import {PublishingQueue} from './PublishingQueue'

// The "Publishing" tab in the Studio's top bar: the queue with room to breathe,
// reachable from Presentation as well as Structure. The tab title carries the
// number of documents waiting (ToolMenuWithCount), visible from every tool.
export function PublishingTool() {
  return (
    <Box style={{height: '100%', overflow: 'auto'}}>
      <Box padding={[3, 4, 5]} style={{maxWidth: 1040, margin: '0 auto'}}>
        <PublishingQueue layout="tool" />
      </Box>
    </Box>
  )
}

export const publishingTool: Tool = {
  name: 'publishing',
  title: 'Publishing',
  icon: PublishIcon,
  component: PublishingTool,
}
