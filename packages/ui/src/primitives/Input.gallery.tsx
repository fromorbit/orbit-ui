import type { Story } from '../gallery/story'
import { Input } from './Input'

export default {
  group: 'primitives',
  title: 'Input',
  states: {
    Leeg: () => <Input label="Zoeken" placeholder="Zoek…" />,
    Ingevuld: () => <Input label="Zoeken" defaultValue="agents aansturen" />,
    'Met icoon': () => <Input label="Zoeken" icon="search" defaultValue="agent" />,
    Maten: () => (
      <div className="flex flex-wrap items-center gap-2">
        <Input label="Klein" size="sm" placeholder="Klein" />
        <Input label="Middel" placeholder="Middel" />
        <Input label="Groot" size="lg" placeholder="Groot" />
      </div>
    ),
    Uitgeschakeld: () => <Input label="Zoeken" disabled defaultValue="agent" />,
    // Last, so the states above keep their reference images.
    'Met icoon en een kruisje om te wissen': () => (
      <Input label="Zoeken" icon="search" clearLabel="Wissen" defaultValue="netwerk" />
    ),
    'Met een voor- en achtervoegsel': () => (
      <div className="flex flex-col gap-2">
        <Input label="Adres" prefix="https://" suffix=".halo.dev" defaultValue="winkel" />
        <Input label="Limiet" suffix="MB" defaultValue="512" inputMode="numeric" />
      </div>
    ),
    Ongeldig: () => <Input label="E-mailadres" aria-invalid defaultValue="noor@" />,
    // A column of fields in a table: a plane without a frame, the ring alone shows the focus.
    Vlak: () => (
      <div className="flex w-56 flex-col gap-1">
        <Input label="Naam van de eerste status" variant="tint" defaultValue="Te doen" />
        <Input label="Naam van de tweede status" variant="tint" defaultValue="Bezig" />
      </div>
    ),
  },
} satisfies Story
