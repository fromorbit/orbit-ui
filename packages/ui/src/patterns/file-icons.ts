/**
 * The one table of file type → icon in this app: the icon configuration `PierreTree` hands to
 * `@pierre/trees`, and so also what `PierreFileIcon` draws for a path in an answer, a row of
 * Wijzigingen or the tab of a file.
 *
 * The library's `complete` set covers the web well and most other languages not at all: a `.java`,
 * a `build.gradle` or a `Makefile` fell back on the plain file. The rules below add those, pointing
 * at the library's own symbol wherever it has a fitting one (its terminal glyph for `.bat` and
 * `.ps1`, its text glyph for a `LICENSE` its own table misses because its keys are upper case) and
 * at a symbol of `SPRITE` below only where it has none (Java, Kotlin, Gradle, PHP, Blade, …). Kept free of `@pierre/trees` itself, so
 * the rule that only `PierreTree.tsx` imports the library keeps holding: every other
 * file stays free of the tree library and its weight.
 */

import { iconSymbol } from '../primitives/Icon'

/** The library's symbols reused below, by their id in its sprite. */
const BUILTIN = {
  bash: 'file-tree-builtin-bash',
  docker: 'file-tree-builtin-docker',
  text: 'file-tree-builtin-text',
} as const

/** Our own symbols, for the types the library has no symbol for at all. */
const OWN = {
  java: 'nt-file-icon-java',
  kotlin: 'nt-file-icon-kotlin',
  gradle: 'nt-file-icon-gradle',
  build: 'nt-file-icon-build',
  code: 'nt-file-icon-code',
  xml: 'nt-file-icon-xml',
  config: 'nt-file-icon-config',
  php: 'nt-file-icon-php',
  blade: 'nt-file-icon-blade',
  package: 'nt-file-icon-package',
  test: 'nt-file-icon-test',
} as const

/** The ids of the Lucide glyphs that stand in for the tree's own controls; see `REMAP`. */
const CONTROLS = { chevron: 'nt-icon-chevron', ellipsis: 'nt-icon-ellipsis' } as const

/** The rounded square the library draws behind a glyph of its own (`html`, `bash`), at 20%. */
const BACKDROP =
  '<path fill="currentColor" d="M8 1C2.24 1 1 2.24 1 8s1.24 7 7 7 7-1.24 7-7-1.24-7-7-7" class="bg" opacity=".2"/>'

/** A line drawn at the weight of the library's own thin glyphs. */
const STROKE =
  'fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"'

/**
 * Our symbols, on the library's 16-unit grid and in `currentColor` like its own, so a row decides
 * their colour the same way. A symbol per kind, not per language: a language without a mark of its
 * own shares `code`.
 */
