# Listing screenshots

Source for the four screenshots on the AMO listing. Each `*.html` file is one
1280×800 frame; `render.sh` turns them into the PNGs in `png/`, which are
committed so the uploaded images and their source never drift apart.

```sh
.github/screenshots/render.sh
```

Then upload `png/*.png` on AMO in filename order — the numbering is the order
they should appear.

| File | Shows |
|---|---|
| `1-before-after.html` | The gate on the left, the article read to the end on the right |
| `2-free.html` | $0, and the trial, cap, payment and call home struck out |
| `3-setup.html` | The popup, the three steps, the ON / OFF / NYT badges |
| `4-privacy.html` | No account, no requests, one stored value, three permissions |

## Notes

Nothing here ships to users: `web-ext-config.mjs` ignores `.github`, and CI
fails the build if anything from it reaches the package.

Ink, paper and one red accent, taken from the icon: a black badge, white article
lines, a red strike. Rules instead of shadows and square corners instead of
round, matching `welcome.html` and `popup.html`. The popup in `3-setup.html` is
a replica of `popup.html` at 1.25x, so change it when the popup changes. Fonts are system fonts (Georgia, Helvetica) and
every mark is drawn in CSS or SVG, so rendering makes no network request — the
same claim the listing makes about the extension. Rendering on a machine without
those fonts will substitute and the frames will reflow; render on macOS.

`render.sh` prefers headless Chrome and falls back to Firefox. Both write the
frame at exactly 1280×800 with `--force-device-scale-factor=1`; do not render at
2× unless you also update this note, because AMO scales the first screenshot
into the listing header and mismatched sizes are obvious there.

The popup mock-up in `3-setup.html` loads `icons/icon-32.png` from the repo, so
if the icon changes the screenshot follows on the next render.
