import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowBigUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AtSign,
  Bell,
  Bold,
  BookOpen,
  Bot,
  Brain,
  Camera,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Code,
  Columns2,
  Command,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  Delete,
  Eye,
  EyeOff,
  File,
  FileDiff,
  FileText,
  Flag,
  Folder,
  FolderGit2,
  FolderTree,
  Gavel,
  GitBranch,
  GitFork,
  Globe,
  GraduationCap,
  Hand,
  Image,
  Info,
  Italic,
  Keyboard,
  Layers,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  type LucideIcon,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MessageSquareWarning,
  MessagesSquare,
  Minimize2,
  Minus,
  MoreHorizontal,
  MousePointerClick,
  OctagonAlert,
  Option,
  Palette,
  PanelLeft,
  PanelRight,
  Paperclip,
  Pencil,
  PenLine,
  Pilcrow,
  Pin,
  Plug,
  Plus,
  Repeat,
  RotateCcw,
  RotateCw,
  Rows3,
  ScanSearch,
  Search,
  Settings,
  Shield,
  ShieldOff,
  SlidersHorizontal,
  Sparkles,
  Split,
  Square,
  SquareArrowOutUpRight,
  SquareCheck,
  SquareMinus,
  SquarePen,
  Star,
  Strikethrough,
  Terminal,
  Trash2,
  Undo2,
  User,
  Users,
  WrapText,
  Wrench,
  X,
} from 'lucide-react'

/**
 * The only place `lucide-react` icon components are named, so an unused import never ships.
 *
 * An icon goes in here when something renders it, and comes out again when nothing does: the
 * import is what pulls the glyph into the bundle, so a registry entry nobody asks for is dead
 * weight in every window.
 */
