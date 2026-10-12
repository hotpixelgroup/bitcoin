#!/bin/sh
# Bitcoin Vibes installer.
#
# Recommended: the installer published with the latest release. It installs
# that release, the same tag its prebuilt node was built from.
#
#   curl -fsSL https://github.com/hotpixelgroup/bitcoin/releases/latest/download/install.sh | sh
#
# Development line: the installer on master, which installs master as it is today.
#
#   curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh | sh
#
# Read before running (it prints everything it would do, changing nothing):
#   VIBES_DRY_RUN=1 sh install.sh
#
# VIBES_REF=<tag or branch> chooses what to install. VIBES_BRANCH is the older
# name for the same setting and still works.
#
# Installs build dependencies, fetches the source, builds the node, and opens
# the Vibe Console. POSIX sh: works on macOS and mainstream Linux out of the box.
set -eu

# Stamped with the release tag when this file is published as a release asset.
# Empty in the repository, where the installer follows master.
PINNED_REF=""

REPO_URL="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
# What to install: VIBES_REF, else the stamp above, else VIBES_BRANCH, else master.
REF="${VIBES_REF:-${PINNED_REF:-${VIBES_BRANCH:-master}}}"
DEST="${VIBES_DIR:-$HOME/bitcoin-vibes}"
DRY_RUN="${VIBES_DRY_RUN:-0}"

# --- presentation ------------------------------------------------------------

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  GOLD=$(printf '\033[38;5;179m'); DIM=$(printf '\033[2m')
  BOLD=$(printf '\033[1m'); RED=$(printf '\033[31m'); OFF=$(printf '\033[0m')
else
  GOLD=''; DIM=''; BOLD=''; RED=''; OFF=''
fi

say()  { printf '%s\n' "$*"; }
step() { printf '%s✦%s %s%s%s\n' "$GOLD" "$OFF" "$BOLD" "$*" "$OFF"; }
note() { printf '  %s%s%s\n' "$DIM" "$*" "$OFF"; }
die()  { printf '\n%s✖ %s%s\n' "$RED" "$*" "$OFF" >&2; exit 1; }
run()  { if [ "$DRY_RUN" = "1" ]; then printf '  %s$ %s%s\n' "$DIM" "$*" "$OFF"; else "$@"; fi; }

# Is there a terminal to ask a question on? Questions are read from /dev/tty,
# not stdin: under `curl | sh` stdin is the script itself.
have_tty() { ( : < /dev/tty ) 2>/dev/null; }

banner() {
  printf '\n'
  printf '%s   ✦  B I T C O I N   V I B E S  ✦%s\n' "$GOLD" "$OFF"
  printf '%s   -------------------------------%s\n' "$DIM" "$OFF"
  printf '%s   consensus is a social construct.%s\n' "$DIM" "$OFF"
  printf '%s   you, however, are eternal.%s\n' "$DIM" "$OFF"
  printf '\n'
}

# --- platform ----------------------------------------------------------------

detect_platform() {
  OS="$(uname -s)"
  case "$OS" in
    Darwin) PLATFORM="macos" ;;
    Linux)
      PLATFORM="linux"
      if   command -v apt-get >/dev/null 2>&1; then PKG="apt"
      elif command -v dnf     >/dev/null 2>&1; then PKG="dnf"
      elif command -v pacman  >/dev/null 2>&1; then PKG="pacman"
      elif command -v zypper  >/dev/null 2>&1; then PKG="zypper"
      else PKG="unknown"; fi ;;
    *) die "Unsupported OS: $OS. Bitcoin Vibes installs on macOS and Linux.
   On Windows, use WSL2 and run this again inside it." ;;
  esac
}

sudo_if_needed() {
  if [ "$(id -u)" -eq 0 ]; then run "$@";
  elif command -v sudo >/dev/null 2>&1; then run sudo "$@";
  else die "need root to install packages, and sudo is not available.
   Install these yourself, then re-run: git cmake ninja boost capnproto"; fi
}

