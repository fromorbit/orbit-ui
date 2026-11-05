import { useState } from 'react'
import { LayerStage } from '../gallery/layer-stage'
import type { Story } from '../gallery/story'
import { Button } from '../primitives/Button'
import { Sheet } from './Sheet'

/** The sheet of both states, open or not as its stage or its trigger says. */
function DetailsSheet({
  side = 'end',
  open,
  setOpen,
}: {
  side?: 'start' | 'end'
  open: boolean
  setOpen: (open: boolean) => void
}) {
  return (
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
  )
}

/** Only the first story opens itself: two open sheets would stand on top of each other. */
function Details({ side = 'end' }: { side?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Details openen</Button>
      <DetailsSheet side={side} open={open} setOpen={setOpen} />
    </>
  )
}

export default {
  group: 'overlays',
  title: 'Sheet',
  states: {
    // Open in a box of its own and not modal (`LayerStage`), so the gallery stays in reach, for
    // the keyboard too.
    'Van rechts': () => (
      <LayerStage height={480} reopenLabel="Details openen">
        {(open, setOpen) => <DetailsSheet open={open} setOpen={setOpen} />}
      </LayerStage>
    ),
    'Van links': () => <Details side="start" />,
  },
} satisfies Story
