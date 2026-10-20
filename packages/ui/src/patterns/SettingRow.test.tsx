import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import { TooltipProvider } from '../overlays/Tooltip'
import { Switch } from '../primitives/Switch'
import { Textarea } from '../primitives/Textarea'
import { nl } from '../testing/labels'
import { SettingRow, type SettingRowProps } from './SettingRow'

/** A row around one `Switch`, wired the way every caller wires its control. */
function renderRow(props: Partial<Omit<SettingRowProps, 'children'>> = {}): void {
  render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Netwerktoegang" {...props}>
        {({ labelId, describedById, disabled }) => (
          <Switch
            label="Netwerktoegang"
            aria-labelledby={labelId}
            aria-describedby={describedById}
            checked={false}
            disabled={disabled}
            onCheckedChange={() => undefined}
          />
        )}
      </SettingRow>
    </TooltipProvider>,
  )
}

function control(): HTMLElement {
  return screen.getByRole('switch', { name: 'Netwerktoegang' })
}

/** The texts the control's `aria-describedby` points at, in order. */
function descriptions(element: HTMLElement): string[] {
  const ids = element.getAttribute('aria-describedby')?.split(' ') ?? []
  return ids.map((id) => document.getElementById(id)?.textContent ?? `<missing ${id}>`)
}

test('the label is the accessible name of the control', () => {
  renderRow()
  expect(control()).toBeInTheDocument()
})

test('the description stands under the label and describes the control', () => {
  renderRow({ description: 'Voor een nieuwe chat' })
  expect(screen.getByText('Voor een nieuwe chat')).toBeVisible()
  expect(descriptions(control())).toEqual(['Voor een nieuwe chat'])
})

test('a hint without a description is the one line, cut to one line', () => {
  renderRow({ hint: 'Geldt voor alle hosts' })
  // One form of explanation: the line, not an info button beside the label.
  expect(screen.queryByRole('button')).toBeNull()
  const line = screen.getByText('Geldt voor alle hosts')
  expect(line).toBeVisible()
  expect(line.className).toContain('truncate')
  expect(descriptions(control())).toEqual(['Geldt voor alle hosts'])
})

test('the line ends without a full stop', () => {
  renderRow({ description: 'Voor een nieuwe chat.' })
  expect(screen.getByText('Voor een nieuwe chat')).toBeVisible()
  expect(descriptions(control())).toEqual(['Voor een nieuwe chat'])
})

test('a description silences the hint: one explanation per row', () => {
  renderRow({ description: 'Voor een nieuwe chat', hint: 'Geldt voor alle hosts' })
  expect(screen.queryByRole('button', { name: 'Geldt voor alle hosts' })).toBeNull()
  expect(descriptions(control())).toEqual(['Voor een nieuwe chat'])
})

test('an error replaces the description and is announced', () => {
  renderRow({ description: 'Voor een nieuwe chat', error: 'Kon niet opslaan' })
  expect(screen.getByRole('alert')).toHaveTextContent('Kon niet opslaan')
  expect(screen.queryByText('Voor een nieuwe chat')).toBeNull()
  expect(descriptions(control())).toEqual(['Kon niet opslaan'])
})

test('blank text is no text', () => {
  renderRow({ description: '  ', error: '' })
  expect(control()).not.toHaveAttribute('aria-describedby')
  expect(screen.queryByRole('alert')).toBeNull()
})

test('restart is said in the line, after the explanation, not as a tag', () => {
  renderRow({ restart: true, description: 'Laat het bureaublad door het venster schemeren.' })
  const restart = screen.getByText('Na herstart')
  expect(restart.closest('p')).toHaveTextContent(
    'Laat het bureaublad door het venster schemeren · Na herstart',
  )
  // The label line holds the label alone.
  expect(screen.getByText('Netwerktoegang').closest('p')).not.toHaveTextContent('Na herstart')
})

test('restart without an explanation is the line on its own', () => {
  renderRow({ restart: true })
  expect(screen.getByText('Na herstart').closest('p')).toHaveTextContent(/^Na herstart$/)
})

test('an own value of a project carries the layers sign, and keeps its description', () => {
  renderRow({ source: 'project', description: 'Voor een nieuwe chat' })
  // One sign, only where the project differs: no tag in words beside the label.
  expect(screen.getByRole('img', { name: 'Eigen waarde voor dit project' })).toBeInTheDocument()
  expect(screen.queryByText('Project')).toBeNull()
  expect(screen.getByText('Voor een nieuwe chat')).toBeInTheDocument()
})

test('a value that follows the app shows its description and no sign', () => {
  renderRow({ source: 'app', description: 'Voor een nieuwe chat' })
  expect(screen.queryByText('Volgt app')).toBeNull()
  expect(screen.queryByRole('img')).toBeNull()
  expect(descriptions(control())).toEqual(['Voor een nieuwe chat'])
})

test('on the app, a value a project changed carries the layers sign with where', () => {
  renderRow({ differs: 'Anders in webwinkel' })
  const sign = screen.getByRole('img', { name: 'Anders in webwinkel' })
  expect(sign.querySelector('svg')).not.toBeNull()
})

