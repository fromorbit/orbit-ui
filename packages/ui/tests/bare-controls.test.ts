import { describe, expect, test } from 'vitest'
import { findBareControls } from './guards/bare-controls'
import { read, sources, underSrc } from './guards/source'

describe('findBareControls', () => {
  test('finds bare controls', () => {
    expect(findBareControls('<button onClick={fn}>Ga</button>')).toEqual(['button'])
    expect(findBareControls('<input value={v} />')).toEqual(['input'])
    expect(findBareControls('<textarea value={v} />')).toEqual(['textarea'])
  })

  test('leaves the wrappers of the library alone', () => {
    expect(findBareControls('<Button onClick={fn}>Ga</Button>')).toEqual([])
    expect(findBareControls('<ButtonGroup>{children}</ButtonGroup>')).toEqual([])
    expect(findBareControls('<inputs>{children}</inputs>')).toEqual([])
  })

  test('leaves a bare control in a comment alone', () => {
    expect(findBareControls('// a native <button> is forbidden here')).toEqual([])
    expect(findBareControls('/* <input type="text"> */')).toEqual([])
  })
})

test('only a component renders a bare control: a story or a test helper uses the components', () => {
  // The rule of Orbit ("only shared/ui renders bare controls") inside the library: the components
  // are where native controls live; the stories and `./testing` show and use them.
  const scanned = sources(/\.tsx?$/).filter((file) =>
    /\.gallery\.tsx$|^(gallery|testing)\//.test(underSrc(file)),
  )
  expect(scanned.length, 'the stories are scanned').toBeGreaterThan(80)
  const offenders = scanned.filter((file) => findBareControls(read(file)).length > 0).map(underSrc)
  expect(offenders).toEqual([])
})
