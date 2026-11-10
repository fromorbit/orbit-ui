import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { SettingSwitchRow, type SettingSwitchRowProps } from './SettingSwitchRow'

/** A row that really switches, and reports every change. */
function Row({
  onChange,
  initial = false,
  ...props
}: Partial<Omit<SettingSwitchRowProps, 'checked' | 'onCheckedChange'>> & {
  onChange?: (checked: boolean) => void
  initial?: boolean
}) {
  const [on, setOn] = useState(initial)
  return (
    <TooltipProvider>
      <SettingSwitchRow
        label="Elke nieuwe pull request beoordelen"
        {...props}
        checked={on}
        onCheckedChange={(checked) => {
          setOn(checked)
          onChange?.(checked)
        }}
      />
    </TooltipProvider>
  )
}

function control(): HTMLElement {
  return screen.getByRole('switch', { name: 'Elke nieuwe pull request beoordelen' })
}

test('makes the whole row the label of its switch', async () => {
  const onChange = vi.fn()
  render(
    <Row
      description="Lens begint als een pull request opent en na elke push"
      onChange={onChange}
    />,
  )
  // A click on the title, on the line under it, or on the empty middle of the row: one toggle each.
  await userEvent.click(screen.getByText('Elke nieuwe pull request beoordelen'))
  expect(control()).toBeChecked()
  await userEvent.click(screen.getByText('Lens begint als een pull request opent en na elke push'))
  expect(control()).not.toBeChecked()
  expect(control().closest('label')).not.toBeNull()
  expect(onChange).toHaveBeenCalledTimes(2)
})

test('names the switch by the title and describes it by the line', () => {
  render(<Row description="Lens begint als een pull request opent en na elke push" />)
  expect(control()).toHaveAccessibleDescription(
    'Lens begint als een pull request opent en na elke push',
  )
  // The title in 13px at the weight of body text: a row is not a heading.
  const title = screen.getByText('Elke nieuwe pull request beoordelen')
  expect(title.className).toContain('text-[13px]')
  expect(title.className).not.toMatch(/font-(medium|semibold|bold|heading)/)
})

test('keeps the plain label as the name when the title is drawn from other content', () => {
  render(
    <Row
      label="zilverberg/webwinkel"
      labelContent={<span className="font-mono">zilverberg/webwinkel</span>}
    />,
  )
  expect(screen.getByRole('switch', { name: 'zilverberg/webwinkel' })).toBeInTheDocument()
})

test('is one tab stop', async () => {
  render(
    <>
      <Row description="Lens begint als een pull request opent en na elke push" meta="Assertief" />
      <a href="#na">Na de rij</a>
    </>,
  )
  await userEvent.tab()
  expect(control()).toHaveFocus()
  await userEvent.tab()
  expect(screen.getByRole('link', { name: 'Na de rij' })).toHaveFocus()
})

test('shows quiet meta before the switch', () => {
  render(<Row meta="Assertief" />)
  const meta = screen.getByText('Assertief')
  expect(meta.className).toContain('text-[12px]')
  expect(meta.className).toContain('text-muted')
  expect(meta.compareDocumentPosition(control())).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(control()).toHaveAccessibleDescription('Assertief')
})

test('wraps the line instead of cutting it', () => {
  const line =
    'Lens begint als een pull request opent en na elke push, ook op een concept dat nog niet klaar is'
  render(<Row description={line} />)
  const shown = screen.getByText(line)
  expect(shown.className).not.toMatch(/truncate|line-clamp|whitespace-nowrap|text-ellipsis/)
  // No tooltip stands in for a cut text: the whole line is there to read.
  expect(shown.closest('[data-state]')).toBeNull()
})

test('keeps the switch on the right at every width', () => {
  const { container } = render(<Row description="Een uitleg" meta="Assertief" />)
  const row = container.querySelector('label')
  // One direction at every width: no container query that stacks the switch under the words.
  expect(row?.className).not.toMatch(/flex-col|@max-|@container/)
  expect(row?.className).toContain('items-center')
  expect(row?.lastElementChild?.contains(control())).toBe(true)
  expect(row?.lastElementChild?.className).toContain('shrink-0')
  expect(row?.firstElementChild?.className).toContain('min-w-0')
})

test('stands as high as a SettingRow: 48px at the least, the title on a line of 24px', () => {
  const { container } = render(<Row />)
  const row = container.querySelector('label')
  const classes = row?.className.split(' ') ?? []
  expect(classes).toEqual(expect.arrayContaining(['min-h-12', 'py-3', 'px-4']))
  expect(classes).not.toContain('min-h-8')
  const title = screen.getByText('Elke nieuwe pull request beoordelen')
  expect(title.className.split(' ')).toContain('leading-6')
})

test('ends the line without a full stop, as SettingRow does', () => {
  render(<Row description="Lens begint als een pull request opent." />)
  expect(screen.getByText('Lens begint als een pull request opent')).toBeVisible()
  expect(control()).toHaveAccessibleDescription('Lens begint als een pull request opent')
})

test('leaves its words selectable, so a repository name can be copied', () => {
  const { container } = render(<Row />)
  expect(container.querySelector('label')?.className).not.toContain('select-none')
})

test('marks its wrapper as a switch row of its own, not as a SettingRow', () => {
  const { container } = render(<Row />)
  expect(container.querySelector('[data-nt-setting-switch-row]')).not.toBeNull()
  expect(container.querySelector('[data-nt-setting-row]')).toBeNull()
})

test('turns the switch off and says why when the row is dimmed', async () => {
  const onChange = vi.fn()
  render(
    <Row
      description="Lens begint als een pull request opent"
      dimmed="Koppel eerst een repository"
      onChange={onChange}
    />,
  )
  expect(control()).toBeDisabled()
  expect(control()).toHaveAccessibleDescription(
    'Lens begint als een pull request opent Koppel eerst een repository',
  )
  await userEvent.click(screen.getByText('Elke nieuwe pull request beoordelen'))
  expect(onChange).not.toHaveBeenCalled()
  // The words stay readable: only the switch is dimmed.
  expect(
    screen.getByText('Elke nieuwe pull request beoordelen').closest('[class*="opacity"]'),
  ).toBeNull()
})

test('a disabled row does not switch from its words', async () => {
  const onChange = vi.fn()
  render(<Row disabled onChange={onChange} />)
  await userEvent.click(screen.getByText('Elke nieuwe pull request beoordelen'))
  expect(onChange).not.toHaveBeenCalled()
  expect(control()).toBeDisabled()
})
