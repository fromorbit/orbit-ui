import type { Brand } from '../types'
import { Icon } from './Icon'

/**
 * How one mark is drawn: a filled path (`d`, with `evenodd` where it has holes), a stroked path
 * (`stroke`), or a capital in a rounded frame (`letter`) for a maker whose own mark cannot be
 * drawn simply enough to stay recognisable at 14px.
 */
type Drawing =
  | { viewBox: string; d: string; evenOdd?: true }
  | { viewBox: string; stroke: string }
  | { letter: string }

/**
 * The drawings per brand, in `currentColor`.
 *
 * Monochrome on purpose:
 * the mark takes the tone of the text beside it, like every other glyph of the interface, so it
 * never becomes the one spot of vendor colour in a quiet toolbar. No downloaded logo files: a simple
 * sign of our own per maker.
 *
 * - `anthropic`: the Claude symbol as Wikimedia Commons publishes it (`Claude_AI_symbol.svg`).
 * - `openai`: the OpenAI "Blossom", from OpenAI's own logo pack; the view box is cropped to the
 *   mark itself, since the original leaves a wide margin around it that would make it read smaller
 *   than the other mark at the same box.
 * - `github`: the Invertocat of GitHub's own Octicons (`mark-github`, 16px): Copilot's maker, and
 *   the mark a chip of a pull request or issue carries, as in the terminal of Claude Code.
 * - `google`: the four-pointed spark of Gemini. `cursor`: a cube seen from its corner. `jetbrains`:
 *   the square with its bar. `kiro`: the ghost. `moonshot`: a crescent moon. `mistral`: the M of
 *   blocks.
 * - The rest is a letter mark: `block` B, `qwen` Q, `factory` F, `cline` C, `augment` A, `kilo` K,
 *   `cognition` D (for Devin; a robot's face for Cline read as the neutral glyph of an agent
 *   without a brand).
 */
const MARKS = {
  anthropic: {
    viewBox: '0 0 100 100',
    d: 'm19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z',
  },
  openai: {
    viewBox: '183 183 350 350',
    d: 'M508.749 317.399C516.777 287.314 508.991 253.884 485.389 230.282C461.788 206.681 428.36 198.895 398.273 206.923C376.231 184.928 343.39 174.956 311.148 183.596C278.906 192.234 255.45 217.292 247.36 247.361C217.291 255.451 192.233 278.91 183.595 311.149C174.957 343.391 184.927 376.232 206.924 398.274C198.896 428.359 206.683 461.789 230.284 485.391C253.885 508.992 287.313 516.779 317.401 508.75C339.442 530.745 372.286 540.717 404.525 532.079C436.767 523.441 460.223 498.384 468.313 468.315C498.383 460.224 523.44 436.766 532.078 404.526C540.716 372.285 530.747 339.443 508.749 317.402V317.399ZM470.899 244.776C486.892 260.77 493.488 282.601 490.687 303.412L415.577 260.046C412.411 258.218 408.509 258.218 405.345 260.046L317.401 310.82V277.526C317.401 275.191 318.652 273.005 320.676 271.837L387.644 233.174C414.178 218.353 448.346 222.223 470.901 244.776H470.899ZM357.837 311.144L398.275 334.491V381.185L357.837 404.532L317.398 381.185V334.491L357.837 311.144ZM264.776 269.693C265.207 239.305 285.644 211.649 316.453 203.393C338.3 197.54 360.505 202.744 377.127 215.573L302.014 258.937C298.848 260.764 296.898 264.144 296.898 267.798V369.346L268.065 352.699C266.043 351.531 264.776 349.353 264.776 347.017V269.691V269.693ZM203.391 316.454C209.244 294.608 224.854 277.978 244.276 269.999V356.73C244.276 360.384 246.226 363.763 249.392 365.591L337.337 416.365L308.503 433.013C306.481 434.181 303.961 434.188 301.939 433.02L234.971 394.357C208.868 378.789 195.138 347.261 203.391 316.454ZM244.775 470.9C228.781 454.906 222.186 433.075 224.986 412.264L300.096 455.63C303.263 457.457 307.164 457.457 310.328 455.63L398.273 404.856V438.149C398.273 440.485 397.022 442.671 394.997 443.839L328.029 482.502C301.495 497.322 267.327 493.452 244.772 470.9H244.775ZM450.897 445.982C450.466 476.371 430.029 504.027 399.22 512.283C377.373 518.136 355.168 512.932 338.547 500.102L413.659 456.738C416.826 454.911 418.775 451.532 418.775 447.877V346.329L447.609 362.977C449.631 364.145 450.897 366.323 450.897 368.659V445.985V445.982ZM512.282 399.221C506.429 421.068 490.819 437.697 471.397 445.676V358.946C471.397 355.292 469.448 351.912 466.281 350.085L378.336 299.311L407.17 282.663C409.192 281.495 411.712 281.487 413.734 282.655L480.702 321.318C506.805 336.887 520.536 368.415 512.282 399.221Z',
  },
  github: {
    viewBox: '0 0 16 16',
    d: 'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z',
  },
  google: {
    viewBox: '0 0 24 24',
    d: 'M12 0C12 6.63 17.37 12 24 12 17.37 12 12 17.37 12 24 12 17.37 6.63 12 0 12 6.63 12 12 6.63 12 0Z',
  },
  cursor: {
    viewBox: '0 0 24 24',
    stroke: 'M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5ZM12 12l8.5-4.75M12 12v9.5M12 12 3.5 7.25',
  },
  jetbrains: {
    viewBox: '0 0 24 24',
    d: 'M2 2h20v20H2ZM5 16.5h8V19H5Z',
    evenOdd: true,
  },
  kiro: {
    viewBox: '0 0 24 24',
    d: 'M12 1.5a8.5 8.5 0 0 0-8.5 8.5v12l2.85-2 2.85 2L12 20l2.8 2 2.85-2 2.85 2V10A8.5 8.5 0 0 0 12 1.5ZM9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
    evenOdd: true,
  },
  moonshot: {
    viewBox: '0 0 24 24',
    d: 'M14.5 1.5A10.5 10.5 0 1 0 22.5 18 8.5 8.5 0 0 1 14.5 1.5Z',
  },
  mistral: {
    viewBox: '0 0 24 24',
    d: 'M2 2h4v4H2Zm16 0h4v4h-4ZM2 6h4v4H2Zm4 0h4v4H6Zm8 0h4v4h-4Zm4 0h4v4h-4ZM2 10h20v4H2Zm0 4h4v4H2Zm8 0h4v4h-4Zm8 0h4v4h-4ZM0 18h8v4H0Zm16 0h8v4h-8Z',
  },
  block: { letter: 'B' },
  qwen: { letter: 'Q' },
  factory: { letter: 'F' },
  cline: { letter: 'C' },
  augment: { letter: 'A' },
  kilo: { letter: 'K' },
  // Cognition's one agent is Devin, and C is Cline's already.
  cognition: { letter: 'D' },
} as const satisfies Record<Mark, Drawing>

