import { bundledLanguages, createCssVariablesTheme, createHighlighter } from './shiki-bundle'

/**
 * The theme of a highlighted block: every colour a CSS variable (`--nt-code-*`), defined once in the
 * app's `styles/tokens.css` (which the website copies), so the palette is ours and the design tokens
 * stay the one source of colour.
 */
const THEME = createCssVariablesTheme({
  name: 'nt-code',
  variablePrefix: '--nt-code-',
  variableDefaults: {},
  fontStyle: true,
})

/** The short names a fence is written with, to the grammar of the bundle that draws them. */
const ALIASES: Readonly<Record<string, keyof typeof bundledLanguages>> = {
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  shell: 'shellscript',
  console: 'shellscript',
  yml: 'yaml',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  kt: 'kotlin',
  kts: 'kotlin',
  dockerfile: 'docker',
  env: 'dotenv',
  patch: 'diff',
}

/**
 * The grammar of the bundle a fence's language names, or `undefined` for one the bundle does not
 * carry: that block stays bare, rather than pulling in a grammar of its own.
 */
export function bundledLanguageOf(fence: string | undefined): string | undefined {
  if (fence === undefined) return undefined
  const name = fence.toLowerCase()
  if (Object.hasOwn(bundledLanguages, name)) return name
  return ALIASES[name]
}

/** One token of a highlighted line: its text, and the colour and face the theme gave it. */
export interface HighlightedToken {
  content: string
  /** A `var(--nt-code-…)` of the theme; left out for plain text. */
  color?: string
  /** Shiki's bit field: 1 italic, 2 bold, 4 underline. */
  fontStyle?: number
}

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>

/** One highlighter for every document, made on the first coloured block. */
let highlighter: Promise<Highlighter> | undefined

/**
 * The lines of a fenced block, tokenised with the grammar of its language, or `null` when the
 * bundle does not carry that language.
 *
 * Through `shiki-bundle.ts`, the same twenty-five lazily loaded grammars Pierre uses: a
 * language costs nothing until a block of it shows up.
 */
export async function highlightCode(
  code: string,
  fence: string | undefined,
): Promise<HighlightedToken[][] | null> {
  const lang = bundledLanguageOf(fence)
  if (lang === undefined) return null
  highlighter ??= createHighlighter({ themes: [THEME], langs: [] })
  const ready = await highlighter
  if (!ready.getLoadedLanguages().includes(lang)) await ready.loadLanguage(lang as never)
  return ready.codeToTokens(code, { lang: lang as never, theme: 'nt-code' }).tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      ...(token.color === undefined ? {} : { color: token.color }),
      ...(token.fontStyle ? { fontStyle: token.fontStyle } : {}),
    })),
  )
}
