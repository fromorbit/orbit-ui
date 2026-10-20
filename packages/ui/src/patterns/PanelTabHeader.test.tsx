import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PanelTabHeader } from './PanelTabHeader'

test('draws a 40px strip with its title and actions', () => {
  const { container } = render(
    <PanelTabHeader title="Deze chat" actions={<button type="button">Uitklappen</button>} />,
  )
  const header = container.querySelector('[data-nt-panel-tab-header]')
  expect(header).not.toBeNull()
  // 40px, a rule under it and the 12px inset of the panel's gutter.
  expect(header?.className).toContain('h-10')
  expect(header?.className).toContain('border-b')
  expect(header?.className).toContain('px-3')
  // The rule inside the 40px, and the controls centred on a whole pixel above it.
  expect(header?.className).toContain('box-border')
  expect(header?.className).toContain('pt-px')
  expect(header).toHaveTextContent('Deze chat')
  expect(header).toContainElement(screen.getByRole('button', { name: 'Uitklappen' }))
})

test('keeps its height without a title or actions', () => {
  const { container } = render(<PanelTabHeader />)
  const header = container.querySelector('[data-nt-panel-tab-header]')
  expect(header?.className).toContain('h-10')
  expect(header?.className).toContain('shrink-0')
  expect(header?.querySelector('[data-nt-panel-tab-actions]')).toBeNull()
})

test('puts the actions after the title, at the far end', () => {
  const { container } = render(
    <PanelTabHeader title="Titel" actions={<button type="button">Meer</button>} />,
  )
  const actions = container.querySelector('[data-nt-panel-tab-actions]')
  const title = container.querySelector('[data-nt-panel-tab-title]')
  expect(actions?.className).toContain('ms-auto')
  expect(title?.compareDocumentPosition(actions as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})
