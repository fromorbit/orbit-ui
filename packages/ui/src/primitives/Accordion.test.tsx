import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { Accordion } from './Accordion'

const ITEMS = [
  { id: 'kosten', title: 'Wat kost een space?', content: 'Niets zolang hij stilstaat.' },
  { id: 'data', title: 'Waar staat mijn data?', content: 'In Amsterdam.' },
  { id: 'oud', title: 'Oude vraag', content: 'Weg.', disabled: true },
  { id: 'export', title: 'Kan ik exporteren?', content: 'Ja, als zip.' },
]

function Single({ onChange = vi.fn() }: { onChange?(value: string | null): void }) {
  const [value, setValue] = useState<string | null>('kosten')
  return (
    <Accordion
      type="single"
      items={ITEMS}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

test('each title is a button in a heading, saying whether it is open', () => {
  render(<Single />)
  const open = screen.getByRole('button', { name: 'Wat kost een space?' })
  expect(open).toHaveAttribute('aria-expanded', 'true')
  expect(open.closest('h3')).not.toBeNull()
  expect(screen.getByText('Niets zolang hij stilstaat.')).toBeVisible()
  expect(screen.queryByText('In Amsterdam.')).not.toBeInTheDocument()
})

test('single: opening one closes the other; a second press closes it', async () => {
  const onChange = vi.fn()
  render(<Single onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Waar staat mijn data?' }))
  expect(onChange).toHaveBeenLastCalledWith('data')
  expect(screen.queryByText('Niets zolang hij stilstaat.')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Waar staat mijn data?' }))
  expect(onChange).toHaveBeenLastCalledWith(null)
})

test('the arrows move between the titles, past a disabled one', async () => {
  render(<Single />)
  screen.getByRole('button', { name: 'Wat kost een space?' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Waar staat mijn data?' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(screen.getByRole('button', { name: 'Kan ik exporteren?' })).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(screen.getByRole('button', { name: 'Wat kost een space?' })).toHaveFocus()
})

test('multiple keeps several open', async () => {
  const onValueChange = vi.fn()
  render(
    <Accordion type="multiple" items={ITEMS} value={['kosten']} onValueChange={onValueChange} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Kan ik exporteren?' }))
  expect(onValueChange).toHaveBeenLastCalledWith(['kosten', 'export'])
})
