import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { UiProvider } from '../provider/UiProvider'
import { NumberField } from './NumberField'

test('saves when the field is left', async () => {
  const onCommit = vi.fn()
  render(
    <NumberField label="Gelijktijdige beurten" value={4} min={1} max={16} onCommit={onCommit} />,
  )
  const field = screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })
  await userEvent.clear(field)
  await userEvent.type(field, '12')
  expect(onCommit).not.toHaveBeenCalled()
  await userEvent.tab()
  expect(onCommit).toHaveBeenCalledWith(12)
})

test('saves on Enter, without waiting for blur', async () => {
  const onCommit = vi.fn()
  render(
    <NumberField label="Gelijktijdige beurten" value={4} min={1} max={16} onCommit={onCommit} />,
  )
  const field = screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })
  await userEvent.clear(field)
  await userEvent.type(field, '9{Enter}')
  expect(onCommit).toHaveBeenCalledWith(9)
})

test('clamps a value that is too high to the maximum', async () => {
  const onCommit = vi.fn()
  render(
    <NumberField label="Gelijktijdige beurten" value={4} min={1} max={16} onCommit={onCommit} />,
  )
  const field = screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })
  await userEvent.clear(field)
  await userEvent.type(field, '99{Enter}')
  expect(onCommit).toHaveBeenCalledWith(16)
  expect(field).toHaveValue('16')
})

test('nonsense restores the previous value without saving', async () => {
  const onCommit = vi.fn()
  render(
    <NumberField label="Wachttijd op goedkeuring" value={5} min={0} max={60} onCommit={onCommit} />,
  )
  const field = screen.getByRole('spinbutton', { name: 'Wachttijd op goedkeuring' })
  await userEvent.clear(field)
  await userEvent.tab()
  expect(field).toHaveValue('5')
  expect(onCommit).not.toHaveBeenCalled()
})

test('shows a unit after the field when one is given', () => {
  render(
    <NumberField
      label="Wachttijd op goedkeuring"
      value={5}
      min={0}
      max={60}
      unit="min"
      onCommit={vi.fn()}
    />,
  )
  expect(screen.getByText('min')).toBeInTheDocument()
})

test('disabled cannot be edited', () => {
  render(
    <NumberField
      label="Gelijktijdige beurten"
      value={4}
      min={1}
      max={16}
      disabled
      onCommit={vi.fn()}
    />,
  )
  expect(screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })).toBeDisabled()
})

test('without size the size is md', () => {
  render(
    <NumberField label="Gelijktijdige beurten" value={4} min={1} max={16} onCommit={vi.fn()} />,
  )
  expect(
    screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' }).parentElement?.className,
  ).toContain('h-(--nt-control-md)')
})

test.each([
  ['sm', 'h-(--nt-control-sm)'],
  ['md', 'h-(--nt-control-md)'],
  ['lg', 'h-(--nt-control-lg)'],
] as const)('size="%s" gives %s', (size, expected) => {
  render(
    <NumberField
      label="Gelijktijdige beurten"
      value={4}
      min={1}
      max={16}
      size={size}
      onCommit={vi.fn()}
    />,
  )
  expect(
    screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' }).parentElement?.className,
  ).toContain(expected)
})

test('aria-labelledby wins over the label prop for the accessible name (Field supplies the visible label)', () => {
  render(
    <div>
      <span id="visible-label">Gelijktijdige beurten</span>
      <NumberField
        label="decoy"
        aria-labelledby="visible-label"
        value={4}
        min={1}
        max={16}
        onCommit={vi.fn()}
      />
    </div>,
  )
  expect(screen.getByRole('spinbutton', { name: 'Gelijktijdige beurten' })).toBeInTheDocument()
})

test('aria-describedby lands on the field', () => {
  render(
    <div>
      <span id="hint">Hoeveel beurten tegelijk mogen lopen.</span>
      <NumberField
        label="Gelijktijdige beurten"
        aria-describedby="hint"
        value={4}
        min={1}
        max={16}
        onCommit={vi.fn()}
      />
    </div>,
  )
  expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
    'Hoeveel beurten tegelijk mogen lopen.',
  )
})

test('the field is 160px wide with its unit outside the border, so rows end on one line', () => {
  // The unit is a suffix beside the input, not inside it.
  const { container } = render(
    <>
      <NumberField label="Beurten" value={4} min={1} max={16} onCommit={() => {}} />
      <NumberField label="Wachttijd" value={5} min={1} max={120} unit="min" onCommit={() => {}} />
    </>,
  )
  const plain = screen.getByRole('spinbutton', { name: 'Beurten' })
  const timed = screen.getByRole('spinbutton', { name: 'Wachttijd' })
  expect(plain.className).toContain('text-right')
  const fields = container.querySelectorAll('[data-nt-number-field]')
  expect(fields).toHaveLength(2)
  for (const field of fields) expect(field.className).toContain('w-40')
  // The unit is a sibling of the bordered frame, not a child of it.
  const frame = timed.parentElement as HTMLElement
  expect(frame.textContent).toBe('')
  expect(fields[1]).toHaveTextContent('min')
  expect(frame.parentElement).toBe(fields[1])
})

test('shows thousands separators at rest and plain digits while editing', async () => {
  const onCommit = vi.fn()
  render(
    <UiProvider locale="nl">
      <NumberField label="Tokens" value={200000} min={1} max={100000000} onCommit={onCommit} />
    </UiProvider>,
  )
  const field = screen.getByRole('spinbutton', { name: 'Tokens' })
  expect(field).toHaveValue('200.000')
  await userEvent.click(field)
  expect(field).toHaveValue('200000')
  await userEvent.clear(field)
  await userEvent.type(field, '1500000{Enter}')
  expect(onCommit).toHaveBeenCalledWith(1500000)
})

test('separates the thousands in the locale of the provider', () => {
  render(
    <UiProvider locale="en">
      <NumberField label="Tokens" value={200000} min={1} max={100000000} onCommit={vi.fn()} />
    </UiProvider>,
  )
  expect(screen.getByRole('spinbutton', { name: 'Tokens' })).toHaveValue('200,000')
})

test('the arrow keys step the value', async () => {
  render(<NumberField label="Beurten" value={4} min={1} max={16} onCommit={vi.fn()} />)
  const field = screen.getByRole('spinbutton', { name: 'Beurten' })
  await userEvent.click(field)
  await userEvent.keyboard('{ArrowUp}{ArrowUp}')
  expect(field).toHaveValue('6')
})
