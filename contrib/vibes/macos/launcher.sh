#!/bin/sh
# The executable inside Bitcoin Vibes.app.
#
# Double-clicked from Finder there is no terminal, no PATH worth trusting and
# nowhere to print an error. So this script does the smallest possible amount of
# work — find a source tree, find python, hand off — and reports anything that
# goes wrong in a native dialog rather than into the void.
set -u

# Stamped with the release tag when the app is built for a release, so the app
# fetches the source of its own release. Empty in the repository.
PINNED_REF=""
PINNED_COMMIT=""

APP_SUPPORT="${VIBES_HOME:-$HOME/Library/Application Support/Bitcoin Vibes}"
SRC="$APP_SUPPORT/source"
LOG="$APP_SUPPORT/launch.log"
REPO="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
# What to fetch on first run: VIBES_REF, else the stamp above, else
# VIBES_BRANCH (the older name), else master.
REF="${VIBES_REF:-${PINNED_REF:-${VIBES_BRANCH:-master}}}"

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
[ -n "$PY" ] || die "Bitcoin Vibes needs Python 3 from Apple's command line tools or Homebrew.\n\nOpen Terminal and run:  xcode-select --install\n\nReopen Bitcoin Vibes when the installation finishes."

# First run: fetch the source. Everything else assumes it is there.
#
# Later launches fetch nothing. Like Bitcoin Core, this never updates by
# itself: the console tells the operator when a newer release exists and
# updates only when they ask, replaying their saved experiments on top.
if [ ! -d "$SRC/.git" ]; then
  if ! command -v git >/dev/null 2>&1; then
    osascript -e 'display dialog "Bitcoin Vibes needs Apple'"'"'s command line tools (they include git and the compiler).\n\nClick OK and macOS will offer to install them. Reopen Bitcoin Vibes once it finishes." with title "Bitcoin Vibes" buttons {"OK"} default button 1 with icon note' >/dev/null 2>&1
    xcode-select --install >/dev/null 2>&1
    exit 0
  fi
  say "Bitcoin Vibes is fetching the node's source code.\n\nThis takes a minute. The console will open by itself when it is ready."
  git -c advice.detachedHead=false clone --depth 1 --branch "$REF" "$REPO" "$SRC" >>"$LOG" 2>&1 \
    || die "Could not download Bitcoin Vibes.\n\nCheck your internet connection and try again.\n\nDetails: $LOG"
  # A release tag leaves HEAD detached, and the console saves experiments as
  # commits on the current branch, so give it one.
  if ! git -C "$SRC" symbolic-ref -q HEAD >/dev/null 2>&1; then
    git -C "$SRC" checkout -q -b vibes >>"$LOG" 2>&1 \
      || die "Could not prepare the Bitcoin Vibes source.\n\nDetails: $LOG"
  fi
fi

# A new launcher does not replace an existing lab or its saved experiments.
# Tell the operator when that lab does not contain this release, including
# shallow histories where ancestry cannot be established. Never call it older
# unless we could prove that, and never fetch or reset source automatically.
if [ -n "$PINNED_COMMIT" ] && [ "$REF" = "$PINNED_REF" ]; then
  CURRENT=$(git -C "$SRC" rev-parse HEAD 2>/dev/null || true)
  if [ "$CURRENT" != "$PINNED_COMMIT" ] \
      && ! git -C "$SRC" merge-base --is-ancestor "$PINNED_COMMIT" HEAD >/dev/null 2>&1; then
    NOTICE="$APP_SUPPORT/launcher-release-notice"
    ACKNOWLEDGED=$(cat "$NOTICE" 2>/dev/null || true)
    if [ "$ACKNOWLEDGED" != "$PINNED_COMMIT" ]; then
      if say "This launcher is for $PINNED_REF. Your existing lab uses different source and has been kept with your saved experiments.\n\nTo update it, use Check for and take updates in Setup & help, then close and reopen Bitcoin Vibes. Downloading a new launcher does not replace your existing lab."; then
        printf '%s\n' "$PINNED_COMMIT" > "$NOTICE"
      fi
    fi
  fi
fi

CONSOLE="$SRC/contrib/vibes/bitcoin-vibes"
[ -f "$CONSOLE" ] || die "The Bitcoin Vibes source looks incomplete. Keep your existing lab and saved experiments.\n\nDetails: $LOG\n\nBack up $SRC before repairing or reinstalling its source."

# Hand over. --app makes first-run setup stream into the browser, because from
# here there is no terminal for it to print to, and keeps the console's access
# key out of this log.
exec "$PY" -u "$CONSOLE" --app "$@" >>"$LOG" 2>&1