/**
 * What `BrandIcon` can draw: the maker of an agent (`Brand`, from the provider). GitHub is one of
 * them, and also the mark of a reference to one of its pull requests or issues.
 */
export type Mark = Brand

/** The box per size, written out so Tailwind finds each class (see `Icon`'s `boxes`). */
const boxes = {
  sm: 'size-(--nt-icon-sm) shrink-0',
  md: 'size-(--nt-icon-md) shrink-0',
} satisfies Record<string, string>

/** The props of `BrandIcon`. */
export interface BrandIconProps {
  /**
   * The maker the provider reported (`ProviderSummary.brand`), or `github` for a reference to a
   * pull request; `undefined` gets the neutral glyph.
   */
  brand: Mark | undefined
  /** Matches the control it sits in; `sm` (14px) beside 12–13px text. */
  size?: keyof typeof boxes
  /**
   * The agent's name, where the mark stands in for it — the model pill shows the mark and not the
   * name. Given, the mark is an image with this name; left out, it
   * is decorative, like every `Icon`, and the name stands in words somewhere else.
   */
  label?: string
}

/**
 * The mark of an agent's maker: the only place the renderer draws a logo, and only from a word the
 * provider reported about itself (`ProviderSummary.brand`) — never from its id or name, which the
 * renderer may not read: what a provider can do or show comes from what it reports, never from
 * knowing who it is. A provider without a brand gets the neutral `bot`
 * glyph, so every agent has a mark and the rows of a menu stay aligned. The one mark that is no
 * maker of an agent is GitHub's, on the chip of a pull request or issue in an answer.
 *
 * A sibling of `Icon` rather than an entry in its registry: these are filled drawings of our own,
 * not lucide's stroked glyphs, and they need no `strokeWidth`.
 */
export function BrandIcon({ brand, size = 'sm', label }: BrandIconProps) {
  const named = label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label }
  if (brand === undefined) {
    return (
      <span
        data-nt-brand="none"
        {...named}
        className={`${boxes[size]} inline-flex items-center justify-center`}
      >
        <Icon name="bot" size={size} />
      </span>
    )
  }
  const mark: Drawing = MARKS[brand]
  const svg = {
    'data-nt-brand': brand,
    ...named,
    xmlns: 'http://www.w3.org/2000/svg',
    className: boxes[size],
  }
  if ('letter' in mark) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative (`aria-hidden`) without a label, and with one an image named by `aria-label`; both arrive through `svg`, which the rule cannot see.
      <svg {...svg} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
        <text
          x="8"
          y="8"
          dy="0.35em"
          textAnchor="middle"
          fill="currentColor"
          fontSize="9"
          fontWeight="700"
          fontFamily="inherit"
        >
          {mark.letter}
        </text>
      </svg>
    )
  }
  if ('stroke' in mark) {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative (`aria-hidden`) without a label, and with one an image named by `aria-label`; both arrive through `svg`, which the rule cannot see.
      <svg
        {...svg}
        viewBox={mark.viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d={mark.stroke} />
      </svg>
    )
  }
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative (`aria-hidden`) without a label, and with one an image named by `aria-label`; both arrive through `svg`, which the rule cannot see.
    <svg {...svg} viewBox={mark.viewBox} fill="currentColor">
      <path d={mark.d} {...(mark.evenOdd ? { fillRule: 'evenodd' as const } : {})} />
    </svg>
  )
}
