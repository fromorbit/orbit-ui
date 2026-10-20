/**
 * A rectangle in CSS pixels of the page, relative to the top left of the window's content.
 *
 * The library's own copy of the shape the host speaks, so it names no type of Orbit's bridge; any
 * host type with these four numbers is assignable to it.
 */
export interface SurfaceRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Everything the host needs to know to place the views it lays over the page: the whole state,
 * never a change, so a lost or reordered message cannot leave it with half a picture.
 */
export interface SurfaceReport {
  /** Rises with every report; the host ignores one that is not newer than the last it applied. */
  seq: number
  /** Every surface on the page; `rect: null` is a surface that is not visible right now. */
  surfaces: { id: string; rect: SurfaceRect | null }[]
  /** The rectangles of the open layers (menus, dialogs, toasts), passive ones left out. */
  occluders: SurfaceRect[]
  /** An edge is being dragged: every visible surface freezes until it lets go. */
  dragging: boolean
}

/**
 * A key a hosted view handed back to the page. `HostedSurface` re-dispatches it as a `keydown`,
 * so the handlers that already listen on `window` answer it without knowing where it was pressed.
 */
export interface SurfaceKey {
  key: string
  code: string
  meta: boolean
  control: boolean
  alt: boolean
  shift: boolean
}

/** What the host tells the page about a hosted view. */
export type SurfaceEvent =
  /**
   * The view is about to hide under a layer: draw `image` (a data URL) in its place and confirm
   * with `drawn(id, seq)`; the host hides the view only then.
   */
  | { type: 'frozen'; id: string; seq: number; image: string }
  /** The view is visible again; the image can go. */
  | { type: 'thawed'; id: string }
  /** The view gained or lost the keyboard focus. */
  | { type: 'focus'; id: string; focused: boolean }
  /** A shortcut of the page, pressed while the view had the focus. */
  | { type: 'shortcut'; id: string; key: SurfaceKey }

/**
 * The channel of a host that lays native views over the page (Orbit's `WebContentsView`s): where
 * each `HostedSurface` stands, what lies above it, and the host's answers. Nothing about what a
 * view shows.
 *
 * The shape of Orbit's `window.nt.surfaces`, so its bridge hands it over as it is. Members as
 * properties rather than methods: a method parameter is checked bivariantly, so a host whose
 * `report` took a narrower report would still pass; a property is checked strictly.
 */
export interface HostSurfaces {
  /** The whole geometry of the page; the host ignores one older than the last it applied. */
  report: (report: SurfaceReport) => void
  /** Moves the keyboard focus into the view of `id`, if it is live. */
  focus: (id: string) => void
  /** Confirms that the image of the freeze `seq` is drawn. */
  drawn: (id: string, seq: number) => void
  /** Listens to the host: `frozen`, `thawed`, `focus`, `shortcut`. Returns the unsubscribe. */
  onEvent: (listener: (event: SurfaceEvent) => void) => () => void
}

/**
 * What the library asks of the window it is hosted in, beyond drawing.
 *
 * Only what a component cannot do itself: `HostedSurface` reports where it stands. Opening a file
 * or a link is no member: `FileLink` and `GitHubLink` hand that to their caller through `onOpen`,
 * which knows the host already.
 */
export interface HostPort {
  /**
   * The host's channel for hosted views; without it a `HostedSurface` reports nothing and shows
   * only its empty box (a browser page, a test without a host).
   */
  readonly surfaces?: HostSurfaces
}
