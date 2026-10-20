import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'klein', label: 'Klein' },
  { value: 'groot', label: 'Groot' },
] as const

test('exactly one option is chosen, as a radio in the group', () => {
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      onValueChange={vi.fn()}
    />,
  )
  const group = screen.getByRole('radiogroup', { name: 'Tekstgrootte' })
  expect(within(group).getByRole('radio', { name: 'Klein' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(within(group).getByRole('radio', { name: 'Groot' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})

test('choosing another option reports the new value', async () => {
  const onValueChange = vi.fn()
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('radio', { name: 'Groot' }))
  expect(onValueChange).toHaveBeenCalledWith('groot')
})

test('one disabled option cannot be chosen, the others still can', async () => {
  const onValueChange = vi.fn()
  render(
    <SegmentedControl
      label="Stand"
      value="code"
      options={[
        { value: 'read', label: 'Lezen', disabled: true },
        { value: 'code', label: 'Code' },
      ]}
      onValueChange={onValueChange}
    />,
  )
  const read = screen.getByRole('radio', { name: 'Lezen' })
  expect(read).toBeDisabled()
  await userEvent.click(read)
  expect(onValueChange).not.toHaveBeenCalled()
  expect(screen.getByRole('radio', { name: 'Code' })).toBeEnabled()
})

test('disabled cannot be operated', async () => {
  const onValueChange = vi.fn()
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      disabled
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('radio', { name: 'Groot' }))
  expect(onValueChange).not.toHaveBeenCalled()
})

// Every other control in the library dims at 40% when it is off; without this the group looked
// exactly like a live one, so the only way to find out was to click it.
test('disabled dims the whole group, checked segment included', () => {
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      disabled
      onValueChange={vi.fn()}
    />,
  )
  const group = screen.getByRole('radiogroup', { name: 'Tekstgrootte' })
  expect(group).toHaveAttribute('data-disabled')
  expect(group.className).toContain('data-disabled:opacity-40')
})

test('without size the size is md', () => {
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      onValueChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('radio', { name: 'Klein' }).className).toContain('h-(--nt-control-md)')
})

test.each([
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      size={size}
      onValueChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('radio', { name: 'Klein' }).className).toContain(expected)
})

test('each segment can be wrapped, and stays a radio of the group', () => {
  render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      onValueChange={vi.fn()}
      wrapItem={(item, value) => (
        <span key={value} data-wrapped={value}>
          {item}
        </span>
      )}
    />,
  )
  const group = screen.getByRole('radiogroup', { name: 'Tekstgrootte' })
  const groot = within(group).getByRole('radio', { name: 'Groot' })
  expect(groot.closest('[data-wrapped]')).toHaveAttribute('data-wrapped', 'groot')
})

// A toolbar size: a frameless 20px group, lower than the 24px ghost button beside it — first a
// 24px segment in 6px of frame read as a block, then a
// framed 24px group still weighed more than the file name beside it.
test('size="sm" is a frameless group at the extra-small control height', () => {
  const { rerender } = render(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      size="sm"
      onValueChange={vi.fn()}
    />,
  )
  const group = screen.getByRole('radiogroup', { name: 'Tekstgrootte' })
  expect(group).toHaveClass('h-(--nt-control-xs)')
  expect(group).not.toHaveClass('border')
  expect(group).not.toHaveClass('bg-surface')
  const segment = screen.getByRole('radio', { name: 'Klein' })
  expect(segment).toHaveClass('h-full', 'text-[12px]')
  expect(segment.className).not.toContain('h-(--nt-control-sm)')

  // The settings sizes keep their frame.
  rerender(
    <SegmentedControl
      label="Tekstgrootte"
      value="klein"
      options={options}
      size="md"
      onValueChange={vi.fn()}
    />,
  )
  expect(screen.getByRole('radiogroup', { name: 'Tekstgrootte' })).toHaveClass(
    'border',
    'bg-surface',
  )
})

test('an option with an icon keeps its label as its name', () => {
  render(
    <SegmentedControl
      label="Stand"
      value="read"
      options={[
        { value: 'read', label: 'Lezen', icon: 'book-open' },
        { value: 'code', label: 'Code', icon: 'code' },
      ]}
      size="sm"
      onValueChange={vi.fn()}
    />,
  )
  const read = screen.getByRole('radio', { name: 'Lezen' })
  expect(read.querySelector('svg')).not.toBeNull()
})

test('collapse leaves only the icons below the narrow toolbar width', () => {
  render(
    <SegmentedControl
      label="Stand"
      value="read"
      collapse
      options={[
        { value: 'read', label: 'Lezen', icon: 'book-open' },
        { value: 'code', label: 'Code', icon: 'code' },
      ]}
      size="sm"
      onValueChange={vi.fn()}
    />,
  )
  const read = screen.getByRole('radio', { name: 'Lezen' })
  // The word goes out of sight but stays the name; the icon only shows when the word is gone.
  expect(within(read).getByText('Lezen')).toHaveClass('@max-[480px]/toolbar:sr-only')
  expect(read.querySelector('[data-nt-segment-icon]')).toHaveClass(
    'hidden',
    '@max-[480px]/toolbar:inline-flex',
  )
  // Folded, the segment tightens to a square around its icon.
  expect(read).toHaveClass('@max-[480px]/toolbar:px-[3px]')
})

test('collapseBelow folds at a narrower toolbar', () => {
  render(
    <SegmentedControl
      label="Stand"
      value="read"
      collapse
      collapseBelow={320}
      options={[{ value: 'read', label: 'Lezen', icon: 'book-open' }]}
      size="sm"
      onValueChange={vi.fn()}
    />,
  )
  const read = screen.getByRole('radio', { name: 'Lezen' })
  expect(within(read).getByText('Lezen')).toHaveClass('@max-[320px]/toolbar:sr-only')
  expect(read.querySelector('[data-nt-segment-icon]')).toHaveClass(
    'hidden',
    '@max-[320px]/toolbar:inline-flex',
  )
})

test('without collapse an icon stands beside its word', () => {
  render(
    <SegmentedControl
      label="Stand"
      value="read"
      options={[{ value: 'read', label: 'Lezen', icon: 'book-open' }]}
      size="sm"
      onValueChange={vi.fn()}
    />,
  )
  const read = screen.getByRole('radio', { name: 'Lezen' })
  expect(read.querySelector('[data-nt-segment-icon]')).not.toHaveClass('hidden')
  expect(within(read).getByText('Lezen')).not.toHaveClass('@max-[480px]/toolbar:sr-only')
})
