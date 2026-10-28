import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Button } from '../primitives/Button'
import { EmptyState } from './EmptyState'

test('the title is on screen', () => {
  render(<EmptyState icon="message-circle" title="Nog geen chats" />)
  expect(screen.getByText('Nog geen chats')).toBeInTheDocument()
})

test('the title is a paragraph, because most empty states sit inside something else', () => {
  render(<EmptyState icon="message-circle" title="Nog geen chats" />)
  expect(screen.queryByRole('heading')).toBeNull()
  expect(screen.getByText('Nog geen chats').tagName).toBe('P')
})

test('a caller that fills a whole panel asks for the title to be its heading', () => {
  render(<EmptyState icon="message-circle" title="Waar wil je aan werken?" titleAs="h1" />)
  const heading = screen.getByRole('heading', { level: 1, name: 'Waar wil je aan werken?' })
  // The same drawing, only another element: the class string may not fork with the tag.
  expect(heading.className).toBe('m-0 text-[13px] font-heading text-fg')
})

test('the explanation stands under the title when there is one', () => {
  render(
    <EmptyState icon="message-circle" title="Nog geen chats" description="Begin een gesprek." />,
  )
  expect(screen.getByText('Begin een gesprek.')).toBeInTheDocument()
})

test('without an explanation there is only a title', () => {
  const { container } = render(<EmptyState icon="message-circle" title="Nog geen chats" />)
  expect(container.querySelectorAll('p')).toHaveLength(1)
})

test('the icon is decorative: the title carries the message', () => {
  const { container } = render(<EmptyState icon="message-circle" title="Nog geen chats" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('the action is a plain button that the caller supplies', async () => {
  const onClick = vi.fn()
  render(
    <EmptyState
      icon="message-circle"
      title="Nog geen chats"
      action={
        <Button variant="primary" onClick={onClick}>
          Nieuwe chat
        </Button>
      }
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Nieuwe chat' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('without an action there is no button', () => {
  render(<EmptyState icon="message-circle" title="Nog geen chats" />)
  expect(screen.queryByRole('button')).toBeNull()
})
