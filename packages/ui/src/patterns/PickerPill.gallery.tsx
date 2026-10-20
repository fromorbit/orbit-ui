import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { PathLabel } from './PathLabel'
import { PickerPill } from './PickerPill'
import type { SearchListItem } from './SearchList'

/** Paths, never a home directory: a fixture with one would leak whoever recorded it. */
const PROJECTS: SearchListItem[] = [
  { id: 'shop', label: 'webshop', detail: <PathLabel path="/work/klanten/webshop" /> },
  { id: 'nt', label: 'nt-agent', detail: <PathLabel path="/work/nt-agent" /> },
  { id: 'ds', label: 'design system', detail: <PathLabel path="/work/klanten/atlas/ds" /> },
  { id: 'docs', label: 'docs', detail: <PathLabel path="/work/docs" /> },
  { id: 'old', label: 'legacy importer', disabled: true },
]

const AGENTS: SearchListItem[] = [
  { id: 'claude', label: 'Claude Code' },
  { id: 'fake', label: 'Fake agent' },
]

const MODELS: SearchListItem[] = [
  { id: 'default', label: 'Standaard' },
  { id: 'small', label: 'Fake klein' },
  { id: 'large', label: 'Fake groot' },
]

/**
 * A pill that remembers what it was handed, the way every caller does.
 *
 * The list is the caller's, so the state lives here: choosing a row must really change what the
 * pill says, or the story would only ever show one half of the control.
 */
function Project({ action }: { action?: boolean }) {
  const [id, setId] = useState('shop')
  const [busy, setBusy] = useState(false)
  const label = PROJECTS.find((item) => item.id === id)?.label ?? ''
  // The folder dialog of the host comes back, so the story's does too: a one-way `busy` would let
  // a reader who tries the action row lock the list for good, and the state it is meant to show
  // would be the only one left.
  useEffect(() => {
    if (!busy) return
    const timer = setTimeout(() => setBusy(false), 1200)
    return () => clearTimeout(timer)
  }, [busy])
  return (
    <PickerPill
      listLabels={nl.list}
      label="Project"
      value={label}
      icon="folder"
      items={PROJECTS}
      selectedId={id}
      onSelect={setId}
      {...(action
        ? {
            action: {
              label: 'Add folder…',
              icon: 'plus',
              shortcut: '⌘O',
              busy,
              onRun: () => setBusy(true),
            },
          }
        : {})}
    />
  )
}

/**
 * A box tall enough to hold its own open panel.
 *
 * A screenshot reference is clipped to the state's box, and the panel floats: without the height it
 * would hang over the state below this one and show up in that state's image instead of this one's.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className="h-72 w-72">{children}</div>
}

/**
 * Opens the one pill that stands open at mount, because a story cannot press a key.
 *
 * `PickerPill` owns whether its panel is up — the caller has nothing to decide there, and a prop
 * for it would exist only for this story — so this state activates the trigger the way a reader
 * does. `HTMLElement.click()` dispatches no pointer event, so the window stays in keyboard mode and
 * the focus ring this story records is the one a reader gets.
 *
 * Only one state per story may do this: a second panel takes the focus, and a panel that loses the
 * focus closes, so two of them standing open would leave none.
 */
function useOpenedPill() {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const trigger = box.current?.querySelector('button')
    // Focused first, then activated, exactly in that order — that is what a keypress does, and a
    // layer hands the focus back to whatever held it before it opened. Without the `focus()` that
    // is the body, and a test that closes this panel and immediately opens another one races the
    // restoration: the new panel loses the focus it just took and dismisses itself.
    trigger?.focus()
    trigger?.click()
  }, [])
  return box
}

function Opened() {
  const box = useOpenedPill()
  const [id, setId] = useState('claude')
  return (
    <Stage>
      <div ref={box}>
        <PickerPill
          listLabels={nl.list}
          label="Agent"
          value={AGENTS.find((item) => item.id === id)?.label ?? ''}
          items={AGENTS}
          selectedId={id}
          onSelect={setId}
          searchable={false}
        />
      </div>
    </Stage>
  )
}

/**
 * The toolbar of a composer that has run out of room: every pill gives up a little.
 *
 * Two rules meet here. The narrow cap (104px) holds an agent or a model, which are short by nature,
 * while the project keeps the wide one (160px) because a directory name is what a reader needs in
 * full. And a cap is a maximum, not a width: the row is `min-w-0` and the pills may shrink, so in a
 * box this tight all three truncate well before their cap. Without that the row would not wrap but
 * simply run past its own right edge — the border is where the send button would stand.
 */