install_deps() {
  step "Checking build dependencies"
  if [ "$PLATFORM" = "macos" ]; then
    if ! command -v brew >/dev/null 2>&1; then
      note "Homebrew is required to install build dependencies on macOS."
      note "Install it from https://brew.sh, then run this installer again."
      die "Homebrew not found."
    fi
    missing=''
    for f in cmake ninja boost capnp; do
      brew list --formula "$f" >/dev/null 2>&1 || missing="$missing $f"
    done
    if [ -n "$missing" ]; then
      note "installing:$missing"
      # shellcheck disable=SC2086
      run brew install $missing
    else
      note "all present"
    fi
    command -v xcode-select >/dev/null 2>&1 && xcode-select -p >/dev/null 2>&1 || {
      note "Xcode command line tools are needed for the compiler."
      run xcode-select --install || true
      die "Re-run this installer once the Xcode tools finish installing."
    }
  else
    case "$PKG" in
      apt)
        sudo_if_needed apt-get update -qq
        sudo_if_needed apt-get install -y --no-install-recommends \
          git build-essential cmake ninja-build pkg-config python3 \
          libboost-dev libsqlite3-dev libcapnp-dev capnproto ;;
      dnf)
        sudo_if_needed dnf install -y \
          git gcc-c++ cmake ninja-build python3 boost-devel sqlite-devel \
          capnproto-devel ;;
      pacman)
        sudo_if_needed pacman -Sy --needed --noconfirm \
          git base-devel cmake ninja python boost sqlite capnproto ;;
      zypper)
        sudo_if_needed zypper install -y \
          git gcc-c++ cmake ninja python3 libboost_headers-devel \
          sqlite3-devel capnproto-devel ;;
      *)
        die "Unrecognized Linux distribution. Install these, then re-run:
   git, a C++20 compiler, cmake, ninja, python3, boost headers,
   sqlite3 headers, capnproto" ;;
    esac
  fi
}

# --- source ------------------------------------------------------------------

short() { git -C "$DEST" rev-parse --short "$1" 2>/dev/null || printf '%s' "$1"; }

fetch_failed() {
  note "could not reach origin, so nothing was updated (are you offline?)"
  note "the checkout is unchanged. git said:"
  note "  $(printf '%s\n' "$1" | sed -n '/./{p;q;}')"
}

# Re-run on an existing checkout. It only ever fast-forwards, and it says which
# of these happened: left alone (uncommitted changes), origin unreachable,
# already current, fast-forwarded, or the checkout has commits of its own.
#
# The fetch has no --depth. The checkout is a depth-1 clone, and a second
# depth-1 fetch brings a tip with no known parent, which git then refuses to
# merge as "unrelated histories". A plain fetch brings the commits between the
# old tip and the new one, and the fast-forward works.
update_source() {
  if [ "$DRY_RUN" = "1" ]; then
    note "\$ git -C $DEST fetch origin $REF"
    note '$ (then fast-forward and rebuild the node; nothing is changed if there'
    note '$  are uncommitted changes or commits of your own)'
    return 0
  fi

  if ! dirty=$(git -C "$DEST" status --porcelain 2>&1); then
    note "git could not read this checkout, so it was left alone. git said:"
    note "  $(printf '%s\n' "$dirty" | sed -n '/./{p;q;}')"
    return 0
  fi
  if [ -n "$dirty" ]; then
    note "this checkout has uncommitted changes, so nothing in it was touched"
    note "commit or discard them, then run this installer again"
    return 0
  fi
  if ! git -C "$DEST" remote get-url origin >/dev/null 2>&1; then
    note "this checkout has no remote named origin, so there is nothing to update from"
    return 0
  fi

  old=$(git -C "$DEST" rev-parse HEAD)
  # A tag already held needs no network: release tags do not move.
  if ! new=$(git -C "$DEST" rev-parse -q --verify "refs/tags/$REF^{commit}" 2>/dev/null); then
    # One question to origin tells a branch from a tag, so that a tag is
    # fetched as a tag and the prebuilt node can later be matched to it.
    if ! refs=$(git -C "$DEST" ls-remote origin "refs/heads/$REF" "refs/tags/$REF" 2>&1); then
      fetch_failed "$refs"
      return 0
    fi
    case "$refs" in
      *"refs/heads/$REF"*) spec="refs/heads/$REF" ;;
      *"refs/tags/$REF"*)  spec="refs/tags/$REF:refs/tags/$REF" ;;
      *) note "origin has no branch or tag named $REF, so nothing was updated"
         return 0 ;;
    esac
    if ! err=$(git -C "$DEST" fetch -q origin "$spec" 2>&1); then
      fetch_failed "$err"
      return 0
    fi
    new=$(git -C "$DEST" rev-parse 'FETCH_HEAD^{commit}')
  fi

  if [ "$old" = "$new" ]; then
    note "already current: this checkout is at $REF ($(short "$new"))"
    return 0
  fi
  if git -C "$DEST" merge-base --is-ancestor "$old" "$new" 2>/dev/null; then
    if err=$(git -C "$DEST" merge --ff-only "$new" 2>&1); then
      note "fast-forwarded to $REF ($(short "$old") -> $(short "$new"))"
      UPDATED=1
    else
      note "could not fast-forward to $REF, so nothing was changed. git said:"
      note "  $(printf '%s\n' "$err" | sed -n '/./{p;q;}')"
    fi
    return 0
  fi

  # From here the checkout has commits that $REF lacks. Saved experiments are
  # the ones whose subject starts with "vibe:".
  mine=$(git -C "$DEST" log --format=%s "$new..$old" | grep -c '^vibe:' || true)
  if git -C "$DEST" merge-base --is-ancestor "$new" "$old" 2>/dev/null; then
    note "already current: $REF has nothing newer than this checkout"
    if [ "$mine" -gt 0 ]; then
      note "your $mine saved experiment(s) are untouched"
    fi
    return 0
  fi
  if git -C "$DEST" merge-base "$old" "$new" >/dev/null 2>&1; then
    extra=$(git -C "$DEST" rev-list --count "$new..$old")
    note "$REF has newer commits, and this checkout has $extra of its own"
    note "($mine saved experiment(s)), so nothing was changed"
    note "to update, use the Update button in the console: it replays your"
    note "experiments onto the new version"
  else
    note "this shallow checkout holds no history in common with $REF (it may be"
    note "ahead of $REF, or on another line), so nothing was changed"
    if [ "$mine" -gt 0 ]; then
      note "your $mine saved experiment(s) are untouched"
    fi
  fi
}

