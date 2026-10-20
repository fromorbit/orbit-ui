import { describe, expect, test } from 'vitest'
import { ALERT_KINDS, alertOf, rehypeAlerts } from '../src/alerts'

describe('alertOf', () => {
  test('knows the five kinds of GitHub, in any case', () => {
    expect(ALERT_KINDS).toEqual(['note', 'tip', 'important', 'warning', 'caution'])
    for (const kind of ALERT_KINDS) {
      expect(alertOf(`[!${kind.toUpperCase()}]\nx`)?.kind).toBe(kind)
      expect(alertOf(`[!${kind}]`)?.kind).toBe(kind)
    }
  })

  test('returns the text that follows the marker', () => {
    expect(alertOf('[!NOTE]\nBody')?.rest).toBe('Body')
    expect(alertOf('[!NOTE]  \r\nBody')?.rest).toBe('Body')
    expect(alertOf('[!NOTE]')?.rest).toBe('')
  })

  test('a marker must stand alone on the first line', () => {
    expect(alertOf('[!NOTE] same line')).toBeUndefined()
    expect(alertOf('[!INFO]\nx')).toBeUndefined()
    expect(alertOf('text [!NOTE]\nx')).toBeUndefined()
    expect(alertOf('')).toBeUndefined()
  })
})

describe('rehypeAlerts', () => {
  const quote = (text: string) => ({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'blockquote',
        properties: {},
        children: [
          { type: 'text', value: '\n' },
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: [{ type: 'text', value: text }],
          },
        ],
      },
    ],
  })

  test('marks the blockquote and strips the marker', () => {
    const tree = quote('[!TIP]\nHandig')
    rehypeAlerts()(tree)
    const block = tree.children[0] as { properties: Record<string, unknown>; children: unknown[] }
    expect(block.properties.dataAlert).toBe('tip')
    expect(JSON.stringify(block.children)).toContain('Handig')
    expect(JSON.stringify(block.children)).not.toContain('[!TIP]')
  })

  test('drops a paragraph that held only the marker', () => {
    const tree = quote('[!NOTE]')
    rehypeAlerts()(tree)
    const block = tree.children[0] as { children: { tagName?: string }[] }
    expect(block.children.some((child) => child.tagName === 'p')).toBe(false)
  })

  test('leaves an ordinary quote alone', () => {
    const tree = quote('Gewoon')
    rehypeAlerts()(tree)
    expect((tree.children[0] as { properties: object }).properties).toEqual({})
  })
})
