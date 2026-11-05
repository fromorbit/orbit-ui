import { useState } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { Banner } from './Banner'
import { CreditCardField, CreditCardVisual } from './CreditCardField'
import { type CardValue, EMPTY_CARD } from './credit-card'

/** Only the test numbers of the card networks: this story is a demo and pays nothing. */
const VISA = { number: '4242424242424242', expiry: '1228', cvc: '', name: 'Noor de Vries' }
const MASTERCARD = { number: '5555555555554444', expiry: '0729', cvc: '123', name: 'Sem Jansen' }
const AMEX = { number: '378282246310005', expiry: '0330', cvc: '1234', name: 'Lotte Bakker' }

const NOW = new Date(2026, 10, 3)

function Demo({ initial, showErrors = false }: { initial: CardValue; showErrors?: boolean }) {
  const [value, setValue] = useState(initial)
  return (
    // As wide as the form and no wider: the banner takes the column's width rather than setting
    // it (`w-0 min-w-full`), so the note and the fields read as one block.
    <div className="grid w-fit max-w-full gap-4">
      <div className="w-0 min-w-full">
        <Banner tone="attention" announce={false}>
          Demo met testnummers: er wordt niets betaald of verstuurd.
        </Banner>
      </div>
      <CreditCardField
        value={value}
        onValueChange={setValue}
        labels={nl.creditCard}
        now={NOW}
        showErrors={showErrors}
      />
    </div>
  )
}

export default {
  group: 'patterns',
  title: 'CreditCardField',
  states: {
    Leeg: () => <Demo initial={EMPTY_CARD} />,
    'Visa, ingevuld': () => <Demo initial={VISA} />,
    'Na versturen met fouten': () => (
      <Demo
        initial={{ number: '4242424242424241', expiry: '1025', cvc: '1', name: '' }}
        showErrors
      />
    ),
    'De kaarten': () => (
      <div className="grid w-full max-w-[40rem] grid-cols-1 gap-4 sm:grid-cols-2">
        <CreditCardVisual value={MASTERCARD} flipped={false} labels={nl.creditCard} />
        <CreditCardVisual value={AMEX} flipped={false} labels={nl.creditCard} />
        <CreditCardVisual value={EMPTY_CARD} flipped={false} labels={nl.creditCard} />
        <CreditCardVisual value={MASTERCARD} flipped labels={nl.creditCard} />
      </div>
    ),
  },
} satisfies Story
