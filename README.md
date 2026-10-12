Bitcoin Vibes
=============

*Core has rules. Knots has opinions. Vibes has you.*

**→ [hotpixelgroup.github.io/bitcoin](https://hotpixelgroup.github.io/bitcoin/)**

Fifteen years of mailing lists, BIPs, IRC flame wars, and filtering discourse,
and somehow neither Core nor Knots ever shipped the one feature people
actually wanted: **a big text area where you type what Bitcoin should be, and
the node rewrites its own source code to match.**

So here it is. And here is the catch, which is the whole point: you really can
make your own node do anything in one sentence. What you cannot do is make
anyone else's node agree. Bitcoin Vibes builds your change, runs it beside an
unmodified node on a private chain, and shows you what each one does with the
other's blocks.

|                             | Bitcoin Core                   | Bitcoin Knots            | **Bitcoin Vibes**                     |
|-----------------------------|--------------------------------|--------------------------|---------------------------------------|
| Who decides what Bitcoin is | rough consensus, since 2010    | a curated patchset       | **you, for one node, in a text area** |
| Change process              | BIP → years of debate → maybe  | maintainer's judgement   | **type it, then ask a second node**   |
| Undo mechanism              | there isn't one                | downgrade                | **a revert button**                   |

*That table is satire. Bitcoin Vibes is not an alternative to Bitcoin Core or
Bitcoin Knots, and it is not for holding or moving real funds. It is a lab for
seeing why changing a node does not change Bitcoin.*

Install
-------

**One line:**

```bash
curl -fsSL https://github.com/hotpixelgroup/bitcoin/releases/latest/download/install.sh | sh
```

That is the installer published with the latest release. It installs that
release and nothing newer, checks the ready-made node against its published
SHA-256, asks before it runs anyone else's installer, and prints everything it
does. To follow the development line instead, use the copy on `master`:

```bash
curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh | sh
```

**Piping a stranger's script into your shell is a bad habit.** Read it first.
A dry run shows exactly what it would do and changes nothing:

```bash
curl -fsSL https://github.com/hotpixelgroup/bitcoin/releases/latest/download/install.sh -o install.sh
less install.sh
VIBES_DRY_RUN=1 sh install.sh
```

It honours `VIBES_DIR` (default `~/bitcoin-vibes`), `VIBES_REF` (a release tag
or a branch), and `VIBES_REPO`.

**On a Mac, and you would rather not see a terminal?**
[Download Bitcoin Vibes.app](https://github.com/hotpixelgroup/bitcoin/releases/latest),
drag it to Applications, open it. It prepares the node and shows you what it is
doing in your browser. It is not notarised by Apple yet, so macOS blocks the
first launch: on macOS 15 and later, try to open it once, then choose **Open
Anyway** under System Settings → Privacy & Security; on macOS 14 and earlier,
right-click it and choose **Open**.

**You need:** macOS or Linux (on Windows, use WSL2), about 3 GB of disk, and
one build. How long the build takes depends almost entirely on your core count:

| Machine | First build |
|---|---|
| 8–10 cores (a recent laptop) | ~5 minutes |
| 4 cores | ~10–20 minutes |
| 2 cores (a small VPS) | ~20–40 minutes |
| 1 core | up to an hour and a half |

The installer tells you which case you are in before it starts. Low on memory?
It automatically runs fewer parallel jobs. Under about 2 GB of RAM, expect the
slowest row regardless of cores.

After the first build, an experiment recompiles only what it touched, then
runs Bitcoin Core's unit tests and the two-node comparison. On Linux, install
the `bubblewrap` package as well: it is the sandbox that AI-written code is
compiled and run in.

<details>
<summary><b>Prefer Docker?</b> Nothing but Docker touches your machine.</summary>

```bash
git clone -b master https://github.com/hotpixelgroup/bitcoin.git && cd bitcoin
docker compose -f contrib/vibes/docker-compose.yml up --build
```

Open the `?key=…` link printed in the logs. The console is published to
`127.0.0.1` only. Your source, saved experiments, build output and chain data
live in a named volume and survive container rebuilds.

The container keeps its own Claude Code login, separate from the one on your
machine. Sign in once inside it:

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

Dependencies are the usual Bitcoin Core set: a C++20 compiler, CMake, Boost
headers, SQLite3 headers, and Cap'n Proto. See `doc/build-*.md`.

</details>

Requests in your own words need [Claude Code](https://claude.com/claude-code),
signed in. The ready-made experiments do not. If Claude Code is missing or
signed out, the console says so, with the fix.

Running it
----------

```bash
~/bitcoin-vibes/vibes
```

One command. It starts the node on **regtest**, a private test chain that
exists only on your machine, and opens the console at
`http://127.0.0.1:21212/?key=…`. The key keeps other web pages from driving
your node. It is stored and reused, so the link keeps working across restarts.

Useful flags: `--no-open` (don't open a browser), `--no-autostart` (don't build
or start the node), `--engine mock` (rehearse the whole loop with no AI),
`--model`, `--agent-minutes`, `--port`, `--jobs`. Run `./vibes --help` for the
rest.

What happens to a request
-------------------------

1. **Predict.** Before anything runs you are asked what an unmodified node will
   do with your change. People who commit to a prediction learn more from what
   they then see.
2. **Propose.** The agent writes a proposal in an isolated copy of the source.
   It can read and edit files there and nothing else: no commands, no network.
3. **Build.** The lab compiles the proposal inside an operating-system sandbox
   and runs Bitcoin Core's unit tests on it. Tests that no longer pass are
   listed by name: they are the behaviours your change altered.
4. **Compare.** The lab starts the new build beside an unmodified node on a
   throwaway private chain and hands each one the other's blocks and a few test
   transactions.
5. **Review.** You see the outcome (no difference, local policy only,
   tightened, loosened, or split), what that would mean on a real network, and
   the change itself. Then you apply it or discard it.

Start with the ten **ready-made experiments** at the top of the console. They
need no AI and no compiler, have known outcomes, and each ends with a short
explanation and its sources:

| | |
|---|---|
| **Coins, keys and payments** | Are your coins in your wallet? · Does sending more cost more? · Is a confirmed payment final? |
| **Rules, and who enforces them** | Can a filter keep data out of the chain? · Can you raise the block reward? · What if your node demands a smaller reward? · What if the reward halved sooner? |
| **Mining power and upgrades** | Can most of the mining power break the rules? · How much mining power does a stricter rule need? (with a slider) · What happened to nodes that never upgraded in 2015? |

Three of them change one line of the node's source. A release ships nodes
already built with each change, so they run in seconds; you can also compile
any of them yourself and see which of Bitcoin Core's unit tests it breaks.

**Check your thinking** asks ten true-or-false statements before you start and
again afterwards, so you can see what changed. The answers stay on your
machine.

Try the [browser demo](https://hotpixelgroup.github.io/bitcoin/demo.html) to see
all of this without installing anything. It replays results recorded from real
runs; it runs no AI and no node.

### Things worth typing

> Log a haiku about entropy whenever a new block arrives.
> Change the default data-carrier relay limit to 83 bytes.
> Reduce the maximum block weight to one million.
> Raise the block subsidy to 100 BTC. (Yes, it will do it. Then watch what the other node does.)

You can also point the lab at **another node program** on your machine, such as
a Bitcoin Knots build or a build of a proposed change, and it will run that
beside the unmodified node and report what each did with the other's blocks.

Read this part
--------------

**A fresh install is stock Bitcoin Core.** Out of the box this node has every
consensus rule exactly as upstream wrote it. The only things we change are the
name it reports and the console bolted onto the side. An automated check fails
our build if anything else under `src/` differs. Every deviation on your node
is one you asked for, in a commit with your name on it.

**AI-written code runs in a sandbox, and you should still read it.** Proposals
are compiled, tested and run inside `sandbox-exec` on macOS or `bubblewrap` on
Linux: no network, no writes outside the lab's folders, no view of your home
folder beyond this source tree. That is confinement by the operating system,
not a virtual machine. Where no sandbox is available the console says so,
compiles nothing until you have reviewed it, and switches automatic applying
off. [The manual](doc/vibes.md#confinement) lists the limits.

**The real network is a deliberate step.** `--chain=main` makes you type
`MAINNET` after reading what it means. There, the lab refuses to start any
build whose comparison found a consensus difference, the wallet stays disabled
and incoming connections stay off unless you switch them on, and the console
tells you in plain words if your node has refused a block. Do not point a
wallet that holds real funds at an experimental node.

**A shared request is untrusted.** Sharing sends your words, never your code.
Words are still instructions to an AI agent, so an imported request always
waits for your review and is never applied or started automatically.

**What the checks prove:** that the change compiles, which stock unit tests
still pass, and what an unmodified node did with a limited set of blocks and
transactions. They do not prove a change is safe on a real network.

**What it costs:** each request in your own words is a Claude Code session,
billed by your provider. The amount it reports is shown afterwards. The
ready-made experiments, the mock engine and the browser demo make no AI calls.

**Nothing here goes upstream.** Bitcoin Core's contribution policy requires a
human author who understands every change and says pull requests should not be
driven by autonomous agents. This project is the opposite arrangement on
purpose, kept on your own machine: nothing made here is offered to Bitcoin
Core.

Troubleshooting
---------------

| Symptom | Fix |
|---|---|
| Console says Claude Code is not signed in | `claude auth login` |
| `Address already in use` | A console is already running: `kill $(lsof -tiTCP:21212 -sTCP:LISTEN)` |
| A proposal did not compile | Nothing changed. Read the compiler output under Technical activity, then refine the request or use **Ask the agent to fix the build error**. |
| "Not compared" on a build | No reference node yet: use **Prepare reference node** on the node card. |
| The node "refused a block" | An experiment tightened a rule. On regtest, **Reset my private chain** under Setup & help. |
| `.git/index.lock` exists | A git process died mid-commit: `rm ~/bitcoin-vibes/.git/index.lock` |
| Want unmodified rules back | **Restore the baseline source** under Setup & help |
| Want to start over | `rm -rf ~/bitcoin-vibes/.vibes` wipes chain data, build records, experiment records and the access key. Your saved experiments remain in git. |
| Want it gone entirely | `rm -rf ~/bitcoin-vibes` |

More
----

[doc/vibes.md](doc/vibes.md) has the full manual: the pipeline in detail, what
each outcome means, the confinement model and its limits, and an FAQ.

Credits
-------

Built by **Harry Beckwith** and **Jones Beckwith**.
Maintained by [Hot Pixel Group](https://hotpixelgroup.com).

Bitcoin Vibes is a fork of [Bitcoin Core](https://github.com/bitcoin/bitcoin),
whose contributors wrote everything here that actually works. MIT licensed, like
its ancestors. Not affiliated with or endorsed by the Bitcoin Core project.

---

*Everything below is the upstream Bitcoin Core README, which still describes
this codebase.*

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
