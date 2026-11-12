import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { UnreadBadge } from './UnreadBadge'

test('says the count in words and shows the digits', () => {
  const { container } = render(<UnreadBadge count={3} label="3 ongelezen berichten" />)
  expect(screen.getByText('3 ongelezen berichten')).toBeInTheDocument()
  const digits = container.querySelector('[aria-hidden="true"]')
  expect(digits).toHaveTextContent('3')
})

test('caps a large count', () => {
  const { container } = render(<UnreadBadge count={120} label="120 ongelezen berichten" />)
  expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('99+')
})

test('draws nothing when everything is read', () => {
  const { container } = render(<UnreadBadge count={0} label="Geen ongelezen berichten" />)
  expect(container).toBeEmptyDOMElement()
})
