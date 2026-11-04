import type { ReactNode } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Icon } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'
import { nl } from '../testing/labels'
import { ChatLog, ChatMessage } from './ChatMessage'
import { CopyButton } from './CopyButton'
import { Prose } from './Prose'
import { Shimmer } from './Shimmer'

/**
 * The column of a conversation: 720px at most, the turns 24px apart in a `ChatLog`, as the chat
 * lays them out.
 */
function Column({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[720px]">
      <ChatLog label="Gesprek">{children}</ChatLog>
    </div>
  )
}

const QUESTION = 'Kun je een functie schrijven die de btw uit een bedrag inclusief btw haalt?'

const ANSWER = [
  'Hier is een functie die het btw-bedrag uit een bedrag **inclusief** btw haalt:',
  '',
  '```ts',
  'export function btwUit(inclusief: number, tarief = 0.21): number {',
  '  const exclusief = inclusief / (1 + tarief)',
  '  return Math.round((inclusief - exclusief) * 100) / 100',
  '}',
  '```',
  '',
  'Rond pas **aan het eind** af, anders loopt het verschil per regel op.',
].join('\n')

/** The actions under an answer: copy and ask again. */
function AnswerActions({ text }: { text: string }) {
  return (
    <>
      <CopyButton {...nl.copy} text={text} />
      <IconButton icon="rotate-ccw" size="sm" label="Opnieuw" />
    </>
  )
}

export default {
  group: 'patterns',
  title: 'ChatMessage',
  states: {
    'A question and its answer': () => (
      <Column>
        <ChatMessage
          from="user"
          label="Jij"
          meta="14:02"
          actions={<CopyButton {...nl.copy} text={QUESTION} />}
        >
          {QUESTION}
        </ChatMessage>
        <ChatMessage
          from="assistant"
          label="Opus 5.5"
          meta="Opus 5.5 · klaar in 12 s"
          actions={<AnswerActions text={ANSWER} />}
        >
          <Prose labels={nl.prose} markdown={ANSWER} settled />
        </ChatMessage>
      </Column>
    ),
    'A long message of your own wraps in its bubble': () => (
      <Column>
        <ChatMessage from="user" label="Jij">
          {
            'De cadeaubon moet ook als pdf mee in de bevestigingsmail.\nGebruik het logo van Zilverberg bovenaan, de code groot in het midden en de geldigheid eronder, in de huisstijl van de facturen.'
          }
        </ChatMessage>
      </Column>
    ),
    'Thinking: the answer has not started': () => (
      <Column>
        <ChatMessage from="user" label="Jij">
          Zet het lage tarief er ook in.
        </ChatMessage>
        <ChatMessage from="assistant" label="Opus 5.5" streaming>
          <p className="m-0 flex items-center gap-2 text-muted">
            <Icon name="sparkles" size="sm" tone="faint" />
            <Shimmer active>Aan het nadenken…</Shimmer>
          </p>
        </ChatMessage>
      </Column>
    ),
    'Streaming: no actions until it is complete': () => (
      <Column>
        <ChatMessage from="assistant" label="Opus 5.5" streaming meta="Opus 5.5">
          <Prose labels={nl.prose} markdown="Ik pas `btwUit` aan zodat het tarief van 9% ook" />
        </ChatMessage>
      </Column>
    ),
    'A long path breaks inside the column': () => (
      <Column>
        <ChatMessage
          from="assistant"
          label="Opus 5.5"
          meta="Opus 5.5 · klaar in 4 s"
          actions={<AnswerActions text="iDEAL" />}
        >
          <Prose
            labels={nl.prose}
            markdown="De status van iDEAL komt binnen in `/work/webwinkel/src/kassa/betaalmethoden/ideal/verwerkBetaalstatus.ts`; daar zet ik de controle op het bedrag bij."
            settled
          />
        </ChatMessage>
      </Column>
    ),
    'Stopped short with an error': () => (
      <Column>
        <ChatMessage
          from="assistant"
          label="Opus 5.5"
          error="De verbinding viel weg na 40 seconden. Wat er al stond, blijft staan."
          errorAction={
            <Button variant="ghost" size="sm">
              <Icon name="rotate-ccw" size="sm" />
              Opnieuw proberen
            </Button>
          }
        >
          <Prose labels={nl.prose} markdown="Ik heb `src/btw.ts` gelezen en begin nu met" settled />
        </ChatMessage>
      </Column>
    ),
  },
} satisfies Story
