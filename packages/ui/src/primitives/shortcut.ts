import type { IconName } from './Icon'

/**
 * The keys that have a name of their own for a screen reader, which the host's
 * `ShortcutPort.keyName` speaks (Orbit: the `keys.*` of its catalogues).
 *
 * A letter, a digit or a function key needs no translation and is named by itself instead.
 */
export type KeyName =
  | 'command'
  | 'control'
  | 'option'
  | 'alt'
  | 'meta'
  | 'shift'
  | 'enter'
  | 'backspace'
  | 'delete'
  | 'escape'
  | 'tab'
  | 'space'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'comma'
  | 'period'
  | 'slash'
  | 'backslash'
  | 'bracketLeft'
  | 'bracketRight'
  | 'plus'
  | 'minus'
  | 'equals'
  | 'semicolon'
  | 'quote'
  | 'backquote'

/** What a screen reader says for one key: a word from the catalogue, or the key itself. */
export type KeySpeech = { key: KeyName } | { literal: string }

/**
 * One key of a shortcut, as `Kbd` draws it: an icon for a modifier or a special key, text for the
 * rest.
 */
export type ShortcutKey =
  | { kind: 'icon'; icon: IconName; name: KeySpeech }
  | {
      kind: 'text'
      text: string
      /** A legend word (`esc`, `F6`, `tab`) rather than a letter or a modifier: small capitals. */
      smallCaps: boolean
      name: KeySpeech
    }

/** Which convention the keys are drawn in: the signs of a Mac keyboard, or the words elsewhere. */
export type ShortcutPlatform = 'mac' | 'other'

/** The signs of macOS that stand for a modifier, peeled off the front of `⇧⌘R` one by one. */
const MODIFIER_SIGNS = new Set(['⌘', '⇧', '⌥', '⌃'])

/** Punctuation a screen reader would otherwise skip or mumble. */
const PUNCTUATION: Record<string, KeyName> = {
  ',': 'comma',
  '.': 'period',
  '/': 'slash',
  '\\': 'backslash',
  '[': 'bracketLeft',
  ']': 'bracketRight',
  '+': 'plus',
  '-': 'minus',
  '=': 'equals',
  ';': 'semicolon',
  "'": 'quote',
  '`': 'backquote',
}

/** A key by any of the spellings a caller may use, lower-cased, to what it is. */
const ALIASES: Record<string, KeyName> = {
  '⌘': 'command',
  cmd: 'command',
  command: 'command',
  '⌃': 'control',
  ctrl: 'control',
  control: 'control',
  '⌥': 'option',
  opt: 'option',
  option: 'option',
  alt: 'alt',
  meta: 'meta',
  '⇧': 'shift',
  shift: 'shift',
  '↵': 'enter',
  '⏎': 'enter',
  '↩': 'enter',
  enter: 'enter',
  return: 'enter',
  '⌫': 'backspace',
  backspace: 'backspace',
  '⌦': 'delete',
  del: 'delete',
  delete: 'delete',
  '⎋': 'escape',
  esc: 'escape',
  escape: 'escape',
  '⇥': 'tab',
  tab: 'tab',
  space: 'space',
  '↑': 'arrowUp',
  up: 'arrowUp',
  arrowup: 'arrowUp',
  '↓': 'arrowDown',
  down: 'arrowDown',
  arrowdown: 'arrowDown',
  '←': 'arrowLeft',
  left: 'arrowLeft',
  arrowleft: 'arrowLeft',
  '→': 'arrowRight',
  right: 'arrowRight',
  arrowright: 'arrowRight',
}

/** The keys that are an icon on every platform. */
const ICONS: Partial<Record<KeyName, IconName>> = {
  command: 'command',
  shift: 'arrow-big-up',
  enter: 'corner-down-left',
  backspace: 'delete',
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',
  arrowLeft: 'arrow-left',
  arrowRight: 'arrow-right',
}

/** The words on a key, the same on every platform: the legend a keyboard prints on it. */
const WORDS: Partial<Record<KeyName, string>> = {
  escape: 'esc',
  delete: 'Del',
  tab: 'tab',
  space: 'space',
  meta: 'Meta',
}

/**
 * Splits `Ctrl+Shift+R` on its pluses, keeping a plus that is itself the key (`Ctrl++`, `+`).
 */
function splitOnPlus(label: string): string[] {
  if (label === '+') return ['+']
  const tail = label.endsWith('++') ? ['+'] : []
  const body = tail.length > 0 ? label.slice(0, -2) : label
  return [...body.split('+').filter((part) => part.length > 0), ...tail]
}

