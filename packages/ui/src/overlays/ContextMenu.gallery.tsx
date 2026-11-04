import { type ReactNode, useEffect, useRef } from 'react'
import type { Story } from '../gallery/story'
import { Avatar } from '../primitives/Avatar'
import { Icon, type IconName } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'
import { ContextMenu } from './ContextMenu'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/**
 * The acts on a file, once: the `⋯` of each row and a right click on it are fed this one array, so
 * both offer the same rows in the same order. A submenu for where it goes, and the one destructive
 * act last, apart.
 */
const FILE_ACTIONS: DropdownMenuItem[] = [
  { id: 'open', label: 'Openen', icon: 'square-arrow-out-up-right', shortcut: '⌘O' },
  { id: 'rename', label: 'Hernoemen', icon: 'pencil' },
  { id: 'duplicate', label: 'Dupliceren', icon: 'copy', shortcut: '⌘D' },
  {
    id: 'move',
    label: 'Verplaatsen naar',
    icon: 'folder',
    kind: 'submenu',
    separated: true,
    // Every destination with its own mark, so the rows of one level look alike; a long name of a
    // folder shows the panel stop at its cap and the label end in an ellipsis.
    items: [
      { id: 'to-quotes', label: 'Offertes', icon: 'folder' },
      { id: 'to-drawings', label: 'Tekeningen', icon: 'folder' },
      {
        id: 'to-final',
        label: 'Definitief ontwerp uitbreiding Bakkerij De Zon en omgeving',
        icon: 'folder',
      },
      { id: 'to-archive', label: 'Archief', icon: 'archive', separated: true },
    ],
  },
  {
    id: 'delete',
    label: 'Verwijderen',
    icon: 'trash-2',
    tone: 'danger',
    shortcut: '⌘⌫',
    separated: true,
  },
]

/**
 * Made-up files of a small studio: a name, a size and when it last changed. One name is as long as
 * real ones get, so the row shows it cut off beside its meta.
 */
const FILES: { name: string; icon: IconName; size: string; age: string }[] = [
  { name: 'offerte-bakkerij-de-zon.pdf', icon: 'file-text', size: '2,4 MB', age: 'gisteren' },
  {
    name: 'definitief-ontwerp-uitbreiding-bakkerij-de-zon-v3-met-opmerkingen-gemeente.pdf',
    icon: 'file-text',
    size: '1,1 MB',
    age: '3 dagen geleden',
  },
  { name: 'plattegrond-begane-grond.png', icon: 'image', size: '840 kB', age: 'vorige week' },
]

/** The one hint of every way in: the mouse, a finger and the keyboard. */
const WAYS_IN = 'houd het ingedrukt of druk op Shift+F10.'

/**
 * A region a right click is meant for, and one quiet line above it that says so: a context menu
 * is out of sight until it opens, so a story of one names the way in. Above rather than under, so
 * the menu that opens over the region never covers its instruction; on the 12px left edge the
 * content of the region starts on.
 */
function Region({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="px-3 text-[12px] text-muted">{hint}</p>
      {children}
    </div>
  )
}

/**
 * The focus ring of a region that takes the focus itself (a drawing, a card), so the context-menu
 * key or Shift+F10 has something to open on and Escape something to come back to.
 */
const FOCUSABLE = 'outline-focus focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * One file as a 36px row of a list: its icon, its name, its size and age quiet at the end, and a
 * `⋯` with the same acts as the right click. The row stays lit while its menu is up
 * (`data-state="open"`, which Radix sets on the region), so it is plain what the menu is about.
 */
function FileRow({ file }: { file: (typeof FILES)[number] }) {
  return (
    <ContextMenu label={`Acties voor ${file.name}`} items={FILE_ACTIONS}>
      <li
        data-nt-story-file
        className="group flex h-9 items-center gap-2 rounded-md ps-2 pe-1 text-[13px] text-fg hover:bg-surface-hover data-[state=open]:bg-surface-hover"
      >
        <span className="flex text-muted">
          <Icon name={file.icon} size="sm" />
        </span>
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        {/* `secondary` while lit: `muted` on the lit row fell to 4.2:1 in dark. On a phone only
            the age stays, so a row keeps its when without crowding the name. */}
        <span className="shrink-0 text-[12px] text-muted tabular-nums group-data-[state=open]:text-secondary">
          <span className="max-sm:hidden">{file.size} · </span>
          {file.age}
        </span>
        <DropdownMenu
          trigger={<IconButton icon="more-horizontal" label="Meer" size="sm" />}
          label={`Acties voor ${file.name}`}
          items={FILE_ACTIONS}
          align="end"
        />
      </li>
    </ContextMenu>
  )
}

/** The files as one tinted plane of rows, no frame around it. */
function Files() {
  return (
    <ul className="flex flex-col rounded-lg bg-surface p-1">
      {FILES.map((file) => (
        <FileRow key={file.name} file={file} />
      ))}
    </ul>
  )
}

/**
 * Open at the pointer, on the first file: the right click a reader would give, sent once after the
 * first paint, low on the row and left of its meta, so the panel hangs under the row and no line
 * of text is cut at its edge. The one state of this page that opens itself, since a second open menu would
 * close this one (as on `DropdownMenu`).
 */
