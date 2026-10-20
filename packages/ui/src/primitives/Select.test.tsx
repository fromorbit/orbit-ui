import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Select } from './Select'

const options = [
  { value: 'a', label: 'Project A' },
  { value: 'b', label: 'Project B' },
]

test('shows the chosen value with the label as its accessible name', () => {
  render(<Select label="Project" value="a" options={options} onValueChange={vi.fn()} />)
  const trigger = screen.getByRole('combobox', { name: 'Project' })
  expect(trigger).toHaveTextContent('Project A')
})

test('opens with Enter and picks with arrow keys', async () => {
  const onValueChange = vi.fn()
  render(<Select label="Project" value="a" options={options} onValueChange={onValueChange} />)
  const trigger = screen.getByRole('combobox', { name: 'Project' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(onValueChange).toHaveBeenCalledWith('b')
})

test('disabled cannot be opened', () => {
  render(<Select label="Project" value="a" options={options} disabled onValueChange={vi.fn()} />)
  expect(screen.getByRole('combobox', { name: 'Project' })).toBeDisabled()
})

test('a disabled option stays in the list, greyed, and cannot be picked', async () => {
  const onValueChange = vi.fn()
  render(
    <Select
      label="Project"
      value="a"
      options={[...options, { value: 'c', label: 'Project C', disabled: true }]}
      onValueChange={onValueChange}
    />,
  )
  await userEvent.click(screen.getByRole('combobox', { name: 'Project' }))
  const greyed = await screen.findByRole('option', { name: 'Project C' })
  expect(greyed).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(greyed)
  expect(onValueChange).not.toHaveBeenCalled()
})

test('without size the size is md', () => {
  render(<Select label="Project" value="a" options={options} onValueChange={vi.fn()} />)
  expect(screen.getByRole('combobox', { name: 'Project' }).className).toContain(
    'h-(--nt-control-md)',
  )
})

test.each([
  ['sm', 'h-(--nt-control-sm)'],
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  render(<Select label="Project" value="a" options={options} size={size} onValueChange={vi.fn()} />)
  expect(screen.getByRole('combobox', { name: 'Project' }).className).toContain(expected)
})

test('the popup uses the layer and surface tokens, no z-50, bg-bg or shadow-xl', async () => {
  render(<Select label="Project" value="a" options={options} onValueChange={vi.fn()} />)
  await userEvent.click(screen.getByRole('combobox', { name: 'Project' }))
  const listbox = await screen.findByRole('listbox')
  expect(listbox.className).toContain('z-(--nt-z-popover)')
  expect(listbox.className).toContain('bg-overlay')
  expect(listbox.className).toContain('shadow-menu')
  expect(listbox.className).not.toContain('z-50')
  expect(listbox.className).not.toContain('bg-bg')
  expect(listbox.className).not.toContain('shadow-xl')
})

// An option is a row you click, so it is as tall as the trigger that opened it. Written as `h-7`
// that was the same 28px by coincidence: the token could move and the popup would stay behind.
test('an item in the popup is as high as a control of size md, from the token', async () => {
  render(<Select label="Project" value="a" options={options} onValueChange={vi.fn()} />)
  await userEvent.click(screen.getByRole('combobox', { name: 'Project' }))
  const item = await screen.findByRole('option', { name: 'Project A' })
  expect(item.className).toContain('h-(--nt-control-md)')
  expect(item.className).not.toContain('h-7')
})

test('the chevron comes from the Icon registry, no loose svg path', () => {
  const { container } = render(
    <Select label="Project" value="a" options={options} onValueChange={vi.fn()} />,
  )
  const svg = container.querySelector('svg')
  // Icon always sets 1.75; the inline svg it replaces used 1.5.
  expect(svg).toHaveAttribute('stroke-width', '1.75')
})

test('the value type is the caller’s own, so a foreign value does not type-check', () => {
  // Generic in its value, like `SegmentedControl`: a caller whose options are a union hears that
  // union back in `onValueChange` instead of a bare `string` it has to cast. That `tsc` does not
  // flag the directive below as unused is the proof that the narrowing bites.
  type Level = 'manual' | 'full'
  const levels: readonly { value: Level; label: string }[] = [
    { value: 'manual', label: 'Handmatig' },
    { value: 'full', label: 'Volledige toegang' },
  ]
  render(
    // The type argument is written out, because inference would otherwise widen it to whatever
    // `value` happens to say — and it is exactly that widening this test is about.
    <Select<Level>
      label="Toegangsniveau"
      // @ts-expect-error `value` has to be one of the options, not any string.
      value="auto"
      options={levels}
      onValueChange={(level) => {
        // And what comes back is the union, not `string`: it fits a variable of the union's own
        // type without a cast, which a `string` would not.
        const narrowed: Level = level
        expect(narrowed).toBe('full')
      }}
    />,
  )
  expect(screen.getByRole('combobox', { name: 'Toegangsniveau' })).toBeInTheDocument()
})

/** Lets every timer that is due run: Radix hands the focus back one task after the list closed. */
function nextTasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20))
}

/** Picks the second option with the keyboard, then does `after` a task later. */
async function pickThen(after: () => void): Promise<void> {
  function Picking() {
    const [value, setValue] = useState('a')
    return (
      <>
        <input aria-label="Adres" />
        <Select
          label="Project"
          value={value}
          options={options}
          onValueChange={(next) => {
            setValue(next)
            // After the list is gone but ahead of the hand-back: a timer set before its own.
            setTimeout(after, 0)
          }}
        />
      </>
    )
  }
  render(<Picking />)
  screen.getByRole('combobox', { name: 'Project' }).focus()
  await userEvent.keyboard('{Enter}')
  await screen.findByRole('listbox')
  await userEvent.keyboard('{ArrowDown}{Enter}')
}

test('the hand-back never takes the focus from what holds it by then', async () => {
  await pickThen(() => screen.getByRole('textbox', { name: 'Adres' }).focus())
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  await nextTasks()
  expect(screen.getByRole('textbox', { name: 'Adres' })).toHaveFocus()
})

test('picked with the keyboard, the focus comes back to the trigger', async () => {
  await pickThen(() => {})
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  await nextTasks()
  expect(screen.getByRole('combobox', { name: 'Project' })).toHaveFocus()
})
