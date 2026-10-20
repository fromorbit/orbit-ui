import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { uiWrapper } from '../testing/ui-wrapper'
import { SearchList, type SearchListItem } from './SearchList'

const PROJECTS: SearchListItem[] = [
  { id: 'nt', label: 'nt-agent' },
  { id: 'ds', label: 'design system' },
  { id: 'shop', label: 'webshop' },
]

const GROUPED: SearchListItem[] = [
  { id: 'nt', label: 'nt-agent', group: 'Recent' },
  { id: 'ds', label: 'design system', group: 'Recent' },
  { id: 'shop', label: 'webshop', group: 'Alles' },
  { id: 'docs', label: 'docs', group: 'Alles' },
]

const field = () => screen.getByRole('combobox', { name: 'Projecten' })
const option = (name: string | RegExp) => screen.getByRole('option', { name })
const activeOption = () =>
  document.getElementById(field().getAttribute('aria-activedescendant') ?? '')

afterEach(() => {
  vi.useRealTimers()
})

test('the list is a listbox of options, named by its label', () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  expect(screen.getByRole('listbox', { name: 'Projecten' })).toBeInTheDocument()
  expect(screen.getAllByRole('option')).toHaveLength(3)
  // The field says what it is and what it controls, so a screen reader reads a search that has a
  // list under it rather than a text box with nothing attached.
  expect(field()).toHaveAttribute('aria-autocomplete', 'list')
  expect(field()).toHaveAttribute('aria-expanded', 'true')
  expect(field().getAttribute('aria-controls')).toBe(
    screen.getByRole('listbox', { name: 'Projecten' }).id,
  )
})

test('only the current choice is selected', () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="ds"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  expect(option('design system')).toHaveAttribute('aria-selected', 'true')
  expect(option('nt-agent')).toHaveAttribute('aria-selected', 'false')
  // One choice per list here, and one choice per group in the list below: neither offers several
  // at once, so nothing in this component ever calls itself a multi-select listbox.
  expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-multiselectable')
  // And with one choice the tick is the selection itself; there is no second state to check.
  expect(option('design system')).not.toHaveAttribute('aria-checked')
})

