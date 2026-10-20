import { cva } from 'class-variance-authority'
import { keyConvention } from '../provider/platform'
import { useUi } from '../provider/UiProvider'
import { Icon } from './Icon'
import {
  type KeyName,
  parseShortcut,
  type ShortcutKey,
  type ShortcutLabel,
  type ShortcutPlatform,
} from './shortcut'

/**
 * How the keys are drawn, which depends on what they are lying on.
 *
 * `quiet` is the everyday shortcut beside ordinary text. `strong` is for a shortcut on a filled
 * row — the action row a `SearchList` has walked to: `--nt-text-muted` composites to 3.40:1 on
 * `--nt-surface-active`, under the 4.5:1 body text owes, so on that fill the keys come forward
 * with the rest of the row. `keycap` sets every key in a cap of its own, for a hint that stands on
 * its own line (the hints under the composer). `on-accent` lays the keys on a dark
 * plane of 16% (black), for the key on a primary button ("Verstuur ⌘↵"), where muted would sink
 * into the accent. `hint` draws small, quiet caps in mono for the keys
 * in the composer's placeholder. `menu` sets the whole shortcut in one
 * cap of its own, right of a menu row ("⌘," as one key-like label):
 * a row of loose keys beside a label read as a gap in the row. `menu-strong` is
 * that cap on the active row of a `SearchList` (⌘K), where muted would fall under AA; the shape
 * stays, only the letters come forward. `plane` is the key of a button
 * without the accent — Stop's esc — on a quiet plane of the same shape as `on-accent`, so Esc and ↵
 * stand in the same kind of cap. Complete class strings, because Tailwind scans source text and
 * this project has no class-merging tool.
 */
const row = cva('inline-flex shrink-0 items-center text-[12px] leading-none', {
  variants: {
    tone: {
      quiet: 'text-muted',
      strong: 'text-fg',
      keycap: 'text-secondary',
      'on-accent': 'h-4 rounded-sm bg-accent-key px-1 text-accent-fg',
      hint: 'text-[11px] text-muted',
      menu: 'h-[18px] rounded-sm border border-border-strong px-1 text-[11px] text-muted',
      'menu-strong': 'h-[18px] rounded-sm border border-border-strong px-1 text-[11px] text-fg',
      plane: 'h-4 rounded-sm bg-surface-hover px-1 text-muted',
    },
  },
  defaultVariants: { tone: 'quiet' },
})

/**
 * One key: 20px high for every kind, so an icon and a letter share one line.
 *
 * No width of its own: a box of 16px centred a comma or a letter in air of its own, so `⌘,` stood
 * as "⌘   ," with the comma far from its modifier. The keys of one shortcut
 * now stand at the 2px gap of their row, whatever their glyph.
 */
const KEY = 'inline-flex h-5 items-center justify-center font-sans font-normal'

/** One key in a cap of its own: 18px, radius 4, the strong border. */
const CAP =
  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm border border-border-strong px-1 font-sans font-normal'

/**
 * One key of a hint inside a placeholder: a smaller cap of 16px in the quiet border and mono, so
 * it reads as part of the dimmed text it stands in rather than as a control (design A).
 */
const HINT_CAP =
  'inline-flex h-4 min-w-4 items-center justify-center rounded-sm border border-border px-0.5 font-mono font-normal'

/** A key inside the one cap of `menu`: the cap is the shape, the keys close up inside it. */
const IN_CAP = 'inline-flex items-center justify-center font-sans font-normal'

/** A key on the plane of `on-accent`: no height of its own, the plane is the shape. */
const FLAT = 'inline-flex min-w-3 items-center justify-center font-sans font-normal'

/** The box of one key per tone; a legend word adds small capitals to it. */
const keyBox: Record<KbdTone, string> = {
  quiet: KEY,
  strong: KEY,
  keycap: CAP,
  'on-accent': FLAT,
  hint: HINT_CAP,
  menu: IN_CAP,
  'menu-strong': IN_CAP,
  plane: IN_CAP,
}

/** The room between two keys: caps stand apart, keys without a cap close together. */
const keyGap: Record<KbdTone, string> = {
  quiet: 'gap-0.5',
  strong: 'gap-0.5',
  keycap: 'gap-1',
  'on-accent': 'gap-0.5',
  hint: 'gap-0.5',
  menu: 'gap-px',
  'menu-strong': 'gap-px',
  plane: 'gap-0.5',
}

/** A legend word (`esc`, `F6`, `tab`): small capitals, as printed on a physical key. */
const WORD = '[font-variant-caps:all-small-caps]'

/**
 * Whether the keys whisper beside their text, stand on a fill that has come forward, sit in caps
 * of their own, share one cap beside a menu row, or lie on the accent of a primary button.
 */
export type KbdTone =
  | 'quiet'
  | 'strong'
  | 'keycap'
  | 'on-accent'
  | 'hint'
  | 'menu'
  | 'menu-strong'
  | 'plane'

