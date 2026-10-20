import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { BRANDS } from '../types'
import { BrandIcon } from './BrandIcon'

describe('BrandIcon', () => {
  test('draws a mark of its own per brand, in the colour of the text around it', () => {
    const { container: anthropic } = render(<BrandIcon brand="anthropic" />)
    const { container: openai } = render(<BrandIcon brand="openai" />)
    const one = anthropic.querySelector('[data-nt-brand="anthropic"] path')
    const two = openai.querySelector('[data-nt-brand="openai"] path')
    expect(one).not.toBeNull()
    expect(two).not.toBeNull()
    expect(one?.getAttribute('d')).not.toBe(two?.getAttribute('d'))
    // Monochrome: the mark follows `color`, never a colour of the vendor.
    expect(anthropic.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
    expect(openai.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
  })

  test('draws the GitHub mark for a reference to a pull request, in the text colour', () => {
    const { container } = render(<BrandIcon brand="github" />)
    const svg = container.querySelector('svg[data-nt-brand="github"]')
    expect(svg?.querySelector('path')).not.toBeNull()
    expect(svg).toHaveAttribute('fill', 'currentColor')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test('draws a mark for every brand of the protocol, each one different', () => {
    const drawings = BRANDS.map((brand) => {
      const { container } = render(<BrandIcon brand={brand} />)
      const svg = container.querySelector(`svg[data-nt-brand="${brand}"]`)
      expect(svg, brand).not.toBeNull()
      // In the colour of the text around it, as fill or as stroke; never a vendor's own colour.
      expect(svg?.innerHTML, brand).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i)
      return svg?.innerHTML
    })
    expect(new Set(drawings).size).toBe(BRANDS.length)
  })

  test('a letter mark carries one capital in a frame', () => {
    const { container } = render(<BrandIcon brand="augment" />)
    expect(container.querySelector('svg[data-nt-brand="augment"] text')?.textContent).toBe('A')
    expect(container.querySelector('svg[data-nt-brand="augment"] rect')).not.toBeNull()
  })

  test('falls back to a neutral glyph for an agent without a brand', () => {
    const { container } = render(<BrandIcon brand={undefined} />)
    expect(container.querySelector('[data-nt-brand="none"]')).not.toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  test('is decorative without a label', () => {
    const { container } = render(<BrandIcon brand="openai" />)
    expect(container.querySelector('[data-nt-brand]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('with a label it is an image with that name, for a mark that stands in for a word', () => {
    render(<BrandIcon brand="anthropic" label="Claude Code" />)
    expect(screen.getByRole('img', { name: 'Claude Code' })).toBeInTheDocument()
  })

  test('takes the small icon box by default and the medium one on request', () => {
    const { container: small } = render(<BrandIcon brand="anthropic" />)
    const { container: medium } = render(<BrandIcon brand="anthropic" size="md" />)
    expect(small.querySelector('[data-nt-brand]')?.getAttribute('class')).toContain(
      'size-(--nt-icon-sm)',
    )
    expect(medium.querySelector('[data-nt-brand]')?.getAttribute('class')).toContain(
      'size-(--nt-icon-md)',
    )
  })
})
