import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { PathLabel } from './PathLabel'
import { SearchList, type SearchListItem } from './SearchList'

const PROJECTS: SearchListItem[] = [
  { id: 'nt', label: 'nt-agent' },
  { id: 'ds', label: 'design system' },
  { id: 'shop', label: 'webshop' },
  { id: 'docs', label: 'docs' },
  { id: 'old', label: 'legacy importer', disabled: true },
]

const MODELS: SearchListItem[] = [
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'opus', label: 'Opus' },
  { id: 'haiku', label: 'Haiku' },
]

/** The four access levels, with the kind of sentence a stacked row exists for. */
const LEVELS: SearchListItem[] = [
  {
    id: 'manual',
    label: 'Handmatig',
    icon: 'hand',
    detail: 'Vraagt het voor commando’s en wijzigingen in bestanden.',
  },
  {
    id: 'edits',
    label: 'Bewerken',
    icon: 'pencil',
    detail: 'Bewerkt bestanden in het project zonder te vragen; vraagt het voor de rest.',
  },
  {
    id: 'auto',
    label: 'Automatisch',
    icon: 'sparkles',
    detail: 'De agent beoordeelt zelf welke routinestappen geen vraag nodig hebben.',
  },
  { id: 'full', label: 'Volledig', icon: 'shield-off', detail: 'Vraagt niets.' },
]

/**
 * Two settings in one panel: a group each, one row in force per group, and the value the provider
 * applies when nothing is asked marked as such.
 *
 * The shape of the reasoning pill of the composer. It is the one list that holds more than one
 * choice, so its rows say themselves which are ticked — and the tag on the row the keyboard starts
 * on is what keeps the "nothing muted on the active fill" walk honest about a badge.
 */
const SETTINGS: SearchListItem[] = [
  { id: 'effort-low', label: 'Laag', group: 'Redeneren', selected: false },
  { id: 'effort-medium', label: 'Middel', group: 'Redeneren', selected: true, tag: 'Standaard' },
  { id: 'effort-high', label: 'Hoog', group: 'Redeneren', selected: false },
  { id: 'window-base', label: 'Basis', group: 'Context', selected: false, tag: 'Standaard' },
  { id: 'window-wide', label: 'Ruim', group: 'Context', selected: true },
]

const GROUPED: SearchListItem[] = [
  { id: 'nt', label: 'nt-agent', group: 'Recent' },
  { id: 'ds', label: 'design system', group: 'Recent' },
  { id: 'shop', label: 'webwinkel', group: 'Alle projecten' },
  { id: 'docs', label: 'docs', group: 'Alle projecten' },
  { id: 'scratch', label: 'kladblok', group: 'Alle projecten' },
]

/**
 * What the project list of the composer really holds: a name, the folder it sits in, and the whole
 * path out of sight in `title`. Never a home directory — a fixture with one leaks who recorded it.
 */
const WORKSPACES: SearchListItem[] = [
  { id: 'nt', label: 'nt-agent', detail: 'work', title: '/work/nt-agent' },
  {
    id: 'ds',
    label: 'design system',
    detail: 'atlas',
    title: '/work/klanten/atlas/design',
  },
  {
    id: 'shop',
    label: 'webshop',
    detail: 'checkouts',
    title: '/work/klanten/atlas/checkouts/webshop-frontend',
  },
  { id: 'docs', label: 'docs', detail: 'work', title: '/work/docs' },
]

/** Paths, never a home directory: a fixture with one would leak whoever recorded it. */
const WITH_PATHS: SearchListItem[] = [
  {
    id: 'nt',
    label: 'nt-agent',
    icon: 'message-circle',
    detail: <PathLabel path="/work/nt-agent" />,
  },
  {
    id: 'ds',
    label: 'design system',
    icon: 'message-circle',
    detail: <PathLabel path="/work/klanten/atlas/design" />,
  },
  {
    id: 'shop',
    label: 'webshop',
    icon: 'message-circle',
    detail: <PathLabel path="/work/klanten/atlas/checkouts/webshop-frontend" />,
  },
]

/**
 * The frame a picker really stands in: the panel of a `Popover`, at the width one gets in the
 * composer. Without it a list would be measured against the whole stage and never have to truncate.
 */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div data-nt-panel className="w-64 rounded-lg border border-border bg-overlay p-1">
      {children}
    </div>
  )
}

