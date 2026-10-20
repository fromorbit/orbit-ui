import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { PathField } from './PathField'

function renderField(props: Partial<ComponentProps<typeof PathField>> = {}) {
  const onChoose = vi.fn()
  render(
    <TooltipProvider>
      <PathField
        label="Werkmap"
        chooseLabel="Kies…"
        clearLabel="Wissen"
        placeholder="Niet gekozen"
        value={null}
        onChoose={onChoose}
        {...props}
      />
    </TooltipProvider>,
  )
  return { onChoose }
}

test('the field is one group named by its label', () => {
  renderField()
  expect(screen.getByRole('group', { name: 'Werkmap' })).toBeInTheDocument()
})

test('without a path it says so in quiet words', () => {
  renderField()
  expect(screen.getByText('Niet gekozen')).toBeInTheDocument()
})

test('a placeholder of its own says what empty means', () => {
  renderField({ placeholder: 'Uit PATH' })
  expect(screen.getByText('Uit PATH')).toBeInTheDocument()
  expect(screen.queryByText('Niet gekozen')).toBeNull()
})

test('a chosen path is shown in full to the reader', () => {
  renderField({ value: '/work/webwinkel/docs' })
  // `PathLabel` splits head and tail into two spans; its title carries the whole path.
  expect(screen.getByTitle('/work/webwinkel/docs')).toHaveTextContent('/work/webwinkel/docs')
  expect(screen.queryByText('Niet gekozen')).toBeNull()
})

test('"Kies…" asks the caller to open the dialog', async () => {
  const { onChoose } = renderField()
  await userEvent.click(screen.getByRole('button', { name: 'Kies…' }))
  expect(onChoose).toHaveBeenCalledOnce()
})

test('a chosen path can be cleared, and the focus goes on to "Kies…"', async () => {
  const onClear = vi.fn()
  renderField({ value: '/work/webwinkel', onClear })
  await userEvent.click(screen.getByRole('button', { name: 'Wissen' }))
  expect(onClear).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Kies…' })).toHaveFocus()
})

test('nothing to clear without a path, or without onClear', () => {
  renderField({ onClear: vi.fn() })
  expect(screen.queryByRole('button', { name: 'Wissen' })).toBeNull()
})

test('disabled turns both buttons off', () => {
  renderField({ value: '/work/webwinkel', onClear: vi.fn(), disabled: true })
  expect(screen.getByRole('button', { name: 'Kies…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Wissen' })).toBeDisabled()
})

test('the ids of a row name the group', () => {
  render(
    <TooltipProvider>
      <span id="rij">Map van de agent</span>
      <PathField
        label="Werkmap"
        chooseLabel="Kies…"
        placeholder="Niet gekozen"
        aria-labelledby="rij"
        value={null}
        onChoose={() => undefined}
      />
    </TooltipProvider>,
  )
  expect(screen.getByRole('group', { name: 'Map van de agent' })).toBeInTheDocument()
})

test('the cross shows its name as a tooltip on focus', async () => {
  renderField({ value: '/work/webwinkel', onClear: vi.fn() })
  screen.getByRole('button', { name: 'Wissen' }).focus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Wissen')
})