/** The props of `KbdKeys`. */
export interface KbdKeysProps {
  /** The shortcut in its text form: `⇧⌘R`, `Meta+Alt+b`, `Ctrl+Shift+R`, `F6`, `Escape`. */
  children: string
  /**
   * `strong` on a filled row, where muted would fall under AA; `keycap` for a hint on a line of its
   * own; `hint` for a key inside a placeholder; `on-accent` on a primary button; `menu` right of a
   * menu row; `quiet` everywhere else.
   */
  tone?: KbdTone
  /**
   * The convention to draw in; the window's own when left out. Only the gallery sets it, to show
   * both side by side.
   *
   * It decides how the keys are drawn (⌘ as a sign or `Ctrl` as a word), never which key is drawn:
   * the key of a `shortcut` is the one the `ShortcutPort` gives for the provider's platform, so a
   * story that shows the Windows form of a Mac key sets the `platform` of a `UiProvider` instead.
   */
  platform?: ShortcutPlatform
}

/** The props of `Kbd`. */
export interface KbdProps extends Omit<KbdKeysProps, 'children'> {
  /**
   * The command whose key this draws, as the host's `ShortcutPort` gives it for its platform: a
   * command id in Orbit. Nothing is drawn when the port has no key for it, or without a provider.
   */
  shortcut?: ShortcutLabel
  /**
   * The text form, for a caller not yet moved to an id; `shortcut` wins when both are given.
   */
  children?: string
}

/**
 * The key of a command of the host's catalogue, drawn as {@link KbdKeys} does in the convention of
 * the platform; nothing when the command has no key there.
 *
 * A label can only show a key the catalogue binds, and only in this platform's form: the id is
 * looked up here — through the `ShortcutPort` of `UiProvider` — rather than spelt by each caller,
 * which is how `'⇧⌘R'` came to be fixed text in one menu while the key itself lived elsewhere.
 */
export function Kbd({ shortcut, children, tone, platform }: KbdProps) {
  const ui = useUi()
  const form = platform ?? keyConvention(ui.platform)
  const text = shortcut === undefined ? children : ui.shortcuts.label(shortcut)
  if (text === undefined) return null
  return (
    <KbdKeys platform={form} {...(tone === undefined ? {} : { tone })}>
      {text}
    </KbdKeys>
  )
}

/**
 * A keyboard shortcut, drawn key by key: modifiers and special keys as an icon, letters and
 * digits (and `Ctrl`, `Alt` off macOS) as text, legend words (`esc`, `F6`) in small capitals.
 *
 * **Icons rather than Unicode signs.** ⌘, ⇧ and ⌥ come out of every font at another size and
 * height, and in a row of three keys that unevenness is the first thing the eye catches. An icon from the registry has
 * one box and one stroke on every machine.
 *
 * The drawing behind {@link Kbd}, from the text form, which {@link parseShortcut} reads. Outside
 * `Kbd` itself only a gallery story draws loose keys with it; everything else names a command of
 * the catalogue (a test on the host's side holds that). One `kbd`
 * per key, all on one line and dimmed: in a tooltip the keys are a footnote to the label, and a
 * bordered chip per key was a row of little buttons. A menu row (`menu`) puts one cap around the
 * whole shortcut instead, never one per key.
 *
 * The keys themselves are hidden from assistive technology (`aria-hidden`); beside them stands
 * the readable form ("Shift Command R", from the `keyName` of the host's `ShortcutPort`) as
 * visually hidden text. Text rather
 * than an `aria-label` on a `role="img"`: a tooltip reaches a screen reader as the *description*
 * of its trigger, computed from its content, and whether that takes the label of an embedded
 * image or descends into it is where implementations differ. Plain text is read the same
 * everywhere. Shortcut badges are the one place the interface sets capitals.
 */
export function KbdKeys({ children, tone, platform }: KbdKeysProps) {
  const ui = useUi()
  const keys = parseShortcut(children, platform ?? keyConvention(ui.platform))
  const spoken = ui.shortcuts.keyName ?? codeName
  const name = keys
    .map((key) => ('key' in key.name ? spoken(key.name.key) : key.name.literal))
    .join(' ')
  return (
    <span data-nt-kbd className={row({ tone })}>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true" className={`inline-flex items-center ${keyGap[tone ?? 'quiet']}`}>
        {keys.map((key, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a shortcut never reorders; its position is the key
          <KeyCap key={index} shortcutKey={key} box={keyBox[tone ?? 'quiet']} />
        ))}
      </span>
    </span>
  )
}

/**
 * The name of a key when the host's port gives none: its code name with a capital (`Shift`,
 * `ArrowUp`), so a reader hears something rather than nothing, without a word of any language.
 */
function codeName(key: KeyName): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** One key of the row, as an icon or as its legend, in the box of its tone. */
function KeyCap({ shortcutKey, box }: { shortcutKey: ShortcutKey; box: string }) {
  if (shortcutKey.kind === 'icon') {
    return (
      <kbd className={box}>
        <Icon name={shortcutKey.icon} size="xs" />
      </kbd>
    )
  }
  return <kbd className={shortcutKey.smallCaps ? `${box} ${WORD}` : box}>{shortcutKey.text}</kbd>
}
