import { useEffect, useRef } from 'react'
import type { Story } from '../gallery/story'
import { nl } from '../testing/labels'
import { CopyButton } from './CopyButton'

/**
 * An outcome of a press, held still.
 *
 * The button owns its own timer and offers no prop to fake it — that prop would exist for this
 * story and nothing else. So the story presses the button instead, on a heartbeat shorter than the
 * second and a half, which is exactly what a reader does when they press it twice: the timer
 * restarts and the glyph never lapses, so the reference image is the same every run.
 *
 * The clipboard is stubbed for as long as the state is on screen, which is also the only way to
 * show a refusal at all. A gallery that rewrote the developer's clipboard twice a second would be
 * unusable, and nothing here is about the clipboard itself: the real call is proven in
 * Orbit's end-to-end tests, against the built app.
 */
function HeldStill({ answer }: { answer: () => Promise<void> }) {
  const holder = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const own = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    // Stubbed again right before every press: Confirmed and Failed stand on one page, and a stub
    // set once would leave the last state mounted answering for both after the first heartbeat.
    // The button calls `writeText` before its first await, so the press reads this one.
    const press = () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: answer },
        configurable: true,
      })
      holder.current?.querySelector('button')?.click()
    }
    press()
    const beat = setInterval(press, 600)
    return () => {
      clearInterval(beat)
      if (own) Object.defineProperty(navigator, 'clipboard', own)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  }, [answer])
  return (
    <div ref={holder}>
      <CopyButton {...nl.copy} text="Held still by the gallery" />
    </div>
  )
}

const accepts = () => Promise.resolve()
const refuses = () => Promise.reject(new Error('the gallery refuses'))

export default {
  group: 'patterns',
  title: 'CopyButton',
  states: {
    Idle: () => <CopyButton {...nl.copy} text="Plain text for the clipboard" />,
    Confirmed: () => <HeldStill answer={accepts} />,
    // A refusal is a warning sign in the danger colour, and the hidden region says the word: the
    // two together, because a status may never be carried by colour on its own.
    Failed: () => <HeldStill answer={refuses} />,
    // The two places it is used, in the frame each of them gives it. In the app both only appear
    // on hover or focus; here they stand still, so the image shows how the button lands on that
    // surface. The appearing itself is layout and opacity, which Orbit's end-to-end tests measure.
    //
    // The two frames below are copied by hand from `Prose.tsx` (`CODE_REGION`, `PRE`, `CODE_COPY`)
    // and from `Timeline.tsx` (`ROW`): a story may not import a component's private classes, so
    // whoever changes the look there has to come past here too, or these images stop telling the
    // truth about the app.
    'Inside a code block': () => (
      <div className="relative w-80">
        <div className="rounded-md border border-border bg-surface p-3">
          <pre className="m-0 font-mono text-[12px] leading-normal">const x = 1</pre>
        </div>
        <div className="absolute top-1 right-1">
          <CopyButton {...nl.copy} text="const x = 1" />
        </div>
      </div>
    ),
    'Under a message': () => (
      <div className="flex w-80 flex-col gap-1">
        <p className="m-0 text-[13px] leading-normal">Yes, that is what the log says.</p>
        <div className="flex h-6 items-center gap-2 text-[11px] text-muted">
          <time className="tabular-nums">14:32</time>
          <CopyButton {...nl.copy} text="Yes, that is what the log says." />
        </div>
      </div>
    ),
  },
} satisfies Story
