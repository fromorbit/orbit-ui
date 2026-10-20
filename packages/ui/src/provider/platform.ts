import type { Platform } from './UiProvider'

/**
 * The convention keys are drawn in on `platform`: the signs of a Mac keyboard, or the words on the
 * keys elsewhere.
 */
export function keyConvention(platform: Platform): 'mac' | 'other' {
  return platform === 'mac' ? 'mac' : 'other'
}

/** The modifier keys of a click or a keydown, as the DOM reports them. */
export interface ModifierState {
  metaKey: boolean
  ctrlKey: boolean
}

/**
 * Whether a click was made with the platform's command modifier held: ⌘ on macOS, Ctrl elsewhere.
 *
 * A ⌘-click on a file opens it in the editor instead of in the app; whether that is ⌘ or Ctrl is a
 * fact of the platform, which the host names through `UiProvider`.
 */
export function isCommandClick(event: ModifierState, platform: Platform): boolean {
  return platform === 'mac' ? event.metaKey : event.ctrlKey
}

/** A keydown as the DOM reports one, reduced to what decides a command letter. */
export interface LetterKeyEvent extends ModifierState {
  key: string
  altKey: boolean
  shiftKey: boolean
  /** True for every key of an IME composition, where the reader is writing a word. */
  isComposing: boolean
}

/**
 * Whether a keydown is `letter` with the platform's command modifier and no other: ⌘D on macOS,
 * Ctrl+D elsewhere.
 *
 * Exact, as the host's shortcut register is: with Shift or Alt it is another key,
 * and the other command key (Control on a Mac) is not this one. The key is compared without case,
 * so Caps Lock still counts; during an IME composition nothing matches.
 */
export function isCommandLetter(
  event: LetterKeyEvent,
  letter: string,
  platform: Platform,
): boolean {
  if (event.isComposing || event.altKey || event.shiftKey) return false
  if (event.key.toLowerCase() !== letter.toLowerCase()) return false
  const command = platform === 'mac' ? event.metaKey : event.ctrlKey
  const other = platform === 'mac' ? event.ctrlKey : event.metaKey
  return command && !other
}
