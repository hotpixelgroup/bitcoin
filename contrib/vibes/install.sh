#!/bin/sh
# Bitcoin Vibes installer.
#
#   curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh | sh
#
# Read before running (it prints everything it would do, changing nothing):
#   VIBES_DRY_RUN=1 sh install.sh
#
# Installs build dependencies, fetches the source, builds the node, and opens
# the Vibe Console. POSIX sh: works on macOS and mainstream Linux out of the box.
set -eu

REPO_URL="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
BRANCH="${VIBES_BRANCH:-master}"
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
  if [ "$(id -u)" -eq 0 ]; then "$@";
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

fetch_source() {
  if [ -d "$DEST/.git" ]; then
    step "Updating existing checkout"
    note "$DEST"
    run git -C "$DEST" fetch --depth 1 origin "$BRANCH"
    # Never clobber the operator's own vibes: only fast-forward.
    if [ "$DRY_RUN" != "1" ] && ! git -C "$DEST" merge --ff-only FETCH_HEAD >/dev/null 2>&1; then
      note "you have local vibes that differ from origin — keeping yours untouched"
    fi
  else
    step "Fetching Bitcoin Vibes"
    note "$REPO_URL ($BRANCH) -> $DEST"
    run git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$DEST"
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

# A prebuilt node, if one exists for this platform AND was built from exactly
# the source we just checked out. Compiling is only needed to *vibe*; it is not
# needed to *run*, so this gets a node up in seconds and leaves the build for
# the operator's first decree, when the wait finally means something.
#
# The commit check is not optional: a binary built from different code is not
# the node they are about to start editing.
try_prebuilt() {
  [ "${VIBES_NO_PREBUILT:-0}" = "1" ] && return 1
  command -v curl >/dev/null 2>&1 || return 1
  command -v tar  >/dev/null 2>&1 || return 1

  case "$(uname -s)/$(uname -m)" in
    Darwin/arm64)  slug=macos-arm64 ;;
    Darwin/x86_64) slug=macos-x86_64 ;;
    Linux/x86_64)  slug=linux-x86_64 ;;
    *) return 1 ;;
  esac

  want=$(git -C "$DEST" rev-parse HEAD 2>/dev/null) || return 1
  url="https://github.com/hotpixelgroup/bitcoin/releases/latest/download/vibes-node-$slug.tar.gz"
  tmp=$(mktemp -d) || return 1

  note "looking for a prebuilt node for $slug"
  if ! curl -fsSL --max-time 300 "$url" -o "$tmp/node.tar.gz" 2>/dev/null; then
    note "none published for this platform — building instead"
    rm -rf "$tmp"; return 1
  fi
  if ! tar -xzf "$tmp/node.tar.gz" -C "$tmp" 2>/dev/null; then
    note "the download was not readable — building instead"
    rm -rf "$tmp"; return 1
  fi
  dir="$tmp/vibes-node-$slug"
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
  note "using a prebuilt node — your first decree will compile it properly"
  return 0
}

build_node() {
  step "Building the node"
  plan_build
  if [ -f "$DEST/build/bin/bitcoind" ]; then
    note "already built — skipping (delete $DEST/build to force a rebuild)"
    return 0
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
  note "installing Claude Code (this is what rewrites the node)"
  if [ "$DRY_RUN" = "1" ]; then
    note '$ curl -fsSL https://claude.ai/install.sh | bash'
  elif curl -fsSL https://claude.ai/install.sh | bash; then
    PATH="$HOME/.local/bin:$PATH"; export PATH
    NEEDS_LOGIN=1
    # Its installer drops the binary in ~/.local/bin, which is frequently not on
    # PATH; without this the sign-in command we print would not even be found.
    if ! command -v claude >/dev/null 2>&1 && [ -x "$HOME/.local/bin/claude" ]; then
      CLAUDE_BIN="$HOME/.local/bin/claude"
      PATH_HINT=1
    fi
  else
    note "could not install Claude Code automatically."
    note "install it from https://claude.com/claude-code and re-run."
    NEEDS_LOGIN=1
  fi
}

# --- go ----------------------------------------------------------------------

NEEDS_LOGIN=0
CLAUDE_BIN="claude"
PATH_HINT=0
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

if [ "$NEEDS_LOGIN" = "1" ]; then
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
