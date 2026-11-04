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
      <ErrorState
        title="De taak kon niet starten: de AI-dienst reageert niet."
        action={
          <Button size="sm" variant="secondary">
            Opnieuw proberen
          </Button>
        }
      />
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
            <Button size="sm" variant="ghost">
              Opnieuw proberen
            </Button>
          }
        />
      </div>
    ),
    // Both of these stand last on the stage, and each in a column of its own width. The stage is
    // as wide as its widest state, so a loose sentence would widen every other reference; and a
    // wrapping sentence ends on half a pixel, which rounds the top of whatever stands under it a
    // pixel differently and would make that state's reference go stale for nothing.
    'Met de eigen woorden van de provider': () => (
      <div className="w-full max-w-72">
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
