#!/usr/bin/env bash
# Packages one extension into ~/Downloads/<extension>-<version>.zip for sharing.
# Builds and zips exts/<extension>/dist for TypeScript extensions; zips the extension
# folder itself for legacy ones (no package.json). Overwrites an existing zip.
set -euo pipefail

usage() {
  echo "Usage: $0 <extension>" >&2
  echo "Available extensions:" >&2
  ls -1 "$EXTS_DIR" >&2
  exit 1
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXTS_DIR="$REPO_ROOT/exts"

[[ $# -eq 1 ]] || usage
EXTENSION="${1%/}"
EXTENSION_DIR="$EXTS_DIR/$EXTENSION"
[[ -d "$EXTENSION_DIR" ]] || { echo "Extension not found: $EXTENSION_DIR" >&2; usage; }

if [[ -f "$EXTENSION_DIR/package.json" ]]; then
  pnpm --dir "$REPO_ROOT" --filter "$EXTENSION" build
  SOURCE_DIR="$EXTENSION_DIR/dist"
else
  SOURCE_DIR="$EXTENSION_DIR"
fi

MANIFEST="$SOURCE_DIR/manifest.json"
[[ -f "$MANIFEST" ]] || { echo "manifest.json not found in $SOURCE_DIR" >&2; exit 1; }

VERSION="$(sed -nE 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$MANIFEST" | head -n 1)"
[[ -n "$VERSION" ]] || { echo "Could not read version from $MANIFEST" >&2; exit 1; }

OUTPUT="$HOME/Downloads/$EXTENSION-$VERSION.zip"
rm -f "$OUTPUT"

(
  cd "$SOURCE_DIR"
  zip -r -q "$OUTPUT" . \
    -x "README.md" "GLOSSARY.md" "*.test.*" "*.spec.*" "test/*" "tests/*" \
       "node_modules/*" "src/*" "dist/*" "*/.DS_Store" ".DS_Store" \
       "package.json" "tsconfig*.json"
)

echo "Created $OUTPUT"
