/**
 * The Orbit symbol: the orbit with the orange satellite, the "o" of the wordmark standing alone.
 *
 * The geometry of the brand assets (v1.0, `orbit/symbool/orbit-symbool-currentcolor.svg`; the same
 * numbers as the "o" of `OrbitWordmark`): one arc of radius 34 on a grid of 120, stroke 10 with round
 * ends, and the satellite of radius 8.5 in its opening. For a place where the name stands in words
 * beside it and the wordmark would repeat it, such as the button "Inloggen met Orbit" next to
 * GitHub's mark. The line follows the text (`currentColor`), the satellite stays brand orange in
 * both themes (`--nt-brand-orbit`). Square: size it with `size-*`. Decorative (`aria-hidden`).
 */
export function OrbitSymbol({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="17 17 86 86"
      aria-hidden="true"
      focusable="false"
      data-nt-orbit-symbol
      className={className}
    >
      <path
        d="M93.38 53.51A34 34 0 1 1 66.49 26.63"
        stroke="currentColor"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* A style, not the fill attribute: a presentation attribute does not resolve var(). */}
      <circle
        data-nt-orbit-dot
        cx="84.04"
        cy="35.96"
        r="8.5"
        style={{ fill: 'var(--nt-brand-orbit)' }}
      />
    </svg>
  )
}
