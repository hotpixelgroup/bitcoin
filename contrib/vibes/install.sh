#!/bin/sh
# Bitcoin Vibes installer.
#
#   curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/vibes/contrib/vibes/install.sh | sh
#
# Read before running (it prints everything it would do, changing nothing):
#   VIBES_DRY_RUN=1 sh install.sh
#
# Installs build dependencies, fetches the source, builds the node, and opens
# the Vibe Console. POSIX sh: works on macOS and mainstream Linux out of the box.
set -eu

REPO_URL="${VIBES_REPO:-https://github.com/hotpixelgroup/bitcoin.git}"
BRANCH="${VIBES_BRANCH:-vibes}"
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
          libboost-dev libcapnp-dev capnproto ;;
      dnf)
        sudo_if_needed dnf install -y \
          git gcc-c++ cmake ninja-build python3 boost-devel capnproto-devel ;;
      pacman)
        sudo_if_needed pacman -Sy --needed --noconfirm \
          git base-devel cmake ninja python boost capnproto ;;
      zypper)
        sudo_if_needed zypper install -y \
          git gcc-c++ cmake ninja python3 libboost_headers-devel capnproto-devel ;;
      *)
        die "Unrecognized Linux distribution. Install these, then re-run:
   git, a C++20 compiler, cmake, ninja, python3, boost headers, capnproto" ;;
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

build_node() {
  step "Building the node"
  jobs=$( (command -v nproc >/dev/null 2>&1 && nproc) \
        || sysctl -n hw.ncpu 2>/dev/null || echo 4 )
  if [ -f "$DEST/build/bin/bitcoind" ]; then
    note "already built — skipping (delete $DEST/build to force a rebuild)"
    return 0
  fi
  note "this takes 10-20 minutes, once. Everything after it is seconds."
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
  else
    note "could not install Claude Code automatically."
    note "install it from https://claude.com/claude-code and re-run."
    NEEDS_LOGIN=1
  fi
}

# --- go ----------------------------------------------------------------------

NEEDS_LOGIN=0
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
  printf '    %sclaude auth login%s   %s(sign in; it opens your browser)%s\n' \
         "$GOLD" "$OFF" "$DIM" "$OFF"
  printf '\n'
fi

printf '  %sTo begin:%s\n' "$BOLD" "$OFF"
printf '    %s%s/vibes%s\n' "$GOLD" "$DEST" "$OFF"
printf '\n'
printf '  %sIt builds nothing further, wakes the node, and opens the console.%s\n' "$DIM" "$OFF"
printf '\n'

if [ "$DRY_RUN" != "1" ] && [ -t 0 ] && [ "$NEEDS_LOGIN" != "1" ]; then
  printf '  Start it now? [Y/n] '
  read -r reply || reply=n
  case "$reply" in
    ''|y|Y|yes|YES) exec "$DEST/vibes" ;;
  esac
fi
