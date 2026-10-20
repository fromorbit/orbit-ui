import {
  createBundledHighlighter,
  createCssVariablesTheme,
  createSingletonShorthands,
  getTokenStyleObject,
  stringifyTokenStyle,
} from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

/**
 * The twenty-five grammars documents and diffs are coloured in, each an `import()` of its own, so
 * a language costs nothing until a block of it shows up (seventeen common ones, Java, Kotlin
 * and Groovy for a Java/Gradle project, and PHP, Blade, XML, dotenv and Docker for Laravel). The
 * full map of `shiki` cost a spike **318 chunks and ~9.8 MB** for grammars that are almost never
 * drawn.
 *
 * The desktop app also puts this module in the place of `shiki` itself through a build-time alias,
 * so `@pierre/diffs` gets
 * every name it imports from `shiki` with this map; that is why the module exports more than a
 * document needs. It lives here so the app and the website colour code with the same bundle.
 *
 * **To add a language:** one more line below, `<name>: () => import('@shikijs/langs/<name>')`.
 * **A name that is not here is drawn as plain text:** `PierreDiff.tsx` asks the library for `text`
 * rather than a language this map lacks (`drawnLanguage`). Left to itself the library's
 * `resolveLanguage` rejects on the miss, and a `.java` opened as the first file of a window drew
 * nothing at all.
 *
 * Everything in this module comes from `shiki/core`, `shiki/engine/javascript` and
 * `shiki/engine/oniguruma` — **never from `shiki` itself**, or the alias above would resolve into
 * a loop.
 */
export const bundledLanguages = {
  typescript: () => import('@shikijs/langs/typescript'),
  tsx: () => import('@shikijs/langs/tsx'),
  javascript: () => import('@shikijs/langs/javascript'),
  jsx: () => import('@shikijs/langs/jsx'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  markdown: () => import('@shikijs/langs/markdown'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  shellscript: () => import('@shikijs/langs/shellscript'),
  python: () => import('@shikijs/langs/python'),
  rust: () => import('@shikijs/langs/rust'),
  go: () => import('@shikijs/langs/go'),
  sql: () => import('@shikijs/langs/sql'),
  // A Java/Gradle project: its sources, its Kotlin and its build scripts (`.gradle` is Groovy).
  java: () => import('@shikijs/langs/java'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  groovy: () => import('@shikijs/langs/groovy'),
  // A Laravel project: PHP, its Blade templates, the `.env` it runs on, the XML of `phpunit.xml`,
  // and the Dockerfile it ships in. Blade and PHP share the grammars of HTML, CSS, JS, JSON and
  // SQL already here; only their own and XML's are new.
  php: () => import('@shikijs/langs/php'),
  blade: () => import('@shikijs/langs/blade'),
  xml: () => import('@shikijs/langs/xml'),
  dotenv: () => import('@shikijs/langs/dotenv'),
  docker: () => import('@shikijs/langs/docker'),
  diff: () => import('@shikijs/langs/diff'),
}

/**
 * Built on `createHighlighterCore` with the reduced map above, the same way the real `shiki`
 * package builds its own `createHighlighter` on the *full* one (`shiki/dist/bundle-full`). No
 * bundled theme: `@pierre/diffs` resolves its themes through `@pierre/theming` and never asks
 * this highlighter to look one up by name — see `getSharedHighlighter` in its own source, the
 * caller of this function, which always passes its own `engine` too, so the default below only
 * matters if it ever does not.
 */
export const createHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: {},
  engine: () => createJavaScriptRegexEngine(),
})

/**
 * `@pierre/diffs`' SSR and worker entry points ask `shiki` for this shorthand; our own usage
 * (`PatchDiff` from `@pierre/diffs/react`, per the plan's "wat wij niet gebruiken") never reaches
 * it, so this exists to keep the export surface complete rather than because anything calls it.
 */
export const { codeToHtml } = createSingletonShorthands(createHighlighter)

export {
  createCssVariablesTheme,
  createJavaScriptRegexEngine,
  createOnigurumaEngine,
  getTokenStyleObject,
  stringifyTokenStyle,
}
