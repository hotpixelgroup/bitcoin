#!/bin/sh
# The executable inside Bitcoin Vibes.app.
#
# Double-clicked from Finder there is no terminal, no PATH worth trusting and
# nowhere to print an error. So this script does the smallest possible amount of
# work — find a source tree, find python, hand off — and reports anything that
# goes wrong in a native dialog rather than into the void.
set -u

APP_SUPPORT="${VIBES_HOME:-$HOME/Library/Application Support/Bitcoin Vibes}"
SRC="$APP_SUPPORT/source"
LOG="$APP_SUPPORT/launch.log"
REPO="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
BRANCH="${VIBES_BRANCH:-master}"

mkdir -p "$APP_SUPPORT"
exec 2>>"$LOG"
echo "--- launch $(date)" >>"$LOG"

# Finder gives us a minimal PATH; put the usual homes for Homebrew and
# user-installed tools back so git, cmake and claude can be found.
PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PATH

say() { osascript -e "display dialog \"$1\" with title \"Bitcoin Vibes\" buttons {\"OK\"} default button 1 with icon note" >/dev/null 2>&1; }
die() { osascript -e "display dialog \"$1\" with title \"Bitcoin Vibes\" buttons {\"OK\"} default button 1 with icon stop" >/dev/null 2>&1; exit 1; }

PY=$(command -v python3 || true)
[ -n "$PY" ] || die "Bitcoin Vibes needs Python 3, which normally ships with macOS.\n\nOpening Terminal and running:  xcode-select --install\n\nwill install it along with the developer tools."

# First run: fetch the source. Everything else assumes it is there.
if [ ! -d "$SRC/.git" ]; then
  if ! command -v git >/dev/null 2>&1; then
    osascript -e 'display dialog "Bitcoin Vibes needs Apple'"'"'s command line tools (they include git and the compiler).\n\nClick OK and macOS will offer to install them. Reopen Bitcoin Vibes once it finishes." with title "Bitcoin Vibes" buttons {"OK"} default button 1 with icon note' >/dev/null 2>&1
    xcode-select --install >/dev/null 2>&1
    exit 0
  fi
  say "Bitcoin Vibes is fetching the node's source code.\n\nThis takes a minute. The console will open by itself when it is ready."
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$SRC" >>"$LOG" 2>&1 \
    || die "Could not download Bitcoin Vibes.\n\nCheck your internet connection and try again.\n\nDetails: $LOG"
else
  # Keep up to date, but never clobber decrees the operator made locally.
  git -C "$SRC" fetch --depth 1 origin "$BRANCH" >>"$LOG" 2>&1 || true
  git -C "$SRC" merge --ff-only FETCH_HEAD >>"$LOG" 2>&1 || true
fi

CONSOLE="$SRC/contrib/vibes/bitcoin-vibes"
[ -f "$CONSOLE" ] || die "The Bitcoin Vibes source looks incomplete.\n\nDelete this folder and reopen the app:\n$SRC"

# Hand over. --app makes first-run setup stream into the browser, because from
# here there is no terminal for it to print to.
exec "$PY" -u "$CONSOLE" --app "$@" >>"$LOG" 2>&1
