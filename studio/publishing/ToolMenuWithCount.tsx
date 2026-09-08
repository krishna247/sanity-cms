import type {ToolMenuProps} from 'sanity'
import {useDraftCount} from './useDrafts'

// The Studio's top-bar tool menu, with the number of documents waiting to be
// published folded into the Publishing tab's title ("Publishing (3)"). Tool
// titles are static config, and the desktop menu renders titles without icons,
// so this is the one place the count can live where every tool can see it.
export function ToolMenuWithCount(props: ToolMenuProps) {
  const count = useDraftCount()
  const tools = props.tools.map((tool) =>
    tool.name === 'publishing' && count > 0 ? {...tool, title: `Publishing (${count})`} : tool,
  )
  return props.renderDefault({...props, tools})
}