test('one quiet scope label names every place else the value can differ', () => {
  renderRow({ scopes: ['project', 'chat'] })
  // One label, not a sign per layer: two loose icons beside the title read as clutter; its
  // tooltip and name say the whole sentence.
  const sign = screen.getByRole('img', { name: 'Per project en per chat te wijzigen' })
  expect(sign).toHaveTextContent('per project en chat')
  expect(screen.getAllByRole('img')).toHaveLength(1)
  expect(sign.querySelector('svg')).toBeNull()
})

test('a scope label for one layer names only that layer', () => {
  renderRow({ scopes: ['chat'] })
  expect(screen.getByRole('img', { name: 'Per chat te wijzigen' })).toHaveTextContent('per chat')
})

test('the reset button shows only while the value is modified', () => {
  const onReset = vi.fn()
  renderRow({ onReset })
  expect(screen.queryByRole('button', { name: 'Terug naar standaard' })).toBeNull()
})

test('reset calls back and hands the focus to the control of the row', async () => {
  const onReset = vi.fn()
  renderRow({ modified: true, onReset })
  await userEvent.click(screen.getByRole('button', { name: 'Terug naar standaard' }))
  expect(onReset).toHaveBeenCalledOnce()
  expect(control()).toHaveFocus()
})

test('reset hands the focus to a textarea control too', async () => {
  render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Instructies" modified onReset={() => undefined}>
        {({ labelId }) => <Textarea label="Instructies" aria-labelledby={labelId} />}
      </SettingRow>
    </TooltipProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Terug naar standaard' }))
  expect(screen.getByRole('textbox', { name: 'Instructies' })).toHaveFocus()
})

test('reset is called "Volg app" on a project', () => {
  renderRow({ modified: true, source: 'project', onReset: () => undefined })
  expect(screen.getByRole('button', { name: 'Volg app' })).toBeInTheDocument()
})

test('reset takes a label of its own, such as the default it goes back to', () => {
  renderRow({
    modified: true,
    onReset: () => undefined,
    resetLabel: 'Terug naar standaard: Automatisch',
  })
  expect(
    screen.getByRole('button', { name: 'Terug naar standaard: Automatisch' }),
  ).toBeInTheDocument()
})

test('no room is kept for a reset that is not offered, so the control ends on the edge', () => {
  // An empty slot of 24px left every control 48px from the edge of its card.
  const { container } = render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Een">
        {() => null}
      </SettingRow>
    </TooltipProvider>,
  )
  expect(container.querySelector('[data-nt-setting-reset]')).toBeNull()
})

test('reset stands before the control, shown with opacity on hover or focus only', () => {
  const { container } = render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Een" modified onReset={() => undefined}>
        {() => <span data-testid="control">bediening</span>}
      </SettingRow>
    </TooltipProvider>,
  )
  const reset = container.querySelector('[data-nt-setting-reset]')
  const control = screen.getByTestId('control')
  expect(reset?.compareDocumentPosition(control)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(reset?.className).toContain('opacity-0')
  expect(reset?.className).toContain('group-hover/setting-row:opacity-100')
  expect(reset?.className).toContain('group-focus-within/setting-row:opacity-100')
  // Opacity alone: a pointer that reaches the button has hovered its row already, and a click that
  // arrives without a hover first (touch, automation) must not fall through to the row beneath.
  expect(reset?.className).not.toContain('pointer-events-none')
})

test('a dense row is 32px high, for a list such as the shortcuts', () => {
  const { container } = render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Een" dense>
        {() => null}
      </SettingRow>
    </TooltipProvider>,
  )
  const row = container.querySelector('[data-nt-setting-row] > div')
  expect(row?.className).toContain('min-h-8')
  expect(row?.className).not.toContain('min-h-12')
})

test('dimmed turns the control off and tells why', () => {
  renderRow({ description: 'Voor een nieuwe chat', dimmed: 'Stel eerst een API-sleutel in' })
  expect(control()).toBeDisabled()
  expect(descriptions(control())).toEqual(['Voor een nieuwe chat', 'Stel eerst een API-sleutel in'])
})

test('dimmed keeps the label readable: only the control is dimmed', () => {
  renderRow({ dimmed: 'Stel eerst een API-sleutel in' })
  const label = screen.getByText('Netwerktoegang')
  expect(label.closest('[class*="opacity"]')).toBeNull()
})

test('a dimmed row offers no reset', () => {
  renderRow({ modified: true, onReset: () => undefined, dimmed: 'Stel eerst een sleutel in' })
  expect(screen.queryByRole('button', { name: 'Terug naar standaard' })).toBeNull()
})

test('the row is a container, so it can break under its own width', () => {
  const { container } = render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Een">
        {() => null}
      </SettingRow>
    </TooltipProvider>,
  )
  const row = container.querySelector('[data-nt-setting-row]')
  expect(row?.className).toContain('@container')
})

test('children may be plain nodes that ignore the ids', () => {
  const node: ReactNode = <span>vrij</span>
  render(
    <TooltipProvider>
      <SettingRow labels={nl.settingRow} label="Een">
        {() => node}
      </SettingRow>
    </TooltipProvider>,
  )
  expect(screen.getByText('vrij')).toBeInTheDocument()
})
