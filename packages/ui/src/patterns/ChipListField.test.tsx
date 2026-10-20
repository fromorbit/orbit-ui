import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { nl } from '../testing/labels'
import { ChipListField, type ChipListFieldProps } from './ChipListField'

/** A list that keeps what it was handed, the way a settings row holds what core confirmed. */
function Harness(
  props: Partial<ChipListFieldProps> & {
    initial?: readonly string[]
    spy?: (next: string[]) => void
  },
) {
  const { initial = [], spy, onChange, ...rest } = props
  const [value, setValue] = useState<readonly string[]>(initial)
  return (
    <TooltipProvider>
      <ChipListField
        labels={nl.chipList}
        label="Hosts"
        maxItems={5}
        maxLength={40}
        {...rest}
        value={value}
        onChange={async (next) => {
          spy?.([...next])
          const refused = await onChange?.(next)
          if (refused === undefined) setValue(next)
          return refused
        }}
      />
    </TooltipProvider>
  )
}

function field(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Hosts' })
}

function chips(): string[] {
  const list = screen.queryByRole('list', { name: 'Hosts' })
  return list
    ? within(list)
        .queryAllByRole('listitem')
        .map((item) => item.textContent ?? '')
    : []
}

test('each value is a chip in a list named after the field', () => {
  render(<Harness initial={['winkel.test', 'api.winkel.test']} />)
  expect(chips()).toEqual(['winkel.test', 'api.winkel.test'])
})

test('the field at the end invites to add', () => {
  render(<Harness />)
  expect(field()).toHaveAttribute('placeholder', 'Toevoegen…')
})

test('Enter adds the trimmed value and empties the field', async () => {
  const spy = vi.fn()
  render(<Harness initial={['een']} spy={spy} />)
  await userEvent.type(field(), '  twee  {Enter}')
  expect(spy).toHaveBeenCalledWith(['een', 'twee'])
  expect(chips()).toEqual(['een', 'twee'])
  expect(field()).toHaveValue('')
  expect(field()).toHaveFocus()
})

test('Enter on an empty field adds nothing', async () => {
  const spy = vi.fn()
  render(<Harness spy={spy} />)
  await userEvent.type(field(), '   {Enter}')
  expect(spy).not.toHaveBeenCalled()
})

test('a value that is already there is refused with its reason, and stays in the field', async () => {
  const spy = vi.fn()
  render(<Harness initial={['een']} spy={spy} />)
  await userEvent.type(field(), 'een{Enter}')
  expect(spy).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('een staat er al')
  expect(field()).toHaveValue('een')
  expect(field()).toHaveAccessibleDescription('een staat er al')
})

test('the next keystroke clears the reason', async () => {
  render(<Harness initial={['een']} />)
  await userEvent.type(field(), 'een{Enter}')
  await userEvent.type(field(), 's')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('check refuses a value in words before anything is sent', async () => {
  const spy = vi.fn()
  render(
    <Harness
      spy={spy}
      check={(item) => (item.includes(' ') ? 'Geen spaties in een host' : undefined)}
    />,
  )
  await userEvent.type(field(), 'twee woorden{Enter}')
  expect(spy).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('Geen spaties in een host')
})

test('a refusal of the caller keeps the draft and shows the reason', async () => {
  render(<Harness onChange={async () => 'Core weigerde dit'} />)
  await userEvent.type(field(), 'fout{Enter}')
  expect(screen.getByRole('alert')).toHaveTextContent('Core weigerde dit')
  expect(field()).toHaveValue('fout')
  expect(chips()).toEqual([])
})

test('maxLength bounds what can be typed', () => {
  render(<Harness maxLength={12} />)
  expect(field()).toHaveAttribute('maxlength', '12')
})

test('a full list offers no field to add to', () => {
  render(<Harness initial={['a', 'b']} maxItems={2} />)
  expect(screen.queryByRole('textbox', { name: 'Hosts' })).toBeNull()
})

test('adding the last item that fits hands the focus to its cross, not to the page', async () => {
  render(<Harness initial={['een']} maxItems={2} />)
  await userEvent.type(field(), 'twee{Enter}')
  expect(screen.queryByRole('textbox', { name: 'Hosts' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Haal twee weg' })).toHaveFocus()
})

test('the cross of a chip removes it, and names what it removes', async () => {
  const spy = vi.fn()
  render(<Harness initial={['een', 'twee', 'drie']} spy={spy} />)
  await userEvent.click(screen.getByRole('button', { name: 'Haal twee weg' }))
  expect(spy).toHaveBeenCalledWith(['een', 'drie'])
  expect(chips()).toEqual(['een', 'drie'])
  // The focus goes on to the next chip's cross, not back to the top of the page.
  expect(screen.getByRole('button', { name: 'Haal drie weg' })).toHaveFocus()
})

test('removing the last chip hands the focus to the field', async () => {
  render(<Harness initial={['een']} />)
  await userEvent.click(screen.getByRole('button', { name: 'Haal een weg' }))
  expect(field()).toHaveFocus()
})

test('Backspace in an empty field picks the last chip back up to edit', async () => {
  const spy = vi.fn()
  render(<Harness initial={['een', 'twee']} spy={spy} />)
  await userEvent.click(field())
  await userEvent.keyboard('{Backspace}')
  expect(spy).toHaveBeenCalledWith(['een'])
  expect(chips()).toEqual(['een'])
  expect(field()).toHaveValue('twee')
})

test('Backspace in a field with text only edits the text', async () => {
  const spy = vi.fn()
  render(<Harness initial={['een']} spy={spy} />)
  await userEvent.type(field(), 'ab{Backspace}')
  expect(spy).not.toHaveBeenCalled()
  expect(field()).toHaveValue('a')
})

test('minItems keeps the crosses of the last ones away', () => {
  render(<Harness initial={['een']} minItems={1} />)
  expect(screen.queryByRole('button', { name: 'Haal een weg' })).toBeNull()
})

test('disabled turns adding and removing off', () => {
  render(<Harness initial={['een']} disabled />)
  expect(field()).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Haal een weg' })).toBeDisabled()
})
