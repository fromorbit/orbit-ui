import { createContext, type ReactNode, useContext, useMemo } from 'react'
import type { KeyName } from '../primitives/shortcut'
import type { HostPort } from './host'
import { type Theme, useDocumentTheme } from './theme'

export type { HostPort } from './host'

/**
 * The operating system the host runs on, for what differs per platform: the signs of the keys
 * (⌘ on a Mac, the words `Ctrl` and `Alt` elsewhere) and the modifier of a command click.
 */
export type Platform = 'mac' | 'windows' | 'linux'

/**
 * Where the library reads the keys of a command: the host's own catalogue of shortcuts.
 *
 * A component with a `shortcut` prop hands that value to the port as it is, and the port decides
 * what it names. In Orbit it is a command id of the register (`browser.hardReload`); a host may
 * also accept a written-out key (`⌘K`) and give it back unchanged, as {@link literalShortcuts}
 * does. The library keeps no catalogue of its own, so it never draws a key the host does not bind.
 *
 * `label` gives the key in its text form (`⇧⌘R`,
 * `Ctrl+Shift+R`), not as a list of keys. That form is what `Kbd` parses and draws key by key,
 * in the convention of the {@link Platform}, so the host never splits a chord itself.
 */
export interface ShortcutPort {
  /**
   * The key of `id` on the host's platform, in its text form; `undefined` when it has none there,
   * and then nothing is drawn.
   */
  label(id: string): string | undefined
  /**
   * The value of `aria-keyshortcuts` for `id` (`Meta+Shift+R`), so a screen reader hears the key the
   * label shows; `undefined` for none.
   */
  aria(id: string): string | undefined
  /**
   * What a screen reader hears for a named key (`shift` → "Shift", `comma` → "Komma"), in the
   * host's language. Here rather than as a prop of `Kbd` or a list of its own in `UiProvider`:
   * the port that gives the keys is the one that knows how they are spoken, and a host wires it
   * in once. Left out, the key's code name is read (`Shift`, `ArrowUp`): a name, not a word of
   * any language, so the library holds no text of its own.
   */
  keyName?(key: KeyName): string
}

/** Everything a `UiProvider` hands down, each with its neutral default filled in. */
export interface UiPorts {
  shortcuts: ShortcutPort
  platform: Platform
  /** The theme the host names, or `undefined` to follow the document (see {@link useUiTheme}). */
  theme: Theme | undefined
  host: HostPort
  /**
   * The language of the host as a BCP 47 tag (`nl`), for what the library formats with `Intl`
   * (the thousands of `NumberField`); `undefined` for the runtime's own.
   */
  locale: string | undefined
}

/** No catalogue: no key is drawn and none is announced. */
const NO_SHORTCUTS: ShortcutPort = {
  label: () => undefined,
  aria: () => undefined,
}

/**
 * A port for a host without a catalogue, which writes its keys out where it uses them (`⇧⌘R` as
 * the value of a `shortcut` prop): drawn as written, never announced, since a text form is no
 * command.
 */
export const literalShortcuts: ShortcutPort = {
  label: (id) => id,
  aria: () => undefined,
}

/**
 * The library without a provider: no shortcut labels and no `aria-keyshortcuts`, the Mac platform,
 * the theme of the document, a host that does nothing and the runtime's locale. Nothing breaks without a provider; it
 * only shows less.
 */
const NEUTRAL: UiPorts = {
  shortcuts: NO_SHORTCUTS,
  platform: 'mac',
  theme: undefined,
  host: {},
  locale: undefined,
}

const UiContext = createContext<UiPorts>(NEUTRAL)

/** The props of {@link UiProvider}: every port is optional and falls back to the one around it. */
export interface UiProviderProps {
  shortcuts?: ShortcutPort
  platform?: Platform
  theme?: Theme
  host?: HostPort
  /** See {@link UiPorts.locale}. */
  locale?: string
  children: ReactNode
}

/**
 * Hands the library what only the host knows: its shortcuts, its platform, its theme and its
 * window. One provider with ports rather than a prop per component, so a component stays usable
 * without one (the neutral default) and a host wires itself in once, at its root.
 *
 * A provider inside another one changes only what it names, so a part of the page can draw the
 * keys of another platform (a showcase) and keep the host's catalogue.
 */
export function UiProvider({
  shortcuts,
  platform,
  theme,
  host,
  locale,
  children,
}: UiProviderProps) {
  const outer = useContext(UiContext)
  const value = useMemo<UiPorts>(
    () => ({
      shortcuts: shortcuts ?? outer.shortcuts,
      platform: platform ?? outer.platform,
      theme: theme ?? outer.theme,
      host: host ?? outer.host,
      locale: locale ?? outer.locale,
    }),
    [outer, shortcuts, platform, theme, host, locale],
  )
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

/** The ports of the nearest {@link UiProvider}, or the neutral default without one. */
export function useUi(): UiPorts {
  return useContext(UiContext)
}

/**
 * The theme a component draws in: the provider's, or — when no provider names one — the
 * `data-theme` of the document, live, which is what `tokens.css` switches on.
 */
export function useUiTheme(): Theme {
  const named = useContext(UiContext).theme
  const document = useDocumentTheme()
  return named ?? document
}
