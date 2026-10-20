# @fromorbit/doc-view

## 0.1.8

### Patch Changes

- `DocProse` gets `foldTechnical`: a section Contract folds under `labels.technical` (default "Technical"), with the source positions of the blocks inside it intact. Plus the CSS `.nt-doc-technical*` and the golden example `technical`.
- The package now lives in the `fromorbit/orbit-ui` repository, beside `@fromorbit/ui`. The code and the entry points are unchanged; the export condition for the workspace source is now `@fromorbit/source`.

## 0.1.7

### Patch Changes

- The published `.d.ts` files get `.js` extensions in their relative imports (`scripts/dts-extensions.mjs`, after `tsc`). A NodeNext consumer got TS2305 on an import, because the sibling declaration files did not resolve.

## 0.1.6

### Patch Changes

- Published without the `nt-` prefix: `@fromorbit/doc-view` instead of `@fromorbit/nt-doc-view`, now that the scope `@fromorbit` already says whose package it is. The code is unchanged and imports stay `@nt/doc-view`; a consumer only changes its alias, e.g. `"@nt/doc-view": "npm:@fromorbit/doc-view@^0.1.6"`. The old `@fromorbit/nt-doc-view` package stays published but gets no new versions.

## 0.1.5

### Patch Changes

- Published under the `@fromorbit` scope, now that the repository belongs to the `fromorbit` organisation (GitHub Packages requires the scope to match the owner). The code is unchanged; a consumer only changes its alias and its `.npmrc` to `@fromorbit:registry=https://npm.pkg.github.com`.

## 0.1.4

### Patch Changes

- Updated dependencies of the tests.

## 0.1.3

### Patch Changes

- `dist/` holds one ES module per source module instead of one bundle per entry, so a consumer's bundler leaves out the modules it does not import.

## 0.1.2

### Patch Changes

- Updated dependencies of the tests.

## 0.1.1

### Patch Changes

- Every export carries `default` beside `import`, so a consumer that loads as CommonJS (such as Playwright specs) can `require` it.
