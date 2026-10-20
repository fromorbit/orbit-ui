/**
 * Remembers what a pure renderer made of the last `limit` texts, used longest ago forgotten first.
 *
 * For the finished answers of a conversation: opening a chat draws every answer in it, and parsing
 * markdown was the largest single cost of that, measured. What a
 * finished answer renders to never changes, and a React element can be mounted again as it is, so
 * a chat opened a second time skips the parse — and React skips the subtree, since the element is
 * the same object. A streaming answer stays out: every delta is a new text that would push a
 * finished one out.
 *
 * @param render pure: the same text always gives an equivalent result.
 */
export function createMarkdownCache<T>(
  render: (text: string) => T,
  limit: number,
): (text: string) => T {
  const kept = new Map<string, T>()
  return (text) => {
    const hit = kept.get(text)
    if (hit !== undefined) {
      // Taken out and put back: a Map keeps its order of insertion, so the end is "used last".
      kept.delete(text)
      kept.set(text, hit)
      return hit
    }
    const made = render(text)
    kept.set(text, made)
    if (kept.size > limit) {
      const oldest = kept.keys().next().value
      if (oldest !== undefined) kept.delete(oldest)
    }
    return made
  }
}
