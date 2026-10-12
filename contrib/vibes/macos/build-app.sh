#!/bin/sh
# Build "Bitcoin Vibes.app" — a double-clickable macOS launcher.
#
#   sh contrib/vibes/macos/build-app.sh          -> dist/Bitcoin Vibes.app
#   sh contrib/vibes/macos/build-app.sh --dmg    -> also dist/BitcoinVibes.dmg
#
# The bundle is a launcher, not the node. On first open it fetches the source
# into ~/Library/Application Support/Bitcoin Vibes and the console compiles the
# node there, so the app stays small and updates itself.
set -eu

cd "$(dirname "$0")/../../.."
ROOT="$PWD"
OUT="$ROOT/dist"
APP="$OUT/Bitcoin Vibes.app"
VERSION=$(sed -n 's/^set(CLIENT_VERSION_MAJOR \([0-9]*\))/\1/p' CMakeLists.txt).$(sed -n 's/^set(CLIENT_VERSION_MINOR \([0-9]*\))/\1/p' CMakeLists.txt)

echo "→ building Bitcoin Vibes.app $VERSION"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>              <string>Bitcoin Vibes</string>
  <key>CFBundleDisplayName</key>       <string>Bitcoin Vibes</string>
  <key>CFBundleIdentifier</key>        <string>group.hotpixel.bitcoinvibes</string>
  <key>CFBundleVersion</key>           <string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleExecutable</key>        <string>BitcoinVibes</string>
  <key>CFBundleIconFile</key>          <string>AppIcon</string>
  <key>CFBundlePackageType</key>       <string>APPL</string>
  <key>LSMinimumSystemVersion</key>    <string>12.0</string>
  <key>LSApplicationCategoryType</key> <string>public.app-category.finance</string>
  <key>NSHumanReadableCopyright</key>  <string>MIT. A fork of Bitcoin Core, maintained by Hot Pixel Group.</string>
  <!-- The console is a local web app; the node runs headless behind it. -->
  <key>LSUIElement</key>               <true/>
</dict>
</plist>
PLIST

install -m 755 contrib/vibes/macos/launcher.sh "$APP/Contents/MacOS/BitcoinVibes"

# Icon: reuse the site's mark so the dock, the tab and the social card agree.
ICON_SRC="$ROOT/contrib/vibes/macos/icon.png"
if [ -f "$ICON_SRC" ]; then
  ICONSET=$(mktemp -d)/AppIcon.iconset
  mkdir -p "$ICONSET"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$ICON_SRC" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    d=$((s * 2))
    sips -z $d $d "$ICON_SRC" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"
  echo "  icon built"
else
  echo "  note: no contrib/vibes/macos/icon.png — the app will use a blank icon"
fi

# Signing. With no credentials the app gets an ad-hoc signature and is not
# notarised: macOS then blocks the first launch until the operator allows it,
# which the README says plainly rather than pretending.
#
# With VIBES_CODESIGN_IDENTITY set to a "Developer ID Application: ..." identity
# the app is signed properly, and the disk image is notarised and stapled when
# notary credentials are also supplied (see the --dmg step below). Nobody has
# had those credentials yet, so the signed and notarised paths are written from
# Apple's documented commands and are untested.
SIGN_STATE="ad-hoc only (not notarised)"
if [ -n "${VIBES_CODESIGN_IDENTITY:-}" ]; then
  codesign --force --deep --options runtime --timestamp \
           --sign "$VIBES_CODESIGN_IDENTITY" "$APP"
  codesign --verify --deep --strict "$APP"
  SIGN_STATE="signed with a Developer ID, not notarised"
  echo "  signed: $VIBES_CODESIGN_IDENTITY"
else
  codesign --force --deep --sign - "$APP" >/dev/null 2>&1 \
    && echo "  ad-hoc signed" || echo "  note: could not sign (the app still runs)"
fi

echo "→ $APP"

if [ "${1:-}" = "--dmg" ]; then
  DMG="$OUT/BitcoinVibes.dmg"
  rm -f "$DMG"
  STAGE=$(mktemp -d)
  cp -R "$APP" "$STAGE/"
  ln -s /Applications "$STAGE/Applications"
  hdiutil create -volname "Bitcoin Vibes" -srcfolder "$STAGE" -ov -format UDZO "$DMG" >/dev/null
  rm -rf "$STAGE"

  # Notarisation needs a Developer ID signature first, then either a stored
  # notarytool profile or an Apple ID, team and app-specific password.
  if [ -n "${VIBES_CODESIGN_IDENTITY:-}" ]; then
    codesign --force --timestamp --sign "$VIBES_CODESIGN_IDENTITY" "$DMG"
    if [ -n "${VIBES_NOTARY_PROFILE:-}" ]; then
      xcrun notarytool submit "$DMG" --keychain-profile "$VIBES_NOTARY_PROFILE" --wait
      NOTARISED=1
    elif [ -n "${VIBES_NOTARY_APPLE_ID:-}" ] && [ -n "${VIBES_NOTARY_TEAM_ID:-}" ] \
         && [ -n "${VIBES_NOTARY_PASSWORD:-}" ]; then
      xcrun notarytool submit "$DMG" --apple-id "$VIBES_NOTARY_APPLE_ID" \
            --team-id "$VIBES_NOTARY_TEAM_ID" --password "$VIBES_NOTARY_PASSWORD" --wait
      NOTARISED=1
    fi
    if [ "${NOTARISED:-0}" = "1" ]; then
      xcrun stapler staple "$DMG"
      SIGN_STATE="signed with a Developer ID and notarised"
    fi
  fi
  echo "→ $DMG"
fi

echo "  signing: $SIGN_STATE"