test('a row the caller ticks itself is checked, and no row says anything about selection', () => {
  render(
    <SearchList
      labels={nl.list}
      items={[
        { id: 'low', label: 'Laag', group: 'Redeneren' },
        { id: 'high', label: 'Hoog', group: 'Redeneren', selected: true },
        { id: 'base', label: 'Basis', group: 'Context', selected: true },
      ]}
      selectedId="low"
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  // Two groups, one choice in each: a panel with two settings in it is one list with two ticks.
  // They are `aria-checked`, which `option` allows (axe-core 4.13.0, `axe.js`), because
  // "selected twice" would promise a list that takes several at once — and this one replaces the
  // choice of a group and closes.
  expect(option('Hoog')).toHaveAttribute('aria-checked', 'true')
  expect(option('Basis')).toHaveAttribute('aria-checked', 'true')
  expect(option('Laag')).toHaveAttribute('aria-checked', 'false')
  expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-multiselectable')
  // And `aria-selected` is left out altogether, `selectedId` notwithstanding. With both attributes
  // present every row here said "not selected" while one per group said "checked", so the row a
  // reader had just picked was announced as the one they had not. `option` requires neither
  // attribute (axe-core 4.13.0, `axe.js`: its entry has `allowedAttrs` and no `requiredAttrs`), and
  // which row the keyboard stands on is `aria-activedescendant`. `selectedId` keeps its other job,
  // which is closing the panel around this list when it changes from outside.
  for (const label of ['Laag', 'Hoog', 'Basis']) {
    expect(option(label), `${label} says nothing about selection`).not.toHaveAttribute(
      'aria-selected',
    )
  }
})

test('the walk starts on the ticked row, not on the id that matches no row', async () => {
  render(
    <SearchList
      labels={nl.list}
      items={[
        { id: 'low', label: 'Laag', group: 'Redeneren' },
        { id: 'medium', label: 'Midden', group: 'Redeneren', selected: true },
        { id: 'base', label: 'Basis', group: 'Context', selected: true },
      ]}
      // What a panel with two settings passes: both values in one id, which is no row at all.
      selectedId={'medium\u0000base'}
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  const listbox = screen.getByRole('listbox')
  listbox.focus()
  // The first ticked row of the list, so ↵ on an untouched panel repeats what the reader already
  // has. Starting at the top would send a level nobody chose the moment they pressed it.
  expect(
    document.getElementById(listbox.getAttribute('aria-activedescendant') ?? ''),
  ).toHaveTextContent('Midden')
})

test('a tag rides along in the row, and in the name the reader hears', () => {
  render(
    <SearchList
      labels={nl.list}
      items={[
        { id: 'low', label: 'Laag' },
        { id: 'medium', label: 'Midden', tag: 'Standaard' },
      ]}
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  const tagged = option(/Midden/)
  expect(tagged.querySelector('[data-nt-searchlist-tag]')).toHaveTextContent('Standaard')
  // Part of the row, not a decoration beside it: what marks a row as the provider's default is
  // exactly what a reader who cannot see the badge needs to hear.
  expect(tagged).toHaveTextContent('Standaard')
  expect(option('Laag').querySelector('[data-nt-searchlist-tag]')).toBeNull()
})

test('typing filters on the label: case does not matter and every word must occur', async () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  await userEvent.type(field(), 'SYS')
  expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual(['design system'])

  await userEvent.clear(field())
  await userEvent.type(field(), 'sign tem')
  // Two words, in the wrong order and neither of them whole: both still have to occur.
  expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual(['design system'])

  await userEvent.clear(field())
  await userEvent.type(field(), 'sign shop')
  expect(screen.queryAllByRole('option')).toHaveLength(0)
})

test('a detail is not searched, only the label is', async () => {
  // `detail` is a node, not a string — a `PathLabel`, a count, a provider's own word — so there is
  // nothing honest to match against; the rule is one the user can predict. The word below occurs
  // only in the detail, so a filter that read it too would keep this row standing.
  const items: SearchListItem[] = [{ id: 'nt', label: 'nt-agent', detail: 'webshop' }]
  render(<SearchList labels={nl.list} items={items} onSelect={() => {}} label="Projecten" />)
  expect(screen.getAllByRole('option')).toHaveLength(1)

  await userEvent.type(field(), 'webshop')
  expect(screen.queryAllByRole('option')).toHaveLength(0)
  expect(screen.getByRole('status')).toHaveTextContent('Geen treffers voor ‘webshop’')
})

test('the region that speaks is there before the query and says what happened after it', async () => {
  // A screen reader only announces a live region that was already in the document when its text
  // changed. A sentence that is mounted at the moment the rows disappear is therefore silent, and
  // the reader hears nothing at all about the keystroke that emptied the list.
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  const region = screen.getByRole('status')
  expect(region).toHaveTextContent('')

  await userEvent.type(field(), 'kubernetes')
  expect(screen.getByRole('status')).toBe(region)
  expect(region).toHaveTextContent('Geen treffers voor ‘kubernetes’')

  await userEvent.clear(field())
  expect(screen.getByRole('status')).toBe(region)
  expect(region).toHaveTextContent('')
})

test('a match is marked, and the label around it stays one piece of text', async () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  await userEvent.type(field(), 'sign')
  const row = screen.getByRole('option')
  expect(row.querySelector('mark')).toHaveTextContent('sign')
  // The mark is a highlight, not a word of its own. That the accessible name is still "design
  // system" is proven in the gallery: happy-dom has no user-agent stylesheet, so it reads `<mark>`
  // as a block and puts a space on either side of it, which no browser does.
  expect(row.textContent).toBe('design system')
})

test('every occurrence is marked, and overlapping words become one mark', async () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  await userEvent.type(field(), 's')
  const marksOf = (index: number) =>
    [...(screen.getAllByRole('option')[index]?.querySelectorAll('mark') ?? [])].map(
      (mark) => mark.textContent,
    )
  // "design system" holds three of them; a filter that marked only the first would look as if it
  // had found something the reader cannot see.
  expect(marksOf(0)).toEqual(['s', 's', 's'])

  await userEvent.clear(field())
  await userEvent.type(field(), 'sys system')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  // Overlapping words merge: two nested marks would print the overlap twice.
  expect(marksOf(0)).toEqual(['system'])
})

test('the arrows move the active option while the focus stays in the field', async () => {
  render(<SearchList labels={nl.list} items={GROUPED} onSelect={() => {}} label="Projecten" />)
  await userEvent.click(field())
  expect(activeOption()).toHaveTextContent('nt-agent')

  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  // The step that matters: the last row of the first group leads into the second group.
  expect(activeOption()).toHaveTextContent('webshop')
  expect(field()).toHaveFocus()

  await userEvent.keyboard('{ArrowUp}')
  expect(activeOption()).toHaveTextContent('design system')
})

test('Home and End jump to the ends of the walk, which does not wrap', async () => {
  render(<SearchList labels={nl.list} items={GROUPED} onSelect={() => {}} label="Projecten" />)
  await userEvent.click(field())
  await userEvent.keyboard('{End}')
  expect(activeOption()).toHaveTextContent('docs')
  await userEvent.keyboard('{ArrowDown}')
  expect(activeOption()).toHaveTextContent('docs')
  await userEvent.keyboard('{Home}')
  expect(activeOption()).toHaveTextContent('nt-agent')
  await userEvent.keyboard('{ArrowUp}')
  expect(activeOption()).toHaveTextContent('nt-agent')
})

test('Enter chooses the active option', async () => {
  const onSelect = vi.fn()
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={onSelect} label="Projecten" />)
  await userEvent.click(field())
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('ds')
})

test('a click chooses an option too', async () => {
  const onSelect = vi.fn()
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={onSelect} label="Projecten" />)
  await userEvent.click(option('webshop'))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('shop')
})

