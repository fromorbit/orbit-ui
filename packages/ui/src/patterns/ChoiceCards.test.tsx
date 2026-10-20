import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { type ChoiceCardItem, ChoiceCards } from './ChoiceCards'

const ITEMS: readonly ChoiceCardItem[] = [
  { id: 'changes', icon: 'file-diff', title: 'Wijzigingen' },
  { id: 'browser', icon: 'globe', title: 'Browser' },
  { id: 'terminal', icon: 'terminal', title: 'Terminal', disabled: true, reason: 'Komt later' },
]

function renderCards(onChoose = vi.fn()) {
  render(
    <TooltipProvider>
      <ChoiceCards label="Open een tab" items={ITEMS} onChoose={onChoose} />
    </TooltipProvider>,
  )
  return onChoose
}

test('the cards form one named group in one column', () => {
  renderCards()
  const group = screen.getByRole('group', { name: 'Open een tab' })
  expect(group.className).toContain('flex-col')
  expect(group.className).toContain('gap-2')
})

test('one tab stop, arrows move between cards', async () => {
  renderCards()
  const cards = screen.getAllByRole('button')
  expect(cards.map((card) => card.tabIndex)).toEqual([0, -1, -1])
  await userEvent.tab()
  expect(cards[0]).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(cards[1]).toHaveFocus()
  // The dimmed card is reachable too: it says why it cannot open.
  await userEvent.keyboard('{ArrowDown}')
  expect(cards[2]).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(cards[2]).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  expect(cards[1]).toHaveFocus()
  expect(cards.map((card) => card.tabIndex)).toEqual([-1, 0, -1])
})

test('Home and End reach the ends', async () => {
  renderCards()
  const cards = screen.getAllByRole('button')
  await userEvent.tab()
  await userEvent.keyboard('{End}')
  expect(cards[2]).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(cards[0]).toHaveFocus()
})

test('Enter chooses the focused card, a dimmed card chooses nothing', async () => {
  const onChoose = renderCards()
  await userEvent.tab()
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(onChoose).toHaveBeenCalledWith('browser')
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(onChoose).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('button', { name: 'Wijzigingen' }))
  expect(onChoose).toHaveBeenLastCalledWith('changes')
})