/**
 * Types into the real field, because a story cannot press a key.
 *
 * `SearchList` owns its query — there is no prop for it, deliberately: a picker starts fresh every
 * time it opens. So the states that only exist while something is typed drive the field the way a
 * keystroke does: through the value setter React's own change tracking watches, followed by the
 * `input` event it listens for. Anything cheaper (assigning `value`) is swallowed by React.
 */
function useTypedQuery(text: string) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const field = box.current?.querySelector('input')
    if (!field) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }, [text])
  return box
}

/**
 * Puts the caret in the search field, because a story cannot press a key.
 *
 * This is the one state that records what a reader sees the instant a pill opens: the focus is in
 * the field from that moment, and nothing in the panel may light up because of it. `preventScroll`,
 * or mounting this state would drag the story out from under the reader.
 *
 * Only one state per story may do this; a second would simply take the focus from the first.
 */
function useFocusedField() {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    box.current?.querySelector('input')?.focus({ preventScroll: true })
  }, [])
  return box
}

/** The project panel of the composer, exactly as a pill opens it. */
function Projects() {
  const box = useFocusedField()
  return (
    <div ref={box}>
      <Panel>
        <SearchList
          labels={nl.list}
          items={WORKSPACES}
          selectedId="ds"
          onSelect={() => {}}
          label="Projecten"
          action={{ label: 'Map toevoegen…', icon: 'plus', shortcut: '⌘O', onRun: () => {} }}
        />
      </Panel>
    </div>
  )
}

function Chosen({ items, label }: { items: SearchListItem[]; label: string }) {
  const [chosen, setChosen] = useState('nt')
  return (
    <Panel>
      <SearchList
        labels={nl.list}
        items={items}
        selectedId={chosen}
        onSelect={setChosen}
        label={label}
      />
    </Panel>
  )
}

function Searched({ query, items }: { query: string; items: SearchListItem[] }) {
  const box = useTypedQuery(query)
  return (
    <div ref={box}>
      <Panel>
        <SearchList labels={nl.list} items={items} onSelect={() => {}} label="Projecten" />
      </Panel>
    </div>
  )
}

/**
 * The one shape in which the walk stands on the action row without a key being pressed.
 *
 * A query nothing matches leaves "Add folder…" as the only thing left to walk to, so it is active
 * from the first render — which is the state its shortcut chip has to survive: a muted chip on the
 * active fill is 3.40:1.
 */
function ActionWalked() {
  const box = useTypedQuery('kubernetes')
  return (
    <div ref={box}>
      <Panel>
        <SearchList
          labels={nl.list}
          items={PROJECTS}
          selectedId="nt"
          onSelect={() => {}}
          label="Projecten"
          action={{ label: 'Map toevoegen…', icon: 'plus', shortcut: '⌘O', onRun: () => {} }}
        />
      </Panel>
    </div>
  )
}

/** The action row with something to show for itself: a counter that Enter and a click both move. */
function WithAction({ busy }: { busy: boolean }) {
  const [added, setAdded] = useState(0)
  return (
    <div className="flex w-64 flex-col gap-2">
      <Panel>
        <SearchList
          labels={nl.list}
          items={PROJECTS.slice(0, 3)}
          selectedId="nt"
          onSelect={() => {}}
          label="Projecten"
          action={{
            label: 'Map toevoegen…',
            icon: 'plus',
            shortcut: '⌘O',
            busy,
            onRun: () => setAdded((count) => count + 1),
          }}
        />
      </Panel>
      <p className="m-0 text-[12px] text-muted">
        Mappen toegevoegd: <span data-nt-action-count>{added}</span>
      </p>
    </div>
  )
}

/**
 * Rows the caller already filtered and marked, with the key of a command on the right: the shape
 * of the command palette, where fuzzy matching happens outside the list.
 */
const COMMANDS: SearchListItem[] = [
  {
    id: 'chat',
    label: 'Eerste meting',
    group: 'Gesprekken',
    icon: 'message-circle',
    detail: 'webwinkel',
    ranges: [[0, 6]],
  },
  {
    id: 'new',
    label: 'Nieuw gesprek',
    group: 'Opdrachten',
    icon: 'command',
    shortcut: 'chat.new',
    ranges: [[6, 7]],
  },
  {
    id: 'panel',
    label: 'Paneel',
    group: 'Opdrachten',
    icon: 'command',
    shortcut: 'panel.toggle',
    ranges: [[0, 1]],
  },
  {
    id: 'sidebar',
    label: 'Zijbalk',
    group: 'Opdrachten',
    icon: 'command',
    shortcut: 'sidebar.toggle',
  },
]

