import { type ReactNode, useState } from 'react'
import type { Story } from '../gallery/story'
import { PortalContainerProvider } from './portal'
import { Toast, ToastProvider } from './Toast'

/**
 * A window stand-in that holds the toasts mounted inside it.
 *
 * A toast sits at the bottom-left of the window it belongs to. Without this box every
 * state of this story would drop its toast in the same corner of the gallery: on top of each
 * other, and outside the crop of every reference image — which would freeze four empty strips as
 * the reference. The box hands itself to the layer as portal container, and `transform-gpu` makes
 * it the containing block the fixed viewport inside it positions against.
 */
function Stage({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  const [box, setBox] = useState<HTMLElement | null>(null)
  return (
    <div
      ref={setBox}
      className={`relative ${tall ? 'h-72' : 'h-52'} w-full max-w-96 transform-gpu overflow-hidden rounded-md border border-border bg-bg`}
    >
      <PortalContainerProvider container={box}>{children}</PortalContainerProvider>
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'Toast',
  states: {
    Eén: () => (
      <Stage>
        <ToastProvider label="Meldingen van het eerste verhaal">
          <Toast
            title="Verzoek verlopen"
            description="Niemand heeft geantwoord binnen de wachttijd."
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
        </ToastProvider>
      </Stage>
    ),
    'Met een actie': () => (
      <Stage>
        <ToastProvider label="Meldingen met een actie">
          <Toast
            title="Gesprek gearchiveerd"
            action={{ label: 'Ongedaan maken', onClick: () => {} }}
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
        </ToastProvider>
      </Stage>
    ),
    'Drie gestapeld': () => (
      // Taller than the rest: three toasts, each of which may take two lines on a phone.
      <Stage tall>
        <ToastProvider label="Meldingen die op elkaar staan">
          <Toast
            title="Gesprek A wacht op een antwoord"
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
          <Toast
            title="Gesprek B wacht op een antwoord"
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
          <Toast
            title="Gesprek C wacht op een antwoord"
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
        </ToastProvider>
      </Stage>
    ),
    'Een lange titel die doorloopt': () => (
      <Stage>
        <ToastProvider label="Meldingen met een lange titel">
          <Toast
            title="Een titel die ruim over de breedte van het venster heen loopt en dus vanzelf omslaat"
            description="En een uitleg die net zo lang is en op zijn beurt ook weer omslaat naar een tweede regel."
            duration={Number.POSITIVE_INFINITY}
            onOpenChange={() => {}}
          />
        </ToastProvider>
      </Stage>
    ),
  },
} satisfies Story
