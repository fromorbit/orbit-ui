import { expect, test } from 'vitest'
import { read, sources, stripComments, underSrc } from './guards/source'

/**
 * A colour comes from a token: Tailwind's own palette —
 * `bg-white/4`, `text-white`, `bg-zinc-800` — is a hex value by another name, and bypasses
 * `tokens.css`, where a later theme would have to find it.
 */
const PALETTE_CLASS =
  /\b(?:bg|text|border|fill|stroke|outline|ring|from|via|to|shadow|decoration|divide|caret|placeholder)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)(?:\/\d+)?\b/

test('no component colours itself from the Tailwind palette instead of a token', () => {
  const offenders = sources(/\.tsx?$/)
    .filter((file) => PALETTE_CLASS.test(stripComments(read(file))))
    .map(underSrc)
  expect(offenders).toEqual([])
})
