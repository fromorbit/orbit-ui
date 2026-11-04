import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Sheet } from './Sheet'

/** Only the first story opens itself: two open sheets would stand on top of each other. */
function Details({ side = 'end', initial = false }: { side?: 'start' | 'end'; initial?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Details openen</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        side={side}
        title="api-gateway"
        description="feat/rate-limit · gestart 2 uur geleden"
        closeLabel="Sluiten"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Sluiten
            </Button>
            <Button variant="primary">Opnieuw starten</Button>
          </>
        }
      >
        <p className="m-0 text-[13px] text-secondary">
          De gateway stopte na een time-out op de database. De laatste regels van het logboek staan
          hieronder.
        </p>
      </Sheet>
    </>
  )
}

export default {
  group: 'overlays',
  title: 'Sheet',
  states: {
    'Van rechts': () => <Details initial />,
    'Van links': () => <Details side="start" />,
  },
} satisfies Story
