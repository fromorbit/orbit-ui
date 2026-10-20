import { describe, expect, test } from 'vitest'
import { parseShortcut, type ShortcutKey } from './shortcut'

/** A compact picture of the keys, so a whole combination fits on one line of a test. */
function glyphs(keys: readonly ShortcutKey[]): string[] {
  return keys.map((key) => (key.kind === 'icon' ? `icon:${key.icon}` : `text:${key.text}`))
}

/** The names a screen reader is given, before translation: a catalogue key or a literal. */
function names(keys: readonly ShortcutKey[]): string[] {
  return keys.map((key) => ('key' in key.name ? `key:${key.name.key}` : key.name.literal))
}

describe('on macOS', () => {
  test('splits a run of symbols into one key each', () => {
    const keys = parseShortcut('⇧⌘R', 'mac')
    expect(glyphs(keys)).toEqual(['icon:arrow-big-up', 'icon:command', 'text:R'])
    expect(names(keys)).toEqual(['key:shift', 'key:command', 'R'])
  })

  test('reads the plus form with the words of the web', () => {
    expect(glyphs(parseShortcut('Meta+Alt+b', 'mac'))).toEqual([
      'icon:command',
      'icon:option',
      'text:B',
    ])
    expect(glyphs(parseShortcut('Ctrl+Shift+B', 'mac'))).toEqual([
      'icon:chevron-up',
      'icon:arrow-big-up',
      'text:B',
    ])
  })

  test('draws Option and Control as their own glyphs', () => {
    expect(glyphs(parseShortcut('⌃⌥⌘K', 'mac'))).toEqual([
      'icon:chevron-up',
      'icon:option',
      'icon:command',
      'text:K',
    ])
  })

  test('gives Enter, Backspace and the arrows an icon', () => {
    expect(glyphs(parseShortcut('Enter', 'mac'))).toEqual(['icon:corner-down-left'])
    expect(glyphs(parseShortcut('↵', 'mac'))).toEqual(['icon:corner-down-left'])
    expect(glyphs(parseShortcut('⌘⌫', 'mac'))).toEqual(['icon:command', 'icon:delete'])
    expect(glyphs(parseShortcut('Backspace', 'mac'))).toEqual(['icon:delete'])
    expect(glyphs(parseShortcut('ArrowUp', 'mac'))).toEqual(['icon:arrow-up'])
    expect(glyphs(parseShortcut('ArrowDown', 'mac'))).toEqual(['icon:arrow-down'])
    expect(glyphs(parseShortcut('ArrowLeft', 'mac'))).toEqual(['icon:arrow-left'])
    expect(glyphs(parseShortcut('ArrowRight', 'mac'))).toEqual(['icon:arrow-right'])
    expect(names(parseShortcut('⌥Enter', 'mac'))).toEqual(['key:option', 'key:enter'])
  })

  test('spells Escape and the function keys as small capitals', () => {
    const esc = parseShortcut('Escape', 'mac')
    expect(esc).toEqual([{ kind: 'text', text: 'esc', smallCaps: true, name: { key: 'escape' } }])
    expect(parseShortcut('Esc', 'mac')).toEqual(esc)
    expect(parseShortcut('F6', 'mac')).toEqual([
      { kind: 'text', text: 'F6', smallCaps: true, name: { literal: 'F6' } },
    ])
  })

  test('keeps a letter or a digit as text, in capitals', () => {
    expect(parseShortcut('r', 'mac')).toEqual([
      { kind: 'text', text: 'R', smallCaps: false, name: { literal: 'R' } },
    ])
    expect(glyphs(parseShortcut('⌘1', 'mac'))).toEqual(['icon:command', 'text:1'])
  })

  test('names punctuation for a screen reader, and draws it as it is', () => {
    const keys = parseShortcut('⌘,', 'mac')
    expect(glyphs(keys)).toEqual(['icon:command', 'text:,'])
    expect(names(keys)).toEqual(['key:command', 'key:comma'])
    expect(names(parseShortcut('⌘[', 'mac'))).toEqual(['key:command', 'key:bracketLeft'])
  })

  test('takes a plus that is itself the key', () => {
    expect(glyphs(parseShortcut('Ctrl++', 'other'))).toEqual(['text:Ctrl', 'text:+'])
    expect(glyphs(parseShortcut('+', 'mac'))).toEqual(['text:+'])
  })

  test('an empty label has no keys', () => {
    expect(parseShortcut('', 'mac')).toEqual([])
    expect(parseShortcut('  ', 'other')).toEqual([])
  })
})

describe('elsewhere', () => {
  test('writes Ctrl and Alt as words', () => {
    const keys = parseShortcut('Ctrl+Shift+R', 'other')
    expect(glyphs(keys)).toEqual(['text:Ctrl', 'icon:arrow-big-up', 'text:R'])
    expect(names(keys)).toEqual(['key:control', 'key:shift', 'R'])
    expect(glyphs(parseShortcut('Ctrl+Alt+Delete', 'other'))).toEqual([
      'text:Ctrl',
      'text:Alt',
      'text:Del',
    ])
  })

  test('the symbols of macOS become the same words', () => {
    expect(glyphs(parseShortcut('⌃⌥B', 'other'))).toEqual(['text:Ctrl', 'text:Alt', 'text:B'])
  })

  test('a modifier word and a letter are plain text, a legend word is small capitals', () => {
    const [ctrl, key] = parseShortcut('Ctrl+O', 'other')
    expect(ctrl).toMatchObject({ kind: 'text', smallCaps: false, name: { key: 'control' } })
    expect(key).toMatchObject({ kind: 'text', text: 'O', smallCaps: false })
    expect(parseShortcut('Tab', 'other')).toMatchObject([{ text: 'tab', smallCaps: true }])
  })

  test('Meta is the key it says, not Command', () => {
    expect(parseShortcut('Meta+Alt+b', 'other')).toMatchObject([
      { kind: 'text', text: 'Meta', name: { key: 'meta' } },
      { kind: 'text', text: 'Alt', name: { key: 'alt' } },
      { kind: 'text', text: 'B' },
    ])
  })

  test('Enter, Escape and the arrows look the same as on macOS', () => {
    expect(glyphs(parseShortcut('Enter', 'other'))).toEqual(['icon:corner-down-left'])
    expect(glyphs(parseShortcut('Escape', 'other'))).toEqual(['text:esc'])
    expect(glyphs(parseShortcut('Ctrl+ArrowUp', 'other'))).toEqual(['text:Ctrl', 'icon:arrow-up'])
  })

  test('an unknown word stays itself', () => {
    expect(parseShortcut('PageDown', 'other')).toEqual([
      { kind: 'text', text: 'PageDown', smallCaps: true, name: { literal: 'PageDown' } },
    ])
  })
})
