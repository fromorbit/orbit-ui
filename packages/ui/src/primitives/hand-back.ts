/**
 * Whether the focus already stands on something other than the body.
 *
 * The one question every closing layer asks before it hands the focus back. Radix returns the
 * focus a task after a layer closed (`FocusScope`, a `setTimeout(0)`), and under load that task
 * runs late: after a row of the layer opened something whose field took the focus, or after the
 * reader opened the layer again. A focused element that is removed leaves the focus on the body,
 * so "still on the body" means the focus went down with the layer and needs rescuing; anything else
 * was put there on purpose since, and a hand-back would only take it away.
 */
export function focusHeldElsewhere(): boolean {
  const active = document.activeElement
  return active !== null && active !== document.body
}

/**
 * An `onCloseAutoFocus` that lets Radix hand the focus back only when it went down with the layer.
 *
 * For a layer whose own hand-back (to its trigger) is right; a layer that returns the focus to a
 * place of its own asks {@link focusHeldElsewhere} first and then moves it itself.
 */
export function handBackOnlyLostFocus(event: Event): void {
  if (focusHeldElsewhere()) event.preventDefault()
}
