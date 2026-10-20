import type { Story } from '../gallery/story'
import { ResizeHandle } from './ResizeHandle'

/**
 * A handle beside a visible column, the way it sits against the right panel.
 *
 * The handle paints one grey line; without a column next to it a screenshot would record nothing
 * but that single stroke.
 */
function Stage({ value }: { value: number }) {
  return (
    <div className="flex h-40">
      <ResizeHandle
        label="Panel width"
        value={value}
        min={320}
        max={640}
        onValueChange={() => {}}
      />
      <div className="w-56 bg-surface" />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'ResizeHandle',
  states: {
    Default: () => <Stage value={360} />,
    'At its minimum': () => <Stage value={320} />,
    'At its maximum': () => <Stage value={640} />,
  },
} satisfies Story
