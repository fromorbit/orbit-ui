import type { HostPort, HostSurfaces, SurfaceEvent, SurfaceReport } from '../provider/host'

/** One thing the page told a {@link FakeHostSurfaces}, in the order it was said. */
export type FakeSurfaceMessage =
  | { kind: 'report'; report: SurfaceReport }
  | { kind: 'focus'; id: string }
  | { kind: 'drawn'; id: string; seq: number }

/** The `surfaces` of a fake host: what the page told it, and a way to answer as the host. */
export interface FakeHostSurfaces extends HostSurfaces {
  /** Every report, in order. */
  readonly reports: SurfaceReport[]
  /** Every message to the host — reports, focus requests, confirmations — in order. */
  readonly messages: FakeSurfaceMessage[]
  /** Delivers an event of the host to every listener. */
  emit(event: SurfaceEvent): void
}

/** A {@link HostPort} for the library's tests and stories, with its `surfaces` to steer. */
export interface FakeHost extends HostPort {
  readonly surfaces: FakeHostSurfaces
}

/**
 * A host that records what the page says and never answers by itself: a test plays the host with
 * `surfaces.emit`. Hand it to a `UiProvider` (or `uiWrapper({ host })`).
 */
export function createFakeHost(): FakeHost {
  const listeners = new Set<(event: SurfaceEvent) => void>()
  const reports: SurfaceReport[] = []
  const messages: FakeSurfaceMessage[] = []
  return {
    surfaces: {
      reports,
      messages,
      report(report) {
        reports.push(report)
        messages.push({ kind: 'report', report })
      },
      focus: (id) => messages.push({ kind: 'focus', id }),
      drawn: (id, seq) => messages.push({ kind: 'drawn', id, seq }),
      onEvent(listener) {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
      emit(event) {
        for (const listener of [...listeners]) listener(event)
      },
    },
  }
}
