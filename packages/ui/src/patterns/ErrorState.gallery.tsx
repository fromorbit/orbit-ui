import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { ErrorState } from './ErrorState'

export default {
  group: 'patterns',
  title: 'ErrorState',
  states: {
    'Met een code': () => (
      <div className="w-full max-w-96">
        <ErrorState
          title="De taak kon niet starten: de AI-dienst reageert niet. Probeer het over een minuut opnieuw."
          code="provider_unavailable"
        />
      </div>
    ),
    'Met een actie': () => (
      <div className="w-full max-w-96">
        <ErrorState
          title="De taak kon niet starten: de AI-dienst reageert niet."
          action={
            <Button size="sm" variant="secondary">
              Opnieuw proberen
            </Button>
          }
        />
      </div>
    ),
    'Compact (in een lijst of popover)': () => (
      <div className="w-full max-w-72">
        <ErrorState size="sm" title="De taken laden niet" code="core_unreachable" />
      </div>
    ),
    'Compact met een actie': () => (
      <div className="w-full max-w-72">
        <ErrorState
          size="sm"
          title="De taken laden niet"
          action={
            <Button size="sm" variant="secondary">
              Opnieuw proberen
            </Button>
          }
        />
      </div>
    ),
    // Every full state stands in the same column of 384px, so they centre on one axis; the
    // compact ones in a column of 288px, the width of a list or a popover.
    'Met de eigen woorden van de provider': () => (
      <div className="w-full max-w-96">
        <ErrorState
          title="Er ging iets mis in de backend."
          code="authentication_failed"
          detail="OAuth token expired. Run `claude login` to sign in again."
        />
      </div>
    ),
    'Compact met de eigen woorden van de provider': () => (
      <div className="w-full max-w-72">
        <ErrorState
          size="sm"
          title="Er ging iets mis in de backend."
          code="billing_error"
          detail="Credit balance is too low to run this model."
        />
      </div>
    ),
  },
} satisfies Story
