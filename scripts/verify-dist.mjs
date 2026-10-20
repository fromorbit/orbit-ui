// Checks a finished build of the package in the current directory: every export has its file
// under dist/, and each JavaScript entry loads in plain Node (no bundler, no source condition), as
// a consumer loads it: through `import`, and through `require` for a consumer that loads as
// CommonJS. Run from a package folder by its `verify` script, after `build`.
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** The condition under which a package of this repo resolves to its source; never shipped. */
const SOURCE_CONDITION = '@fromorbit/source'

const root = resolve(process.cwd())
const require = createRequire(join(root, 'package.json'))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const problems = []
for (const [subpath, target] of Object.entries(manifest.exports)) {
  for (const [condition, file] of Object.entries(target)) {
    if (condition === SOURCE_CONDITION) continue
    if (!existsSync(join(root, file))) problems.push(`${subpath}: no ${file}`)
    else if (condition === 'import') {
      try {
        await import(pathToFileURL(join(root, file)).href)
      } catch (error) {
        problems.push(`${subpath}: ${file} does not load: ${error.message}`)
      }
    } else if (condition === 'default' && file.endsWith('.js')) {
      try {
        require(join(root, file))
      } catch (error) {
        problems.push(`${subpath}: ${file} does not require: ${error.message}`)
      }
    }
  }
}
if (problems.length > 0) {
  process.stderr.write(`${manifest.name}\n${problems.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`${manifest.name}: every export has its built file and loads\n`)
