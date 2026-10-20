import { forwardRef } from 'react'

/** The props of `FileInput`. */
export interface FileInputProps {
  /** Every file chosen in one round, in the order the dialog gave them. */
  onFiles(files: File[]): void
}

/**
 * A hidden `<input type="file" multiple>`, opened with `.click()` on its `ref` rather than shown:
 * the paperclip is the control the user sees, this is only the
 * native dialog behind it. No `accept`: everything can be chosen, and what does not fit is refused
 * per file, with the reason.
 *
 * The one native `<input>` outside `shared/ui/` a file picker needs; wrapped here so
 * `bare-controls.test.ts`'s rule — every native control lives in `shared/ui/` — still holds
 * without a control that looks like anything: a hidden file input has no visual design of its own.
 */
export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { onFiles },
  ref,
) {
  return (
    <input
      ref={ref}
      type="file"
      multiple
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const chosen = Array.from(event.target.files ?? [])
        // Choosing the same file again must still fire `change`.
        event.target.value = ''
        if (chosen.length > 0) onFiles(chosen)
      }}
    />
  )
})