function Open() {
  const stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const row = stage.current?.querySelector('[data-nt-story-file]')
      if (!row) return
      const box = row.getBoundingClientRect()
      row.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left + Math.min(160, box.width / 2),
          clientY: box.bottom - 2,
        }),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    // As tall as the open panel reaches, so the next state starts at the same distance as the rest.
    <div ref={stage} className="flex min-h-58 w-full max-w-md flex-col">
      <Region hint={`Rechtsklik op een bestand, ${WAYS_IN}`}>
        <Files />
      </Region>
    </div>
  )
}

/** Settings of a drawing among its acts: switches, and one choice of a unit in a group. */
const CANVAS_ITEMS: DropdownMenuItem[] = [
  { id: 'zoom-in', label: 'Inzoomen' },
  { id: 'zoom-out', label: 'Uitzoomen' },
  { id: 'fit', label: 'Passend in venster' },
  { id: 'grid', label: 'Raster tonen', checked: true, separated: true },
  { id: 'sizes', label: 'Maten tonen', checked: false },
  // A quiet heading names the choice and the group (`aria-labelledby`); the dot of a radio row
  // tells it from the checks of the switches above.
  { id: 'unit', label: 'Eenheid', kind: 'heading', separated: true },
  { id: 'metre', label: 'Meter', kind: 'radio', group: 'unit', checked: true },
  { id: 'centimetre', label: 'Centimeter', kind: 'radio', group: 'unit', checked: false },
]

/**
 * A right click on a drawing: acts and settings in one menu, the checks in the column the labels
 * of the acts keep free, so every word starts on one line. The drawing takes the focus for the
 * keyboard's way in, and its `⋯` offers the same rows to whoever never right-clicks.
 */
function WithChoices() {
  return (
    <Region hint={`Rechtsklik op de tekening, ${WAYS_IN}`}>
      <ContextMenu label="Tekening" items={CANVAS_ITEMS}>
        <div
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the focus target of the context-menu key
          tabIndex={0}
          data-nt-story-region
          className={`relative flex h-32 flex-col items-center justify-center gap-2 rounded-lg bg-surface text-muted data-[state=open]:bg-surface-hover ${FOCUSABLE}`}
        >
          <Icon name="image" size="md" />
          <span className="text-[12px]">plattegrond-begane-grond.png</span>
          <span className="absolute top-1 right-1">
            <DropdownMenu
              trigger={<IconButton icon="more-horizontal" label="Meer" size="sm" />}
              label="Tekening"
              items={CANVAS_ITEMS}
              align="end"
            />
          </span>
        </div>
      </ContextMenu>
    </Region>
  )
}

/** The acts on a member of the team, for the right click on the card and its `⋯`. */
const MEMBER_ACTIONS: DropdownMenuItem[] = [
  { id: 'profile', label: 'Profiel bekijken', icon: 'user' },
  { id: 'message', label: 'Bericht sturen', icon: 'message-square' },
  {
    id: 'remove',
    label: 'Uit het team halen',
    icon: 'log-out',
    tone: 'danger',
    separated: true,
  },
]

const MEMBER = {
  title: 'Robin de Vries',
  detail: 'Ontwerper · Studio Noord',
  glyph: <Avatar name="Robin de Vries" size="md" />,
}

/** A member of the team, with a head of identity over comfortable rows (the account menu's shape). */
function WithAHead() {
  return (
    <Region hint={`Rechtsklik op een teamlid, ${WAYS_IN}`}>
      <ContextMenu
        label="Acties voor Robin de Vries"
        header={MEMBER}
        density="comfortable"
        items={MEMBER_ACTIONS}
      >
        <div
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the focus target of the context-menu key
          tabIndex={0}
          data-nt-story-region
          className={`flex h-14 items-center gap-3 rounded-lg bg-surface ps-3 pe-2 data-[state=open]:bg-surface-hover ${FOCUSABLE}`}
        >
          <Avatar name="Robin de Vries" size="md" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium text-fg">Robin de Vries</span>
            <span className="truncate text-[12px] text-muted">Ontwerper</span>
          </div>
          <DropdownMenu
            trigger={<IconButton icon="more-horizontal" label="Meer" size="sm" />}
            label="Acties voor Robin de Vries"
            header={MEMBER}
            density="comfortable"
            items={MEMBER_ACTIONS}
            align="end"
          />
        </div>
      </ContextMenu>
    </Region>
  )
}

/**
 * Off for a moment: a file still being sent has no acts yet, so a right click gives the browser's
 * own menu, and the row says why instead of a menu that refuses everything.
 */
function Disabled() {
  return (
    <Region hint="Het menu komt terug zodra het uploaden klaar is.">
      <ContextMenu label="Acties voor gevelaanzicht-noord.pdf" items={FILE_ACTIONS} disabled>
        {/* `aria-busy` and the progress as a live line: a reader hears why a right click does
            nothing yet, as a sighted one reads it at the end of the row. */}
        <div
          aria-busy="true"
          className="flex h-9 items-center gap-2 rounded-lg bg-surface px-3 text-[13px] text-secondary"
        >
          <span className="flex text-muted">
            <Icon name="upload" size="sm" />
          </span>
          <span className="min-w-0 flex-1 truncate">gevelaanzicht-noord.pdf</span>
          <span role="status" className="shrink-0 text-[12px] text-muted tabular-nums">
            Uploaden · 64% · nog geen acties
          </span>
        </div>
      </ContextMenu>
    </Region>
  )
}

export default {
  group: 'overlays',
  title: 'ContextMenu',
  states: {
    Open,
    'With choices': WithChoices,
    'With a head': WithAHead,
    Disabled,
  },
} satisfies Story
