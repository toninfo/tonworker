#!/usr/bin/env bash
# Build the Linux desktop app (.AppImage + .deb).
#
#   1. PyInstaller-bundle the server into a standalone onedir folder.
#   2. Stage it at binaries/sidecar/ for Tauri's `resources` slot.
#   3. `tauri build --bundles appimage,deb`.
#
# AppImage notes (CI):
#   linuxdeploy is itself an AppImage; many GitHub-hosted runners block FUSE mounts.
#   We export APPIMAGE_EXTRACT_AND_RUN=1 and NO_STRIP=true. If AppImage still fails,
#   the script falls back to --bundles deb only so the release still ships.
#
# Prerequisites: Rust + Node, a .venv at repo root with this package + PyInstaller,
# and the usual WebKitGTK / GTK build deps (see release.yml).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PLATFORM="$(cd "$HERE/.." && pwd)"
GUI="$PLATFORM/surfaces/gui"
# Single source of truth for the version: tauri.conf.json
VERSION="$(node -p "require('$GUI/src-tauri/tauri.conf.json').version")"
TRIPLE="$(rustc -vV | sed -n 's/host: //p')"

echo "==> TonWorker $VERSION Linux build ($TRIPLE)"

echo "==> [1/3] PyInstaller: bundling tonworker-server"
"$PLATFORM/.venv/bin/pyinstaller" --noconfirm --clean \
  --distpath "$HERE/dist" --workpath "$HERE/build" "$HERE/tonworker-server.spec"

echo "==> [2/3] staging sidecar resources"
mkdir -p "$GUI/src-tauri/binaries"
rm -rf "$GUI/src-tauri/binaries/sidecar" "$GUI/src-tauri/binaries/tonworker-server-$TRIPLE"
cp -a "$HERE/dist/tonworker-server" "$GUI/src-tauri/binaries/sidecar"
chmod +x "$GUI/src-tauri/binaries/sidecar/tonworker-server"

echo "==> [3/3] tauri build (appimage + deb)"
UPDATER_ENV="${OCW_UPDATER_ENV:-$PLATFORM/../.ocw-updater.env}"
if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ] && [ -f "$UPDATER_ENV" ]; then
  # shellcheck disable=SC1090
  source "$UPDATER_ENV"
fi
UPDATER_OVERLAY=()
if [ -n "${TAURI_SIGNING_PRIVATE_KEY:-}" ]; then
  UPDATER_OVERLAY=(--config '{"bundle":{"createUpdaterArtifacts":true}}')
else
  echo "    WARNING: no updater signing key — building WITHOUT auto-update artifacts."
fi

# FUSE-less CI + modern ELF strip quirks around linuxdeploy
export APPIMAGE_EXTRACT_AND_RUN=1
export NO_STRIP="${NO_STRIP:-true}"

cd "$GUI"
set +e
npm run tauri build -- --bundles appimage,deb ${UPDATER_OVERLAY[@]+"${UPDATER_OVERLAY[@]}"}
rc=$?
set -e
if [ "$rc" -ne 0 ]; then
  echo "WARNING: appimage,deb build failed (rc=$rc) — retrying with deb only" >&2
  npm run tauri build -- --bundles deb ${UPDATER_OVERLAY[@]+"${UPDATER_OVERLAY[@]}"}
fi

BUNDLE="$GUI/src-tauri/target/release/bundle"
echo "==> artifacts:"
ls -la "$BUNDLE"/appimage 2>/dev/null || echo "  (no appimage/)"
ls -la "$BUNDLE"/deb 2>/dev/null || echo "  (no deb/)"

# Require at least one shippable artifact
if ! ls "$BUNDLE"/appimage/*.AppImage >/dev/null 2>&1 \
  && ! ls "$BUNDLE"/deb/*.deb >/dev/null 2>&1; then
  echo "ERROR: no Linux installer produced" >&2
  exit 1
fi
