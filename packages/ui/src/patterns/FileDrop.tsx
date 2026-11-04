import { type DragEvent, useId, useRef, useState } from 'react'
import { FileInput } from '../primitives/FileInput'
import { Icon } from '../primitives/Icon'

/** The words of `FileDrop`. */
export interface FileDropLabels {
  /** The line in the middle: "Sleep bestanden hierheen". */
  title: string
  /** The word that opens the dialog, and the zone's accessible name: "of kies bestanden". */
  browse: string
  /** What fits, under it: "PDF of afbeelding, tot 10 MB". */
  hint?: string
  /** What the zone says while files hover over it: "Laat los om toe te voegen". */
  dropping: string
}

/** The props of `FileDrop`. */
export interface FileDropProps {
  labels: FileDropLabels
  /** The files that fit `accept`, in the order they came. */
  onFiles(files: File[]): void
  /** The files dropped that do not fit `accept`, so the caller can say why. */
  onReject?(files: File[]): void
  /** The types that fit, as the `accept` attribute: `"image/*,.pdf"`. Left out, any. */
  accept?: string
  /** One file at a time; several by default. */
  single?: boolean
  disabled?: boolean
  /** What is wrong ("Dat bestand is te groot"), announced under the zone. */
  error?: string
}

/** Whether a file fits an `accept` list: extensions (`.pdf`), types (`image/png`) and families (`image/*`). */
export function acceptsFile(
  file: Pick<File, 'name' | 'type'>,
  accept: string | undefined,
): boolean {
  if (accept === undefined || accept.trim() === '') return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) =>
      entry.startsWith('.')
        ? name.endsWith(entry)
        : entry.endsWith('/*')
          ? type.startsWith(entry.slice(0, -1))
          : type === entry,
    )
}

/**
 * A place to drop files on, or to click for the file dialog: the upload field of a form.
 *
 * The zone is one button: Enter, Space or a click opens the dialog of a hidden `FileInput`, so the
 * keyboard reaches everything a mouse does by dragging. While files hover over it, the border
 * turns to the accent and the line says what letting go will do. A drop is checked against
 * `accept` (the dialog filters by itself, a drop does not): what fits goes to `onFiles`, the rest to
 * `onReject`. What happens to the files next — a list, a `ProgressBar` per upload — belongs to the
 * caller.
 */
export function FileDrop({
  labels,
  onFiles,
  onReject,
  accept,
  single = false,
  disabled = false,
  error,
}: FileDropProps) {
  const input = useRef<HTMLInputElement>(null)
  // Counted, not a flag: dragging over a child fires a leave on the parent before the enter.
  const [depth, setDepth] = useState(0)
  const over = depth > 0 && !disabled
  const shownError = error?.trim() ? error : undefined
  const hintId = useId()

  function take(files: File[]) {
    const chosen = single ? files.slice(0, 1) : files
    const fits = chosen.filter((file) => acceptsFile(file, accept))
    const misfits = chosen.filter((file) => !acceptsFile(file, accept))
    if (fits.length > 0) onFiles(fits)
    if (misfits.length > 0) onReject?.(misfits)
  }

  const onDrag = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const frame = over
    ? 'border-accent-border bg-accent-subtle'
    : shownError !== undefined
      ? 'border-danger hover:bg-surface-hover'
      : 'border-border-strong hover:bg-surface-hover'

  return (
    <div data-nt-file-drop className="flex w-full min-w-0 flex-col gap-1.5">
      <button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        aria-invalid={shownError === undefined ? undefined : true}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setDepth((count) => count + 1)
        }}
        onDragOver={onDrag}
        onDragLeave={() => setDepth((count) => Math.max(0, count - 1))}
        onDrop={(event) => {
          event.preventDefault()
          setDepth(0)
          if (!disabled) take(Array.from(event.dataTransfer.files))
        }}
        className={`no-drag flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center outline-focus transition-colors duration-(--nt-duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 ${frame}`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-surface-hover text-muted">
          <Icon name="upload" size="md" />
        </span>
        <span className="text-[13px] text-fg">
          {over ? labels.dropping : labels.title}{' '}
          {over ? null : <span className="text-accent-text">{labels.browse}</span>}
        </span>
      </button>
      <span
        id={hintId}
        className={shownError === undefined && labels.hint === undefined ? 'sr-only' : ''}
      >
        {shownError !== undefined ? (
          <span role="alert" className="flex items-center gap-1.5 text-[12px] text-danger">
            <Icon name="alert-triangle" size="sm" />
            {shownError}
          </span>
        ) : labels.hint !== undefined ? (
          <span className="text-[12px] text-muted">{labels.hint}</span>
        ) : null}
      </span>
      <FileInput
        ref={input}
        onFiles={take}
        single={single}
        {...(accept === undefined ? {} : { accept })}
      />
    </div>
  )
}
