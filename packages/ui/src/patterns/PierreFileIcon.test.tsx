import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PierreFileIcon } from './PierreFileIcon'

test('a file icon is the one the tree draws for that kind of file', () => {
  const { container } = render(
    <>
      <PierreFileIcon path="src/lezer.ts" />
      <PierreFileIcon path="docs/handleiding.md" />
      <PierreFileIcon path="iets.onbekend" />
    </>,
  )

  const icons = [...container.querySelectorAll('svg')]
  expect(icons.map((icon) => icon.getAttribute('data-nt-icon-name'))).toEqual([
    'file-tree-builtin-typescript',
    'file-tree-builtin-markdown',
    // The set's own plain file, which is what the tree draws for a type it has no icon for.
    'file-tree-builtin-default',
  ])
  // Drawn, not referenced: the tree's sprite lives in its own shadow root, out of reach here.
  for (const icon of icons) {
    expect(icon.querySelector('path')).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  }
})

// Each language and each build or project file an agent names in an answer gets an icon of its
// own kind: the library's where it has one, ours where it has none.
test.each([
  ['src/main/java/org/voorbeeld/winkel/Winkel.java', 'nt-file-icon-java'],
  ['src/main/kotlin/Kassa.kt', 'nt-file-icon-kotlin'],
  ['scripts/kassa.kts', 'nt-file-icon-kotlin'],
  ['build.gradle', 'nt-file-icon-gradle'],
  ['build.gradle.kts', 'nt-file-icon-gradle'],
  ['settings.gradle', 'nt-file-icon-gradle'],
  ['gradlew', 'nt-file-icon-gradle'],
  ['gradlew.bat', 'nt-file-icon-gradle'],
  ['gradle.properties.example', 'nt-file-icon-gradle'],
  ['gradle/wrapper/gradle-wrapper.properties', 'nt-file-icon-gradle'],
  ['pom.xml', 'nt-file-icon-build'],
  ['Makefile', 'nt-file-icon-build'],
  ['CMakeLists.txt', 'nt-file-icon-build'],
  ['scripts/kassa.groovy', 'nt-file-icon-code'],
  ['src/Winkel.scala', 'nt-file-icon-code'],
  ['src/Winkel.cs', 'nt-file-icon-code'],
  ['app/Http/Controllers/WinkelController.php', 'nt-file-icon-php'],
  ['public/index.php', 'nt-file-icon-php'],
  ['resources/views/winkel.blade.php', 'nt-file-icon-blade'],
  ['artisan', 'file-tree-builtin-bash'],
  ['composer.json', 'nt-file-icon-package'],
  ['composer.lock', 'nt-file-icon-package'],
  ['phpunit.xml', 'nt-file-icon-test'],
  ['phpunit.xml.dist', 'nt-file-icon-test'],
  ['tests/Pest.php', 'nt-file-icon-test'],
  ['vite.config.js', 'file-tree-builtin-vite'],
  ['vite.config.ts', 'file-tree-builtin-vite'],
  ['docker/Dockerfile.prod', 'file-tree-builtin-docker'],
  ['docker/app.dockerfile', 'file-tree-builtin-docker'],
  ['docker-compose.yml', 'file-tree-builtin-docker'],
  ['docker-compose.yaml', 'file-tree-builtin-docker'],
  ['docker-compose.prod.yml', 'file-tree-builtin-docker'],
  ['compose.yml', 'file-tree-builtin-docker'],
  ['compose.yaml', 'file-tree-builtin-docker'],
  ['.dockerignore', 'file-tree-builtin-docker'],
  ['lib/winkel.dart', 'nt-file-icon-code'],
  ['plugin/init.lua', 'nt-file-icon-code'],
  ['src/winkel.c', 'file-tree-builtin-c'],
  ['src/winkel.h', 'file-tree-builtin-c'],
  ['src/winkel.cpp', 'file-tree-builtin-cpp'],
  ['src/winkel.hpp', 'file-tree-builtin-cpp'],
  ['cmd/winkel/main.go', 'file-tree-builtin-go'],
  ['src/main.rs', 'file-tree-builtin-rust'],
  ['winkel.py', 'file-tree-builtin-python'],
  ['lib/winkel.rb', 'file-tree-builtin-ruby'],
  ['Sources/Winkel.swift', 'file-tree-builtin-swift'],
  ['scripts/start.sh', 'file-tree-builtin-bash'],
  ['scripts/start.bash', 'file-tree-builtin-bash'],
  ['scripts/start.zsh', 'file-tree-builtin-bash'],
  ['scripts/start.bat', 'file-tree-builtin-bash'],
  ['scripts/start.cmd', 'file-tree-builtin-bash'],
  ['scripts/start.ps1', 'file-tree-builtin-bash'],
  ['db/schema.sql', 'file-tree-builtin-database'],
  ['Dockerfile', 'file-tree-builtin-docker'],
  ['Containerfile', 'file-tree-builtin-docker'],
  ['config/app.properties', 'nt-file-icon-config'],
  ['config/app.ini', 'nt-file-icon-config'],
  ['config/app.toml', 'nt-file-icon-config'],
  ['.env', 'nt-file-icon-config'],
  ['.env.example', 'nt-file-icon-config'],
  ['config/beans.xml', 'nt-file-icon-xml'],
  ['LICENSE', 'file-tree-builtin-text'],
  ['README', 'file-tree-builtin-text'],
])('%s gets %s', (path, icon) => {
  const { container } = render(<PierreFileIcon path={path} />)
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('data-nt-icon-name', icon)
  expect(svg?.querySelector('path')).not.toBeNull()
})