const registry = {
  check: Check,
  // Afronden: a glyph of its own, so the hover action never reads as the status done.
  'check-check': CheckCheck,
  bell: Bell,
  search: Search,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  plus: Plus,
  settings: Settings,
  x: X,
  // The dash of a thing that was cut short, the shape the old `interrupted` status icon drew
  // inside its ring: quieter than an `x`, which would claim something failed.
  minus: Minus,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  'message-circle': MessageCircle,
  // The chats as a view of the sidebar, beside `file-text` for the specs.
  'message-square': MessageSquare,
  paperclip: Paperclip,
  'at-sign': AtSign,
  'arrow-up': ArrowUp,
  // From one name to the next: a file the agent moved, "oud/pad.ts → nieuw/pad.ts".
  'arrow-right': ArrowRight,
  square: Square,
  // A favourite in a list: the row action of the model picker, filled where it is on.
  star: Star,
  // Two sheets: the sign every editor uses for "take this along". Its counterpart when the copy
  // succeeded is `check`, which is already here.
  copy: Copy,
  // A project is a checkout on disk, so the pill that chooses one shows a folder rather than a
  // speech bubble; `message-circle` stays what a chat is.
  folder: Folder,
  // The four access levels of a chat, as one family that reads from strict to wide: a raised hand
  // that stops every step, a pencil for the edits that may happen unasked, a spark for the
  // routine an agent may judge itself, and a shield switched off for the level that never asks.
  // The pill that chooses one falls back to its icon alone in a tight toolbar, so each glyph has
  // to carry its level without the word beside it.
  hand: Hand,
  pencil: Pencil,
  sparkles: Sparkles,
  // An Expert (the pill of a new chat, the category in Settings): not the sparkles of automatic access.
  'graduation-cap': GraduationCap,
  'shield-off': ShieldOff,
  // The row menu's own trigger — three dots rather than a chevron, so it never reads as "expand
  // this row" the way `chevron-down` does elsewhere.
  'more-horizontal': MoreHorizontal,
  // The archive itself, and its own reverse: putting a chat away and bringing it back are two
  // glyphs, not one glyph with a rotated arrow that a screen reader cannot tell apart anyway.
  archive: Archive,
  'archive-restore': ArchiveRestore,
  // Definitively removing something, distinct from `x` (which only closes or dismisses).
  'trash-2': Trash2,
  // A rectangle whose right-hand column is filled: the window with its right panel out. The same
  // sign every editor uses for a side panel, so the button needs no word beside it.
  'panel-right': PanelRight,
  // Its mirror for the left sidebar: the button that folds it away and the one in the
  // title bar that brings it back both draw this, filled column on the left this time.
  'panel-left': PanelLeft,
  // The three tabs the right panel's `+`-menu promises before they exist:
  // a globe for a browser tab, a prompt for a terminal, and the diff mark for a file's changes.
  globe: Globe,
  terminal: Terminal,
  'file-diff': FileDiff,
  // An attached file from outside the workspace: a plain sheet for a
  // pdf, a sheet with lines for text.
  file: File,
  'file-text': FileText,
  // The changes toolbar. Stacked reads as one column of rows, split as two
  // columns beside each other — the two glyphs code tools use for this choice.
  rows: Rows3,
  columns: Columns2,
  'wrap-text': WrapText,
  // The pilcrow (¶) is the proofreading mark for a paragraph break, so it doubles as "whitespace"
  // without a second, busier glyph.
  pilcrow: Pilcrow,
  'folder-tree': FolderTree,
  // Two chevrons pulling apart for "expand everything", pulling together for "collapse
  // everything" — the shape reads before the tooltip does.
  'chevrons-expand': ChevronsUpDown,
  'chevrons-collapse': ChevronsDownUp,
  // A chat in a worktree of its own names its branch on the line under the composer, and
  // the pill that chooses the place shows it beside the folder of the project directory: two
  // places, one glyph each, so the choice reads without its word.
  'git-branch': GitBranch,
  // Aftakken under an answer: a new chat from here.
  'git-fork': GitFork,
  // Flow, the view of objectives and their steps: a list being ticked off, never the branch of a
  // worktree it used to borrow.
  'list-checks': ListChecks,
  // A subagent — an agent another agent started — wherever one shows: the pill and the card of
  // its tab, the row of the `+`-menu and its line in the conversation. Its own glyph, not the
  // branch above, which is a worktree's.
  bot: Bot,
  // The team platform: the tab Team and the chip of its context.
  users: Users,
  // A context that comes from the cache rather than fresh from the team platform.
  clock: Clock,
  // The quiet line of a thought: a brain for "Denkt na", the one glyph that reads as thinking
  // rather than as a status or an action.
  brain: Brain,
  // The quiet line of a folded block whose tools have no kind of their own: a wrench says "work
  // is being done with some instrument" without claiming which one.
  wrench: Wrench,
  // The address bar of a browser tab: back beside the `arrow-right` above for forward,
  // and the circle every browser draws for reload.
  'arrow-left': ArrowLeft,
  'rotate-cw': RotateCw,
  // A settings row back to its default: the arrow turning
  // back, the mirror of reload above, so the two never read as the same action.
  'rotate-ccw': RotateCcw,
  // Terughalen on a row under Afgerond: an arrow bending back, so it
  // never reads as reload or as the archive's restore.
  'undo-2': Undo2,
  // A secret field showing what is being typed, and hiding it again (`SecretField`).
  eye: Eye,
  'eye-off': EyeOff,
  // The keys of a shortcut that are not a letter or a digit (`Kbd`). A glyph from one icon set
  // rather than the Unicode sign: ⌘, ⇧ and ⌥ come out of every font at another size and height,
  // and in a row of keys that difference is what the eye catches first. `chevron-up` is Control,
  // `delete` is Backspace, `corner-down-left` is Enter — the signs printed on a Mac keyboard.
  command: Command,
  option: Option,
  'chevron-up': ChevronUp,
  'arrow-big-up': ArrowBigUp,
  'corner-down-left': CornerDownLeft,
  delete: Delete,
  'arrow-down': ArrowDown,
  // Pointing at something on a page and taking a picture of it: the pointer
  // with its click marks, and the camera every browser uses for a
  // screenshot.
  'mouse-pointer-click': MousePointerClick,
  camera: Camera,
  // A pick the user adjusted in the page before adding it: the same sliders
  // the overlay draws on its Aanpassen button, dimmed on the chip as a quiet mark.
  'sliders-horizontal': SlidersHorizontal,
  // The address field's own "open": a diagonal arrow out of the field, the sign every
  // browser uses for "go", so it reads beside a combobox without a word.
  'arrow-up-right': ArrowUpRight,
  // The hint of a registered setting: a quiet "i" behind the label, never a line
  // of explanation under it.
  info: Info,
  // The stands of a markdown document, for a file tab too narrow for their words: an
  // open book for Lezen, angle brackets for Code; Gesplitst reuses `columns`.
  'book-open': BookOpen,
  code: Code,
  // The floating toolbar of Bewerken: the marks every editor draws this way;
  // inline code reuses `code`, and Bewerken itself the `pencil`.
  bold: Bold,
  italic: Italic,
  strikethrough: Strikethrough,
  // The right panel over the whole room and back: two arrows pointing out of
  // the corners and two pointing in, the usual pair for this button.
  'maximize-2': Maximize2,
  'minimize-2': Minimize2,
  // The kinds of an SDD document: `file-text` above for a
  // spec, a gavel for a decision (a knot was cut), a clipboard with a list for a plan, and a box
  // to tick for a step of a plan, which carries its own status. `DocKindIcon` draws them with a
  // status badge cut out of the glyph, so they never look like the shapes of a chat.
  gavel: Gavel,
  'clipboard-list': ClipboardList,
  // An audit: a frame with a magnifier.
  'scan-search': ScanSearch,
  'square-check': SquareCheck,
  'square-minus': SquareMinus,
  // The categories of the settings screen that had no glyph yet: a palette
  // for Uiterlijk, a shield for Toegang en veiligheid, a plug for Integraties and a keyboard for
  // Toetsenbord; the other six reuse a glyph above.
  palette: Palette,
  shield: Shield,
  plug: Plug,
  keyboard: Keyboard,
  // A new chat: the pen on a square, the sign Linear and
  // most mail apps put in the head of a list for "write something new".
  'square-pen': SquarePen,
  // A chat in a worktree of its own, on the third line of its item: a folder with the branch
  // mark, so it reads as "its own copy" rather than as the branch itself (`git-branch`).
  'folder-git-2': FolderGit2,
  // The chats as a view, beside `file-text` for the specs: two bubbles for many conversations.
  'messages-square': MessagesSquare,
  // A chat pinned to the list.
  pin: Pin,
  // The affordance of a pill that opens a picker, the two chevrons every select draws. The same
  // glyph as `chevrons-expand` above, under the name the pill asks for.
  'chevrons-up-down': ChevronsUpDown,
  // Open elsewhere ("Toon in Chats"): the square with the arrow leaving it.
  'square-arrow-out-up-right': SquareArrowOutUpRight,
  // "This is taking a moment" (`Spinner`): the open circle that turns.
  'loader-circle': LoaderCircle,
  // The Artifacts page (E-ART-16): a lock on a row whose artifact is held by a person or a run, and
  // the picture for the kind `afbeelding`.
  lock: Lock,
  // Vergrendelen and Ontgrendelen of an artifact, and the badge "agent schrijft" (E-ART-25).
  'lock-open': LockOpen,
  'pen-line': PenLine,
  image: Image,
  // The callouts of a document (E-ART-31): a bulb for a tip, a speech bubble with a mark for an
  // important note, and the stop sign for a caution; note and warning reuse `info` and
  // `alert-triangle`.
  lightbulb: Lightbulb,
  'message-square-warning': MessageSquareWarning,
  'octagon-alert': OctagonAlert,
  // The account: a person without a face for "Niet ingelogd", and the doors of
  // Inloggen and Uitloggen in its menu.
  user: User,
  'log-in': LogIn,
  'log-out': LogOut,
  // The kinds of a Flow step that had no glyph of their own: a split for a
  // Condition, layers for a Subflow, a loop for "Voor elk item", a flag for the end, and the
  // bent arrow that sets a path in under the step it leaves.
  split: Split,
  layers: Layers,
  repeat: Repeat,
  flag: Flag,
  'corner-down-right': CornerDownRight,
} satisfies Record<string, LucideIcon>