function Tight() {
  return (
    <div className="flex w-80 items-center gap-1 rounded-lg border border-border bg-surface p-2">
      <div className="flex min-w-0 items-center gap-1">
        <PickerPill
          listLabels={nl.list}
          label="Project"
          value="atlas-checkout-payments"
          icon="folder"
          items={PROJECTS}
          selectedId="shop"
          onSelect={() => {}}
        />
        <PickerPill
          listLabels={nl.list}
          label="Agent"
          value="An agent with a long name"
          items={AGENTS}
          selectedId="claude"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
        />
        <PickerPill
          listLabels={nl.list}
          label="Model"
          value="A model with a long label"
          items={MODELS}
          selectedId="large"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
        />
      </div>
    </div>
  )
}

const ACCESS: SearchListItem[] = [
  { id: 'ask', label: 'vraag het mij' },
  { id: 'edits', label: 'bewerkingen' },
  { id: 'full', label: 'volledig' },
]

/**
 * The two settings that hang on a model, in one list with a group each.
 *
 * Invented names, as everywhere in this file: what the toolbar shows here is the shape of such a
 * list, not the vocabulary of any one agent.
 */
const REASONING: SearchListItem[] = [
  { id: 'e:laag', label: 'Laag', group: 'Redeneren', selected: false },
  { id: 'e:middel', label: 'Middel', group: 'Redeneren', selected: true },
  { id: 'e:hoog', label: 'Hoog', group: 'Redeneren', selected: false },
  { id: 'c:basis', label: 'Basis', group: 'Context', selected: false },
  { id: 'c:ruim', label: 'Ruim', group: 'Context', selected: true },
]

/**
 * The three pills of a chat, with the access level as the one that may give way.
 *
 * The row the composer really builds: the agent and the model in one wide pill, the reasoning level
 * and the context size in one narrow pill that names both values, and the access level, which is
 * the only one that collapses to its icon. The project is not here — it has a line of its own under
 * the surface, which is the state at the foot of this story.
 *
 * The same row twice below, in two boxes of a different width: no prop says whether the last pill
 * shows its word, so the two states can only differ in the room they have.
 */
function ChatPills() {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <PickerPill
        listLabels={nl.list}
        label="Model"
        value="Fake agent · Fake groot"
        items={MODELS}
        selectedId="large"
        onSelect={() => {}}
        searchable={false}
      />
      <PickerPill
        listLabels={nl.list}
        label="Redeneren"
        value="Middel · Ruim"
        items={REASONING}
        selectedId="middel:ruim"
        onSelect={() => {}}
        searchable={false}
        width="narrow"
      />
      <PickerPill
        listLabels={nl.list}
        label="Toegang"
        value="volledig"
        tone="attention"
        collapse
        icon="shield-off"
        items={ACCESS}
        selectedId="full"
        onSelect={() => {}}
        searchable={false}
        width="narrow"
      />
    </div>
  )
}

/**
 * The composer's surface, at the width it has in a window of 900px: a toolbar of 562px.
 *
 * The same 12px of padding and 1px border as the real thing, so the number inside the box is the
 * one a container query sees: 588 − 24 − 2 = 562, below the 588px at which the access level gives
 * way. The container stands on the toolbar, never on the box of pills — that box is a
 * shrink-to-fit flex item and would measure its own width, which is then zero — so the story
 * brings a toolbar of its own rather than a pill made to collapse for the gallery alone.
 */
function TightToolbar() {
  return (
    <div className="w-[588px] rounded-lg border border-border bg-surface p-3">
      <div className="@container/toolbar flex items-center gap-1">
        <ChatPills />
      </div>
    </div>
  )
}

/** The same surface at the column's full width (768px), where the toolbar is 742px. */
function RoomyToolbar() {
  return (
    <div className="w-[768px] rounded-lg border border-border bg-surface p-3">
      <div className="@container/toolbar flex items-center gap-1">
        <ChatPills />
      </div>
    </div>
  )
}

/**
 * The project under the composer's surface: the one pill with a line to itself.
 *
 * `width="free"` is what that line is for. A name that loses its tail at the 160px cap of a
 * toolbar pill — the state "A long value" shows exactly that — stands here whole, because there
 * is nothing beside it to share the room with. The box above it is the composer's surface at the
 * width it has in a 900px window, so the icon can be seen standing under the text inside it.
 */
function ProjectLine() {
  return (
    <div className="w-[588px]">
      <div className="rounded-lg border border-border bg-surface p-3 text-[13px] text-muted">
        Ask for changes…
      </div>
      <div className="mt-2 flex h-6 items-center pl-[5px]">
        <PickerPill
          listLabels={nl.list}
          label="Project"
          value="atlas-checkout-payments-refactor"
          icon="folder"
          items={PROJECTS}
          selectedId="shop"
          onSelect={() => {}}
          width="free"
        />
      </div>
    </div>
  )
}

/**
 * All three forms of a collapsed pill, and one beside them that does not collapse.
 *
 * The comparison is the point: at this width the model pill still shows its value, because it was
 * never asked to give way. What the other three have in common is that the icon and the colour
 * stay, and that the name still says which level applies — the two controls carry it in their
 * `aria-label`, the quiet one in text that has left the screen but not the document.
 */