test('a disabled option is skipped and cannot be chosen', async () => {
  const onSelect = vi.fn()
  const items: SearchListItem[] = [
    { id: 'nt', label: 'nt-agent' },
    { id: 'ds', label: 'design system', disabled: true },
    { id: 'shop', label: 'webshop' },
  ]
  render(<SearchList labels={nl.list} items={items} onSelect={onSelect} label="Projecten" />)
  expect(option('design system')).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(field())
  await userEvent.keyboard('{ArrowDown}')
  expect(activeOption()).toHaveTextContent('webshop')
  await userEvent.click(option('design system'))
  expect(onSelect).not.toHaveBeenCalled()
})

test('the walk starts on the current choice, and on the first match while searching', async () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="shop"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  await userEvent.click(field())
  expect(activeOption()).toHaveTextContent('webshop')
  // Once there is a query, Enter must take what was searched for, not what was already chosen.
  await userEvent.type(field(), 'e')
  expect(activeOption()).toHaveTextContent('nt-agent')
})

test('a highlight the reader placed survives a keystroke that does not remove it', async () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="nt"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  await userEvent.click(field())
  await userEvent.keyboard('{End}')
  expect(activeOption()).toHaveTextContent('webshop')
  // Refining a query must not throw the highlight back to the top of the list every letter: the
  // row is still there, and the reader is looking at it. The query is a letter every project has,
  // so all three rows survive it — a query that leaves only `webshop` standing would make this
  // assertion true whatever the component did with the highlight.
  await userEvent.type(field(), 'e')
  expect(screen.getAllByRole('option')).toHaveLength(3)
  expect(activeOption()).toHaveTextContent('webshop')
})

test('a highlight that the filter removes gives way to the first match', async () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  await userEvent.click(field())
  await userEvent.keyboard('{End}')
  expect(activeOption()).toHaveTextContent('webshop')
  await userEvent.type(field(), 'design')
  expect(activeOption()).toHaveTextContent('design system')
})

test('clearing the query leaves the highlight where the reader put it', async () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="nt"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  await userEvent.click(field())
  await userEvent.keyboard('{End}')
  await userEvent.type(field(), 'web')
  await userEvent.clear(field())
  // Not back to `nt-agent`: the current choice decides where the walk *starts*, nothing more.
  // Undoing a deliberate move because the field ran empty is the surprise, not the service.
  expect(activeOption()).toHaveTextContent('webshop')
})

test('a list that changes under the reader keeps the row they highlighted', async () => {
  const onSelect = vi.fn()
  const { rerender } = render(
    <SearchList labels={nl.list} items={PROJECTS} onSelect={onSelect} label="Projecten" />,
  )
  await userEvent.click(field())
  await userEvent.keyboard('{ArrowDown}')
  expect(activeOption()).toHaveTextContent('design system')

  // Exactly what the action row causes ("Map toevoegen…" adds a project) and what the @-list will
  // do while it streams: an item arrives at the top. A row id keyed on the position in `items`
  // would now name a different project, and ↵ would take one the reader never highlighted.
  rerender(
    <SearchList
      labels={nl.list}
      items={[{ id: 'nieuw', label: 'nieuw project' }, ...PROJECTS]}
      onSelect={onSelect}
      label="Projecten"
    />,
  )
  expect(activeOption()).toHaveTextContent('design system')
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('ds')
})

test('an id with a space or a slash still names a row the field can point at', async () => {
  const onSelect = vi.fn()
  const items: SearchListItem[] = [
    { id: '/work/klant a', label: 'klant a' },
    { id: '/work/klant b', label: 'klant b' },
  ]
  render(<SearchList labels={nl.list} items={items} onSelect={onSelect} label="Projecten" />)
  const first = screen.getAllByRole('option')[0]
  // `aria-activedescendant` holds one IDREF, and an IDREF may not contain whitespace: an id taken
  // from a path has to be encoded before it can be a DOM id at all.
  expect(first?.id).not.toMatch(/\s/)
  expect(field()).toHaveAttribute('aria-activedescendant', first?.id)
  await userEvent.click(field())
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('/work/klant a')
})

test('a key that is part of composing text is not a command', async () => {
  const onSelect = vi.fn()
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={onSelect} label="Projecten" />)
  // The Enter that commits a Japanese or Chinese candidate arrives as an ordinary keydown. Taking
  // it would choose a row while the reader was still spelling a word.
  fireEvent.keyDown(field(), { key: 'Enter', isComposing: true })
  expect(onSelect).not.toHaveBeenCalled()
  fireEvent.keyDown(field(), { key: 'Enter' })
  expect(onSelect).toHaveBeenCalledOnce()
})

test('the field says the list is collapsed when there is nothing in it', async () => {
  const { rerender } = render(
    <SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />,
  )
  expect(field()).toHaveAttribute('aria-expanded', 'true')
  await userEvent.type(field(), 'kubernetes')
  expect(field()).toHaveAttribute('aria-expanded', 'false')

  // An action row is an option of its own, so the list is not empty while it stands there.
  rerender(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', onRun: () => {} }}
    />,
  )
  expect(field()).toHaveAttribute('aria-expanded', 'true')
})

