#!/usr/bin/env bash
# Compress exported GLBs with meshopt (decoded in-browser by drei's useGLTF; no CDN needed).
# usage: scripts/anatomy/optimize.sh <export-dir> <public-dir>
set -euo pipefail
in="$1"; out="$2"; mkdir -p "$out"
for f in "$in"/*.glb; do
  npx --yes @gltf-transform/cli@4 meshopt "$f" "$out/$(basename "$f")" --level high
done
cp "$in/manifest.json" "$out/manifest.json"
