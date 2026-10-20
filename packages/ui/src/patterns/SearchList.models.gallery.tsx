import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { SearchList, type SearchListItem } from './SearchList'

/**
 * One model of the story: made-up agents and providers ("Fake", "Relay", "Noord", "Zuid"), never a
 * real vendor's, with what a picker would say about it on the right.
 */
interface Model {
  id: string
  label: string
  agent: string
  /** The provider group inside an agent that reports its models in groups; none for a flat one. */
  provider?: string
  /** "denkt", the largest window, "standaard" — what the capabilities say, nothing else. */
  can?: string
}

/** Twelve models of one provider, the kind of list an agent over a relay really reports. */
const NOORD = [
  'Noord 5',
  'Noord 5 Mini',
  'Noord 5 Nano',
  'Noord 5 Codex',
  'Noord 4.1',
  'Noord 4.1 Mini',
  'Noord 4o',
  'Noord 4o Mini',
  'Noord o3',
  'Noord o3 Mini',
  'Noord o4 Mini',
  'Noord Open 120B',
]

/** Fourteen of another. */
const ZUID = [
  'Zuid Pro 2',
  'Zuid Flash 2',
  'Zuid Flash 2 Lite',
  'Zuid Pro 1.5',
  'Zuid Flash 1.5',
  'Zuid Coder',
  'Zuid Coder Mini',
  'Zuid Vision',
  'Zuid Large',
  'Zuid Medium',
  'Zuid Small',
  'Zuid Tiny',
  'Zuid Reasoner',
  'Zuid Reasoner Mini',
]

/**
 * Twenty-nine models in three groups: the length a searchable model picker was designed for.
 * The composer's model menu replaced that picker; this story stays as the
 * proof of what the pattern itself carries — trailing words, stars, headings that open — at length.
 */
const MODELS: Model[] = [
  { id: 'fake/small', label: 'Klein', agent: 'Fake' },
  { id: 'fake/large', label: 'Groot', agent: 'Fake', can: 'denkt · 1M' },
  { id: 'fake/steady', label: 'Vast', agent: 'Fake', can: 'denkt' },
  ...NOORD.map((label, index) => ({
    id: `relay/noord-${index}`,
    label,
    agent: 'Relay',
    provider: 'Noord',
    ...(index < 4 || index > 7 ? { can: 'denkt' } : {}),
  })),
  ...ZUID.map((label, index) => ({
    id: `relay/zuid-${index}`,
    label,
    agent: 'Relay',
    provider: 'Zuid',
    ...(index === 0 ? { can: 'standaard' } : index < 2 ? { can: 'denkt · 1M' } : {}),
  })),
]

/** The group a model stands under when no favourite or recent row repeats it. */
function groupOf(model: Model): string {
  return model.provider ? `${model.agent} · ${model.provider}` : model.agent
}

/**
 * The rows of the picker: favourites and recent on top — with the agent in front of the trailing
 * words, since no heading names it there — then every model once under its own group, and last an
 * agent that is not signed in, as a heading with its reason.
 */
function rows(
  favourites: ReadonlySet<string>,
  recent: readonly string[],
  toggle: (id: string) => void,
): SearchListItem[] {
  const row = (model: Model, group: string, prefix: string, withAgent: boolean) => {
    const trailing = withAgent ? [model.agent, model.can].filter(Boolean).join(' · ') : model.can
    return {
      id: `${prefix}${model.id}`,
      label: model.label,
      group,
      keywords: [model.agent, ...(model.provider ? [model.provider] : [])],
      ...(trailing ? { trailing } : {}),
      secondary: {
        label: 'Favourite',
        icon: 'star' as const,
        on: favourites.has(model.id),
        onRun: () => toggle(model.id),
      },
    }
  }
  const find = (id: string) => MODELS.find((model) => model.id === id)
  return [
    ...[...favourites].flatMap((id) => {
      const model = find(id)
      return model ? [row(model, 'Favourites', 'favourite:', true)] : []
    }),
    ...recent.flatMap((id) => {
      const model = find(id)
      return model && !favourites.has(id) ? [row(model, 'Recent', 'recent:', true)] : []
    }),
    ...MODELS.map((model) => row(model, groupOf(model), '', false)),
    { id: 'agent:anker', label: 'Anker', head: { reason: 'Not signed in', onOpen: () => {} } },
  ]
}

/** The panel of the picker at its own width, 320px. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div data-nt-panel className="w-80 rounded-lg border border-border bg-overlay p-1">
      {children}
    </div>
  )
}

/**
 * The picker with its favourites live: ⌘D or a click on a star moves a model in and out of them,
 * so the story can be tried by hand. `query` is typed into the real field, the way a keystroke
 * does it (see `useTypedQuery` in `SearchList.gallery.tsx`).
 */
function Picker({ query = '' }: { query?: string }) {
  const [favourites, setFavourites] = useState<ReadonlySet<string>>(
    () => new Set(['relay/noord-3', 'fake/large']),
  )
  const toggle = (id: string) =>
    setFavourites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!query) return
    const field = box.current?.querySelector('input')
    if (!field) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(field, query)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }, [query])
  return (
    <div ref={box}>
      <Panel>
        <SearchList
          labels={nl.list}
          items={rows(favourites, ['relay/zuid-0', 'fake/small'], toggle)}
          // The model in force, where it stands first: in the favourites.
          selectedId="favourite:relay/noord-3"
          onSelect={() => {}}
          label="Model"
          scroll
          secondaryKey="d"
        />
      </Panel>
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'SearchList, 29 models',
  states: {
    // The walk starts on the model in force, a favourite: its trailing words and its filled star
    // stand on the active fill, where nothing may be muted.
    'Favourites, recent, three groups and an agent that is not signed in': () => <Picker />,
    // A query flattens the list to the rows it finds, by the label or by the agent and provider,
    // and marks the label only.
    'A query over the model and its provider': () => <Picker query="zuid flash" />,
    // An agent that is not signed in can be searched for too: its heading is then the one stop of
    // the walk, reason and all on the active fill.
    'A query that finds the agent that is not signed in': () => <Picker query="anker" />,
  },
} satisfies Story
