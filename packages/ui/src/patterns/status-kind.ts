/**
 * The life of a run as the user sees it.
 *
 * Lives here rather than with the chats that first needed it: every list in the app speaks the
 * same seven states, and a feature that has a status maps its own vocabulary onto them. These are
 * the states the protocol knows today; a ticket vocabulary ("draft", "cancelled") is mapped onto
 * them by its feature (`stateKind` of Flow). `StatusShape` draws every one of them; the older
 * drawing of `StatusIcon` is gone, the type stayed.
 */
export type RunStatusKind =
  | 'queued'
  | 'running'
  | 'attention'
  | 'done'
  | 'interrupted'
  | 'closed'
  | 'failed'
