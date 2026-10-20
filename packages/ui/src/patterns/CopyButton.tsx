import { useEffect, useState } from 'react'
import { Tooltip } from '../overlays/Tooltip'
import { IconButton } from '../primitives/IconButton'

/**
 * How long the tick and the spoken word stay after a press.
 *
 * Long enough to be seen and to be read out, short enough that the button is itself again before
 * anyone reaches for it a second time.
 */
const FLASH_MS = 1_500

/** What just happened, if anything: a new object per press, so a second press restarts the timer. */
interface Flash {
  kind: 'copied' | 'failed'
}

/** The words of a `CopyButton`, as one object for a host that hands the same to every button. */
export interface CopyButtonLabels {
  /** The name of the button and its tooltip, which stays put after a press: "Kopiëren". */
  label: string
  /** What the live region says after a copy: "Gekopieerd". */
  copiedLabel: string
  /** What it says when the clipboard refused: "Kopiëren mislukt". */
  failedLabel: string
}

/** The props of `CopyButton`. */
export interface CopyButtonProps extends CopyButtonLabels {
  /**
   * What lands on the clipboard, or a function that produces it when the button is pressed.
   *
   * A string when the caller already holds one (the text of a message *is* the message). A
   * function when it still has to be assembled — flattening a markdown node, joining the blocks
   * of a prompt — because a conversation re-renders on every streamed token, and that work would
   * then be done again for every code block on screen to produce a string nobody asked for yet.
   */
  text: string | (() => string)
}

/** The glyph and the colour of each outcome; at rest the button is simply itself again. */
const flashes = {
  copied: { icon: 'check', tone: 'default' },
  failed: { icon: 'alert-triangle', tone: 'danger' },
} as const

/**
 * Copies a piece of text and says, quietly, how it went.
 *
 * Every outcome is told twice over: the glyph changes for whoever is looking, and a visually
 * hidden live region says the word for whoever is listening. A refusal is a warning sign in the
 * danger colour — shape *and* word, never colour on its own, which is what the guidelines ask of
 * anything carrying a status.
 *
 * What does *not* change is the accessible name of the button: a name that changes while the
 * button has focus is announced a second time, and "Copied" as a name would also be a lie about
 * what pressing it does.
 *
 * The region is mounted from the start and empty at rest, for the same reason `StatusLine` is: a
 * screen reader only announces a live region that was already in the document when its text
 * changed. Status is never carried by colour alone, and live regions stay put.
 */
export function CopyButton({ text, label, copiedLabel, failedLabel }: CopyButtonProps) {
  const [flash, setFlash] = useState<Flash | null>(null)

  // Keyed on the object rather than on its kind: pressing again while it still says "Copied" hands
  // over a fresh object, so the effect re-runs and the second and a half starts over instead of
  // ending whenever the first press happened to say it would.
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timer)
  }, [flash])

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(typeof text === 'function' ? text() : text)
      setFlash({ kind: 'copied' })
    } catch {
      // A refusal is not an exception the user can do anything with; it is a word in the region.
      setFlash({ kind: 'failed' })
    }
  }

  const shown = flash ? flashes[flash.kind] : undefined
  return (
    <span className="inline-flex">
      {/* The name as a tooltip too: an icon alone says nothing to a new reader. */}
      <Tooltip label={label}>
        <IconButton
          icon={shown?.icon ?? 'copy'}
          tone={shown?.tone ?? 'default'}
          label={label}
          size="sm"
          onClick={() => void copy()}
        />
      </Tooltip>
      <span role="status" className="sr-only">
        {flash ? (flash.kind === 'copied' ? copiedLabel : failedLabel) : null}
      </span>
    </span>
  )
}
