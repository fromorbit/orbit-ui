import type { Story } from '../gallery/story'
import { IconButton } from './IconButton'
import { Input } from './Input'
import { Tabs } from './Tabs'

const appearanceTab = {
  id: 'appearance',
  label: 'Weergave',
  content: <p>Instellingen voor de weergave</p>,
}
const agentsTab = { id: 'agents', label: 'Agents', content: <p>Instellingen voor agents</p> }
const providersTab = {
  id: 'providers',
  label: 'Providers',
  content: <p>Instellingen voor providers</p>,
}
const tabs = [appearanceTab, agentsTab, providersTab]

const pillTabs = [
  {
    id: 'changes',
    label: 'Wijzigingen',
    icon: 'file-diff' as const,
    content: <p>Gewijzigde bestanden</p>,
  },
  { id: 'browser', label: 'Browser', icon: 'globe' as const, content: <p>Browser</p> },
  { id: 'terminal', label: 'Terminal', icon: 'terminal' as const, content: <p>Terminal</p> },
]

/** A page tab as core would report it: closable, its title data rather than catalogue text. */
const page = (id: string, label: string) => ({
  id,
  label,
  icon: 'globe' as const,
  closable: true,
  closeLabel: `Close ${label}`,
  content: <p>{label}</p>,
})

const changesPill = {
  id: 'changes',
  label: 'Wijzigingen',
  icon: 'file-diff' as const,
  content: <p>Gewijzigde bestanden</p>,
}

const noop = () => {}

export default {
  group: 'primitives',
  title: 'Tabs',
  states: {
    Default: () => (
      <div className="h-64">
        <Tabs label="Onderdelen van de instellingen" tabs={tabs} />
      </div>
    ),
    Horizontal: () => (
      <div className="h-64">
        <Tabs label="Onderdelen van het paneel" tabs={tabs} orientation="horizontal" />
      </div>
    ),
    Pill: () => (
      <div className="h-64">
        <Tabs
          label="Onderdelen van het paneel"
          tabs={pillTabs}
          orientation="horizontal"
          variant="pill"
          after={<IconButton icon="plus" label="Add tab" />}
        />
      </div>
    ),
    'One tab': () => (
      <div className="h-32">
        <Tabs
          label="Onderdelen van het paneel"
          tabs={[changesPill]}
          orientation="horizontal"
          variant="pill"
        />
      </div>
    ),
    'Long title': () => (
      <div className="h-32">
        <Tabs
          label="Onderdelen van het paneel"
          orientation="horizontal"
          variant="pill"
          onClose={noop}
          value="tab-1"
          tabs={[
            changesPill,
            page('tab-1', 'Een heel lange paginatitel die nooit op één pil past'),
          ]}
        />
      </div>
    ),
    Count: () => (
      <div className="h-32">
        <Tabs
          label="Onderdelen van het paneel"
          orientation="horizontal"
          variant="pill"
          tabs={[{ ...changesPill, count: 12 }]}
        />
      </div>
    ),
    'Closable, focused': () => (
      <div className="h-32">
        <Tabs
          label="Onderdelen van het paneel"
          orientation="horizontal"
          variant="pill"
          onClose={noop}
          value="tab-1"
          tabs={[changesPill, page('tab-1', 'Shop')]}
        />
      </div>
    ),
    // The right panel's strip: level with the title bar, a drag region, holding the corner where
    // Windows lays its window controls. Switch the platform to win32 to see the room it keeps at
    // its end; six pages then shrink to their cut titles instead of running under that room.
    'Title bar strip': () => (
      <div className="h-32 w-full max-w-[360px] border border-border">
        <Tabs
          label="Onderdelen van het paneel"
          orientation="horizontal"
          variant="pill"
          strip="titlebar"
          reserveWindowControls
          onClose={noop}
          value="tab-1"
          tabs={[
            changesPill,
            page('tab-1', 'Shop'),
            page('tab-2', 'Documentatie van het afrekenen'),
            page('tab-3', 'Dashboard'),
            page('tab-4', 'Status'),
            page('tab-5', 'Login'),
          ]}
          after={<IconButton icon="plus" label="Add tab" />}
        />
      </div>
    ),
    // The settings screen while it searches: a field above the list, the hits counted per tab,
    // and a tab without hits dimmed.
    'Field above, counts, dimmed': () => (
      <div className="h-64">
        <Tabs
          label="Onderdelen van de instellingen"
          before={<Input label="Search" placeholder="Search" icon="search" size="sm" />}
          tabs={[
            { ...appearanceTab, count: 3 },
            { ...agentsTab, count: 1 },
            { ...providersTab, dimmed: true },
          ]}
        />
      </div>
    ),
  },
} satisfies Story
