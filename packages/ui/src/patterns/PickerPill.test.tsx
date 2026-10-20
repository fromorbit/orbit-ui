import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { nl } from '../testing/labels'
import { PickerPill, type PickerPillProps } from './PickerPill'
import type { SearchListItem } from './SearchList'

const PROJECTS: SearchListItem[] = [
  { id: 'shop', label: 'webshop' },
  { id: 'nt', label: 'nt-agent' },
  { id: 'ds', label: 'design system' },
]

/**
 * The shape every caller has: one thing chosen, and a list to choose another from.
 *
 * Typed as the everyday member of the union. The other two demand an icon of their own, and a
 * `Partial` of all three would no longer be assignable to any of them; the tests that are about
 * those two render `PickerPill` directly, which is also where their types have to bite.
 */
function Pill(props: Partial<Extract<PickerPillProps, { tone?: 'neutral' }>>) {
  return (
    <PickerPill
      listLabels={nl.list}
      label="Project"
      value="webshop"
      items={PROJECTS}
      selectedId="shop"
      onSelect={() => {}}
      {...props}
    />
  )
}

const pill = () => screen.getByRole('button', { name: 'Project: webshop' })

/** Opens the panel the way a reader does and hands it back. */
async function open(): Promise<HTMLElement> {
  await userEvent.click(pill())
  return await screen.findByRole('dialog', { name: 'Project' })
}

test('the pill is a button named after what it chooses, and says it opens a panel', async () => {
  render(<Pill />)
  expect(pill()).toHaveAttribute('aria-haspopup', 'dialog')
  expect(pill()).toHaveAttribute('aria-expanded', 'false')
  // The label is in the name, not on the screen: the toolbar shows the choice, a screen reader
  // hears what it is a choice of.
  expect(pill()).toHaveTextContent('webshop')
  expect(pill()).not.toHaveTextContent('Project')

  const panel = await open()
  expect(panel).toBeInTheDocument()
  expect(pill()).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getAllByRole('option')).toHaveLength(3)
})

test('choosing an option calls onSelect, closes the panel and gives the focus back to the pill', async () => {
  const onSelect = vi.fn()
  render(<Pill onSelect={onSelect} />)
  await open()
  await userEvent.click(screen.getByRole('option', { name: 'nt-agent' }))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('nt')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(pill()).toHaveFocus()
})

test('the current choice is the selected option, so the panel opens on what the pill shows', async () => {
  render(<Pill />)
  await open()
  expect(screen.getByRole('option', { name: 'webshop' })).toHaveAttribute('aria-selected', 'true')
})