/** Names in the registry above; adding an icon is one line there, so the bundle stays small. */
export type IconName = keyof typeof registry

/**
 * The same names as a list, for whoever has to walk all of them: the gallery story and the test.
 *
 * Read from the registry rather than written out a second time. Two hand-copied lists had already
 * drifted apart — `message-circle` was in the story and missing from the test — and a new icon
 * could ship without a single place noticing.
 */
export const iconNames = Object.keys(registry) as IconName[]

/**
 * The bare component of a registry icon, to draw inside an SVG of one's own.
 *
 * For the rare glyph that needs more than `Icon` offers — `DocKindIcon` puts it under a mask to cut
 * a status badge out of it. The name still has to be in the registry, so the bundle stays exactly
 * what is used; everything else draws `Icon`.
 */
export function iconGlyph(name: IconName): LucideIcon {
  return registry[name]
}

/** One element of a Lucide glyph: its tag and its attributes, as the library describes it. */
type IconNode = readonly (readonly [string, Record<string, string | number>])[]

/**
 * The elements of a registry glyph, read from the component Lucide built them into.
 *
 * `lucide-react` exports each glyph only as a component; its data sits in the props the component
 * hands its inner `Icon`. Calling the component's render function without mounting it reads them
 * without `react-dom/server`, which would be a large dependency for a few paths. `Icon.test.tsx`
 * pins the path of one glyph, so an update of the library that moves this data fails there.
 */
