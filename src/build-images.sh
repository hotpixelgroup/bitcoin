#!/bin/sh
# Regenerate the social card and the favicon set.
#
#   sh src/build-images.sh        (run from the gh-pages branch root)
#
# Renders through headless Chrome at 2x and downscales with Pillow, because
# rendering straight to the target size leaves the serif type mushy.
set -eu

cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found. Set CHROME=/path/to/chrome" >&2; exit 1; }
python3 -c "import PIL" 2>/dev/null || { echo "needs Pillow: pip install pillow" >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "→ social card (1200x630)"
"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --screenshot="$tmp/og-2x.png" --window-size=1200,630 \
  "file://$PWD/src/og.html" >/dev/null 2>&1
python3 -c "
from PIL import Image
Image.open('$tmp/og-2x.png').convert('RGB').resize((1200,630), Image.LANCZOS).save('og.png', optimize=True)"

# Two icon sources on purpose: the rounded, framed mark resamples into an
# unreadable blob at 16px, so the small sizes come from a full-bleed variant
# with sharper points.
cat > "$tmp/big.html" <<'HTML'
<!DOCTYPE html><meta charset="utf-8"><style>*{margin:0;padding:0}
html,body{width:512px;height:512px;overflow:hidden}img{width:512px;height:512px;display:block}
</style><img src="favicon.svg">
HTML
cat > "$tmp/small.html" <<'HTML'
<!DOCTYPE html><meta charset="utf-8"><style>*{margin:0;padding:0}
html,body{width:256px;height:256px;overflow:hidden}img{width:256px;height:256px;display:block}
</style><img src="favicon-small.svg">
HTML
cp src/favicon.svg src/favicon-small.svg "$tmp/"

echo "→ icons"
"$CHROME" --headless --disable-gpu --hide-scrollbars --screenshot="$tmp/big.png" \
  --window-size=512,512 "file://$tmp/big.html" >/dev/null 2>&1
"$CHROME" --headless --disable-gpu --hide-scrollbars --screenshot="$tmp/small.png" \
  --window-size=256,256 "file://$tmp/small.html" >/dev/null 2>&1
python3 - <<PY
from PIL import Image
big = Image.open("$tmp/big.png").convert("RGBA")
small = Image.open("$tmp/small.png").convert("RGBA")
for n in (180, 192):
    big.resize((n, n), Image.LANCZOS).save(f"favicon-{n}.png", optimize=True)
big.resize((180, 180), Image.LANCZOS).convert("RGB").save("apple-touch-icon.png", optimize=True)
for n in (32, 16):
    small.resize((n, n), Image.LANCZOS).save(f"favicon-{n}.png", optimize=True)
small.save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
PY

cp src/favicon.svg favicon.svg
echo "done: og.png, favicon.svg, favicon-{16,32,180,192}.png, apple-touch-icon.png, favicon.ico"