test('the choices are counted, and the action row is not one of them', () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', onRun: () => {} }}
    />,
  )
  const rows = screen.getAllByRole('option')
  // Without this the action row inflates the count a screen reader reads out: "Map toevoegen…,
  // 4 of 4" suggests four things to choose from, and there are three.
  expect(rows.map((row) => row.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', null])
  // `-1`, not absent: a browser computes the pair from the DOM for an option that carries neither,
  // so leaving both off puts "4 of 4" back. `-1` is the ARIA value for "the size is not known",
  // which is exactly what should be said about a row that is not part of any set.
  expect(rows.map((row) => row.getAttribute('aria-setsize'))).toEqual(['3', '3', '3', '-1'])
})

test('a group has a heading and a role, not a landmark', () => {
  render(<SearchList labels={nl.list} items={GROUPED} onSelect={() => {}} label="Projecten" />)
  expect(screen.getByRole('group', { name: 'Recent' })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Alles' })).toBeInTheDocument()
  expect(screen.queryByRole('region')).toBeNull()
})

test('without a search field the list itself is the tab stop', async () => {
  const onSelect = vi.fn()
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={onSelect}
      label="Projecten"
      searchable={false}
    />,
  )
  expect(screen.queryByRole('combobox')).toBeNull()
  const listbox = screen.getByRole('listbox', { name: 'Projecten' })
  expect(listbox).toHaveAttribute('tabindex', '0')
  await userEvent.tab()
  expect(listbox).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(
    document.getElementById(listbox.getAttribute('aria-activedescendant') ?? ''),
  ).toHaveTextContent('design system')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('ds')
})

test('a list that is the tab stop says whether it has a row to point at', () => {
  // The condition the focus indicator hangs on, and the only half of it happy-dom can see: with a
  // row in the walk the field points at it (and that row carries the focus outline), with an empty
  // walk it points at nothing (and the list itself carries the ring). Which of those two really
  // gets painted, in which colour, is measured in a browser — Orbit's end-to-end gallery test does it for both
  // variants, before and after the focus arrives.
  const walkable = render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  expect(screen.getByRole('listbox', { name: 'Projecten' })).toHaveAttribute(
    'aria-activedescendant',
  )
  walkable.unmount()

  render(
    <SearchList
      labels={nl.list}
      items={[]}
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  expect(screen.getByRole('listbox', { name: 'Projecten' })).not.toHaveAttribute(
    'aria-activedescendant',
  )
})

test('loading shows nothing for 150 ms and skeleton rows after it', () => {
  vi.useFakeTimers()
  const { container } = render(
    <SearchList
      labels={nl.list}
      items={[]}
      onSelect={() => {}}
      label="Projecten"
      state="loading"
    />,
  )
  expect(container.querySelectorAll('.nt-shimmer')).toHaveLength(0)
  // Said in words from the first moment: the shapes are decorative, and a short wait draws none.
  expect(screen.getByText('Laden…')).toBeInTheDocument()
  act(() => {
    vi.advanceTimersByTime(150)
  })
  expect(container.querySelectorAll('.nt-shimmer').length).toBeGreaterThan(0)
})

test('an empty list and a search without matches are different sentences', async () => {
  render(<SearchList labels={nl.list} items={[]} onSelect={() => {}} label="Projecten" />)
  expect(screen.getByText('Niets om te kiezen')).toBeInTheDocument()

  await userEvent.type(field(), 'map')
  // The second one names the query, so the reader sees what was searched for and can correct it.
  expect(screen.getByText('Geen treffers voor ‘map’')).toBeInTheDocument()
  expect(screen.queryByText('Niets om te kiezen')).toBeNull()
})

test('a failure is the compact ErrorState, with no options left standing', () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      state="error"
    />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Kon de lijst niet laden')
  expect(screen.queryAllByRole('option')).toHaveLength(0)
})

test('the action row is the last stop of the walk, and Enter runs it', async () => {
  const onRun = vi.fn()
  const onSelect = vi.fn()
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={onSelect}
      label="Projecten"
      action={{ label: 'Map toevoegen…', icon: 'plus', shortcut: '⌘O', onRun }}
    />,
  )
  await userEvent.click(field())
  await userEvent.keyboard('{End}')
  expect(activeOption()).toHaveTextContent('Map toevoegen…')
  await userEvent.keyboard('{Enter}')
  expect(onRun).toHaveBeenCalledOnce()
  expect(onSelect).not.toHaveBeenCalled()
})

test('the action row is never a choice, so it is never selected', () => {
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="nt"
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', onRun: () => {} }}
    />,
  )
  // It walks and reads as a row of the list, but it carries no `aria-selected`: a listbox that
  // announced "not selected" for a command would invite the reader to select it.
  expect(option('Map toevoegen…')).not.toHaveAttribute('aria-selected')
})

