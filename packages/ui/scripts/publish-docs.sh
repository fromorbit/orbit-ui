#!/bin/sh
# Builds the docs page and publishes it to GitHub Pages: the public repo fromorbit/orbit-ui-docs,
# served at https://fromorbit.github.io/orbit-ui-docs/. Its main branch holds only the build.
# Needs push rights to that repo (gh or an SSH key); run it by hand, never in check or CI.
set -eu

# The folder of @fromorbit/ui (packages/ui); git commands below work from it as from the repo root.
pkg_root=$(cd "$(dirname "$0")/.." && pwd)
remote=${ORBIT_UI_DOCS_REMOTE:-git@github.com:fromorbit/orbit-ui-docs.git}
source_commit=$(git -C "$pkg_root" rev-parse --short HEAD)
# Commit as the author of this checkout, never as whatever the global config holds.
author_name=$(git -C "$pkg_root" config user.name)
author_email=$(git -C "$pkg_root" config user.email)

cd "$pkg_root"
bun run gallery:build

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

git clone --depth 1 --branch main "$remote" "$work/site"
# Replace everything but the repo's own history with the fresh build.
find "$work/site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R docs-site/dist/. "$work/site/"

cd "$work/site"
git add --all
if git diff --cached --quiet; then
  echo "Nothing changed; the published page is up to date."
  exit 0
fi
git -c user.name="$author_name" -c user.email="$author_email" commit -m "docs: the component page of orbit-ui at ${source_commit}"
git push origin main
echo "Published: https://fromorbit.github.io/orbit-ui-docs/"