function nodeOf(name: IconName): IconNode {
  const component = registry[name] as unknown as {
    render: (props: object, ref: null) => { props: { icon?: { node?: IconNode } } }
  }
  return component.render({}, null).props.icon?.node ?? []
}

/**
 * A registry glyph as a `<symbol>` of a sprite: the same paths, the same stroke of 1.75, in
 * `currentColor`.
 *
 * For a library that draws its own icons from a sprite and takes a symbol of ours in their place,
 * such as the chevron of `@pierre/trees` (`file-icons.ts`). The markup is ours from end to end — no
 * text from outside ever reaches it.
 */
export function iconSymbol(name: IconName, id: string): string {
  const elements = nodeOf(name)
    .map(([tag, attributes]) => {
      const written = Object.entries(attributes)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(' ')
      return `<${tag} ${written}/>`
    })
    .join('')
  return `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${elements}</symbol>`
}

/**
 * The colour a glyph may carry of its own, exhaustive so exactly one `text-*` class is emitted.
 *
 * On the glyph rather than on whatever holds it: a control paints itself (`Button` and
 * `IconButton` set `text-muted`, `text-fg`, `text-accent-fg`), and a colour inherited from a
 * wrapper would lose to that. This project has no class-merging tool, so two competing `text-*`
 * classes would be settled by Tailwind's generation order rather than by intent — see the note in
 * `Button.tsx`.
 */
const tones = {
  default: '',
  danger: 'text-danger',
  // The quiet icon beside a word in `muted` or `secondary` (the branch glyph, the pin, the folder
  // of the filter row). The only place `text-faint` may stand: at 4.3:1 it is too faint for a
  // word, and `tests/faint-text.test.ts` holds that nothing else uses it.
  faint: 'text-faint',
} satisfies Record<string, string>

/** The tones a glyph can be asked for; `default` inherits the colour around it. */
export type IconTone = keyof typeof tones

/**
 * The box a glyph fills, written out in full per size.
 *
 * Tailwind finds classes by scanning source text, so the three class names are literals here rather
 * than a string built from the size — see the note in `control-size.ts`.
 *
 * `xs` is not a smaller icon but a different job: the affordance of a control, such as the chevron
 * of a `PickerPill`, which has to sit beside 12px text without shouting. A glyph that carries
 * content (a status, an action) stays `sm` or `md`.
 */
const boxes = {
  // `shrink-0` with every size: a flex item with only a `size-*` still shrinks when its row runs
  // out of room, and a glyph drawn narrower than itself is a fault in whatever row it sits in —
  // the chevron of a file row with a long path was squeezed to 12px of its 14.
  xs: 'size-(--nt-icon-xs) shrink-0',
  sm: 'size-(--nt-icon-sm) shrink-0',
  md: 'size-(--nt-icon-md) shrink-0',
} satisfies Record<string, string>

/** The props of `Icon`. */
export interface IconProps {
  name: IconName
  /** Matches the size of the control it sits in; defaults to `md`. */
  size?: keyof typeof boxes
  /**
   * A colour of its own; `default` (the default) inherits one.
   *
   * Never the whole of a status: the guidelines forbid colour on its own, so a caller that turns
   * a glyph red changes the glyph as well and puts the word somewhere a screen reader finds it.
   */
  tone?: IconTone
}

/**
 * A named icon from the registry.
 *
 * Always decorative (`aria-hidden`): per the UI guidelines an icon never carries meaning on its
 * own, so whatever it illustrates has its own accessible name elsewhere. Sized from the icon
 * tokens, not a pixel number, so it always matches the control it sits beside.
 */
export function Icon({ name, size = 'md', tone = 'default' }: IconProps) {
  const Glyph = registry[name]
  const box = boxes[size]
  return (
    <Glyph
      aria-hidden="true"
      strokeWidth={1.75}
      className={tone === 'default' ? box : `${box} ${tones[tone]}`}
    />
  )
}
