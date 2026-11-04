import { type ReactNode, useEffect, useId, useRef } from 'react'
import type { Story } from '../gallery/story'
import { Avatar } from '../primitives/Avatar'
import { Icon, type IconName } from '../primitives/Icon'
import { IconButton } from '../primitives/IconButton'
import { useUi } from '../provider/UiProvider'
import { ContextMenu } from './ContextMenu'
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu'

/**
 * The acts on a file, once: the `⋯` of each row and a right click on it are fed this one array, so
 * both offer the same rows in the same order. A submenu for where it goes, and the one destructive
 * act last, apart. The keys are command ids of the docs page's port, so they follow its platform
 * switch (⌘O or Ctrl+O) and reach a screen reader as `aria-keyshortcuts`.
 */
const FILE_ACTIONS: DropdownMenuItem[] = [
  { id: 'open', label: 'Openen', icon: 'square-arrow-out-up-right', shortcut: 'file.open' },
  { id: 'rename', label: 'Hernoemen', icon: 'pencil' },
  { id: 'duplicate', label: 'Dupliceren', icon: 'copy', shortcut: 'file.duplicate' },
  {
    id: 'move',
    label: 'Verplaatsen naar',
    icon: 'folder',
    kind: 'submenu',
    separated: true,
    // Every destination with its own mark, so the rows of one level look alike; a long name of a
    // folder shows the panel stop at its cap and the label end in an ellipsis, and its full name
    // in a tooltip on hover and on focus, so where the file goes is never a guess.
    items: [
      { id: 'to-quotes', label: 'Offertes', icon: 'folder' },
      { id: 'to-drawings', label: 'Tekeningen', icon: 'folder' },
      {
        id: 'to-final',
        label: 'Definitief ontwerp uitbreiding Bakkerij De Zon en omgeving',
        hint: 'Definitief ontwerp uitbreiding Bakkerij De Zon en omgeving',
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
    shortcut: 'file.delete',
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

/**
 * The line above a region that says how its menu opens, in the words of the input at hand: a right
 * click where there is a pointer, a long press under a coarse pointer, where a right click does not
 * exist. Chosen by the pointer only, never by the width: a keyboard user who zooms in to 400% keeps
 * the pointer's line and its key. Each says what the gesture gives ("voor acties").
 *
 * The keyboard's half follows the platform of the page, as the keys in the menu do: on macOS a
 * Control-click is the right click of a one-button mouse, and Shift+F10 is a key of Windows and
 * Linux, named there only (`keys`, on the first state). The menu still opens on Shift+F10 on every
 * platform, and every focusable region says so as `aria-keyshortcuts`.
 */
function Hint({ id, subject, keys }: { id: string; subject: string; keys: boolean }) {
  const { platform } = useUi()
  const pointer =
    platform === 'mac'
      ? `Rechtsklik (of Control-klik) op ${subject} voor acties.`
      : keys
        ? `Rechtsklik op ${subject} voor acties, of druk op Shift+F10.`
        : `Rechtsklik op ${subject} voor acties.`
  return (
    <p id={id} className="m-0 text-[12px] text-muted">
      <span className="pointer-coarse:hidden">{pointer}</span>
      <span className="hidden pointer-coarse:inline">{`Houd ${subject} ingedrukt voor acties.`}</span>
    </p>
  )
}

/**
 * A region a right click is meant for, and one quiet line above it that says so: a context menu
 * is out of sight until it opens, so a story of one names the way in. Above rather than under, so
 * the menu that opens over the region never covers its instruction; on the 12px left edge the
 * content of the region starts on. The region gets the id of the line, for its `aria-describedby`.
 */
function Region({
  subject,
  keys = false,
  children,
}: {
  subject: string
  keys?: boolean
  children: (hintId: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Hint id={id} subject={subject} keys={keys} />
      {children(id)}
    </div>
  )
}

/**
 * The focus ring of a region that takes the focus itself (a drawing, a card), so the context-menu
 * key or Shift+F10 has something to open on and Escape something to come back to.
 */
const FOCUSABLE = 'outline-focus focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * One file as a 40px row of a list: its icon, its name, its size and age quiet at the end, and a
 * framed `⋯` (`secondary`, 28px) with the same acts as the right click: a frame, so the one action
 * of the row never floats beside the text. The row stays lit a step above its hover while its menu
 * is up (`data-state="open"`, which Radix sets on the region), so it is plain what the menu is about.
 */
function FileRow({ file }: { file: (typeof FILES)[number] }) {
  return (
    <ContextMenu label={`Acties voor ${file.name}`} items={FILE_ACTIONS}>
      <li
        data-nt-story-file
        className="group flex h-10 items-center gap-2 ps-3 pe-2 text-[13px] text-fg first:rounded-t-lg last:rounded-b-lg hover:bg-surface-hover data-[state=open]:bg-surface-active"
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
          trigger={<IconButton icon="more-horizontal" label="Meer" size="sm" variant="secondary" />}
          label={`Acties voor ${file.name}`}
          items={FILE_ACTIONS}
          align="end"
        />
      </li>
    </ContextMenu>
  )
}

/**
 * The files as one plane of rows (`bg-plane shadow-plane`): a white card with a hairline edge on
 * the off-white page in light, a tint in dark; the rows parted by hairlines the eye follows across.
 */
function Files() {
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-border rounded-lg bg-plane p-0 shadow-plane">
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
    const open = () => {
      const row = stage.current?.querySelector('[data-nt-story-file]')
      if (!row || row.closest('[data-state="open"]')) return
      const box = row.getBoundingClientRect()
      // Only while the row is in sight: a menu opened off screen would be closed by the scroll
      // that brings it in.
      if (box.bottom < 0 || box.top > window.innerHeight) return
      row.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left + Math.min(160, box.width / 2),
          clientY: box.bottom - 2,
        }),
      )
    }
    const frame = requestAnimationFrame(open)
    // A scroll closes a context menu, as a native one does; this state is a picture of the open
    // menu, so it opens again once a scroll has settled with the row in sight (a phone scrolls
    // to it before it can be seen).
    let settle: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      clearTimeout(settle)
      settle = setTimeout(open, 200)
    }
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [])
  return (
    // As tall as the open panel reaches, so the next state starts at the same distance as the rest.
    <div ref={stage} className="flex min-h-58 w-full max-w-md flex-col">
      <Region subject="een bestand" keys>
        {() => <Files />}
      </Region>
    </div>
  )
}

