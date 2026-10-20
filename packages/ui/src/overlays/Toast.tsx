import { Portal as RadixPortal, Toast as RadixToast } from 'radix-ui'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { usePortalContainer } from './portal'

/**
 * At most this many toasts show at once: a stack any deeper reads as a queue, not a
 * notice, and a run that keeps waiting keeps its line in the timeline regardless.
 */
const MAX_VISIBLE_TOASTS = 3

/**
 * How long a toast stands, when its caller says nothing: five seconds, the undo after archiving
 * and settling too.
 *
 * An undo toast that stood longer was still in view on later screens. A toast is a moment, not a
 * place; what has to stay goes in a `Banner` or the timeline.
 */
export const TOAST_DURATION_MS = 5_000

/**
 * How long a toast with something to read stands: a message of an agent, a reason. The one longer
 * duration, so a caller picks between two rather than inventing a third.
 */
export const TOAST_LONG_DURATION_MS = 8_000

interface ToastStackEntry {
  id: string
  /** Puts this toast in its closed state and tells its own caller, exactly as a timeout would. */
  close(): void
}

interface ToastStackContextValue {
  register(entry: ToastStackEntry): void
  unregister(id: string): void
}

const ToastStackContext = createContext<ToastStackContextValue | null>(null)

/**
 * Hosts every `Toast` mounted below it: Radix' `Provider` plus its `Viewport`, portalled into the
 * container of the surrounding screen (`usePortalContainer`, `./portal`) rather than
 * `document.body` — the same reasoning as every other layer in `overlays/`.
 *
 * Also the one place that keeps the stack to `MAX_VISIBLE_TOASTS`: each `Toast` registers itself
 * here for as long as it is open, oldest first, and a registration past the limit closes the
 * oldest one immediately — a caller that pushes faster than the reader can act never buries the
 * screen. The Toast package itself has no such limit.
 *
 * `label` names the region the toasts live in. A screen inside the app has exactly one stand of
 * this layer and leaves it at the name Radix gives it; two stands on one page — the gallery shows
 * four of them side by side — need their own names, or they are landmarks a reader cannot tell
 * apart (axe `landmark-unique`).
 *
 * `aboveFoot` says whether the foot of the chat sidebar stands in the corner the toasts share with
 * it. It does by default; with the sidebar folded, yielded or replaced by the settings there is no
 * foot, and the stand drops back to 16px above the window edge (`data-nt-toast-without-foot`,
 * which `tokens.css` turns into a smaller `--nt-toast-bottom`).
 */
export function ToastProvider({
  children,
  label,
  aboveFoot = true,
}: {
  children: ReactNode
  label?: string
  /** False when the window shows no foot of the chat sidebar for the toasts to clear. */
  aboveFoot?: boolean
}) {
  const container = usePortalContainer()
  // A ref, not state: registering during another toast's mount effect must see every earlier
  // registration immediately, and never re-renders the provider on its own.
  const stackRef = useRef<ToastStackEntry[]>([])

  const register = useCallback((entry: ToastStackEntry) => {
    stackRef.current = [...stackRef.current.filter((existing) => existing.id !== entry.id), entry]
    while (stackRef.current.length > MAX_VISIBLE_TOASTS) {
      const oldest = stackRef.current.shift()
      oldest?.close()
    }
  }, [])

  const unregister = useCallback((id: string) => {
    stackRef.current = stackRef.current.filter((existing) => existing.id !== id)
  }, [])

  return (
    <ToastStackContext.Provider value={{ register, unregister }}>
      <RadixToast.Provider>
        {children}
        <RadixPortal.Root container={container}>
          <RadixToast.Viewport
            // Left out rather than passed as undefined: Radix' own default carries the hotkey.
            {...(label === undefined ? {} : { label })}
            // As wide as the sidebar less its gutters (`--nt-toast-width`): a toast that reached
            // into the conversation covered what was said there. And above the foot
            // of the sidebar (`--nt-toast-bottom`), which it hid while it stood; without
            // that foot the attribute below brings the token back to 16px.
            {...(aboveFoot ? {} : { 'data-nt-toast-without-foot': '' })}
            className="no-drag fixed bottom-(--nt-toast-bottom) left-4 z-(--nt-z-toast) flex w-(--nt-toast-width) flex-col gap-2 outline-none"
          />
        </RadixPortal.Root>
      </RadixToast.Provider>
    </ToastStackContext.Provider>
  )
}

/** The props of `ToastAction`. */
export interface ToastActionProps {
  label: string
  onClick(): void
}

/** The props of `Toast`. */
export interface ToastProps {
  title: string
  description?: string
  action?: ToastActionProps
  /**
   * Milliseconds before it closes itself: {@link TOAST_DURATION_MS} when left out,
   * {@link TOAST_LONG_DURATION_MS} for a toast with something to read. A gallery story passes
   * `Infinity` to stand still.
   */
  duration?: number
  /**
   * Called once, with `false`, however it closed: its own timeout, a swipe, its action, or the
   * stack evicting it. There is no `true` call — mounting it is what shows it.
   */
  onOpenChange(open: boolean): void
}

/**
 * One notification, bottom-left above the foot of the sidebar — the app can put a native view in
 * the right pane, and that sits above everything the renderer draws there, so this layer must
 * never end up under it.
 *
 * Uncontrolled like every other layer that does not need to be driven from outside: a caller shows
 * one by mounting it and finds out it is gone through `onOpenChange(false)`, whether that came from
 * its own timeout, a swipe, its action, or `ToastProvider` evicting it for the stack limit.
 */
export function Toast({
  title,
  description,
  action,
  duration = TOAST_DURATION_MS,
  onOpenChange,
}: ToastProps) {
  const [open, setOpen] = useState(true)
  const id = useId()
  const stack = useContext(ToastStackContext)

  const close = useCallback(() => {
    setOpen(false)
    onOpenChange(false)
  }, [onOpenChange])

  useEffect(() => {
    stack?.register({ id, close })
    return () => stack?.unregister(id)
  }, [stack, id, close])

  return (
    <RadixToast.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      duration={duration}
      className="no-drag nt-fade-in pointer-events-auto flex items-start justify-between gap-3 rounded-lg border border-border bg-overlay p-3 shadow-menu"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <RadixToast.Title className="text-fg">{title}</RadixToast.Title>
        {description === undefined ? null : (
          <RadixToast.Description className="text-[12px] text-muted">
            {description}
          </RadixToast.Description>
        )}
      </div>
      {action === undefined ? null : (
        <RadixToast.Action asChild altText={action.label}>
          <button
            type="button"
            onClick={action.onClick}
            className="no-drag shrink-0 text-[12px] font-medium text-accent-text outline-focus focus-visible:outline-2 focus-visible:outline-offset-2 hover:underline"
          >
            {action.label}
          </button>
        </RadixToast.Action>
      )}
    </RadixToast.Root>
  )
}
