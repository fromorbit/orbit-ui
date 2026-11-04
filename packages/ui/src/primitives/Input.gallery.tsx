import type { Story } from '../gallery/story'
import { Input } from './Input'

export default {
  group: 'primitives',
  title: 'Input',
  states: {
    Empty: () => <Input label="Zoeken" placeholder="Zoek…" />,
    Filled: () => <Input label="Zoeken" defaultValue="agents aansturen" />,
    'With icon': () => <Input label="Zoeken" icon="search" defaultValue="agent" />,
    Sizes: () => (
      <div className="flex items-center gap-2">
        <Input label="Klein" size="sm" placeholder="Klein" />
        <Input label="Middel" placeholder="Middel" />
        <Input label="Groot" size="lg" placeholder="Groot" />
      </div>
    ),
    Disabled: () => <Input label="Zoeken" disabled defaultValue="agent" />,
    // Last, so the states above keep their reference images.
    'With icon and a cross to clear': () => (
      <Input label="Zoeken" icon="search" clearLabel="Wissen" defaultValue="netwerk" />
    ),
    'With a prefix and a suffix': () => (
      <div className="flex flex-col gap-2">
        <Input label="Adres" prefix="https://" suffix=".halo.dev" defaultValue="winkel" />
        <Input label="Limiet" suffix="MB" defaultValue="512" inputMode="numeric" />
      </div>
    ),
    Invalid: () => <Input label="E-mailadres" aria-invalid defaultValue="noor@" />,
  },
} satisfies Story
