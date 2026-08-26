#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# Renders the AMO listing screenshots from HTML to 1280x800 PNGs.
#
#     .github/screenshots/render.sh
#
# Uses headless Chrome, falling back to Firefox. Output goes to png/, which is
# committed so the uploaded images and their source stay in step.
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p png

W=1280
H=800

chrome=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  [ -x "$c" ] && { chrome="$c"; break; }
done

firefox=""
for f in \
  "/Applications/Firefox.app/Contents/MacOS/firefox" \
  "$(command -v firefox || true)"; do
  [ -x "$f" ] && { firefox="$f"; break; }
done

if [ -z "$chrome" ] && [ -z "$firefox" ]; then
  echo "render.sh: no Chrome or Firefox found" >&2
  exit 1
fi

for html in [0-9]-*.html; do
  out="png/${html%.html}.png"
  if [ -n "$chrome" ]; then
    # --headless=new needs the deprecated flag form on some builds; both are set.
    "$chrome" --headless --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=1 \
      --window-size="$W,$H" --screenshot="$out" \
      "file://$PWD/$html" >/dev/null 2>&1
  else
    "$firefox" --headless --window-size="$W,$H" \
      --screenshot "$PWD/$out" "file://$PWD/$html" >/dev/null 2>&1
  fi
  [ -s "$out" ] || { echo "render.sh: $out was not written" >&2; exit 1; }
  echo "  $out"
done

echo "done — upload png/*.png to AMO in filename order"
