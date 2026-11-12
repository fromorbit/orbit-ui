import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { IconButton } from '../primitives/IconButton'
import { ChatLog, ChatMessage, TypingDots } from './ChatMessage'

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
      actions={<IconButton icon="repeat" label="Opnieuw genereren" />}
    >
      Klaar.
    </ChatMessage>,
  )
  const message = screen.getByRole('article', { name: 'Opus 5.5' })
  expect(within(message).getByRole('button', { name: 'Opnieuw genereren' })).toBeInTheDocument()
  expect(message).toHaveTextContent('Opus 5.5 · klaar in 12 s')
})

test('while an answer streams it is busy and offers no actions yet', () => {
  render(
    <ChatMessage
      from="assistant"
      label="Opus 5.5"
      streaming
      actions={<IconButton icon="repeat" label="Opnieuw genereren" />}
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

test('your own question is read before its buttons', () => {
  // The buttons stand to the left of the bubble on screen, but a screen reader walking the turn
  // hears the question first: the row is reversed, the document is not.
  render(
    <ChatMessage
      from="user"
      label="Jij"
      meta="14:02"
      actions={<button type="button">Kopiëren</button>}
    >
      Kun je de btw uitrekenen?
    </ChatMessage>,
  )
  expect(screen.getByRole('article', { name: 'Jij' }).textContent).toMatch(
    /^Kun je de btw uitrekenen\?.*Kopiëren/,
  )
})

test('inside a log the error is no alert of its own: the polite log says it, once', () => {
  render(
    <ChatLog label="Gesprek">
      <ChatMessage from="assistant" label="Opus 5.5" error="De verbinding viel weg.">
        Ik heb gelezen
      </ChatMessage>
    </ChatLog>,
  )
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('article')).toHaveAccessibleDescription(/De verbinding viel weg\./)
})

test('a bubble from you sits on the right and one from Orb on the left with its mark', () => {
  render(
    <ChatLog label="Gesprek met Orb">
      <ChatMessage shape="bubble" from="user" label="Jij">
        Hoe staat de checkout-suite ervoor?
      </ChatMessage>
      <ChatMessage
        shape="bubble"
        from="assistant"
        label="Orb"
        mark={<span data-testid="mark" aria-hidden="true" />}
        source="Uit zichzelf, na run 1291 van Trail · 08:12"
        actions={<button type="button">Open run 1284</button>}
      >
        Drie van de vier flows slagen.
      </ChatMessage>
    </ChatLog>,
  )
  const mine = screen.getByRole('article', { name: 'Jij' })
  expect(mine).toHaveAttribute('data-nt-chat-side', 'end')
  expect(mine.querySelector('[data-nt-chat-bubble]')?.className).toContain('rounded-br-sm')

  const theirs = screen.getByRole('article', { name: 'Orb' })
  expect(theirs).toHaveAttribute('data-nt-chat-side', 'start')
  const bubble = theirs.querySelector('[data-nt-chat-bubble]')
  expect(bubble?.className).toContain('rounded-bl-sm')
  expect(bubble?.className).toContain('border-border')
  // The mark stands before the bubble, the source line above it, the chips under it.
  const mark = within(theirs).getByTestId('mark')
  expect(
    mark.compareDocumentPosition(bubble as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(theirs.textContent).toMatch(
    /^Uit zichzelf, na run 1291 van Trail · 08:12.*Drie van de vier flows slagen\..*Open run 1284$/,
  )
  expect(within(theirs).getByRole('button', { name: 'Open run 1284' })).toBeVisible()
})

test('while Orb types, its bubble is busy and shows three dots with a name', () => {
  render(
    <ChatMessage shape="bubble" from="assistant" label="Orb" streaming>
      <TypingDots label="Orb typt" />
    </ChatMessage>,
  )
  const message = screen.getByRole('article', { name: 'Orb' })
  expect(message).toHaveAttribute('aria-busy', 'true')
  const dots = within(message).getByRole('img', { name: 'Orb typt' })
  expect(dots.className).toContain('nt-typing')
  expect(dots.children).toHaveLength(3)
})
