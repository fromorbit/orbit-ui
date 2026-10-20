import { describe, expect, test, vi } from 'vitest'
import { collectStories, stateId, storyId } from './story'

describe('storyId', () => {
  test('group and title become a kebab-case id', () => {
    expect(storyId({ group: 'primitives', title: 'Button' })).toBe('primitives-button')
    expect(storyId({ group: 'patterns', title: 'Empty State' })).toBe('patterns-empty-state')
  })
})

describe('collectStories', () => {
  test('sorts titles by English collation, whatever the locale of the machine', () => {
    // In Swedish `Ä` sorts after `Z`: a gallery built on such a machine would shift every
    // reference image after it. English collation keeps one order everywhere.
    const compare = vi.spyOn(String.prototype, 'localeCompare')
    try {
      const stories = collectStories([
        { group: 'primitives', title: 'Zebra', states: {} },
        { group: 'primitives', title: 'Äpple', states: {} },
        { group: 'primitives', title: 'Apple', states: {} },
      ])
      expect(stories.map((story) => story.title)).toEqual(['Apple', 'Äpple', 'Zebra'])
      expect(compare.mock.calls.length).toBeGreaterThan(0)
      expect(compare.mock.calls.map((call) => call[1])).toEqual(compare.mock.calls.map(() => 'en'))
    } finally {
      compare.mockRestore()
    }
  })

  test('sorts by group (primitives, overlays, patterns) and then by title', () => {
    const modules = {
      './c.gallery.tsx': { default: { group: 'patterns', title: 'Empty State', states: {} } },
      './a.gallery.tsx': { default: { group: 'primitives', title: 'Switch', states: {} } },
      './b.gallery.tsx': { default: { group: 'overlays', title: 'Dialog', states: {} } },
      './d.gallery.tsx': { default: { group: 'primitives', title: 'Button', states: {} } },
    } as const
    expect(collectStories(modules).map((story) => `${story.group}-${story.title}`)).toEqual([
      'primitives-Button',
      'primitives-Switch',
      'overlays-Dialog',
      'patterns-Empty State',
    ])
  })

  test('a story of a feature sorts after the shared groups', () => {
    // The first story outside `shared/ui` Last in line, so the order of every
    // existing story — and with it every reference image — stays where it was.
    const modules = {
      './e.gallery.tsx': { default: { group: 'features', title: 'Workspace line', states: {} } },
      './c.gallery.tsx': { default: { group: 'patterns', title: 'Empty State', states: {} } },
      './a.gallery.tsx': { default: { group: 'primitives', title: 'Switch', states: {} } },
      './b.gallery.tsx': { default: { group: 'overlays', title: 'Dialog', states: {} } },
    } as const
    expect(collectStories(modules).map((story) => storyId(story))).toEqual([
      'primitives-switch',
      'overlays-dialog',
      'patterns-empty-state',
      'features-workspace-line',
    ])
  })

  test('takes a plain list of stories as well as glob modules', () => {
    const list = [
      { group: 'patterns', title: 'Empty State', states: {} },
      { group: 'primitives', title: 'Switch', states: {} },
    ] as const
    expect(collectStories(list).map((story) => storyId(story))).toEqual([
      'primitives-switch',
      'patterns-empty-state',
    ])
  })

  test('throws an English error for two stories with the same id', () => {
    const modules = {
      './a.gallery.tsx': { default: { group: 'primitives', title: 'Button', states: {} } },
      './b.gallery.tsx': { default: { group: 'primitives', title: 'Button', states: {} } },
    } as const
    expect(() => collectStories(modules)).toThrow(
      'Two stories share the same id: primitives-button',
    )
  })
})

describe('stateId', () => {
  test('turns a caption into a name that fits a file name and a selector', () => {
    expect(stateId('Sizes')).toBe('sizes')
    expect(stateId('With a unit')).toBe('with-a-unit')
    expect(stateId('Loading (equal width)')).toBe('loading-equal-width')
  })
})
