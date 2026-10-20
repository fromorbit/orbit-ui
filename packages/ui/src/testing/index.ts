import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { UiProvider, type UiProviderProps } from '../provider/UiProvider'

export {
  createFakeHost,
  type FakeHost,
  type FakeHostSurfaces,
  type FakeSurfaceMessage,
} from './fake-host'
export { HEADING_START_CASES, type HeadingStartCase } from './heading-start-cases'
export { fakeShortcuts, uiWrapper } from './ui-wrapper'

/**
 * The ports a {@link renderWithUi} hands its `UiProvider`; each left out keeps the provider's
 * neutral default.
 */
export type UiPortProps = Omit<UiProviderProps, 'children'>

/** The options of Testing Library's `render`, plus the ports of the `UiProvider` around it. */
export interface RenderWithUiOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * What the provider is given. Left out, it gets none: no shortcut labels and no
   * `aria-keyshortcuts`, the Mac platform, the document's theme — as the library behaves in a host
   * that wires nothing in. Pass `{ shortcuts: fakeShortcuts() }` for keys from a made-up catalogue.
   */
  ports?: UiPortProps
}

/**
 * Renders `ui` inside a `UiProvider`, for the tests of a host that uses the library: the
 * `./testing` export of `@fromorbit/ui`.
 *
 * Neutral by default rather than with {@link fakeShortcuts}, unlike {@link uiWrapper}: a host's test
 * should see what its own ports give, and an unnamed port should show the library's own default,
 * not keys of a catalogue the host never had.
 *
 * Deliberately not exported here: the Dutch words of the library's own stories and tests (a
 * gallery fixture, public as `galleryLabels` of `./gallery`; a host has its own catalogue).
 * `HEADING_START_CASES`, the table of `Prose`'s own test, is exported beside it, so a host's test
 * keeps it equal to its own protocol's copy.
 *
 * @example
 * renderWithUi(<Button shortcut="chat.send">Verstuur</Button>, {
 *   ports: { shortcuts: myShortcuts, platform: 'windows' },
 * })
 */
export function renderWithUi(ui: ReactElement, options: RenderWithUiOptions = {}): RenderResult {
  const { ports = {}, ...rest } = options
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(UiProvider, { ...ports, children })
  return render(ui, { ...rest, wrapper })
}