test('the panel waits out the action and closes when the new choice arrives', async () => {
  // The contract for "Map toevoegen…": running the row opens the host's folder dialog, and this
  // pill has no way of knowing how that ends. So it stays up while the row waits, and closes on
  // the one thing that means the job is done — the choice it shows has changed.
  const onRun = vi.fn()
  const { rerender } = render(
    <Pill action={{ label: 'Map toevoegen…', icon: 'plus', busy: false, onRun }} />,
  )
  await open()
  await userEvent.click(screen.getByRole('option', { name: 'Map toevoegen…' }))
  expect(onRun).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('dialog', { name: 'Project' })).toBeInTheDocument()

  rerender(<Pill action={{ label: 'Map toevoegen…', icon: 'plus', busy: true, onRun }} />)
  expect(screen.getByRole('dialog', { name: 'Project' })).toBeInTheDocument()

  rerender(
    <Pill
      value="klant-b"
      selectedId="nt"
      action={{ label: 'Map toevoegen…', icon: 'plus', busy: false, onRun }}
    />,
  )
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('a selectedId that changes from outside closes the panel, with no action in play', async () => {
  // The surprising half of the contract, and the one the action row leans on: this pill closes on
  // a choice it did not make itself. Worth its own test without an action anywhere near it,
  // because the same thing happens when core reports a choice (see the JSDoc on `selectedId`).
  const { rerender } = render(<Pill />)
  await open()
  rerender(<Pill value="nt-agent" selectedId="nt" />)
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Project: nt-agent' })).toHaveFocus()
})

test('read-only wins from a reason: fixed is fixed, however the caller says it', () => {
  // Both at once is a caller that has not decided; the quieter of the two is the safer reading —
  // a control that is never coming back should not look like one that is off for now.
  render(<Pill readOnly disabledReason="Tijdens een beurt kun je niet wisselen" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.queryByTitle('Tijdens een beurt kun je niet wisselen')).not.toBeInTheDocument()
})

test('a state travels through to the list, so a picker may still be loading', async () => {
  render(<Pill items={[]} state="loading" />)
  await open()
  expect(screen.getByRole('listbox', { name: 'Project' })).toHaveAttribute('aria-busy', 'true')
})

test('a cancelled action leaves the panel standing, because nothing was chosen', async () => {
  const onRun = vi.fn()
  const { rerender } = render(
    <Pill action={{ label: 'Map toevoegen…', icon: 'plus', busy: true, onRun }} />,
  )
  await open()
  rerender(<Pill action={{ label: 'Map toevoegen…', icon: 'plus', busy: false, onRun }} />)
  expect(screen.getByRole('dialog', { name: 'Project' })).toBeInTheDocument()
})

test('read-only is text, not a control, and still reads as label and value', async () => {
  render(<Pill readOnly icon="message-circle" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  const quiet = document.querySelector('[data-nt-pill]')
  // What a screen reader gets: the same sentence as the name of the control it replaces, from a
  // visually hidden prefix rather than from an `aria-label` (which ARIA forbids on a plain span)
  // or a `role="text"` (which is not an ARIA role at all).
  expect(quiet).toHaveTextContent('Project: webshop')
  expect(quiet).not.toHaveAttribute('tabindex')
  expect(quiet).not.toHaveAttribute('title')
  expect(quiet?.tagName.toLowerCase()).toBe('span')
})

test('a reason turns the pill off and stands in the title of the span around it', async () => {
  // A disabled button takes no pointer events, so its own `title` would never appear; the wrapper
  // carries it, exactly as the send button of the composer does.
  render(<Pill disabledReason="Tijdens een beurt kun je niet wisselen" />)
  expect(pill()).toBeDisabled()
  expect(screen.getByTitle('Tijdens een beurt kun je niet wisselen')).toContainElement(pill())
  await userEvent.click(pill())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a className or style from outside does not get in', () => {
  render(
    // @ts-expect-error variation comes from props, never from a className handed in.
    <Pill className="bg-red-500" style={{ color: 'red' }} />,
  )
  expect(pill().className).not.toContain('bg-red-500')
  expect(pill().getAttribute('style')).toBeNull()
})

test('an attention pill without an icon does not type-check, so colour is never alone', () => {
  // The guidelines forbid colour as the only carrier of a state. The type says so: `attention`
  // demands the icon that stands beside it. That `tsc` does not flag this directive as unused is
  // the proof that the union bites.
  render(
    // @ts-expect-error `tone="attention"` requires an icon beside the colour.
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      tone="attention"
      items={[]}
      selectedId={null}
      onSelect={() => {}}
    />,
  )
  expect(screen.getByRole('button', { name: 'Toegang: volledig' })).toBeInTheDocument()
})

test('the value has three widths, and the pill may give up room before any of them', () => {
  // A cap says how wide a value may get, `shrink` says it is allowed to get smaller: together they
  // are what keeps a full toolbar inside a narrow window. What that looks like in pixels is a
  // Playwright matter (Orbit's end-to-end tests); here only that each class is written out whole.
  const { rerender } = render(<Pill />)
  const value = () => document.querySelector('[data-nt-pill-value]')?.className ?? ''
  expect(value()).toContain('max-w-40')
  expect(pill().className).not.toContain('shrink-0')

  rerender(<Pill width="narrow" />)
  expect(value()).toContain('max-w-26')
  expect(value()).not.toContain('max-w-40')

  // The third width is no cap at all: the line under the composer has the whole column to itself,
  // and a number decided here would cut a project name short in front of 500px of empty line. It
  // still truncates — at the width it really has.
  rerender(<Pill width="free" />)
  expect(value()).not.toContain('max-w-')
  expect(value()).toContain('truncate')
})

test('a collapsing pill hands its value to the container query, and keeps its chevron', () => {
  // The fall-back is a container query on the composer's toolbar, so what a render can show here
  // is only that the class is written out whole (Tailwind scans source text, and a class built at
  // runtime would silently never be generated) — how it behaves in pixels is the Playwright test
  // in Orbit's end-to-end gallery test.
  render(
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      collapse
      icon="shield-off"
      items={[]}
      selectedId={null}
      onSelect={() => {}}
    />,
  )
  expect(document.querySelector('[data-nt-pill-value]')?.className).toContain(
    '@max-[588px]/toolbar:sr-only',
  )
  // The name is the button's own, so the value may leave the screen entirely.
  expect(screen.getByRole('button', { name: 'Toegang: volledig' })).toBeInTheDocument()
  // Still a control that opens: without the chevron a collapsed pill would read as the read-only
  // text beside it, in exactly the row where there is least to go on.
  expect(document.querySelector('[data-nt-pill-chevron]')).toBeInTheDocument()
})

test('a collapsing read-only pill keeps the value in the document, because its name is its text', () => {
  // The quiet form has no `aria-label` (ARIA forbids one on a plain span), so its name is what
  // stands in it. `sr-only` takes the value off the screen without taking it out of that name.
  render(
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      collapse
      icon="shield-off"
      items={[]}
      selectedId={null}
      onSelect={() => {}}
      readOnly
    />,
  )
  const quiet = document.querySelector('[data-nt-pill]')
  expect(quiet).toHaveTextContent('Toegang: volledig')
  expect(quiet?.querySelector('[data-nt-pill-value]')?.className).toContain(
    '@max-[588px]/toolbar:sr-only',
  )
})

test('a pill that does not collapse carries no container query at all', () => {
  render(<Pill icon="folder" />)
  expect(document.querySelector('[data-nt-pill-value]')?.className).not.toContain('@max-')
})

test('a collapsing pill without an icon does not type-check, so the fall-back is never empty', () => {
  // The value is what disappears; the icon is all that is left. A caller that asks to collapse
  // without one would leave a pill with nothing in it, so the type refuses — the same way
  // `tone="attention"` demands the sign beside its colour.
  render(
    // @ts-expect-error `collapse` requires the icon it falls back to.
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      collapse
      items={[]}
      selectedId={null}
      onSelect={() => {}}
    />,
  )
  expect(screen.getByRole('button', { name: 'Toegang: volledig' })).toBeInTheDocument()
})

test('a notice travels through to the list the pill opens', async () => {
  render(<Pill notice="Deze agent kan dat niveau niet." />)
  await open()
  expect(screen.getByText('Deze agent kan dat niveau niet.')).toBeInTheDocument()
  // Above the rows and not one of them: the list still has exactly its own three choices.
  expect(screen.getAllByRole('option')).toHaveLength(3)
})

test('a layout travels through to the list, so a row can carry a whole sentence', async () => {
  render(
    <Pill
      layout="stacked"
      items={[{ id: 'shop', label: 'webshop', detail: 'Een zin die niet afgekapt mag worden.' }]}
    />,
  )
  await open()
  const detail = screen.getByRole('option').querySelector('[data-nt-searchlist-detail]')
  expect(detail?.className).not.toContain('truncate')
})

test('a note about the value is the accessible description of the pill, panel closed and all', () => {
  // A `title` on the span around the pill is for the mouse and for nobody else: an ancestor's
  // title adds nothing to the name or the description of the button inside it. So the sentence
  // also stands in a hidden run of text the trigger points at — which exists whether the panel is
  // open or shut, because the reason this pill shows what it shows does not wait for a click.
  render(<Pill note="Deze agent kan Automatisch niet." />)
  expect(pill()).toBeEnabled()
  expect(pill()).toHaveAccessibleDescription('Deze agent kan Automatisch niet.')
  // And the mouse still gets it, on the one element that keeps its pointer events in every state.
  expect(screen.getByTitle('Deze agent kan Automatisch niet.')).toContainElement(pill())
})

test('a reason to be off takes the title, and the note keeps the description', () => {
  // Two sentences, one `title`: "you cannot do this right now" is the more urgent of the two. The
  // other one may not vanish with it — a level that is not the one you configured is exactly the
  // thing a reader has to be able to find out, also while a turn is running.
  render(<Pill note="Deze agent kan Automatisch niet." disabledReason="Tijdens een beurt niet" />)
  expect(pill()).toBeDisabled()
  expect(screen.getByTitle('Tijdens een beurt niet')).toContainElement(pill())
  expect(screen.queryByTitle('Deze agent kan Automatisch niet.')).not.toBeInTheDocument()
  expect(pill()).toHaveAccessibleDescription('Deze agent kan Automatisch niet.')
})

test('a read-only pill carries its note in its own text, since a span cannot be described', () => {
  // The quiet form has no `aria-label` and no `aria-describedby` to point anywhere: ARIA forbids
  // both on a plain span, and its name is simply the text standing in it. So the sentence joins
  // that text, visually hidden — which is the only carrier there is in a toolbar that has no room
  // for a line of prose.
  render(<Pill readOnly note="Deze agent kan Automatisch niet." />)
  const quiet = document.querySelector('[data-nt-pill]')
  expect(quiet).toHaveAttribute('title', 'Deze agent kan Automatisch niet.')
  expect(quiet).toHaveTextContent('Project: webshop Deze agent kan Automatisch niet.')
})

test('a collapsing pill keeps its whole box, where the others give way', () => {
  // The value of a collapsed pill is out of the flow, so all that is left is the icon and the
  // chevron — about 48px, and there is nothing in it to truncate. Letting it shrink like its
  // neighbours would squeeze those two glyphs in exactly the row that has the least room, which
  // is the row this pill exists for. What that is in pixels is a Playwright matter
  // (Orbit's end-to-end tests); here only that the class is the one that refuses to shrink.
  const { rerender } = render(
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      collapse
      icon="shield-off"
      items={[]}
      selectedId={null}
      onSelect={() => {}}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Toegang: volledig' })
  expect(trigger.className).toContain('shrink-0')
  expect(trigger.className).not.toContain('min-w-0')

  rerender(
    <PickerPill
      listLabels={nl.list}
      label="Toegang"
      value="volledig"
      collapse
      icon="shield-off"
      items={[]}
      selectedId={null}
      onSelect={() => {}}
      readOnly
    />,
  )
  // The quiet form has the same job and the same box, so it gives way just as little.
  const quiet = document.querySelector('[data-nt-pill]')
  expect(quiet?.className).toContain('shrink-0')
  expect(quiet?.className).not.toContain('min-w-0')
})

test('a read-only pill shrinks like the control it replaces', () => {
  // After the first message the toolbar is a row of these, in the same window as before.
  render(<Pill readOnly width="narrow" />)
  const quiet = document.querySelector('[data-nt-pill]')
  expect(quiet?.className).toContain('min-w-0')
  expect(quiet?.className).not.toContain('shrink-0')
  expect(document.querySelector('[data-nt-pill-value]')?.className).toContain('max-w-26')
})

test('a plain pill has no fill at rest, the value in fg and a quiet chevron', () => {
  render(<Pill frame="plain" />)
  const classes = pill().className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining(['text-fg', 'hover:bg-surface-hover', 'h-(--nt-control-md)']),
  )
  expect(classes.some((name) => name.startsWith('bg-'))).toBe(false)
  expect(classes.some((name) => name === 'border' || name.startsWith('border-'))).toBe(false)
  expect(pill().querySelector('[data-nt-pill-chevron]')?.className).toContain('text-muted')
})

test('the default stays ghost', () => {
  render(<Pill />)
  const classes = pill().className.split(' ')
  expect(classes).not.toContain('bg-surface-hover')
  expect(classes).toContain('h-(--nt-control-sm)')
})

test('a field pill is framed like a select, at one width, so a column of controls lines up', async () => {
  // For a row of the settings screen: bare text with a chevron read as
  // a label there, not as a control beside the switches and fields of the column.
  render(<Pill frame="field" />)
  expect(pill()).toHaveAttribute('data-nt-pill-frame', 'field')
  const classes = pill().className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining([
      'border',
      'border-border',
      'bg-surface',
      'w-56',
      'h-(--nt-control-md)',
    ]),
  )
  // The value takes the room and the chevron stands at the end, as in `Select`.
  expect(document.querySelector('[data-nt-pill-value]')?.className).toContain('flex-1')
  expect(await open()).toBeInTheDocument()
})

test('a quiet pill frame has no border or plane at rest, at the size of the framed one', () => {
  // A started chat: the toolbar steps back, and nothing in it shifts.
  render(<Pill frame="pill" quiet />)
  const classes = pill().className.split(' ')
  expect(classes).toEqual(
    expect.arrayContaining(['h-(--nt-control-md)', 'border-transparent', 'bg-transparent']),
  )
  expect(classes).not.toContain('border-border-strong')
})

test('a read-only pill frame keeps the box of the pill, so it lines up with a quiet one', () => {
  render(<Pill frame="pill" readOnly icon="shield" />)
  const text = document.querySelector('[data-nt-pill]') as HTMLElement
  expect(text.tagName.toLowerCase()).toBe('span')
  expect(text.className.split(' ')).toEqual(
    expect.arrayContaining(['h-(--nt-control-md)', 'ps-2.5', 'pe-2']),
  )
  expect(text).toHaveTextContent('Project: webshop')
})