fetch_source() {
  if [ -d "$DEST/.git" ]; then
    step "Updating existing checkout"
    note "$DEST"
    update_source
  else
    step "Fetching Bitcoin Vibes"
    note "$REPO_URL ($REF) -> $DEST"
    run git -c advice.detachedHead=false clone --depth 1 --branch "$REF" "$REPO_URL" "$DEST"
    # A tag leaves HEAD detached, and the console saves experiments as commits
    # on the current branch, so give it one. A branch install already has one.
    if [ "$DRY_RUN" = "1" ]; then
      note "\$ (if $REF is a tag: git -C $DEST checkout -b vibes)"
    elif ! git -C "$DEST" symbolic-ref -q HEAD >/dev/null 2>&1; then
      git -C "$DEST" checkout -q -b vibes
      note "$REF is a tag: created a local branch named vibes at it"
    fi
  fi
}

# Cores, and a job count that won't get the build OOM-killed: each parallel
# C++ compile can peak near a gigabyte, so never run more jobs than GB of RAM.
plan_build() {
  cores=$( (command -v nproc >/dev/null 2>&1 && nproc) \
         || sysctl -n hw.ncpu 2>/dev/null || echo 2 )
  mem_gb=''
  if [ -r /proc/meminfo ]; then
    mem_gb=$(awk '/^MemTotal:/ {printf "%d", $2/1024/1024}' /proc/meminfo)
  elif command -v sysctl >/dev/null 2>&1; then
    mem_gb=$(sysctl -n hw.memsize 2>/dev/null | awk '{printf "%d", $1/1073741824}')
  fi
  [ -n "$mem_gb" ] && [ "$mem_gb" -ge 1 ] 2>/dev/null || mem_gb=$cores
  jobs=$cores
  [ "$mem_gb" -lt "$cores" ] && jobs=$mem_gb
  [ "$jobs" -lt 1 ] && jobs=1
  # Measured: ~32 core-minutes for this trimmed build. Rounded up for slower
  # cores and for make-instead-of-ninja, then given as a range.
  low=$(( 40 / jobs )); [ "$low" -lt 3 ] && low=3
  high=$(( low * 2 ))
}

# SHA-256 of a file, by whichever tool this system has. Prints nothing if none.
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum < "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 < "$1" | awk '{print $1}'
  fi
}

