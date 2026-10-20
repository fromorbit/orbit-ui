import { defineConfig } from 'vitest/config'

/**
 * The test against the build (`bun run test:consumer`): it packs the package, installs the tarball
 * into a fresh NodeNext project and type-checks an import of every subpath. It needs `bun run
 * build` first and the network for the peer dependencies, so it stays out of `check`.
 */
export default defineConfig({
  test: { include: ['consumer/consumer.test.ts'], environment: 'node' },
})
