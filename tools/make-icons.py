#!/usr/bin/env python3
"""Render the extension icon at each size Firefox asks for.

The mark is struck article lines: the same strikethrough the welcome page uses
for the quotations it removed. Geometry is normalised to 0..1 and rendered
natively per size, because downscaling one 128px source softens the strokes at
toolbar sizes.

    python3 tools/make-icons.py icons
"""
import math, struct, sys, zlib

INK    = (0x12, 0x12, 0x12)
PAPER  = (0xFF, 0xFF, 0xFF)
STRIKE = (0xAA, 0x11, 0x11)

SIZES = (16, 32, 48, 96, 128)

# normalised geometry (fractions of the icon's edge)
BADGE_RADIUS = 0.203
LINE_TH, STRIKE_TH = 0.086, 0.094
STRIKE_X0, STRIKE_X1, STRIKE_Y = 0.172, 0.828, 0.500

# Three lines at 32px and up. Below that the minimum stroke width closes the
# gaps to under a pixel, so small sizes drop to two lines and spread them.
LINES = ((0.234, 0.344, 0.766), (0.234, 0.500, 0.766), (0.234, 0.656, 0.609))
LINES_SMALL = ((0.220, 0.280, 0.780), (0.220, 0.720, 0.660))
SMALL_BELOW = 24


def sd_round_rect(p, c, half, r):
    qx, qy = abs(p[0] - c[0]) - (half - r), abs(p[1] - c[1]) - (half - r)
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r


def sd_segment(p, a, b, th):
    px, py, bx, by = p[0] - a[0], p[1] - a[1], b[0] - a[0], b[1] - a[1]
    d = bx * bx + by * by
    t = 0.0 if d == 0 else max(0.0, min(1.0, (px * bx + py * by) / d))
    return math.hypot(px - bx * t, py - by * t) - th / 2


def layers_for(size):
    s, c = float(size), size / 2.0
    # Keep strokes from disappearing at 16px, where a proportional line is ~1.4px.
    line_th = max(LINE_TH * s, 1.75)
    strike_th = max(STRIKE_TH * s, 2.0)
    L = [(lambda p: sd_round_rect(p, (c, c), c, BADGE_RADIUS * s), INK, 1.0)]
    for x0, y, x1 in (LINES_SMALL if size < SMALL_BELOW else LINES):
        L.append((lambda p, x0=x0, y=y, x1=x1:
                  sd_segment(p, (x0 * s, y * s), (x1 * s, y * s), line_th), PAPER, 1.0))
    L.append((lambda p: sd_segment(p, (STRIKE_X0 * s, STRIKE_Y * s),
                                   (STRIKE_X1 * s, STRIKE_Y * s), strike_th), STRIKE, 1.0))
    return L


def render(size):
    out = []
    for y in range(size):
        for x in range(size):
            p = (x + 0.5, y + 0.5)
            r = g = b = a = 0.0
            for sdf, rgb, la in layers_for(size):
                cov = min(max(0.5 - sdf(p), 0.0), 1.0) * la
                if cov <= 0:
                    continue
                sr, sg, sb = (v / 255 for v in rgb)
                r, g, b = sr * cov + r * (1 - cov), sg * cov + g * (1 - cov), sb * cov + b * (1 - cov)
                a = cov + a * (1 - cov)
            out.append((round(r * 255), round(g * 255), round(b * 255), round(a * 255)))
    return out


def write_png(path, px, size):
    raw = b''.join(b'\x00' + bytes(v for p in px[y * size:(y + 1) * size] for v in p)
                   for y in range(size))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b''))


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else 'icons'
    for n in SIZES:
        write_png(f'{outdir}/icon-{n}.png', render(n), n)
        print(f'icons/icon-{n}.png')
