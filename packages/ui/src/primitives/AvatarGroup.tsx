import { Avatar } from './Avatar'

/** The plane the group stands on: the ring around each face takes its colour, so faces part. */
export type AvatarGroupOn = 'canvas' | 'surface' | 'overlay'

// Written out per value: Tailwind finds a class only as a literal in the source.
const RING: Record<AvatarGroupOn, string> = {
  canvas: 'ring-2 ring-canvas',
  surface: 'ring-2 ring-surface',
  overlay: 'ring-2 ring-overlay',
}

/** The props of `AvatarGroup`. */
export interface AvatarGroupProps {
  /** The display names of the people, in the order they are shown. */
  names: readonly string[]
  /** The name of the group, which is all a screen reader hears: "6 leden: Noor, Sem en 4 anderen". */
  label: string
  /** How many faces stand before the "+n"; default 4. */
  max?: number
  size?: 'sm' | 'md'
  /** The plane behind the group; `canvas` by default. */
  on?: AvatarGroupOn
}

/**
 * A row of overlapping faces with "+3" for the rest: who is in a team, who works on a task.
 *
 * One image to a screen reader (`role="img"` with `label`), since a list of initials says nothing
 * that the label does not say better. Each face gets a ring in the colour of the plane behind it,
 * so the overlap reads as faces in a row rather than a smudge. The faces are `Avatar`s, with the
 * tone that belongs to each name.
 */
export function AvatarGroup({
  names,
  label,
  max = 4,
  size = 'md',
  on = 'canvas',
}: AvatarGroupProps) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  const ring = RING[on]
  return (
    <span
      role="img"
      aria-label={label}
      data-nt-avatar-group
      className={`inline-flex items-center ${size === 'sm' ? '-space-x-1.5' : '-space-x-2'}`}
    >
      {shown.map((name, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: two people may share a name; their place tells them apart.
        <span key={`${name}-${index}`} className={`flex rounded-full ${ring}`}>
          <Avatar name={name} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span
          aria-hidden="true"
          className={`flex items-center justify-center rounded-full bg-mark font-medium text-secondary tabular-nums ${ring} ${size === 'sm' ? 'size-5 text-[11px]' : 'size-7.5 text-[11px]'}`}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  )
}