test('while the action waits, every option is off and the row says it is busy', async () => {
  const onSelect = vi.fn()
  const onRun = vi.fn()
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="nt"
      onSelect={onSelect}
      label="Projecten"
      action={{ label: 'Map toevoegen…', busy: true, onRun }}
    />,
  )
  for (const row of screen.getAllByRole('option')) {
    expect(row).toHaveAttribute('aria-disabled', 'true')
  }
  expect(option('Map toevoegen…')).toHaveAttribute('aria-busy', 'true')
  await userEvent.click(option('nt-agent'))
  await userEvent.click(option('Map toevoegen…'))
  expect(onSelect).not.toHaveBeenCalled()
  expect(onRun).not.toHaveBeenCalled()
  // With nothing left to walk, the field points at no row at all — not even at the current
  // choice, or ↵ would pick a row that is standing there greyed out.
  expect(field()).not.toHaveAttribute('aria-activedescendant')
  await userEvent.click(field())
  await userEvent.keyboard('{Enter}')
  expect(onSelect).not.toHaveBeenCalled()
})

test('a notice stands above the rows and is not one of them', () => {
  // A sentence about the list as a whole — "this agent cannot do the level from your settings" —
  // so it may not be an option: a reader walking the list with ↓ would land on something that
  // cannot be chosen, and every row would be counted one too many.
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      notice="Deze agent kan dat niveau niet."
    />,
  )
  const said = screen.getByText('Deze agent kan dat niveau niet.')
  expect(said).toBeInTheDocument()
  expect(screen.getAllByRole('option')).toHaveLength(3)
  expect(screen.getByRole('listbox', { name: 'Projecten' })).not.toContainElement(said)
  // Above the rows, where it is read before the choice it is about.
  expect(said.compareDocumentPosition(option('nt-agent'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

test('without a notice there is no line above the list at all', () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  expect(document.querySelector('[data-nt-searchlist-notice]')).toBeNull()
})

test('a stacked row puts its detail under the label, where it wraps instead of truncating', async () => {
  // The shape for a detail the reader came to read: an explanation cut off after four words
  // explains nothing. `truncate` is exactly what may not be on it.
  const items: SearchListItem[] = [
    { id: 'manual', label: 'Handmatig', detail: 'Vraagt vóór opdrachten en bestandswijzigingen.' },
    { id: 'full', label: 'Volledige toegang', detail: 'Vraagt niets.' },
  ]
  render(
    <SearchList
      labels={nl.list}
      items={items}
      onSelect={() => {}}
      label="Toegang"
      layout="stacked"
    />,
  )
  const detail = option(/^Handmatig/).querySelector('[data-nt-searchlist-detail]')
  expect(detail).toHaveTextContent('Vraagt vóór opdrachten en bestandswijzigingen.')
  expect(detail?.className).not.toContain('truncate')
  // Under the label, not beside it: the two share one column of their own.
  expect(detail?.parentElement?.className).toContain('flex-col')
  // And the whole line is still the name of the option, so nothing is hidden from a reader who
  // hears the list rather than sees it.
  expect(option(/^Handmatig/)).toHaveAccessibleName(
    'Handmatig Vraagt vóór opdrachten en bestandswijzigingen.',
  )
})

test('the taller rows change nothing about the walk', async () => {
  const onSelect = vi.fn()
  const items: SearchListItem[] = [
    { id: 'manual', label: 'Handmatig', detail: 'Vraagt vóór opdrachten en bestandswijzigingen.' },
    { id: 'edits', label: 'Bewerkingen', detail: 'Bewerkt bestanden zonder te vragen.' },
  ]
  render(
    <SearchList
      labels={nl.list}
      items={items}
      selectedId="manual"
      onSelect={onSelect}
      label="Toegang"
      searchable={false}
      layout="stacked"
    />,
  )
  const list = screen.getByRole('listbox', { name: 'Toegang' })
  list.focus()
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('edits')
})

test('inline is the default, and there the detail still gives up its tail', () => {
  const items: SearchListItem[] = [{ id: 'nt', label: 'nt-agent', detail: '/work/nt-agent' }]
  render(<SearchList labels={nl.list} items={items} onSelect={() => {}} label="Projecten" />)
  const detail = option(/^nt-agent/).querySelector('[data-nt-searchlist-detail]')
  expect(detail?.className).toContain('truncate')
})

test('the search field is bare, with one rule between it and the rows', () => {
  // An open panel carries one frame, its own. A bordered field inside it is a box in a box, and
  // the focus ring on it was the second cyan frame a reader saw beside the active row.
  const { container } = render(
    <SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />,
  )
  const frame = field().parentElement?.className ?? ''
  for (const paint of ['border-border', 'bg-surface', 'outline-focus', 'accent']) {
    expect(frame, paint).not.toContain(paint)
  }
  const rule = container.querySelector('[data-nt-searchlist-rule]')
  expect(rule).toBeInTheDocument()
  // Decorative: the field and its list already name each other with `aria-controls`.
  expect(rule).toHaveAttribute('aria-hidden', 'true')
  // Between the two, where a border would have been.
  expect(rule?.compareDocumentPosition(option('nt-agent'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

test('a list without a search field has no rule either', () => {
  const { container } = render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      searchable={false}
    />,
  )
  expect(container.querySelector('[data-nt-searchlist-rule]')).toBeNull()
})

test('the active row carries a neutral fill and the full text colour, and no accent at all', () => {
  // The two halves of the indicator, and the one thing that may not be there. What those classes
  // really paint — and that the pair is far enough apart to see — is measured in the gallery.
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="ds"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  const active = activeOption()?.className ?? ''
  expect(active).toContain('bg-surface-active')
  expect(active).toContain('text-fg')
  expect(active).not.toContain('accent')
  expect(active).not.toContain('outline')
  const quiet = option('nt-agent').className
  expect(quiet).toContain('text-muted')
  expect(quiet).not.toContain('bg-surface-active')
})

test('a detail is muted on a quiet row and comes forward on the active one', () => {
  // `--nt-text-muted` on `--nt-surface-active` is 3.71:1, under the 4.5:1 body text owes, so
  // nothing inside the row the keyboard stands on may stay muted. The figure itself is measured
  // in the gallery, against the fill the browser really paints; this pins which row gets which.
  const items: SearchListItem[] = [
    { id: 'nt', label: 'nt-agent', detail: 'work' },
    { id: 'ds', label: 'design system', detail: 'klanten' },
  ]
  render(
    <SearchList
      labels={nl.list}
      items={items}
      selectedId="ds"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  const detailOf = (row: HTMLElement | null) =>
    row?.querySelector('[data-nt-searchlist-detail]')?.className ?? ''
  expect(detailOf(activeOption())).not.toContain('text-muted')
  expect(detailOf(option(/^nt-agent/))).toContain('text-muted')
})

test('the shortcut of the action row comes forward with it', () => {
  // The same rule, for the one row that carries a chip of its own.
  const { rerender } = render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', shortcut: '⌘O', onRun: () => {} }}
    />,
    { wrapper: uiWrapper() },
  )
  // The walk starts on the first project, so the keys are still the quiet ones.
  expect(option(/Map toevoegen…/).querySelector('[data-nt-kbd]')?.className).toContain('text-muted')

  // Nothing matches, so the action row is all there is left to walk to.
  rerender(
    <SearchList
      labels={nl.list}
      items={[]}
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', shortcut: '⌘O', onRun: () => {} }}
    />,
  )
  const keys = option(/Map toevoegen…/).querySelector('[data-nt-kbd]')?.className ?? ''
  expect(keys).toContain('text-fg')
  expect(keys).not.toContain('text-muted')
})

test('the action row draws the key of its shortcut id as the catalogue spells it', () => {
  render(
    <SearchList
      labels={nl.list}
      items={[]}
      onSelect={() => {}}
      label="Projecten"
      action={{ label: 'Map toevoegen…', shortcut: 'demo.open', onRun: () => {} }}
    />,
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  const keys = option(/Map toevoegen…/).querySelector('[data-nt-kbd]')
  // Drawn by `Kbd`: the Command key as its icon, spelled out for a screen reader.
  expect(keys).toHaveTextContent('Command O')
  expect(keys?.querySelector('kbd svg')?.getAttribute('class')).toContain('lucide-command')
  // The row it stands on is the active one, so the keys come forward with it.
  expect(keys?.className).toContain('text-fg')
})

test('the check carries no colour of its own, so it follows the row it marks', () => {
  // Never the accent (it marks the choice already made, not the thing to press) and never the
  // foreground either: a bright glyph beside muted words is a second kind of emphasis in a panel
  // meant to be quiet, and on the active row the check has to come forward with everything else.
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      selectedId="shop"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  const slot = option('webshop').querySelector('svg')?.parentElement?.className ?? ''
  expect(slot).not.toContain('text-')
  expect(slot).not.toContain('accent')
})

test('a row can carry the whole truth in its title without saying it out loud', () => {
  // The project rows: the folder on screen, the path one hover away. It may not become part of the
  // name, or a reader would hear a path read out for every project in the list.
  const items: SearchListItem[] = [
    { id: 'nt', label: 'nt-agent', detail: 'work', title: '/work/nt-agent' },
  ]
  render(<SearchList labels={nl.list} items={items} onSelect={() => {}} label="Projecten" />)
  expect(option(/^nt-agent/)).toHaveAttribute('title', '/work/nt-agent')
  expect(option(/^nt-agent/)).not.toHaveAccessibleName(/\/work/)
})

test('a row without a title carries no empty one', () => {
  render(<SearchList labels={nl.list} items={PROJECTS} onSelect={() => {}} label="Projecten" />)
  expect(option('nt-agent')).not.toHaveAttribute('title')
})

test('a className or style from outside does not get in', () => {
  const { container } = render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={() => {}}
      label="Projecten"
      // @ts-expect-error variation comes from props, never from a className handed in.
      className="bg-red-500"
      style={{ color: 'red' }}
    />,
  )
  expect(container.querySelector('.bg-red-500')).toBeNull()
  expect(container.querySelector('[style]')).toBeNull()
})

test('a list the caller filtered shows every row it was given, marked where the caller says', async () => {
  const user = userEvent.setup()
  render(
    <SearchList
      labels={nl.list}
      items={[{ id: 'a', label: 'Eerste meting', ranges: [[0, 4]] }]}
      filter={false}
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  await user.type(field(), 'emt')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(screen.getByRole('option').querySelector('mark')?.textContent).toBe('Eers')
})

test('a controlled query comes from the caller and goes back to it', async () => {
  const user = userEvent.setup()
  const onQueryChange = vi.fn()
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      query="web"
      onQueryChange={onQueryChange}
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  expect(field()).toHaveValue('web')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  await user.type(field(), 's')
  expect(onQueryChange).toHaveBeenLastCalledWith('webs')
})

test('Enter with the command key takes the second way, where the caller offers one', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  const onSelectAlt = vi.fn()
  const { rerender } = render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      onSelect={onSelect}
      onSelectAlt={onSelectAlt}
      label="Projecten"
    />,
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  await user.click(field())
  await user.keyboard('{Enter}')
  expect(onSelect).toHaveBeenLastCalledWith('nt')
  await user.keyboard('{Meta>}{Enter}{/Meta}')
  expect(onSelectAlt).toHaveBeenCalledTimes(1)
  expect(onSelectAlt).toHaveBeenLastCalledWith('nt')
  expect(onSelect).toHaveBeenCalledTimes(1)
  // Without a second way, the command key changes nothing.
  rerender(<SearchList labels={nl.list} items={PROJECTS} onSelect={onSelect} label="Projecten" />)
  await user.keyboard('{Meta>}{Enter}{/Meta}')
  expect(onSelect).toHaveBeenCalledTimes(2)
})

test('a row can carry the key of a command on its right', () => {
  render(
    <SearchList
      labels={nl.list}
      items={[{ id: 'n', label: 'Nieuwe chat', shortcut: 'demo.new' }]}
      onSelect={() => {}}
      label="Projecten"
    />,
    { wrapper: uiWrapper({ platform: 'mac' }) },
  )
  const slot = option(/Nieuwe chat/).querySelector('[data-nt-searchlist-shortcut]')
  expect(slot).not.toBeNull()
  // One cap around the whole shortcut, as in the account menu.
  const cap = slot?.querySelector('[data-nt-kbd]')?.className ?? ''
  expect(cap).toContain('border-border-strong')
  expect(cap).toContain('rounded-sm')
  const keys = slot?.querySelectorAll('kbd') ?? []
  expect(keys).toHaveLength(2)
  for (const key of keys) {
    expect(key.className).not.toContain('border')
  }
})

test('a list that scrolls caps its height, and the empty text can be the caller’s own', async () => {
  const user = userEvent.setup()
  render(
    <SearchList
      labels={nl.list}
      items={PROJECTS}
      scroll
      emptyText="Geen treffers"
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  expect(screen.getByRole('listbox').className).toContain('overflow-y-auto')
  await user.type(field(), 'qqq')
  expect(screen.getByRole('status')).toHaveTextContent('Geen treffers')
})

test('a list that holds no choice drops the slot of the check', () => {
  const { container } = render(
    <SearchList
      labels={nl.list}
      items={[{ id: 'a', label: 'Paneel', icon: 'terminal' }]}
      checkSlot={false}
      onSelect={() => {}}
      label="Projecten"
    />,
  )
  // Only the glyph of the row stands before its label.
  const option = container.querySelector('[role="option"]')
  expect(option?.firstElementChild?.querySelector('svg')).not.toBeNull()
  expect(option?.children).toHaveLength(2)
})

/** Rows of a model picker: the words of what a model can do on the right, the agent to search by. */
const MODELS: SearchListItem[] = [
  { id: 'small', label: 'Klein', trailing: 'Noord', keywords: ['Fake', 'Noord'] },
  { id: 'large', label: 'Groot', trailing: 'denkt · 1M', keywords: ['Fake', 'Zuid'] },
]

const modelField = () => screen.getByRole('combobox', { name: 'Model' })

/** The row action of the row named `name`, as the list draws it. */
const secondaryOf = (name: string) =>
  option(new RegExp(name)).querySelector('[data-nt-searchlist-secondary]')

test('a trailing word stands on the right at 11px, muted except on the active row', () => {
  render(<SearchList labels={nl.list} items={MODELS} onSelect={() => {}} label="Model" />)
  const trailingOf = (name: string) =>
    option(new RegExp(name)).querySelector('[data-nt-searchlist-trailing]')
  // The first row is where the walk starts: it brightens with the rest of the row, since nothing
  // on the active fill may be muted (3.71:1 there).
  expect(trailingOf('Klein')).toHaveTextContent('Noord')
  expect(trailingOf('Klein')?.className).toContain('text-[11px]')
  expect(trailingOf('Klein')?.className).not.toContain('text-muted')
  expect(trailingOf('Groot')).toHaveTextContent('denkt · 1M')
  expect(trailingOf('Groot')?.className).toContain('text-muted')
  expect(trailingOf('Groot')?.className).toContain('ml-auto')
})

test('the query also finds a row by its keywords, and marks only the label', async () => {
  const user = userEvent.setup()
  render(<SearchList labels={nl.list} items={MODELS} onSelect={() => {}} label="Model" />)
  await user.type(modelField(), 'zuid')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(option(/Groot/)).toBeInTheDocument()
  // A keyword is not on screen, so there is nothing to mark.
  expect(document.querySelector('mark')).toBeNull()
  // The words may come from the label and the keywords together.
  await user.clear(modelField())
  await user.type(modelField(), 'fake gr')
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(screen.getByRole('option').querySelector('mark')).toHaveTextContent('Gr')
})

test('a heading that can be opened is walked to, and Enter or a click opens it', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  const onOpen = vi.fn()
  render(
    <SearchList
      labels={nl.list}
      items={[
        ...MODELS.map((item) => ({ ...item, group: 'Fake' })),
        { id: 'agent:other', label: 'Ander', head: { reason: 'Niet aangemeld', onOpen } },
      ]}
      onSelect={onSelect}
      label="Model"
    />,
  )
  const head = option(/Ander/)
  // A heading, not a choice: it says why, carries no tick and is not counted among the models.
  expect(head).toHaveTextContent('Niet aangemeld')
  expect(head).toHaveAttribute('data-nt-searchlist-head')
  expect(head).not.toHaveAttribute('aria-selected')
  expect(head).toHaveAttribute('aria-setsize', '-1')
  expect(option(/Klein/)).toHaveAttribute('aria-setsize', '2')
  await user.click(modelField())
  await user.keyboard('{End}{Enter}')
  expect(onOpen).toHaveBeenCalledTimes(1)
  expect(onSelect).not.toHaveBeenCalled()
  await user.click(head)
  expect(onOpen).toHaveBeenCalledTimes(2)
  expect(onSelect).not.toHaveBeenCalled()
})

test('a row action runs with its row key on the active row, and a click on it takes no row', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  const starred = vi.fn()
  const items: SearchListItem[] = MODELS.map((item) => ({
    ...item,
    secondary: {
      label: 'Favoriet',
      icon: 'star',
      on: item.id === 'large',
      onRun: () => starred(item.id),
    },
  }))
  render(
    <SearchList
      labels={nl.list}
      items={items}
      onSelect={onSelect}
      label="Model"
      secondaryKey="d"
    />,
    {
      wrapper: uiWrapper({ platform: 'mac' }),
    },
  )
  // Never a tab stop, and nothing a screen reader has to step over: the row says it instead.
  expect(secondaryOf('Klein')).not.toHaveAttribute('tabindex')
  expect(secondaryOf('Klein')).toHaveAttribute('aria-hidden', 'true')
  expect(option(/Groot/)).toHaveAttribute('aria-description', 'Favoriet')
  expect(option(/Klein/)).not.toHaveAttribute('aria-description')
  await user.click(modelField())
  await user.keyboard('{ArrowDown}')
  expect(modelField()).toHaveAttribute('aria-activedescendant', option(/Groot/).id)
  await user.keyboard('{Meta>}d{/Meta}')
  expect(starred).toHaveBeenLastCalledWith('large')
  // The plain letter is typing, never the action.
  await user.keyboard('d')
  expect(starred).toHaveBeenCalledTimes(1)
  await user.click(secondaryOf('Klein') as HTMLElement)
  expect(starred).toHaveBeenLastCalledWith('small')
  expect(onSelect).not.toHaveBeenCalled()
})

test('a row action shows on the active row and where it is on, and hides elsewhere', () => {
  const items: SearchListItem[] = [...MODELS, { id: 'tiny', label: 'Mini', keywords: [] }].map(
    (item) => ({
      ...item,
      secondary: { label: 'Favoriet', icon: 'star', on: item.id === 'tiny', onRun: () => {} },
    }),
  )
  render(
    <SearchList
      labels={nl.list}
      items={items}
      onSelect={() => {}}
      label="Model"
      secondaryKey="d"
    />,
  )
  // The walk starts on the first row.
  expect(secondaryOf('Klein')?.className).not.toContain('invisible')
  expect(secondaryOf('Groot')?.className).toContain('invisible')
  expect(secondaryOf('Mini')?.className).not.toContain('invisible')
})

test('sectionHeadings draws the group headings as the SectionHeading of every column', () => {
  render(
    <SearchList
      labels={nl.list}
      items={GROUPED}
      label="Projecten"
      sectionHeadings
      onSelect={vi.fn()}
    />,
  )
  const group = screen.getByRole('group', { name: 'Recent' })
  const heading = document.getElementById(group.getAttribute('aria-labelledby') ?? '')
  expect(heading?.className).toContain('uppercase')
  expect(heading?.className).toContain('h-7')
})
