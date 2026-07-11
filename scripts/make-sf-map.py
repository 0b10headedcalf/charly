#!/usr/bin/env python3
"""Stitch CARTO voyager_nolabels tiles into public/sf-map.png cropped to the
exact CityHeatmap bbox (mercator crop; linear-lat error inside is <1px)."""
import math, os, subprocess, sys

MIN_LNG, MAX_LNG, MIN_LAT, MAX_LAT = -122.525, -122.35, 37.7, 37.835
Z = 13
N = 2 ** Z
TILE = 256
OUT = sys.argv[1]
TMP = "/tmp/claude-1000/-mnt-storage-dev-Hackathons-comm-org-platform/e58ef1b7-aed2-4a60-bcda-13aaf2bccb1a/scratchpad/tiles"
os.makedirs(TMP, exist_ok=True)

def xf(lng): return N * (lng + 180) / 360
def yf(lat):
    r = math.radians(lat)
    return N * (1 - math.asinh(math.tan(r)) / math.pi) / 2

x0, x1 = xf(MIN_LNG), xf(MAX_LNG)
y0, y1 = yf(MAX_LAT), yf(MIN_LAT)  # y grows southward
tx0, tx1 = int(x0), int(x1)
ty0, ty1 = int(y0), int(y1)
cols, rows = tx1 - tx0 + 1, ty1 - ty0 + 1
print(f"tiles x {tx0}..{tx1} y {ty0}..{ty1} ({cols}x{rows})")

paths = []
for ty in range(ty0, ty1 + 1):
    for tx in range(tx0, tx1 + 1):
        p = f"{TMP}/{Z}_{tx}_{ty}.png"
        paths.append(p)
        if not os.path.exists(p):
            url = f"https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{Z}/{tx}/{ty}.png"
            subprocess.run(["curl", "-sf", "--max-time", "15", "-o", p, url], check=True)

stitched = f"{TMP}/stitched.png"
subprocess.run(["magick", "montage", *paths, "-tile", f"{cols}x{rows}",
                "-geometry", "+0+0", stitched], check=True)

# crop to bbox in stitched-pixel coords
cx = round((x0 - tx0) * TILE); cw = round((x1 - x0) * TILE)
cy = round((y0 - ty0) * TILE); ch = round((y1 - y0) * TILE)
subprocess.run(["magick", stitched, "-crop", f"{cw}x{ch}+{cx}+{cy}", "+repage",
                "-strip", "-quality", "90", OUT], check=True)
print(f"wrote {OUT} {cw}x{ch}")
