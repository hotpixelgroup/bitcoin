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
PINNED_BETA=""

if [ "$PINNED_BETA" = "1" ]; then
  DEFAULT_HOME="$HOME/Library/Application Support/Bitcoin Vibes Beta/${PINNED_REF:-development}"
else
  DEFAULT_HOME="$HOME/Library/Application Support/Bitcoin Vibes"
fi
APP_SUPPORT="${VIBES_HOME:-$DEFAULT_HOME}"
SRC="$APP_SUPPORT/source"
LOG="$APP_SUPPORT/launch.log"
REPO="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
# What to fetch on first run: VIBES_REF, else the stamp above, else
# VIBES_BRANCH (the older name), else master.
REF="${VIBES_REF:-${PINNED_REF:-${VIBES_BRANCH:-master}}}"

# Finder gives us a minimal PATH; put the usual homes for Homebrew and
# user-installed tools back so git, cmake and claude can be found.
PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PATH

# Pass messages as arguments, so quotes or backslashes in a user's folder
# name cannot turn a helpful dialog into broken AppleScript.
alert() {
  osascript - "$1" "$2" <<'APPLESCRIPT' >/dev/null 2>&1
on run argv
  if item 2 of argv is "stop" then
    display dialog (item 1 of argv) with title "Bitcoin Vibes" buttons {"OK"} default button 1 with icon stop
  else
    display dialog (item 1 of argv) with title "Bitcoin Vibes" buttons {"OK"} default button 1 with icon note
  end if
end run
APPLESCRIPT
}
say() { alert "$(printf '%b' "$1")" note; }
die() { printf '%b\n' "$1" >>"$LOG"; alert "$(printf '%b' "$1")" stop; exit 1; }
progress() {
  printf '%s\n' "$1" >>"$LOG"
  osascript - "$1" <<'APPLESCRIPT' >/dev/null 2>&1 || true
on run argv
  display notification (item 1 of argv) with title "Bitcoin Vibes"
end run
APPLESCRIPT
}

mkdir -p "$APP_SUPPORT" || die "Could not create the Bitcoin Vibes lab folder.\n\nCheck that you can write to $APP_SUPPORT, then reopen the app."
if ! : >>"$LOG"; then
  die "Could not write the Bitcoin Vibes launch log.\n\nCheck permissions for $APP_SUPPORT, then reopen the app."
fi
exec 2>>"$LOG"
echo "--- launch $(date)" >>"$LOG"

PY=''
for candidate in "$(command -v python3 || true)" /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
  if [ -n "$candidate" ] && "$candidate" -c 'import sys; assert sys.version_info >= (3, 8)' >/dev/null 2>&1; then
    PY="$candidate"
    break
  fi
done
[ -n "$PY" ] || die "Bitcoin Vibes needs working Python 3.8+ from Apple's command line tools or Homebrew.\n\nOpen Terminal and run:  xcode-select --install\n\nReopen Bitcoin Vibes when the installation finishes."
git --version >/dev/null 2>&1 || die "Bitcoin Vibes needs working git from Apple's command line tools or Homebrew.\n\nOpen Terminal and run:  xcode-select --install\n\nReopen Bitcoin Vibes when the installation finishes."

# First run: fetch the source. Everything else assumes it is there.
#
# Later launches fetch nothing. Like Bitcoin Core, this never updates by
# itself: the console tells the operator when a newer release exists and
# updates only when they ask, replaying their saved experiments on top.
if [ ! -e "$SRC/.git" ]; then
  if [ -e "$SRC" ] && [ -n "$(ls -A "$SRC" 2>/dev/null)" ]; then
    die "The Bitcoin Vibes source looks incomplete. Your files have been kept.\n\nBack up $SRC before repairing its git metadata, or choose a different lab folder.\n\nDetails: $LOG"
  fi
  progress "Downloading source. The console opens when it is ready; progress is in launch.log."
  FETCH_TMP=$(mktemp -d "$APP_SUPPORT/source.download.XXXXXX") \
    || die "Could not prepare a download folder.\n\nDetails: $LOG"
  trap 'rm -rf "$FETCH_TMP"' 0
  trap 'exit 1' 1 2 15
  git -c advice.detachedHead=false clone --progress --depth 1 --branch "$REF" "$REPO" "$FETCH_TMP/source" >>"$LOG" 2>&1 \
    || die "Could not download Bitcoin Vibes. Your existing files were kept.\n\nCheck your internet connection and reopen the app to retry.\n\nDetails: $LOG"
  if [ -n "$PINNED_COMMIT" ] && [ "$REF" = "$PINNED_REF" ] \
      && [ "$(git -C "$FETCH_TMP/source" rev-parse HEAD)" != "$PINNED_COMMIT" ]; then
    die "The downloaded source does not match this launcher's release. It was not installed.\n\nDownload the app again from the official release page.\n\nDetails: $LOG"
  fi
  # A release tag leaves HEAD detached. Give saved experiments a branch.
  if ! git -C "$FETCH_TMP/source" symbolic-ref -q HEAD >/dev/null 2>&1; then
    git -C "$FETCH_TMP/source" checkout -q -b vibes >>"$LOG" 2>&1 \
      || die "Could not prepare the Bitcoin Vibes source.\n\nDetails: $LOG"
  fi
  [ ! -d "$SRC" ] || rmdir "$SRC" || die "Could not prepare $SRC. Your files were kept.\n\nDetails: $LOG"
  mv "$FETCH_TMP/source" "$SRC" || die "Could not install the source.\n\nDetails: $LOG"
  rm -rf "$FETCH_TMP"
  trap - 0 1 2 15
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
