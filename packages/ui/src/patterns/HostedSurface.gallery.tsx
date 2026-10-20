import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Story } from '../gallery/story'
import { ConfirmDialog } from '../overlays/ConfirmDialog'
import { DropdownMenu } from '../overlays/DropdownMenu'
import { PortalContainerProvider } from '../overlays/portal'
import { Tooltip, TooltipProvider } from '../overlays/Tooltip'
import { Button } from '../primitives/Button'
import { IconButton } from '../primitives/IconButton'
import { ResizeHandle } from '../primitives/ResizeHandle'
import type { HostPort } from '../provider/host'
import { UiProvider, useUi } from '../provider/UiProvider'
import { createFakeHost, type FakeHost } from '../testing/fake-host'
import { HostedSurface, useSurfaceReporter } from './HostedSurface'

/**
 * A made-up page as a frozen view would show it: a bar, a heading block and three cards, drawn as
 * an SVG so the story needs no image file and no network.
 */
const PAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
    <rect width="400" height="240" fill="#f4f1ea"/>
    <rect width="400" height="36" fill="#2f5d50"/>
    <rect x="20" y="56" width="220" height="20" rx="3" fill="#1f2a28"/>
    <rect x="20" y="96" width="112" height="112" rx="6" fill="#d98c5f"/>
    <rect x="144" y="96" width="112" height="112" rx="6" fill="#7aa6c2"/>
    <rect x="268" y="96" width="112" height="112" rx="6" fill="#c9b458"/>
  </svg>`,
)}`

/**
 * The frozen state: the still image a view leaves behind while a layer lies over it.
 *
 * A fake host of its own plays main and sends the image once the surface is mounted — effects
 * of children run first, so the surface is listening by then.
 */
function Frozen() {
  const [host] = useState(createFakeHost)
  return (
    <UiProvider host={host}>
      <SendImage host={host} />
    </UiProvider>
  )
}

function SendImage({ host }: { host: FakeHost }) {
  useEffect(() => {
    host.surfaces.emit({ type: 'frozen', id: 'tab_galerij_bevroren', seq: 1, image: PAGE })
  }, [host])
  return (
    <div className="flex h-[240px] w-[400px] border border-border">
      <HostedSurface id="tab_galerij_bevroren" />
    </div>
  )
}

/**
 * The host around the story when it has a channel for hosted views, so main can lay a real view
 * here (the app's gallery hands it the window's bridge); a fake one otherwise (a component test
 * renders every story without Electron).
 *
 * This is the only story that talks to main. It has to: until the browser tab exists, it is the
 * only place in the renderer where a `HostedSurface` stands, and an end-to-end test of Orbit
 * attaches a view to it. Main ignores an id it has no view for, so in the gallery itself this
 * only costs a report.
 */
function useHostOrFake(): HostPort {
  const around = useUi().host
  const [fake] = useState(createFakeHost)
  return around.surfaces ? around : fake
}

/**
 * A column as a hosted tab will have it: a bar above the view with a menu, a dialog and a
 * tooltip, a view that takes the rest, a bar below it whose tooltip opens over the view, and an
 * edge on the right that resizes the column. F6 goes between the bar and the page.
 */
function InAColumn() {
  const host = useHostOrFake()
  const [layers, setLayers] = useState<HTMLElement | null>(null)
  return (
    <UiProvider host={host}>
      <PortalContainerProvider container={layers}>
        <TooltipProvider>
          <Column />
        </TooltipProvider>
      </PortalContainerProvider>
      {/* The column's own layer box, like the app's: the stage holds the stories themselves, and
          every child of the box a layer lands in counts as a layer. */}
      <div ref={setLayers} data-nt-layer-root />
    </UiProvider>
  )
}

function Column() {
  const reporter = useSurfaceReporter()
  const [width, setWidth] = useState(420)
  const [dialog, setDialog] = useState(false)
  const inPage = useRef(false)
  const menu = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'F6') return
      event.preventDefault()
      if (inPage.current) menu.current?.focus()
      else reporter.focus('tab_galerij')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reporter])

  return (
    <div className="flex h-[360px]">
      <div className="flex flex-col border border-border" style={{ width: `${width}px` }}>
        <Bar>
          <DropdownMenu
            label="Tabacties"
            tooltip="Meer"
            items={[
              { id: 'reload', label: 'Opnieuw laden', onSelect: () => {} },
              { id: 'copy', label: 'Adres kopiëren', onSelect: () => {} },
              { id: 'devtools', label: 'Ontwikkelaarstools', onSelect: () => {} },
              { id: 'close', label: 'Tab sluiten', onSelect: () => {} },
            ]}
            trigger={
              <IconButton
                ref={menu}
                icon="more-horizontal"
                size="sm"
                variant="ghost"
                label="Meer"
              />
            }
          />
          <Button size="sm" variant="ghost" onClick={() => setDialog(true)}>
            Profiel wissen
          </Button>
        </Bar>
        <HostedSurface
          id="tab_galerij"
          onFocusChange={(focused) => {
            inPage.current = focused
          }}
        />
        <Bar>
          <Tooltip label="Uitleg over deze pagina">
            <IconButton icon="x" size="sm" variant="ghost" label="Uitleg" />
          </Tooltip>
        </Bar>
      </div>
      <ResizeHandle
        label="Breedte van de kolom"
        value={width}
        min={320}
        max={560}
        onValueChange={setWidth}
        onDragChange={(dragging) => reporter.setDragging(dragging)}
      />
      <ConfirmDialog
        open={dialog}
        onOpenChange={setDialog}
        title="Profiel wissen"
        body="Cookies en opslag van dit profiel verdwijnen."
        confirmLabel="Wissen"
        cancelLabel="Annuleren"
        onConfirm={() => setDialog(false)}
      />
    </div>
  )
}

function Bar({ children }: { children: ReactNode }) {
  return <div className="flex h-9 shrink-0 items-center gap-1 px-1">{children}</div>
}

export default {
  group: 'patterns',
  title: 'HostedSurface',
  states: {
    Frozen,
    'In a column': InAColumn,
  },
} satisfies Story
