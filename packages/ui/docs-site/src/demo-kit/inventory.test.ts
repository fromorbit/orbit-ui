import { describe, expect, test } from 'vitest'
import { libraryImports, localImports, missingNames, resolveLocal } from './inventory'

describe('the inventory of a demo source', () => {
  test('reads the components imported from the library root, without types', () => {
    const source = [
      "import { useState } from 'react'",
      'import {',
      '  Button,',
      '  type ButtonProps,',
      '  List as Rows,',
      '  SETTING_ROW_REVEAL,',
      '  useDelayed,',
      "} from '../../../src'",
      "import { galleryLabels } from '../../../src/gallery'",
      "import type { Tag } from '../../../src'",
    ].join('\n')
    expect(libraryImports(source)).toEqual(['Button', 'List'])
  })

  test('reads the names of the Missing placeholders, once each', () => {
    const source =
      '<Missing name="Chart">x</Missing>\n<Missing\n  name="Chart" />\n<Missing name="DataTable" inline />'
    expect(missingNames(source)).toEqual(['Chart', 'DataTable'])
  })

  test('follows the relative imports of a demo', () => {
    const source =
      "import { AppFrame } from './parts/AppFrame'\nimport { x } from '../demo-kit/Missing'"
    expect(localImports(source)).toEqual(['./parts/AppFrame', '../demo-kit/Missing'])
    expect(resolveLocal('../demos/chat.tsx', './parts/AppFrame')).toBe('../demos/parts/AppFrame')
    expect(resolveLocal('../demos/parts/AppFrame.tsx', '../shared')).toBe('../demos/shared')
  })
})