function CollapsedForms() {
  return (
    <div className="w-[420px] rounded-lg border border-border bg-surface p-3">
      <div className="@container/toolbar flex items-center gap-1">
        <PickerPill
          listLabels={nl.list}
          label="Toegang"
          value="bewerkingen"
          collapse
          icon="pencil"
          items={ACCESS}
          selectedId="edits"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
        />
        <PickerPill
          listLabels={nl.list}
          label="Toegang"
          value="volledig"
          tone="attention"
          collapse
          icon="shield-off"
          items={ACCESS}
          selectedId="full"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
        />
        <PickerPill
          listLabels={nl.list}
          label="Toegang"
          value="volledig"
          tone="attention"
          collapse
          icon="shield-off"
          items={ACCESS}
          selectedId="full"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
          readOnly
        />
        <PickerPill
          listLabels={nl.list}
          label="Model"
          value="Standaard"
          items={MODELS}
          selectedId="default"
          onSelect={() => {}}
          searchable={false}
          width="narrow"
        />
      </div>
    </div>
  )
}

/** The toolbar of the composer: four choices, 4px apart, all of them 24px. */
function Toolbar() {
  const [model, setModel] = useState('default')
  const [agent, setAgent] = useState('claude')
  return (
    <div className="flex items-center gap-1">
      <Project />
      <PickerPill
        listLabels={nl.list}
        label="Agent"
        value={AGENTS.find((item) => item.id === agent)?.label ?? ''}
        items={AGENTS}
        selectedId={agent}
        onSelect={setAgent}
        searchable={false}
      />
      <PickerPill
        listLabels={nl.list}
        label="Model"
        value={MODELS.find((item) => item.id === model)?.label ?? ''}
        items={MODELS}
        selectedId={model}
        onSelect={setModel}
        searchable={false}
      />
      <PickerPill
        listLabels={nl.list}
        label="Toegang"
        value="volledig"
        tone="attention"
        icon="alert-triangle"
        items={[
          { id: 'ask', label: 'Vraag het mij' },
          { id: 'full', label: 'volledig' },
        ]}
        selectedId="full"
        onSelect={() => {}}
        searchable={false}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'PickerPill',
  states: {
    'At rest': () => <Project action />,
    Open: Opened,
    'Read-only, beside the pill it replaces': () => (
      <div className="flex flex-col items-start gap-1">
        <Project />
        <PickerPill
          listLabels={nl.list}
          label="Project"
          value="webshop"
          icon="folder"
          items={PROJECTS}
          selectedId="shop"
          onSelect={() => {}}
          readOnly
        />
      </div>
    ),
    Disabled: () => (
      <PickerPill
        listLabels={nl.list}
        label="Model"
        value="Fake groot"
        items={MODELS}
        selectedId="large"
        onSelect={() => {}}
        disabledReason="You cannot switch models during a turn"
      />
    ),
    Attention: () => (
      <PickerPill
        listLabels={nl.list}
        label="Toegang"
        value="volledig"
        tone="attention"
        icon="alert-triangle"
        items={[
          { id: 'ask', label: 'Vraag het mij' },
          { id: 'full', label: 'volledig' },
        ]}
        selectedId="full"
        onSelect={() => {}}
        searchable={false}
      />
    ),
    // Long enough to pass the 160px cap by a comfortable margin: this state exists to show a value
    // losing its tail, so a name that happens to fit would prove nothing at all.
    'A long value': () => (
      <PickerPill
        listLabels={nl.list}
        label="Project"
        value="atlas-checkout-payments-refactor"
        icon="folder"
        items={PROJECTS}
        selectedId="shop"
        onSelect={() => {}}
      />
    ),
    'Four in a row': Toolbar,
    'Three in a row that is too tight for them': Tight,
    'Collapsing, in a toolbar with no room left': TightToolbar,
    'The same toolbar once the window is wide': RoomyToolbar,
    'Collapsed: every form, beside a pill that keeps its value': CollapsedForms,
    // Last on the page on purpose: a state inserted higher up moves every state under it, and an
    // element screenshot of a moved box rasterises a whisker differently — five references would
    // change for a story that did not.
    'Under the composer, with a line to itself': ProjectLine,
    // After the last state rather than among the others, for the reason given above. The scope
    // picker at the head of the changes tab: no fill, no border, the value in the foreground.
    'Plain, at the head of a panel': () => (
      <PickerPill
        listLabels={nl.list}
        frame="plain"
        label="Bereik"
        value="Deze chat"
        items={[
          { id: 'chat', label: 'Deze chat' },
          { id: 'branch', label: 'Hele branch' },
        ]}
        selectedId="chat"
        onSelect={() => {}}
        searchable={false}
        width="narrow"
      />
    ),
  },
} satisfies Story