# A prebuilt node, if one exists for this platform AND was built from exactly
# the source we just checked out. Compiling is only needed to change the node;
# it is not needed to run it, so this gets a node up quickly and leaves the
# compile for the operator's first experiment.
#
# Three checks, none optional. The archive must match the SHA-256 published
# beside it: that catches a corrupted or swapped download, but the checksum
# comes from the same release page as the archive, so it is not an independent
# signature. The archive must unpack inside its own folder. And the commit it
# was built from must be the commit checked out here: a binary built from
# different code is not the node they are about to start editing.
try_prebuilt() {
  [ "${VIBES_NO_PREBUILT:-0}" = "1" ] && return 1
  command -v curl >/dev/null 2>&1 || return 1
  command -v tar  >/dev/null 2>&1 || return 1

  case "$(uname -s)/$(uname -m)" in
    Darwin/arm64)  slug=macos-arm64 ;;
    Darwin/x86_64) slug=macos-x86_64 ;;
    Linux/x86_64)  slug=linux-x86_64 ;;
    # uname -m says aarch64 on most ARM Linux; a few distros say arm64.
    Linux/aarch64|Linux/arm64) slug=linux-arm64 ;;
    *) return 1 ;;
  esac

  want=$(git -C "$DEST" rev-parse HEAD 2>/dev/null) || return 1
  # At a tag, take the binary from that same named release, so binary and
  # source come from one place. Otherwise ask the latest release; the commit
  # check below still has to pass. VIBES_PREBUILT_URL replaces the folder the
  # two files are fetched from (the console honours the same name).
  if [ -n "${VIBES_PREBUILT_URL:-}" ]; then
    base="${VIBES_PREBUILT_URL%/}"; from="$base"
  elif tag=$(git -C "$DEST" describe --tags --exact-match HEAD 2>/dev/null); then
    base="https://github.com/hotpixelgroup/bitcoin/releases/download/$tag"; from="release $tag"
  else
    base="https://github.com/hotpixelgroup/bitcoin/releases/latest/download"; from="the latest release"
  fi
  url="$base/vibes-node-$slug.tar.gz"
  if [ -z "$(sha256_of /dev/null)" ]; then
    note "neither sha256sum nor shasum is installed, so a prebuilt node could not"
    note "be checked against its published SHA-256: building instead"
    return 1
  fi
  tmp=$(mktemp -d) || return 1

  note "looking for a prebuilt node for $slug in $from"
  if ! curl -fsSL --max-time 300 "$url" -o "$tmp/node.tar.gz" 2>/dev/null; then
    note "none published for this platform — building instead"
    rm -rf "$tmp"; return 1
  fi
  if ! curl -fsSL --max-time 60 "$url.sha256" -o "$tmp/node.sha256" 2>/dev/null; then
    note "no SHA-256 is published beside it, so the download could not be"
    note "checked and was not used: building instead"
    rm -rf "$tmp"; return 1
  fi
  expect=$(awk 'NR == 1 { print tolower($1) }' "$tmp/node.sha256")
  actual=$(sha256_of "$tmp/node.tar.gz")
  if ! printf '%s\n' "$expect" | grep -Eq '^[0-9a-f]{64}$'; then
    note "the published SHA-256 file is not a checksum, so the download could"
    note "not be checked and was not used: building instead"
    rm -rf "$tmp"; return 1
  fi
  if [ "$expect" != "$actual" ]; then
    note "the download does not match its published SHA-256 and was not used:"
    note "building instead"
    note "(published ${expect%"${expect#????????????}"}, downloaded ${actual%"${actual#????????????}"})"
    rm -rf "$tmp"; return 1
  fi
  note "the download matches the SHA-256 published beside it. That detects a"
  note "corrupted or swapped download; the checksum comes from the same release"
  note "page as the archive, so it is not an independent signature."

  # Nothing in the archive may land outside the folder it is unpacked into.
  if ! listing=$(tar -tzf "$tmp/node.tar.gz" 2>/dev/null); then
    note "the download was not readable: building instead"
    rm -rf "$tmp"; return 1
  fi
  if printf '%s\n' "$listing" | grep -Eq '^/|(^|/)\.\.(/|$)'; then
    note "the archive names paths outside its own folder, so it was not"
    note "unpacked: building instead"
    rm -rf "$tmp"; return 1
  fi
  mkdir "$tmp/x" || { rm -rf "$tmp"; return 1; }
  if ! tar -xzf "$tmp/node.tar.gz" -C "$tmp/x" 2>/dev/null; then
    note "the download was not readable: building instead"
    rm -rf "$tmp"; return 1
  fi
  dir="$tmp/x/vibes-node-$slug"
  for f in COMMIT bitcoind bitcoin-cli; do
    if [ ! -f "$dir/$f" ] || [ -L "$dir/$f" ]; then
      note "the archive has no plain file named $f, so it was not used:"
      note "building instead"
      rm -rf "$tmp"; return 1
    fi
  done
  got=$(cat "$dir/COMMIT" 2>/dev/null || echo unknown)
  if [ "$got" != "$want" ]; then
    note "the published node was built from different source — building instead"
    note "(published ${got%"${got#??????????}"}, yours ${want%"${want#??????????}"})"
    rm -rf "$tmp"; return 1
  fi
  mkdir -p "$DEST/build/bin"
  cp "$dir/bitcoind" "$dir/bitcoin-cli" "$DEST/build/bin/" || { rm -rf "$tmp"; return 1; }
  chmod +x "$DEST/build/bin/bitcoind" "$DEST/build/bin/bitcoin-cli"
  if ! "$DEST/build/bin/bitcoind" -version >/dev/null 2>&1; then
    note "the prebuilt node would not run here — building instead"
    rm -rf "$tmp" "$DEST/build/bin"; return 1
  fi
  rm -rf "$tmp"
  note "using a prebuilt node built from this exact source"
  note "your first experiment compiles the node from source: that wait has been"
  note "postponed, not avoided"
  return 0
}

build_node() {
  step "Building the node"
  plan_build
  if [ -f "$DEST/build/bin/bitcoind" ]; then
    if [ "$UPDATED" != "1" ]; then
      note "already built: skipping (delete $DEST/build to force a rebuild)"
      return 0
    fi
    # A node left over from the older source is not the node for this source.
    note "the source was just updated, so the node built from the older source"
    note "is replaced"
  fi
  if [ "$DRY_RUN" = "1" ]; then
    note '$ (try a prebuilt node for this platform, else compile)'
  elif try_prebuilt; then
    return 0
  fi
  note "$cores core(s), ${mem_gb}GB RAM — using $jobs parallel job(s)"
  note "expect roughly $low-$high minutes, once. Everything after it is seconds."
  if [ "$jobs" -lt "$cores" ]; then
    note "(fewer jobs than cores: keeps the linker from being OOM-killed)"
  fi
  gen=''
  command -v ninja >/dev/null 2>&1 && gen='-G Ninja'
  # shellcheck disable=SC2086
  run cmake -B "$DEST/build" -S "$DEST" $gen \
      -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF \
      || die "cmake configure failed (see output above)"
  run cmake --build "$DEST/build" -j "$jobs" \
      || die "build failed (see output above)"
}

# Claude Code comes from Anthropic's own installer: a script fetched from
# claude.ai and piped to a shell. That is somebody else's code running as you,
# so it runs only after a yes on the terminal. With no terminal, or on any
# other answer, the command is printed for the operator to run themselves.
CLAUDE_INSTALL='curl -fsSL https://claude.ai/install.sh | bash'

install_claude() {
  step "Checking the vibe engine"
  if command -v claude >/dev/null 2>&1; then
    if claude auth status 2>/dev/null | grep -q '"loggedIn": *true'; then
      note "Claude Code installed and signed in"
    else
      note "Claude Code is installed but not signed in."
      NEEDS_LOGIN=1
    fi
    return 0
  fi
  note "Claude Code is not installed (this is what rewrites the node)"
  NEEDS_LOGIN=1
  if [ "$DRY_RUN" = "1" ]; then
    note "would ask on the terminal before running Anthropic's installer:"
    note "\$ $CLAUDE_INSTALL"
    note '$ (with no terminal, or on any answer but yes, that command is only'
    note '$  printed for you to run yourself)'
    return 0
  fi

  reply=n
  if have_tty; then
    printf "  %sInstall it now with Anthropic's installer?%s It fetches a script from\n" "$BOLD" "$OFF"
    printf '  claude.ai and runs it as you:\n'
    printf '    %s%s%s\n' "$GOLD" "$CLAUDE_INSTALL" "$OFF"
    printf '  [y/N] '
    read -r reply < /dev/tty || reply=n
  else
    note "there is no terminal to ask on, so its installer was not run"
  fi
  case "$reply" in
    y|Y|yes|YES)
      curl -fsSL https://claude.ai/install.sh | bash || true
      if command -v claude >/dev/null 2>&1; then
        note "Claude Code installed"
      elif [ -x "$HOME/.local/bin/claude" ]; then
        # Its installer drops the binary in ~/.local/bin, which is frequently not on
        # PATH; without this the sign-in command we print would not even be found.
        PATH="$HOME/.local/bin:$PATH"; export PATH
        CLAUDE_BIN="$HOME/.local/bin/claude"
        PATH_HINT=1
        note "Claude Code installed"
      else
        CLAUDE_MISSING=1
        note "could not install Claude Code automatically."
        note "install it from https://claude.com/claude-code and re-run."
      fi ;;
    *)
      CLAUDE_MISSING=1
      note "to install it yourself, run:"
      note "  $CLAUDE_INSTALL"
      note "(other ways to install: https://claude.com/claude-code)" ;;
  esac
}

