import { useState } from 'react'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Sheet } from './Sheet'

function Details({ side = 'end' }: { side?: 'start' | 'end' }) {
  const [open, setOpen] = useState(true)
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
    'From the right': () => <Details />,
    'From the left': () => <Details side="start" />,
  },
} satisfies Story
