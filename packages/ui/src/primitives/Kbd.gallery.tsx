import type { Story } from '../gallery/story'
import { Button } from './Button'
import { KbdKeys } from './Kbd'

/** Combinations a menu or tooltip of this app shows, plus the keys the parser has to know. */
const SHORTCUTS = [
  'Meta+Alt+b',
  '⇧⌘R',
  '⌘[',
  '⌘,',
  '⌃⌥⌘K',
  '⌘⌫',
  '⌥Enter',
  'Enter',
  'Shift+Enter',
  'Meta+Enter',
  'F6',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'W',
] as const

export default {
  group: 'primitives',
  title: 'Kbd',
  states: {
    // The same text, drawn on macOS and elsewhere: signs as icons there, Ctrl and Alt as words
    // here. Each row is the size it has in a menu, so the height of the keys can be judged
    // against the 28px row they stand in.
    Shortcuts: () => (
      <div className="grid w-96 grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1 text-[12px]">
        <span className="text-muted">Text</span>
        <span className="text-muted">macOS</span>
        <span className="text-muted">Windows, Linux</span>
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut} className="contents">
            <span className="flex h-7 items-center font-mono text-fg">{shortcut}</span>
            <KbdKeys platform="mac">{shortcut}</KbdKeys>
            <KbdKeys platform="other">{shortcut}</KbdKeys>
          </div>
        ))}
      </div>
    ),
    // On the fill of a row a list has walked to, where the quiet keys would be 3.40:1. The box
    // below is that fill, so the pair can be judged side by side rather than described.
    'On a filled row': () => (
      <div className="flex w-64 flex-col gap-1 rounded-lg bg-overlay p-2">
        <div className="flex h-7 items-center gap-2 rounded-md bg-surface-active px-2 text-[13px] text-fg">
          <span className="flex-1">Hard herladen</span>
          <KbdKeys tone="strong" platform="mac">
            ⇧⌘R
          </KbdKeys>
        </div>
        <div className="flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-fg">
          <span className="flex-1">Hard herladen</span>
          <KbdKeys platform="mac">⇧⌘R</KbdKeys>
        </div>
      </div>
    ),
    // The four forms side by side. Enter is always the icon, never
    // the glyph: the stories here spell it as a word, and a test holds that no story shows one.
    'Four forms': () => (
      <div className="flex w-[28rem] flex-col gap-3 text-[12px] text-muted">
        <div className="flex h-7 items-center gap-2">
          <span className="w-20">quiet</span>
          <span className="flex-1 text-[13px] text-fg">Nieuwe chat</span>
          <KbdKeys platform="mac">⌘N</KbdKeys>
        </div>
        <div className="flex h-7 items-center gap-2 rounded-md bg-surface-active px-2">
          <span className="w-18">strong</span>
          <span className="flex-1 text-[13px] text-fg">Hard herladen</span>
          <KbdKeys tone="strong" platform="mac">
            ⇧⌘R
          </KbdKeys>
        </div>
        <div className="flex h-7 items-center gap-3">
          <span className="w-20">keycap</span>
          <span className="inline-flex items-center gap-1.5">
            <KbdKeys tone="keycap" platform="mac">
              @
            </KbdKeys>
            bestand
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KbdKeys tone="keycap" platform="mac">
              /
            </KbdKeys>
            commando
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KbdKeys tone="keycap" platform="mac">
              Shift+Enter
            </KbdKeys>
            nieuwe regel
          </span>
        </div>
        <div className="flex h-8 items-center gap-2">
          <span className="w-20">on-accent</span>
          <Button variant="primary">
            Verstuur
            <KbdKeys tone="on-accent" platform="mac">
              Meta+Enter
            </KbdKeys>
          </Button>
        </div>
      </div>
    ),
    // `menu`: the whole shortcut in one cap at the end of a menu row (design A of the account
    // menu), on both platforms, so the comma and the words of Windows can be judged in it.
    'In one cap, beside a menu row': () => (
      <div className="flex w-64 flex-col gap-1 rounded-lg bg-overlay p-1">
        {(
          [
            ['mac', '⌘,', '⇧⌘R'],
            ['other', 'Ctrl+,', 'Ctrl+Shift+R'],
          ] as const
        ).map(([platform, settings, reload]) => (
          <div key={platform} className="contents">
            <div className="flex h-[30px] items-center gap-2 rounded-md px-2 text-[13px] text-fg">
              <span className="flex-1">Instellingen</span>
              <KbdKeys tone="menu" platform={platform}>
                {settings}
              </KbdKeys>
            </div>
            <div className="flex h-[30px] items-center gap-2 rounded-md px-2 text-[13px] text-fg">
              <span className="flex-1">Hard herladen</span>
              <KbdKeys tone="menu" platform={platform}>
                {reload}
              </KbdKeys>
            </div>
          </div>
        ))}
      </div>
    ),
  },
} satisfies Story
