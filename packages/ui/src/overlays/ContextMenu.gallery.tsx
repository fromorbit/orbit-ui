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
    items: [
      { id: 'to-quotes', label: 'Offertes' },
      { id: 'to-drawings', label: 'Tekeningen' },
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

/** Made-up files of a small studio: a name, a size and when it last changed. */
const FILES: { name: string; icon: IconName; meta: string }[] = [
  { name: 'offerte-bakkerij-de-zon.pdf', icon: 'file-text', meta: '2,4 MB · gisteren' },
  { name: 'plattegrond-begane-grond.png', icon: 'image', meta: '840 kB · 3 dagen' },
  { name: 'notulen-teamoverleg.md', icon: 'file-text', meta: '12 kB · vorige week' },
]

/**
 * A region a right click is meant for, and one quiet line under it that says so: a context menu
 * is out of sight until it opens, so a story of one names the way in.
 */
function Region({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {children}
      <p className="px-2 text-[12px] text-muted">{hint}</p>
    </div>
  )
}

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
        className="flex h-9 items-center gap-2 rounded-md ps-2 pe-1 text-[13px] text-fg hover:bg-surface-hover data-[state=open]:bg-surface-hover"
      >
        <span className="flex text-muted">
          <Icon name={file.icon} size="sm" />
        </span>
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <span className="shrink-0 text-[12px] text-muted tabular-nums max-sm:hidden">
          {file.meta}
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
 * Open at the pointer, over the first file: the right click a reader would give, sent once after
 * the first paint. The one state of this page that opens itself, since a second open menu would
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
          clientX: box.left + Math.min(240, box.width / 2),
          clientY: box.top + box.height / 2,
        }),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div ref={stage} className="flex h-64 w-full max-w-md flex-col">
      <Region hint="Rechtsklik op een bestand, of houd het ingedrukt.">
        <Files />
      </Region>
    </div>
  )
}

/** Settings of a drawing among its acts: switches, and one choice of a unit in a group. */
const CANVAS_ITEMS: DropdownMenuItem[] = [
  { id: 'zoom-in', label: 'Inzoomen' },
  { id: 'zoom-out', label: 'Uitzoomen' },
  { id: 'fit', label: 'Passend maken' },
  { id: 'grid', label: 'Raster tonen', checked: true, separated: true },
  { id: 'sizes', label: 'Maten tonen', checked: false },
  { id: 'metre', label: 'Meter', kind: 'radio', group: 'unit', checked: true, separated: true },
  { id: 'centimetre', label: 'Centimeter', kind: 'radio', group: 'unit', checked: false },
]

/**
 * A right click on a drawing: acts and settings in one menu, the checks in the column the labels
 * of the acts keep free, so every word starts on one line.
 */
function WithChoices() {
  return (
    <Region hint="Rechtsklik op de tekening.">
      <ContextMenu label="Tekening" items={CANVAS_ITEMS}>
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg bg-surface text-muted data-[state=open]:bg-surface-hover">
          <Icon name="image" size="md" />
          <span className="text-[12px]">plattegrond-begane-grond.png</span>
        </div>
      </ContextMenu>
    </Region>
  )
}

/** A member of the team, with a head of identity over comfortable rows (the account menu's shape). */
function WithAHead() {
  return (
    <Region hint="Rechtsklik op een teamlid.">
      <ContextMenu
        label="Acties voor Robin de Vries"
        header={{
          title: 'Robin de Vries',
          detail: 'Ontwerper · Studio Noord',
          glyph: <Avatar name="Robin de Vries" size="md" />,
        }}
        density="comfortable"
        items={[
          { id: 'profile', label: 'Profiel bekijken', icon: 'user' },
          { id: 'message', label: 'Bericht sturen', icon: 'message-square' },
          {
            id: 'remove',
            label: 'Uit het team halen',
            icon: 'log-out',
            tone: 'danger',
            separated: true,
          },
        ]}
      >
        <div className="flex h-14 items-center gap-3 rounded-lg bg-surface px-3 data-[state=open]:bg-surface-hover">
          <Avatar name="Robin de Vries" size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-fg">Robin de Vries</span>
            <span className="truncate text-[12px] text-muted">Ontwerper</span>
          </div>
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
    <Region hint="Het menu komt terug zodra het bestand binnen is.">
      <ContextMenu label="Acties voor gevelaanzicht-noord.pdf" items={FILE_ACTIONS} disabled>
        <div className="flex h-9 items-center gap-2 rounded-lg bg-surface px-3 text-[13px] text-secondary">
          <span className="flex text-muted">
            <Icon name="upload" size="sm" />
          </span>
          <span className="min-w-0 flex-1 truncate">gevelaanzicht-noord.pdf</span>
          <span className="shrink-0 text-[12px] text-muted tabular-nums">Uploaden · 64%</span>
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