const SYMBOLS: Record<(typeof OWN)[keyof typeof OWN], string> = {
  // A cup with steam, the mark Java has always had.
  [OWN.java]:
    '<path fill="currentColor" d="M6 1.5a.5.5 0 0 1 1 0v2a.5.5 0 0 1-1 0zm3 0a.5.5 0 0 1 1 0v2a.5.5 0 0 1-1 0z" opacity=".6"/>' +
    '<path fill="currentColor" d="M2.5 5.5h9v4A3.5 3.5 0 0 1 8 13H6a3.5 3.5 0 0 1-3.5-3.5zm9 1H13a2 2 0 1 1 0 4h-1.7l.25-1H13a1 1 0 1 0 0-2h-1.5zM1 14.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>',
  // Kotlin's own mark: a square with a notch cut from its right side.
  [OWN.kotlin]: '<path fill="currentColor" d="M2 2h12L8 8l6 6H2z"/>',
  // An elephant, Gradle's mark, facing left with its trunk down.
  [OWN.gradle]:
    '<path fill="currentColor" fill-rule="evenodd" d="M4 12.5V9.8A3.3 3.3 0 0 1 3 7.5C3 4.5 5 2.5 8 2.5h2.5A3.5 3.5 0 0 1 14 6v6.5a.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-2h-3v2a.5.5 0 0 1-.5.5H6.5a.5.5 0 0 1-.5-.5V9.9a2 2 0 0 0-1 .1v2.5a.5.5 0 0 1-1 0zM6 6.1a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2"/>',
  // Building blocks: a file that builds the project rather than being part of it.
  [OWN.build]:
    '<path fill="currentColor" d="M5.5 3A1.5 1.5 0 0 1 7 1.5h2A1.5 1.5 0 0 1 10.5 3v2A1.5 1.5 0 0 1 9 6.5H7A1.5 1.5 0 0 1 5.5 5z" opacity=".6"/>' +
    '<path fill="currentColor" d="M1.5 9.5A1.5 1.5 0 0 1 3 8h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 6 14H3a1.5 1.5 0 0 1-1.5-1.5zm7 0A1.5 1.5 0 0 1 10 8h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 13 14h-3a1.5 1.5 0 0 1-1.5-1.5z"/>',
  // Braces: source code of a language without a mark here.
  [OWN.code]: `${BACKDROP}<path ${STROKE} d="M6.5 4.5c-1 0-1.5.5-1.5 1.3v.9c0 .8-.4 1.3-1.2 1.3.8 0 1.2.5 1.2 1.3v.9c0 .8.5 1.3 1.5 1.3m3-7c1 0 1.5.5 1.5 1.3v.9c0 .8.4 1.3 1.2 1.3-.8 0-1.2.5-1.2 1.3v.9c0 .8-.5 1.3-1.5 1.3"/>`,
  // Angle brackets: markup.
  [OWN.xml]: `${BACKDROP}<path ${STROKE} d="M5.5 5.5 3.5 8l2 2.5m5-5 2 2.5-2 2.5M9 4.5l-2 7"/>`,
  // Sliders: settings kept as keys and values.
  [OWN.config]:
    `<path ${STROKE} d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" opacity=".6"/>` +
    '<path fill="currentColor" d="M5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m6 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M7 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>',
  // PHP's oval with its opening tag, `<?`, rather than a copy of the lettered logo.
  [OWN.php]:
    '<path fill="currentColor" d="M8 3.25C3.5 3.25 1 5.4 1 8s2.5 4.75 7 4.75S15 10.6 15 8s-2.5-4.75-7-4.75" class="bg" opacity=".2"/>' +
    `<path ${STROKE} d="M6.5 5.75 4.25 8l2.25 2.25m2.25-3.9a1.6 1.6 0 1 1 2.3 1.45c-.5.25-.8.6-.8 1.05v.1"/>` +
    '<path fill="currentColor" d="M10.25 11.1a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2"/>',
  // Blade's own echo, `{{ }}`: a PHP template, told apart from plain PHP at a glance.
  [OWN.blade]: `${BACKDROP}<path ${STROKE} d="M5.2 5c-.8 0-1.2.4-1.2 1v.9c0 .5-.3.9-.8 1.1.5.2.8.6.8 1.1v.9c0 .6.4 1 1.2 1m1.5-6c-.8 0-1.2.4-1.2 1v.9c0 .5-.3.9-.8 1.1.5.2.8.6.8 1.1v.9c0 .6.4 1 1.2 1m2.1-6c.8 0 1.2.4 1.2 1v.9c0 .5.3.9.8 1.1-.5.2-.8.6-.8 1.1v.9c0 .6-.4 1-1.2 1m1.5-6c.8 0 1.2.4 1.2 1v.9c0 .5.3.9.8 1.1-.5.2-.8.6-.8 1.1v.9c0 .6-.4 1-1.2 1"/>`,
  // A box: the packages a project depends on (Composer's lock and manifest).
  [OWN.package]:
    '<path fill="currentColor" d="M8 1.5 14 4.75v6.5L8 14.5 2 11.25v-6.5z" class="bg" opacity=".2"/>' +
    `<path ${STROKE} d="M8 1.5 14 4.75v6.5L8 14.5 2 11.25v-6.5zM2 4.75 8 8l6-3.25M8 8v6.5"/>`,
  // A flask: the configuration of a test runner (PHPUnit, Pest).
  [OWN.test]:
    '<path fill="currentColor" d="M4.6 10h6.8l1.6 2.5a1.3 1.3 0 0 1-1.15 2h-7.7A1.3 1.3 0 0 1 3 12.5z" opacity=".6"/>' +
    `<path ${STROKE} d="M6 1.5h4M6.75 1.5v4.25L3 12.5a1.3 1.3 0 0 0 1.15 2h7.7a1.3 1.3 0 0 0 1.15-2L9.25 5.75V1.5"/>`,
}

/**
 * The sprite of our own symbols, in the shape the library injects next to its own sheet inside the
 * tree's shadow root — and reads from here to draw one outside it.
 */
const SPRITE = `<svg data-nt-icon-sprite aria-hidden="true" width="0" height="0">${Object.entries(
  SYMBOLS,
)
  .map(([id, markup]) => `<symbol id="${id}" viewBox="0 0 16 16">${markup}</symbol>`)
  .join('')}${iconSymbol('chevron-down', CONTROLS.chevron)}${iconSymbol(
  'more-horizontal',
  CONTROLS.ellipsis,
)}</svg>`

