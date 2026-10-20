/**
 * The Orbit wordmark: "orbit" in the brand's line, with the orange dot in the "o".
 *
 * Copied path for path from the brand assets (`orbit/woordmerk/orbit-woordmerk-currentcolor.svg`,
 * v1.0), never retyped in the Orbit Line font: the symbol inside the "o" exists only in the logo
 * files. The line follows the colour of the text around it (`currentColor`), so it reads in the
 * light and the dark theme alike; the dot stays brand orange in both (`--nt-brand-orbit`).
 * Decorative (`aria-hidden`): whoever needs the name gets it from the window title or a label.
 */
export function OrbitWordmark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="15 15 264 90"
      aria-hidden="true"
      focusable="false"
      data-nt-orbit-wordmark
      className={className}
      // The ratio of the viewBox: with only a height set, the box is as wide as the drawing, not
      // the 300px an <svg> falls back to (with the mark centred inside it).
      style={{ aspectRatio: '264 / 90' }}
    >
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M93.38 53.51A34 34 0 1 1 66.49 26.63" />
        <g transform="translate(-6 0)">
          <path d="M118 92V66A16 16 0 0 1 134 50H139" />
          <path d="M163 28V92" />
          <circle cx="184" cy="71" r="21" />
          <path d="M229 50V92" />
          <path d="M260 34V80A12 12 0 0 0 272 92H274M248 50H272" />
        </g>
      </g>
      {/* A style, not the fill attribute: a presentation attribute does not resolve var(). */}
      <circle
        data-nt-orbit-dot
        cx="84.04"
        cy="35.96"
        r="8.5"
        style={{ fill: 'var(--nt-brand-orbit)' }}
      />
      <circle cx="223" cy="31" r="6.5" fill="currentColor" />
    </svg>
  )
}
