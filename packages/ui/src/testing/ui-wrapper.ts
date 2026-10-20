import { createElement, type ReactNode } from 'react'
import {
  type Platform,
  type ShortcutPort,
  UiProvider,
  type UiProviderProps,
} from '../provider/UiProvider'

/** One command of {@link fakeShortcuts}: its key per convention and what a screen reader hears. */
interface FakeCommand {
  mac: string
  other: string
  aria: { mac: string; other: string }
}

/**
 * A small catalogue in the shape of a host's, for tests: a few made-up command ids (`demo.*`) with
 * a key that differs per platform, as a host's register has them. Made up on purpose: this module
 * is public (`./testing`), and the ids of one host — Orbit's `browser.hardReload` — are not the
 * library's to name.
 */
const COMMANDS: Record<string, FakeCommand> = {
  'demo.reload': {
    mac: '⇧⌘R',
    other: 'Ctrl+Shift+R',
    aria: { mac: 'Meta+Shift+R', other: 'Control+Shift+R' },
  },
  'demo.new': { mac: '⌘N', other: 'Ctrl+N', aria: { mac: 'Meta+N', other: 'Control+N' } },
  'demo.panel': {
    mac: '⌥⌘B',
    other: 'Ctrl+Shift+B',
    aria: { mac: 'Meta+Alt+B', other: 'Control+Shift+B' },
  },
  'demo.settings': { mac: '⌘,', other: 'Ctrl+,', aria: { mac: 'Meta+,', other: 'Control+,' } },
  'demo.open': {
    mac: '⌘O',
    other: 'Ctrl+O',
    aria: { mac: 'Meta+O', other: 'Control+O' },
  },
  'demo.comment': {
    mac: '⇧⌘M',
    other: 'Ctrl+Shift+M',
    aria: { mac: 'Meta+Shift+M', other: 'Control+Shift+M' },
  },
  'demo.send': {
    mac: '⌘L',
    other: 'Ctrl+L',
    aria: { mac: 'Meta+L', other: 'Control+L' },
  },
  // A letter of the panel's start cards: the same key on every platform.
  'demo.letter': { mac: 'W', other: 'W', aria: { mac: 'W', other: 'W' } },
}

/**
 * A `ShortcutPort` over a fake catalogue, for tests: a known id gives its key on `platform` and its
 * `aria-keyshortcuts`; any other value is a written-out key, drawn as it stands and not announced —
 * the way Orbit's adapter treats both.
 */
export function fakeShortcuts(platform: Platform = 'mac'): ShortcutPort {
  const convention = platform === 'mac' ? 'mac' : 'other'
  return {
    label: (id) => COMMANDS[id]?.[convention] ?? id,
    aria: (id) => COMMANDS[id]?.aria[convention],
  }
}

/**
 * A `wrapper` for Testing Library's `render` that puts a `UiProvider` around the component; without
 * ports of its own it takes {@link fakeShortcuts} on the Mac.
 *
 * @example
 * render(<Button shortcut="demo.new">Nieuw</Button>, { wrapper: uiWrapper({ platform: 'windows' }) })
 */
export function uiWrapper(
  ports: Omit<UiProviderProps, 'children'> = {},
): (props: { children: ReactNode }) => ReactNode {
  const platform = ports.platform ?? 'mac'
  const props = { shortcuts: fakeShortcuts(platform), platform, ...ports }
  return ({ children }) => createElement(UiProvider, { ...props, children })
}
