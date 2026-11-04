import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { IconButton } from '../primitives/IconButton'
import { ChatLog, ChatMessage } from './ChatMessage'

test('a message is an article named by who speaks', () => {
  render(
    <>
      <ChatMessage from="user" label="Jij">
        Kun je de btw uitrekenen?
      </ChatMessage>
      <ChatMessage from="assistant" label="Opus 5.5">
        Ja, zo:
      </ChatMessage>
    </>,
  )
  expect(screen.getByRole('article', { name: 'Jij' })).toHaveTextContent(
    'Kun je de btw uitrekenen?',
  )
  expect(screen.getByRole('article', { name: 'Opus 5.5' })).toHaveTextContent('Ja, zo:')
})

test('an answer carries its actions and its meta', () => {
  render(
    <ChatMessage
      from="assistant"
      label="Opus 5.5"
      meta="Opus 5.5 · klaar in 12 s"
      actions={<IconButton icon="rotate-ccw" label="Opnieuw" />}
    >
      Klaar.
    </ChatMessage>,
  )
  const message = screen.getByRole('article', { name: 'Opus 5.5' })
  expect(within(message).getByRole('button', { name: 'Opnieuw' })).toBeInTheDocument()
  expect(message).toHaveTextContent('Opus 5.5 · klaar in 12 s')
})

test('while an answer streams it is busy and offers no actions yet', () => {
  render(
    <ChatMessage
      from="assistant"
      label="Opus 5.5"
      streaming
      actions={<IconButton icon="rotate-ccw" label="Opnieuw" />}
    >
      Ik begin met
    </ChatMessage>,
  )
  const message = screen.getByRole('article', { name: 'Opus 5.5' })
  expect(message).toHaveAttribute('aria-busy', 'true')
  expect(within(message).queryByRole('button')).not.toBeInTheDocument()
})

test('a complete answer is not busy', () => {
  render(
    <ChatMessage from="assistant" label="Opus 5.5">
      Klaar.
    </ChatMessage>,
  )
  expect(screen.getByRole('article')).not.toHaveAttribute('aria-busy')
})

test('an error is said in words under what did arrive, as an alert that describes the turn', () => {
  render(
    <ChatMessage
      from="assistant"
      label="Opus 5.5"
      error="De verbinding viel weg."
      errorAction={<button type="button">Opnieuw proberen</button>}
    >
      Ik heb gelezen
    </ChatMessage>,
  )
  const message = screen.getByRole('article')
  expect(message).toHaveTextContent('Ik heb gelezen')
  const alert = within(message).getByRole('alert')
  expect(alert).toHaveTextContent('De verbinding viel weg.')
  // The way on stands with the error, named in words.
  expect(within(alert).getByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument()
  expect(message).toHaveAccessibleDescription(/De verbinding viel weg\./)
})

test('the turns stand in a polite log, so a new one is announced', () => {
  render(
    <ChatLog label="Gesprek">
      <ChatMessage from="user" label="Jij">
        Hallo
      </ChatMessage>
    </ChatLog>,
  )
  const log = screen.getByRole('log', { name: 'Gesprek' })
  expect(log).toHaveAttribute('aria-live', 'polite')
  expect(log).toHaveAttribute('aria-relevant', 'additions')
  expect(within(log).getByRole('article', { name: 'Jij' })).toBeInTheDocument()
})

test('your own actions stay in the document, shown on hover or focus', () => {
  render(
    <ChatMessage from="user" label="Jij" actions={<IconButton icon="pencil" label="Bewerk" />}>
      Hallo
    </ChatMessage>,
  )
  // Hidden by opacity only: the keyboard reaches them, and the focus shows them.
  expect(screen.getByRole('button', { name: 'Bewerk' })).toBeInTheDocument()
})
