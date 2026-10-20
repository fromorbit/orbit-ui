import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { uiWrapper } from '../testing/ui-wrapper'
import { ChoiceCard } from './ChoiceCard'

test('a card is one row with icon, title and key', () => {
  render(<ChoiceCard icon="file-diff" title="Wijzigingen" shortcut="demo.letter" />, {
    wrapper: uiWrapper(),
  })
  const card = screen.getByRole('button', { name: 'Wijzigingen' })
  expect(card.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  // The key is drawn beside the title and announced as the key of the card, not as its name.
  expect(card).toHaveAttribute('aria-keyshortcuts', 'W')
  expect(card).toHaveTextContent('W')
  expect(card.className).toContain('h-(--nt-control-lg)')
})

test('rests one step lighter than the panel and steps up on hover', () => {
  render(<ChoiceCard icon="file-diff" title="Wijzigingen" />)
  const card = screen.getByRole('button', { name: 'Wijzigingen' })
  expect(card.className).toContain('bg-surface')
  expect(card.className).toContain('hover:bg-surface-hover')
  expect(card.className).toContain('focus-visible:bg-surface-hover')
  // No outline around a card: the fill is the shape.
  expect(card.className).not.toMatch(/(^|\s)border(\s|-)/)
})

test('a dimmed card stays focusable, says why, and does not choose', async () => {
  const onClick = vi.fn()
  render(
    <TooltipProvider delayDuration={0}>
      <ChoiceCard icon="terminal" title="Terminal" disabled reason="Komt later" onClick={onClick} />
    </TooltipProvider>,
  )
  const card = screen.getByRole('button', { name: 'Terminal' })
  expect(card).toHaveAttribute('aria-disabled', 'true')
  expect(card).not.toBeDisabled()
  await userEvent.tab()
  expect(card).toHaveFocus()
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Komt later')
  await userEvent.click(card)
  expect(onClick).not.toHaveBeenCalled()
})
