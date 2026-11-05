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
      <div className="w-56 bg-plane shadow-plane" />
    </div>
  )
}

export default {
  group: 'primitives',
  title: 'ResizeHandle',
  states: {
    Standaard: () => <Stage value={360} />,
    'Op het minimum': () => <Stage value={320} />,
    'Op het maximum': () => <Stage value={640} />,
  },
} satisfies Story
