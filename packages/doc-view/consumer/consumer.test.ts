import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

/**
 * The consumer test: packs the package, installs the tarball into a fresh NodeNext project and
 * type-checks an import of every subpath that ships types, as a NodeNext consumer does.
 *
 * Needs `bun run build` first, so it has its own config and script (`bun run test:consumer`),
 * not part of `bun run check`. Installing the peer dependencies needs the network.
 */

const root = resolve(import.meta.dirname, '..')

interface Manifest {
  readonly name: string
  readonly exports: Readonly<Record<string, Readonly<Record<string, string>>>>
}

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Manifest

/** `.` and `./shiki-bundle` become `@fromorbit/doc-view` and `@fromorbit/doc-view/shiki-bundle`. */
const specifiers = Object.entries(manifest.exports)
  .filter(([, target]) => target.types !== undefined)
  .map(([subpath]) => (subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`))

let project = ''

beforeAll(() => {
  if (!existsSync(join(root, 'dist'))) throw new Error('not built; run bun run build')
  project = mkdtempSync(join(tmpdir(), 'doc-view-consumer-'))
  const tarballs = join(project, 'tarballs')
  mkdirSync(tarballs)
  execFileSync('bun', ['pm', 'pack', '--destination', tarballs, '--quiet'], {
    cwd: root,
    stdio: 'pipe',
  })
  const [tarball] = readdirSync(tarballs)
  if (!tarball) throw new Error('no tarball')
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify(
      {
        name: 'consumer',
        private: true,
        type: 'module',
        dependencies: {
          [manifest.name]: `file:./tarballs/${tarball}`,
          '@types/react': '*',
        },
      },
      null,
      2,
    ),
  )
  writeFileSync(
    join(project, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2023',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        verbatimModuleSyntax: true,
        skipLibCheck: true,
        noEmit: true,
        lib: ['ES2023', 'DOM'],
        jsx: 'react-jsx',
        types: [],
      },
      include: ['check.ts'],
    }),
  )
  // `keyof typeof ns` is `never` when the sibling modules of a declaration file do not resolve.
  const lines = specifiers.map((specifier, index) =>
    [
      `import * as ns${index} from '${specifier}'`,
      `export const has${index}: [keyof typeof ns${index}] extends [never] ? false : true = true`,
    ].join('\n'),
  )
  writeFileSync(join(project, 'check.ts'), `${lines.join('\n')}\n`)
  execFileSync('bun', ['install', '--ignore-scripts'], { cwd: project, stdio: 'pipe' })
}, 300_000)

afterAll(() => {
  if (project) rmSync(project, { recursive: true, force: true })
})

describe('published types under NodeNext', () => {
  test('every subpath type-checks with names that resolve', () => {
    const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc')
    let output = ''
    try {
      execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { cwd: project, stdio: 'pipe' })
    } catch (error) {
      const failed = error as { stdout?: Buffer }
      output = failed.stdout?.toString() ?? String(error)
    }
    expect(output).toBe('')
  }, 120_000)

  test('checks both subpaths with types', () => {
    expect(specifiers).toEqual([manifest.name, `${manifest.name}/shiki-bundle`])
  })
})
