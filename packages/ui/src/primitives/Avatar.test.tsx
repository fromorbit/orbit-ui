import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Avatar, avatarTone, initialsOf } from './Avatar'

describe('initialsOf', () => {
  test('takes the first letters of the first and the last word, in capitals', () => {
    expect(initialsOf('Noor Bakker')).toBe('NB')
    expect(initialsOf('noor van der bakker')).toBe('NB')
    expect(initialsOf('  Noor  ')).toBe('N')
  })

  test('keeps a sign that starts with an emoji whole', () => {
    expect(initialsOf('🚀 Raket')).toBe('🚀R')
  })
})

describe('avatarTone', () => {
  test('is the same for the same name and stays in the six tones', () => {
    expect(avatarTone('Noor Bakker')).toBe(avatarTone('Noor Bakker'))
    const tones = ['Noor Bakker', 'Sem de Vries', 'Lotte Jansen', 'Daan Smit', 'Fenna Mulder'].map(
      avatarTone,
    )
    for (const tone of tones) expect(tone).toBeGreaterThanOrEqual(1)
    for (const tone of tones) expect(tone).toBeLessThanOrEqual(6)
    // Not one colour for everyone.
    expect(new Set(tones).size).toBeGreaterThan(1)
  })
})

describe('Avatar', () => {
  test('draws the initials in a round of its tone, decorative', () => {
    const { container } = render(<Avatar name="Noor Bakker" size="sm" />)
    const avatar = container.querySelector('[data-nt-avatar]')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar?.textContent).toBe('NB')
    expect(avatar?.className).toContain('rounded-full')
    expect(avatar?.className.split(' ')).toContain(
      ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5', 'bg-avatar-6'][
        avatarTone('Noor Bakker') - 1
      ],
    )
    expect(avatar).toHaveAttribute('data-size', 'sm')
  })

  test('without a name a neutral glyph on a quiet plane, no colour', () => {
    const { container } = render(<Avatar name={null} size="lg" />)
    const avatar = container.querySelector('[data-nt-avatar]')
    expect(avatar?.querySelector('svg')).not.toBeNull()
    expect(avatar?.className).toContain('bg-mark')
    expect(avatar?.className).not.toMatch(/bg-avatar-/)
  })

  test('the middle size is a round of 30px, for the head of the account menu', () => {
    const { container } = render(<Avatar name="Robin de Vries" size="md" />)
    const avatar = container.querySelector('[data-nt-avatar]')
    expect(avatar).toHaveAttribute('data-size', 'md')
    expect(avatar?.className.split(' ')).toContain('size-7.5')
    expect(avatar?.textContent).toBe('RV')
  })
})