# --- go ----------------------------------------------------------------------

NEEDS_LOGIN=0
CLAUDE_BIN="claude"
CLAUDE_MISSING=0
PATH_HINT=0
UPDATED=0

# VIBES_INSTALL_ONLY runs one step by itself and stops. The tests drive the
# real functions this way; it is not part of a normal install.
case "${VIBES_INSTALL_ONLY:-}" in
  '')       ;;
  fetch)    fetch_source; exit 0 ;;
  prebuilt) if try_prebuilt; then exit 0; else exit 1; fi ;;
  claude)   install_claude; exit 0 ;;
  *)        die "VIBES_INSTALL_ONLY must be fetch, prebuilt or claude" ;;
esac

banner
detect_platform
command -v git >/dev/null 2>&1 || [ "$PLATFORM" != "macos" ] || die "git not found. Run: xcode-select --install"
install_deps
fetch_source
build_node
install_claude

printf '\n'
step "Installed"
note "$DEST"
printf '\n'

if [ "$CLAUDE_MISSING" = "1" ]; then
  printf '  %sTwo things left, and only you can do them:%s\n' "$BOLD" "$OFF"
  printf '    %s%s%s\n' "$GOLD" "$CLAUDE_INSTALL" "$OFF"
  printf '    %sclaude auth login%s   %s(sign in; it opens your browser)%s\n' \
         "$GOLD" "$OFF" "$DIM" "$OFF"
  printf '\n'
