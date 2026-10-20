import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

/** The stylesheet the app and the website share, as text: happy-dom lays nothing out. */
const css = readFileSync(join(__dirname, '..', 'src', 'doc-view.css'), 'utf8')

/** The declarations of the rule written as `selector {`. */
function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

test('a cell of a table keeps a width of its own, so a narrow column scrolls instead of breaking per word', () => {
  // A table squeezed to the width of the text broke every word of a narrow column
  // onto a line of its own; the group around it already scrolls sideways (`nt-doc-scrolls`).
  expect(rule('.nt-doc-th,\n.nt-doc-td')).toMatch(/min-width:\s*\d/)
  expect(rule('.nt-doc-table')).toMatch(/min-width:\s*100%/)
  expect(rule('.nt-doc-table')).not.toMatch(/(?:^|[;\s])width:\s*100%/)
})
