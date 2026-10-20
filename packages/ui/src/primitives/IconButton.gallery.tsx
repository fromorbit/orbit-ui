import type { Story } from '../gallery/story'
import { IconButton } from './IconButton'

export default {
  group: 'primitives',
  title: 'IconButton',
  states: {
    Variants: () => (
      <div className="flex gap-2">
        <IconButton icon="plus" label="Add" variant="primary" />
        <IconButton icon="settings" label="Settings" variant="secondary" />
        <IconButton icon="x" label="Close" variant="ghost" />
      </div>
    ),
    Sizes: () => (
      // secondary, not ghost: a ghost button has no visible border, so the three sizes would be
      // hard to tell apart. The ghost look already has its own row under "Variants".
      <div className="flex items-center gap-2">
        <IconButton icon="x" label="Close" variant="secondary" size="sm" />
        <IconButton icon="x" label="Close" variant="secondary" size="md" />
        <IconButton icon="x" label="Close" variant="secondary" size="lg" />
      </div>
    ),
    // The tone colours the glyph, not the button, so it survives the hover colour of its variant.
    Tone: () => (
      <div className="flex gap-2">
        <IconButton icon="alert-triangle" label="Warn" />
        <IconButton icon="alert-triangle" label="Warn" tone="danger" />
      </div>
    ),
    Disabled: () => <IconButton icon="x" label="Close" disabled />,
    // Last, so it moves no reference above it: the sidebar's own `+` and gear.
    'Plain, beside a pressed ghost': () => (
      <div className="flex gap-2">
        <IconButton icon="panel-left" label="Sidebar" aria-pressed />
        <IconButton icon="plus" label="Add" variant="plain" />
        <IconButton icon="settings" label="Settings" variant="plain" />
      </div>
    ),
    // The "+" of the composer: a 28px circle in the strong border, the glyph muted;
    // beside it the square ghost it is otherwise, to show only the shape and the border differ.
    'Round and outlined': () => (
      <div className="flex items-center gap-2">
        <IconButton icon="plus" label="Add" shape="round" outlined />
        <IconButton icon="plus" label="Add" shape="round" />
        <IconButton icon="plus" label="Add" outlined />
        <IconButton icon="plus" label="Add" />
      </div>
    ),
  },
} satisfies Story
