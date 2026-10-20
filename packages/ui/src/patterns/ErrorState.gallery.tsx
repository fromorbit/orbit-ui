import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { ErrorState } from './ErrorState'

export default {
  group: 'patterns',
  title: 'ErrorState',
  states: {
    'With a code': () => (
      <ErrorState title="The run could not be started" code="provider_unavailable" />
    ),
    'With an action': () => (
      <ErrorState
        title="The run could not be started"
        code="provider_unavailable"
        action={
          <Button size="sm" variant="secondary">
            Try again
          </Button>
        }
      />
    ),
    'Compact (inside a list or a popover)': () => (
      <div className="w-72">
        <ErrorState size="sm" title="Could not load the runs" code="core_unreachable" />
      </div>
    ),
    'Compact with an action': () => (
      <div className="w-72">
        <ErrorState
          size="sm"
          title="Could not load the runs"
          action={
            <Button size="sm" variant="ghost">
              Retry
            </Button>
          }
        />
      </div>
    ),
    // Both of these stand last on the stage, and each in a column of its own width. The stage is
    // as wide as its widest state, so a loose sentence would widen every other reference; and a
    // wrapping sentence ends on half a pixel, which rounds the top of whatever stands under it a
    // pixel differently and would make that state's reference go stale for nothing.
    "With the provider's own words": () => (
      <div className="w-72">
        <ErrorState
          title="Something went wrong in the backend."
          code="authentication_failed"
          detail="OAuth token expired. Run `claude login` to sign in again."
        />
      </div>
    ),
    "Compact with the provider's own words": () => (
      <div className="w-72">
        <ErrorState
          size="sm"
          title="Something went wrong in the backend."
          code="billing_error"
          detail="Credit balance is too low to run this model."
        />
      </div>
    ),
  },
} satisfies Story