elif [ "$NEEDS_LOGIN" = "1" ]; then
  printf '  %sOne thing left, and only you can do it:%s\n' "$BOLD" "$OFF"
  printf '    %s%s auth login%s   %s(sign in; it opens your browser)%s\n' \
         "$GOLD" "$CLAUDE_BIN" "$OFF" "$DIM" "$OFF"
  printf '\n'
  if [ "$PATH_HINT" = "1" ]; then
    printf '  %sClaude landed in ~/.local/bin, which is not on your PATH. The console\n' "$DIM"
    printf '  finds it regardless; to type "claude" yourself, add it:%s\n' "$OFF"
    printf '    %secho '"'"'export PATH="$HOME/.local/bin:$PATH"'"'"' >> ~/.profile%s\n' "$GOLD" "$OFF"
    printf '\n'
  fi
fi

printf '  %sTo begin:%s\n' "$BOLD" "$OFF"
printf '    %s%s/vibes%s\n' "$GOLD" "$DEST" "$OFF"
printf '\n'
printf '  %sIt builds nothing further, wakes the node, and opens the console.%s\n' "$DIM" "$OFF"
printf '\n'

# Read from the terminal, not stdin: under `curl | sh` stdin is the script
# itself, so a plain `read` would eat the rest of this file.
if [ "$DRY_RUN" != "1" ] && [ "$NEEDS_LOGIN" != "1" ] && [ -r /dev/tty ]; then
  printf '  %sStart it now?%s [Y/n] ' "$BOLD" "$OFF"
  read -r reply < /dev/tty || reply=n
  case "$reply" in
    ''|y|Y|yes|YES) exec "$DEST/vibes" ;;
  esac
fi