/** Peels the modifier signs off the front of `⇧⌘R`, leaving the key itself as the last token. */
function peelSigns(token: string): string[] {
  const tokens: string[] = []
  let rest = token
  while (rest.length > 1 && MODIFIER_SIGNS.has(rest[0] ?? '')) {
    tokens.push(rest[0] ?? '')
    rest = rest.slice(1)
  }
  tokens.push(rest)
  return tokens
}

/** One token to the key it is, in the convention of `platform`. */
function keyOf(token: string, platform: ShortcutPlatform): ShortcutKey {
  const named = ALIASES[token.toLowerCase()] ?? PUNCTUATION[token]
  if (named === 'control' || named === 'option' || named === 'alt') {
    // Control and Option are glyphs on a Mac; elsewhere they are the words on the key, and
    // Option does not exist, so its sign reads as the Alt it is on the same key.
    if (platform === 'mac') {
      return {
        kind: 'icon',
        icon: named === 'control' ? 'chevron-up' : 'option',
        name: { key: named === 'control' ? 'control' : 'option' },
      }
    }
    // Plain text, not small capitals: a modifier stands beside a capital letter in nearly every
    // combination, and at 12px `CTRL` in small capitals shrank to half its height.
    const word = named === 'control' ? 'Ctrl' : 'Alt'
    return {
      kind: 'text',
      text: word,
      smallCaps: false,
      name: { key: named === 'control' ? 'control' : 'alt' },
    }
  }
  if (named === 'meta' && platform === 'mac') {
    return { kind: 'icon', icon: 'command', name: { key: 'command' } }
  }
  if (named !== undefined) {
    const icon = ICONS[named]
    if (icon !== undefined) return { kind: 'icon', icon, name: { key: named } }
    const word = WORDS[named]
    if (word !== undefined)
      return { kind: 'text', text: word, smallCaps: named !== 'meta', name: { key: named } }
    // Punctuation: drawn as itself, named in words.
    return { kind: 'text', text: token, smallCaps: false, name: { key: named } }
  }
  if (/^f([1-9]|1\d|2[0-4])$/i.test(token)) {
    const text = token.toUpperCase()
    return { kind: 'text', text, smallCaps: true, name: { literal: text } }
  }
  if (token.length === 1) {
    const text = token.toUpperCase()
    return { kind: 'text', text, smallCaps: false, name: { literal: text } }
  }
  return { kind: 'text', text: token, smallCaps: true, name: { literal: token } }
}

/**
 * Reads a shortcut in the text form callers already pass (`⇧⌘R`, `Meta+Alt+b`, `Ctrl+Shift+R`,
 * `F6`, `Escape`, `ArrowUp`) into the keys `Kbd` draws, one by one.
 *
 * Pure, so the whole mapping is tested without a DOM. Both forms are accepted everywhere: the
 * signs of macOS, and the plus-joined words of `KeyboardEvent.key` and of Windows and Linux. What
 * a key *looks like* follows `platform`, not the form it came in — a `⌥` off macOS is drawn as the
 * `Alt` that key is there. Letters come out in capitals, the legend on a physical key.
 *
 * @example
 * parseShortcut('⇧⌘R', 'mac') // [shift icon, command icon, text "R"]
 */
export function parseShortcut(label: string, platform: ShortcutPlatform): ShortcutKey[] {
  const trimmed = label.trim()
  if (trimmed.length === 0) return []
  const tokens = trimmed.length > 1 && trimmed.includes('+') ? splitOnPlus(trimmed) : [trimmed]
  return tokens.flatMap(peelSigns).map((token) => keyOf(token, platform))
}

/**
 * The command ids of the host's catalogue, as keys: empty here, and filled by the host through
 * declaration merging, so an editor completes the ids of a `shortcut` prop.
 *
 * Augment the name the host imports the library by: `@fromorbit/ui`, or the alias it installed
 * it under (Orbit uses a short alias).
 *
 * @example
 * declare module '@fromorbit/ui' {
 *   interface ShortcutIds extends Record<'chat.send' | 'chat.new', true> {}
 * }
 */
// biome-ignore lint/suspicious/noEmptyInterface: empty on purpose; a host fills it by declaration merging
export interface ShortcutIds {}

/**
 * What a `shortcut` prop takes: a value the host's `ShortcutPort` reads — in Orbit a command id of
 * its register (`browser.hardReload`), or a written-out key (`⌘K`) where the port accepts one.
 *
 * The ids of {@link ShortcutIds} for completion, and any other string besides (`string & {}` keeps
 * the ids from collapsing into `string`): the library keeps no catalogue, so whether a value names
 * a key is the port's to say.
 */
export type ShortcutLabel = keyof ShortcutIds | (string & {})