export default {
  group: 'patterns',
  title: 'SearchList',
  states: {
    'Met een zoekveld': () => <Chosen items={PROJECTS} label="Projecten" />,
    // The panel a reader really opens: the caret is already in the field, a row is already active,
    // and neither of those two facts paints a frame anywhere.
    'Projecten, met de focus in het veld': Projects,
    'Zonder zoekveld': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={MODELS}
          selectedId="opus"
          onSelect={() => {}}
          label="Model"
          searchable={false}
        />
      </Panel>
    ),
    // The one shape in which the list itself is the tab stop and has no active row to show the
    // focus with: then, and only then, it wears a ring of its own.
    'Zonder zoekveld, en niets te kiezen': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={[]}
          onSelect={() => {}}
          label="Model"
          searchable={false}
        />
      </Panel>
    ),
    Groepen: () => (
      <Panel>
        <SearchList labels={nl.list} items={GROUPED} onSelect={() => {}} label="Projecten" />
      </Panel>
    ),
    'Paden als detail': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={WITH_PATHS}
          selectedId="ds"
          onSelect={() => {}}
          label="Projecten"
        />
      </Panel>
    ),
    'Een zoekvraag, met de treffers gemarkeerd': () => <Searched query="s" items={PROJECTS} />,
    Laden: () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={[]}
          onSelect={() => {}}
          label="Projecten"
          state="loading"
        />
      </Panel>
    ),
    'Niets te kiezen': () => (
      <Panel>
        <SearchList labels={nl.list} items={[]} onSelect={() => {}} label="Projecten" />
      </Panel>
    ),
    'Geen resultaten': () => <Searched query="kubernetes" items={PROJECTS} />,
    Mislukt: () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={PROJECTS}
          onSelect={() => {}}
          label="Projecten"
          state="error"
        />
      </Panel>
    ),
    'Met een actierij': () => <WithAction busy={false} />,
    'De actie wacht': () => <WithAction busy />,
    // Nothing matched, so the row that is not a choice is the only place left to stand: the fill
    // reaches the shortcut chip, which has to come forward with it.
    'De actierij heeft de focus': ActionWalked,
    'Gefilterd door de aanroeper, met toetsen': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={COMMANDS}
          filter={false}
          checkSlot={false}
          scroll
          onSelect={() => {}}
          label="Zoeken"
        />
      </Panel>
    ),
    // A remark about the list, not a row in it: the access level of a chat, where the agent
    // cannot do the one the settings ask for and the list is therefore shorter than it looks.
    'Met een melding boven de rijen': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={MODELS}
          selectedId="opus"
          onSelect={() => {}}
          label="Model"
          searchable={false}
          notice="Deze agent kan geen Sonnet; dit komt er het dichtst bij."
        />
      </Panel>
    ),
    // Two settings in one panel, which is the one list that holds more than one choice: a tick per
    // group, and a badge on the value the provider applies by itself. The walk starts on that
    // badged row on purpose — a tag is a run of text on the active fill like any other, and the
    // contrast walk has to be able to read it there. The caption is deliberately short: the story
    // is one `inline-block`, so its widest line sets the width of every state's reference image,
    // and a long one here would move seventeen pictures that have nothing to do with this.
    'Twee groepen, een gemarkeerde standaard': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={SETTINGS}
          selectedId="effort-medium"
          onSelect={() => {}}
          label="Reasoning"
          searchable={false}
        />
      </Panel>
    ),
    // The access level of a chat: the explanation is what the row is for, so it stands under the
    // label and wraps. The same panel width as every pill opens, which is where it has to fit.
    'Gestapeld: een uitleg onder elk label': () => (
      <Panel>
        <SearchList
          labels={nl.list}
          items={LEVELS}
          selectedId="manual"
          onSelect={() => {}}
          label="Access"
          searchable={false}
          layout="stacked"
        />
      </Panel>
    ),
  },
} satisfies Story
