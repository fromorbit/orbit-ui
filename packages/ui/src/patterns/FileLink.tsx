import type { MouseEvent, ReactElement } from 'react'
import { isCommandClick } from '../provider/platform'
import { useUi } from '../provider/UiProvider'
import { PierreFileIcon } from './PierreFileIcon'

/** What a click on a file link says: which element was clicked, and whether ⌘ or Ctrl was held. */
export interface FileLinkOpen {
  /** ⌘ on macOS, Ctrl elsewhere (`isCommandClick`): the editor instead of the app. */
  modifier: boolean
  /** The link itself, so a preview can stand beside it and hand the focus back to it. */
  target: HTMLElement
}

/** The props of `FileLink`. */
export interface FileLinkProps {
  /** The words as the agent wrote them, path and line: what stands in the text and is copied. */
  text: string
  /** The path relative to the working directory, as it stands in the file list. */
  path: string
  line?: number
  column?: number
  /** The link's accessible name, path and line in the host's words: "Open src/app.ts, regel 12". */
  label: string
  onOpen(event: FileLinkOpen): void
}

/** `:12` or `:12:5` at the end of what the agent wrote. */
const LINE = /:\d+(?::\d+)?$/

/**
 * A path the agent named, as a quiet button in running text: the type icon of the file, the folder
 * muted, the name in the text's own colour, a line muted after it.
 *
 * A `button`, not an `<a>`: there is no address, and a button is what a screen reader must hear.
 * No underline and no frame at rest; 4px of room on both sides, and on hover a quiet surface with a
 * small radius and a hand for the pointer — calmer than an underline, and clearly something to
 * click. The surface is `surface-active`:
 * `surface-hover` barely showed behind running text on the dark conversation. The focus ring shows for the keyboard
 * only. The padding is inline, so it widens the link without moving the line it stands in, and
 * `box-decoration-clone` gives each piece of a path that breaks its own rounded ends. The text is the agent's own, so copying an answer gives what it wrote; the name for a
 * screen reader comes from the catalogue ("Open src/a.ts, regel 42"), the `title` holds the path
 * and the line. The path may break across lines, unlike `PathLabel` in a row. What opening means is
 * the caller's.
 */
export function FileLink({ text, path, line, column, label, onOpen }: FileLinkProps): ReactElement {
  const { platform } = useUi()
  const suffix = LINE.exec(text)?.[0] ?? ''
  const written = text.slice(0, text.length - suffix.length)
  const nameStart = written.lastIndexOf('/') + 1
  const title =
    line === undefined ? path : `${path}:${line}${column === undefined ? '' : `:${column}`}`
  function open(event: MouseEvent<HTMLButtonElement>): void {
    onOpen({ modifier: isCommandClick(event, platform), target: event.currentTarget })
  }
  return (
    <button
      type="button"
      data-nt-file-link
      aria-label={label}
      title={title}
      onClick={open}
      className="inline cursor-pointer rounded-sm px-1 py-0.5 font-mono text-[12px] text-fg outline-focus box-decoration-clone transition-colors duration-100 hover:bg-surface-active focus-visible:outline-2 focus-visible:outline-offset-1 motion-reduce:transition-none"
    >
      <span className="mr-1 inline-flex translate-y-[2px] text-fg">
        <PierreFileIcon path={path} />
      </span>
      <span className="text-muted">{written.slice(0, nameStart)}</span>
      <span>{written.slice(nameStart)}</span>
      {suffix ? <span className="text-muted">{suffix}</span> : null}
    </button>
  )
}