/** Settings of a drawing among its acts: switches, and one choice of a unit in a group. */
const CANVAS_ITEMS: DropdownMenuItem[] = [
  // With their keys, as the acts on a file have theirs: the menu teaches the shortcut.
  { id: 'zoom-in', label: 'Inzoomen', shortcut: 'canvas.zoomIn' },
  { id: 'zoom-out', label: 'Uitzoomen', shortcut: 'canvas.zoomOut' },
  { id: 'fit', label: 'Passend in venster', shortcut: 'canvas.fit' },
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
    <Region subject="de tekening">
      {(hint) => (
        <ContextMenu label="Tekening" items={CANVAS_ITEMS}>
          {/* biome-ignore lint/a11y/useSemanticElements: a drawing or a card, not a set of form controls */}
          <div
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the focus target of the context-menu key
            tabIndex={0}
            role="group"
            aria-label="Tekening plattegrond-begane-grond.png"
            aria-describedby={hint}
            aria-keyshortcuts="Shift+F10"
            data-nt-story-region
            // `secondary` while lit, as on a file row: `muted` on the lit plane fell to 4.05:1 in dark.
            className={`relative flex h-32 flex-col items-center justify-center gap-2 rounded-lg bg-plane text-muted shadow-plane data-[state=open]:bg-surface-active data-[state=open]:text-secondary ${FOCUSABLE}`}
          >
            <Icon name="image" size="md" />
            <span className="text-[12px]">plattegrond-begane-grond.png</span>
            <span className="absolute top-2 right-2">
              <DropdownMenu
                trigger={
                  <IconButton icon="more-horizontal" label="Meer" size="sm" variant="secondary" />
                }
                label="Tekening"
                items={CANVAS_ITEMS}
                align="end"
              />
            </span>
          </div>
        </ContextMenu>
      )}
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
    <Region subject="een teamlid">
      {(hint) => (
        <ContextMenu
          label="Acties voor Robin de Vries"
          header={MEMBER}
          density="comfortable"
          items={MEMBER_ACTIONS}
        >
          {/* biome-ignore lint/a11y/useSemanticElements: a drawing or a card, not a set of form controls */}
          <div
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the focus target of the context-menu key
            tabIndex={0}
            role="group"
            aria-label="Robin de Vries, Ontwerper · Studio Noord"
            aria-describedby={hint}
            aria-keyshortcuts="Shift+F10"
            data-nt-story-region
            className={`group flex h-14 items-center gap-3 rounded-lg bg-plane ps-3 pe-3 shadow-plane data-[state=open]:bg-surface-active ${FOCUSABLE}`}
          >
            <Avatar name="Robin de Vries" size="md" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium text-fg">Robin de Vries</span>
              {/* `secondary` while lit: `muted` on the lit card fell to 4.05:1 in dark. */}
              <span className="truncate text-[12px] text-muted group-data-[state=open]:text-secondary">
                Ontwerper · Studio Noord
              </span>
            </div>
            <DropdownMenu
              trigger={
                <IconButton icon="more-horizontal" label="Meer" size="sm" variant="secondary" />
              }
              label="Acties voor Robin de Vries"
              header={MEMBER}
              density="comfortable"
              items={MEMBER_ACTIONS}
              align="end"
            />
          </div>
        </ContextMenu>
      )}
    </Region>
  )
}

/**
 * Off for a moment: a file still being sent has no acts yet, so a right click gives the browser's
 * own menu, and the row says why instead of a menu that refuses everything.
 */
function Disabled() {
  return (
    // The line above says when the acts come, in the one pattern every reason of the family uses
    // ("… kan/kunnen zodra … klaar is"); a sentence like the lines above the other regions.
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="m-0 text-[12px] text-muted">Acties kunnen zodra het uploaden klaar is.</p>
      <ContextMenu label="Acties voor gevelaanzicht-noord.pdf" items={FILE_ACTIONS} disabled>
        {/* `aria-busy` and the progress as a polite live line, in steps of a tenth in a real
            product rather than every tick: a reader hears why a right click does nothing yet, as a
            sighted one reads it at the end of the row. */}
        <div
          aria-busy="true"
          className="flex h-10 items-center gap-2 rounded-lg bg-plane px-3 text-[13px] text-secondary shadow-plane"
        >
          <span className="flex text-muted">
            <Icon name="upload" size="sm" />
          </span>
          <span className="min-w-0 flex-1 truncate">gevelaanzicht-noord.pdf</span>
          <span
            role="status"
            aria-live="polite"
            className="shrink-0 text-[12px] text-muted tabular-nums"
          >
            64% geüpload
          </span>
        </div>
      </ContextMenu>
    </div>
  )
}

export default {
  group: 'overlays',
  title: 'ContextMenu',
  states: {
    Open: Open,
    'Met keuzes': WithChoices,
    'Met een kop': WithAHead,
    Uitgeschakeld: Disabled,
  },
} satisfies Story
