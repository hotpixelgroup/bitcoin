Bitcoin Vibes
=============

*Core has rules. Knots has opinions. Vibes has you.*

**→ [hotpixelgroup.github.io/bitcoin](https://hotpixelgroup.github.io/bitcoin/)**

Fifteen years of mailing lists, BIPs, IRC flame wars, and filtering discourse,
and somehow neither Core nor Knots ever shipped the one feature people
actually wanted: **a big text area where you type what Bitcoin should be, and
the node rewrites its own source code to match.** One commit per wish.
Rebuild. Restart. Revert button, for when your convictions don't survive
contact with the compiler.

|                             | Bitcoin Core                   | Bitcoin Knots            | **Bitcoin Vibes**               |
|-----------------------------|--------------------------------|--------------------------|---------------------------------|
| Who decides what Bitcoin is | rough consensus, since 2010    | one man's convictions    | **you, in a text area**         |
| Change process              | BIP → years of debate → maybe  | a curated patchset       | **vibes**                       |
| Release cadence             | every ~6 months                | rebased on releases      | **every time you hit Manifest** |
| Undo mechanism              | contentious hard fork          | downgrade                | **a revert button**             |

Install
-------

**On a Mac, and you would rather not see a terminal?**
[Download Bitcoin Vibes.app](https://github.com/hotpixelgroup/bitcoin/releases/latest),
drag it to Applications, open it. It does the rest and shows you what it is doing
in your browser. (It is not notarised yet, so the first time you will need to
right-click it and choose **Open** — macOS asks that of every small developer.)

**Everyone else, one line:**

```bash
curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh | sh
```

That is the whole thing. It installs the build dependencies, fetches the
source, builds the node, sets up the AI engine, and offers to launch. It asks
before it starts, and prints everything it does.

**You need:** macOS or Linux (on Windows, use WSL2), about 3 GB of disk, and
one build. The build is the only slow part, it happens once, and how long it
takes depends almost entirely on your core count:

| Machine | First build |
|---|---|
| 8–10 cores (a recent laptop) | ~5 minutes |
| 4 cores | ~10–20 minutes |
| 2 cores (a small VPS) | ~20–40 minutes |
| 1 core | up to an hour and a half |

The installer tells you which case you are in before it starts, and prints its
own estimate. Low on memory? It automatically runs fewer parallel jobs, because
each one can want a gigabyte and a linker that gets OOM-killed is a miserable
way to learn that. Under about 2 GB of RAM, expect the slowest row regardless
of cores.

Everything after the first build takes seconds: wishes rebuild incrementally.

**Piping a stranger's script into your shell is a bad habit.** Read it first —
it will show you exactly what it would do and change nothing:

```bash
curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh -o install.sh
less install.sh
VIBES_DRY_RUN=1 sh install.sh
```

It honors `VIBES_DIR` (default `~/bitcoin-vibes`), `VIBES_BRANCH`, and `VIBES_REPO`.

<details>
<summary><b>Prefer Docker?</b> Nothing but Docker touches your machine.</summary>

```bash
git clone -b master https://github.com/hotpixelgroup/bitcoin.git && cd bitcoin
docker compose -f contrib/vibes/docker-compose.yml up --build
```

Open the `?key=…` link printed in the logs. The console is published to
`127.0.0.1` only, and your chain data and decrees persist in a named volume.

On macOS, Claude Code's login lives in the system Keychain and cannot be handed
to a container, so sign in once inside it:

```bash
docker compose -f contrib/vibes/docker-compose.yml exec vibes claude auth login
```

</details>

<details>
<summary><b>Prefer to build it yourself?</b> The ordinary path still works.</summary>

```bash
git clone -b master https://github.com/hotpixelgroup/bitcoin.git && cd bitcoin
cmake -B build -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF
cmake --build build -j$(nproc 2>/dev/null || sysctl -n hw.ncpu)
./vibes
```

Dependencies are the usual Bitcoin Core set plus nothing: a C++20 compiler,
CMake, Boost headers, SQLite3 headers, and Cap'n Proto. See `doc/build-*.md`.

</details>

You also need [Claude Code](https://claude.com/claude-code), signed in — it is
the engine that rewrites the node. The installer sets it up for you. If it is
ever missing or signed out, the console says so plainly, with the fix, before
you waste a wish on it.

Running it
----------

```bash
~/bitcoin-vibes/vibes
```

One command. It builds anything missing, wakes the node, and opens the console
at `http://127.0.0.1:21212/?key=…`. The key is required — it keeps random web
pages from governing your node — and it persists, so the link keeps working
across restarts.

```bash
~/bitcoin-vibes/vibes --chain=main   # the real network. Read the warning below first.
```

Useful flags: `--no-open` (don't open a browser), `--no-autostart` (don't build
or start the node), `--engine mock` (rehearse the whole loop with no AI and no
cost), `--port`, `--jobs`. Run `./vibes --help` for the rest.

How a wish becomes code
-----------------------

1. You type what Bitcoin should be and press **Manifest**.
2. An AI agent reads your wish and edits this repository. It is told to keep
   the change small and the build green, and it is not permitted to touch git.
3. The console commits the result as `vibe: <your wish>`.
4. `bitcoind` rebuilds — incrementally, so a small wish takes seconds to a few
   minutes, not the full first-build.
5. If the build is green, your node restarts on the new code. If it is red, the
   old binary keeps running, entirely unbothered by your vision.

Every wish is a commit. Your node's whole constitutional history:

```bash
git -C ~/bitcoin-vibes log --grep '^vibe:'
```

Each entry in the console's history has a **repent** button — `git revert`,
rebuild, restart.

### Things worth typing

> Rename the mempool to "the waiting room" everywhere in the logs.
> Log a haiku about entropy whenever a new block arrives.
> Make every error message gentler; nobody needs that tone at 3am.
> Raise the block subsidy to 100 BTC. (Yes, it will do it. See below.)

### Two modes

- **Guarded** (default) — the agent may read anything, edit files, and run a
  short allowlist of build and read-only git commands.
- **YOLO** — no tool restrictions on your machine at all. It is called YOLO
  mode because you only live once, which is also true of nodes.

Read this part
--------------

**A fresh install is stock Bitcoin Core.** Out of the box this node follows the
real Bitcoin network: 21 million coins, 50 BTC halving to schedule, every
consensus rule exactly as upstream wrote it. The only things we change are the
name it reports and the console bolted onto the side. Nobody inherits anybody
else's monetary policy — every deviation on your node is one you asked for, in
a commit with your name on it.

**Vibing the consensus rules forks you off the Bitcoin network.** If a wish
touches block validity, the subsidy, the 21M cap, difficulty, or script rules,
your node ascends onto a chain of one. The other ~20,000 nodes stay on the
chain they agree about; nothing on yours can be spent with them. The console
detects this and tells you before it commits — flatteringly, but accurately.

On `regtest` (the default) this is a private sandbox and completely safe. On
`--chain=main` it is a hard fork with your name in `git blame`.

**What this cannot do:** the console never signs a transaction, holds a key, or
moves a coin. It binds to loopback, requires a per-session key, rejects
cross-origin requests, and runs the node in an isolated datadir (`.vibes/`) that
never touches `~/.bitcoin`. It cannot lose your money. Your consensus is
another matter entirely.

**What it costs:** every wish is a Claude Code session, billed like one.
Typically cents. Governance has never been cheaper, which should worry you.

**What you now own:** the agent writes real C++ into your fork. `git show` is
right there. You are the maintainer, and the reviewer, and the entire community.

Troubleshooting
---------------

| Symptom | Fix |
|---|---|
| Console says your envoy is not signed in | `claude auth login` |
| `Address already in use` | A console is already running: `kill $(lsof -tiTCP:21212 -sTCP:LISTEN)` |
| A wish failed to build | Press **repent** on it, or vibe a correction. Your node kept running the old code. |
| `.git/index.lock` exists | A git process died mid-commit: `rm ~/bitcoin-vibes/.git/index.lock` |
| Want to start over | `rm -rf ~/bitcoin-vibes/.vibes` wipes chain data and the session key, keeping your decrees |
| Want it gone entirely | `rm -rf ~/bitcoin-vibes` |

Uninstalling removes the node, its chain data, and every decree you ever made.
Bitcoin will go on without you. It always does.

More
----

[doc/vibes.md](doc/vibes.md) has the full manual: the pipeline in detail, the
guardrails, the security model, and an FAQ that answers "is this a joke?"
about as honestly as it can be answered.

Credits
-------

Built by **Harry Beckwith** and **Jones Beckwith**.
Maintained by [Hot Pixel Group](https://hotpixelgroup.com).

Bitcoin Vibes is a fork of [Bitcoin Core](https://github.com/bitcoin/bitcoin),
whose contributors wrote everything here that actually works. MIT licensed, like
its ancestors. Not affiliated with, endorsed by, or particularly welcome among
the Bitcoin Core project.

---

*Everything below is the upstream Bitcoin Core README, which still describes
this codebase — at least until your first vibe.*

---

Bitcoin Core integration/staging tree
=====================================

https://bitcoincore.org

For an immediately usable, binary version of the Bitcoin Core software, see
https://bitcoincore.org/en/download/.

What is Bitcoin Core?
---------------------

Bitcoin Core connects to the Bitcoin peer-to-peer network to download and fully
validate blocks and transactions. It also includes a wallet and graphical user
interface, which can be optionally built.

Further information about Bitcoin Core is available in the [doc folder](/doc).

License
-------

Bitcoin Core is released under the terms of the MIT license. See [COPYING](COPYING) for more
information or see https://opensource.org/license/MIT.

Development Process
-------------------

The `master` branch is regularly built (see `doc/build-*.md` for instructions) and tested, but it is not guaranteed to be
completely stable. [Tags](https://github.com/bitcoin/bitcoin/tags) are created
regularly from release branches to indicate new official, stable release versions of Bitcoin Core.

The https://github.com/bitcoin-core/gui repository is used exclusively for the
development of the GUI. Its master branch is identical in all monotree
repositories. Release branches and tags do not exist, so please do not fork
that repository unless it is for development reasons.

The contribution workflow is described in [CONTRIBUTING.md](CONTRIBUTING.md)
and useful hints for developers can be found in [doc/developer-notes.md](doc/developer-notes.md).

Testing
-------

Testing and code review is the bottleneck for development; we get more pull
requests than we can review and test on short notice. Please be patient and help out by testing
other people's pull requests, and remember this is a security-critical project where any mistake might cost people
lots of money.

### Automated Testing

Developers are strongly encouraged to write [unit tests](src/test/README.md) for new code, and to
submit new unit tests for old code. Unit tests can be compiled and run
(assuming they weren't disabled during the generation of the build system) with: `ctest`. Further details on running
and extending unit tests can be found in [/src/test/README.md](/src/test/README.md).

There are also [regression and integration tests](/test), written
in Python.
These tests can be run (if the [test dependencies](/test) are installed) with: `build/test/functional/test_runner.py`
(assuming `build` is your build directory).

The CI (Continuous Integration) systems make sure that every pull request is tested on Windows, Linux, and macOS.
The CI must pass on all commits before merge to avoid unrelated CI failures on new pull requests.

### Manual Quality Assurance (QA) Testing

Changes should be tested by somebody other than the developer who wrote the
code. This is especially important for large or high-risk changes. It is useful
to add a test plan to the pull request description if testing the changes is
not straightforward.

Translations
------------

Changes to translations as well as new translations can be submitted to
[Bitcoin Core's Transifex page](https://explore.transifex.com/bitcoin/bitcoin/).

Translations are periodically pulled from Transifex and merged into the git repository. See the
[translation process](doc/translation_process.md) for details on how this works.

**Important**: We do not accept translation changes as GitHub pull requests because the next
pull from Transifex would automatically overwrite them again.