/**
 * The controls of the tree in the app's own glyphs rather than the library's: the chevron of a folder and the ellipsis of a row, in Lucide at the
 * stroke of every other icon. The file-type icons stay the library's and ours above: Lucide has no
 * glyph per language.
 */
const REMAP = {
  'file-tree-icon-chevron': { name: CONTROLS.chevron, viewBox: '0 0 24 24' },
  'file-tree-icon-ellipsis': { name: CONTROLS.ellipsis, viewBox: '0 0 24 24' },
} as const

/** Whole file names, lower case: the files whose name says what they are, not their extension. */
const BY_FILE_NAME: Record<string, string> = {
  gradlew: OWN.gradle,
  'gradlew.bat': OWN.gradle,
  makefile: OWN.build,
  gnumakefile: OWN.build,
  'cmakelists.txt': OWN.build,
  'pom.xml': OWN.build,
  containerfile: BUILTIN.docker,
  artisan: BUILTIN.bash,
  'composer.json': OWN.package,
  'composer.lock': OWN.package,
  'phpunit.xml': OWN.test,
  'phpunit.xml.dist': OWN.test,
  'pest.php': OWN.test,
  license: BUILTIN.text,
  licence: BUILTIN.text,
  copying: BUILTIN.text,
  notice: BUILTIN.text,
  readme: BUILTIN.text,
  changelog: BUILTIN.text,
  authors: BUILTIN.text,
  contributors: BUILTIN.text,
}

/**
 * Parts of a file name, lower case, read before any extension. Every file of a Gradle build has
 * `gradle` in its name (`settings.gradle.kts`, `gradle.properties.example`), so the `.kts` of a
 * build script does not make it Kotlin; a `Dockerfile.prod` or an `app.dockerfile` is a Dockerfile,
 * and a `docker-compose.prod.yml` Docker rather than YAML.
 */
const BY_FILE_NAME_CONTAINS: Record<string, string> = {
  gradle: OWN.gradle,
  dockerfile: BUILTIN.docker,
  'docker-compose': BUILTIN.docker,
}

/** Languages without a mark of their own in either sprite. */
const CODE_EXTENSIONS = [
  'groovy',
  'gvy',
  'scala',
  'sc',
  'cs',
  'csx',
  'fs',
  'fsx',
  'vb',
  'dart',
  'lua',
  'pl',
  'pm',
  'r',
  'ex',
  'exs',
  'erl',
  'hs',
  'clj',
  'cljs',
  'elm',
  'ml',
  'jl',
  'nim',
] as const

/** Keys and values: settings files, and the `.env` family a project ships an example of. */
const CONFIG_EXTENSIONS = [
  'properties',
  'ini',
  'toml',
  'cfg',
  'conf',
  'editorconfig',
  'env',
  'env.example',
  'env.sample',
  'env.template',
  'env.local',
  'env.development',
  'env.production',
  'env.test',
] as const

/** Markup that is not a web page. */
const XML_EXTENSIONS = [
  'xml',
  'xsd',
  'xsl',
  'xslt',
  'wsdl',
  'plist',
  'csproj',
  'fsproj',
  'vbproj',
  'props',
  'targets',
] as const

/** Extensions without their dot, lower case; the library tries `a.b.c` as `b.c` before `c`. */
const BY_FILE_EXTENSION: Record<string, string> = {
  java: OWN.java,
  kt: OWN.kotlin,
  kts: OWN.kotlin,
  mk: OWN.build,
  cmake: OWN.build,
  php: OWN.php,
  // Tried before `php`: the library reads `a.blade.php` as `blade.php` first.
  'blade.php': OWN.blade,
  bat: BUILTIN.bash,
  cmd: BUILTIN.bash,
  ps1: BUILTIN.bash,
  psm1: BUILTIN.bash,
  psd1: BUILTIN.bash,
  ...Object.fromEntries(CODE_EXTENSIONS.map((extension) => [extension, OWN.code])),
  ...Object.fromEntries(CONFIG_EXTENSIONS.map((extension) => [extension, OWN.config])),
  ...Object.fromEntries(XML_EXTENSIONS.map((extension) => [extension, OWN.xml])),
}

/**
 * The icon configuration of every file icon in the app, in the shape of `@pierre/trees`'
 * `FileTreeIconConfig`.
 *
 * `set: 'complete'` must be said out loud: the library falls back on no set at all (`'none'`) as
 * soon as a configuration carries rules of its own.
 */
export const FILE_ICONS = {
  set: 'complete',
  spriteSheet: SPRITE,
  remap: REMAP,
  byFileName: BY_FILE_NAME,
  byFileNameContains: BY_FILE_NAME_CONTAINS,
  byFileExtension: BY_FILE_EXTENSION,
} as const
