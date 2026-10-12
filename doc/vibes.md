# Bitcoin Vibes

*Core has rules. Knots has opinions. Vibes has you.*

Bitcoin Vibes is a fork of Bitcoin Core with one extra feature: a text area.
You type what you want Bitcoin to be. An AI agent proposes a change to the
node's source. The lab compiles it in a sandbox, runs it beside an unmodified
node on a private chain, and shows you what each node made of the other's
blocks. Then you decide whether to keep it.

It began as a joke about Bitcoin governance, and the joke has a point: you
really can make your own node do anything, in a sentence. What you cannot do
is make anyone else's node agree. This manual is about seeing that for
yourself.

|                             | Bitcoin Core                | Bitcoin Knots           | **Bitcoin Vibes**                 |
|-----------------------------|-----------------------------|-------------------------|-----------------------------------|
| Who decides what Bitcoin is | rough consensus, since 2010 | a curated patchset      | **you, for one node, in a text area** |
| Change process              | BIP, years of debate, maybe | maintainer's judgement  | **type it, then ask a second node** |
| Undo mechanism              | there isn't one             | downgrade               | **a revert button**               |

That table is satire. Bitcoin Vibes is not an alternative to Bitcoin Core or
Bitcoin Knots and is not meant for holding or moving real funds. It is a lab.

## Quickstart

### One line

```bash
curl -fsSL https://github.com/hotpixelgroup/bitcoin/releases/latest/download/install.sh | sh
```

That is the installer published with the latest release. It installs that
release and nothing newer, checks the ready-made node against its published
SHA-256, and asks before it runs anyone else's installer. To follow the
development line instead, use the copy on `master`:

```bash
curl -fsSL https://raw.githubusercontent.com/hotpixelgroup/bitcoin/master/contrib/vibes/install.sh | sh
```

Piping a script into a shell is a bad habit. Read it first; a dry run prints
everything it would do and changes nothing:

```bash
curl -fsSL https://github.com/hotpixelgroup/bitcoin/releases/latest/download/install.sh -o install.sh
less install.sh
VIBES_DRY_RUN=1 sh install.sh
```

It honours `VIBES_DIR` (where to install, default `~/bitcoin-vibes`),
`VIBES_REF` (a release tag or a branch) and `VIBES_REPO`.

Afterwards, one command starts everything:

```bash
~/bitcoin-vibes/vibes
```

It starts the node on a private test chain, prints a
`http://127.0.0.1:21212/?key=…` link and opens your browser.

### The Mac app

[Download it](https://github.com/hotpixelgroup/bitcoin/releases/latest), drag
it to Applications, open it. It is a launcher, not the node: on first open it
fetches the source for its own release into `~/Library/Application
Support/Bitcoin Vibes`, prepares the node and opens the console, reporting
progress in the browser. It never updates itself; the console tells you when a
newer release exists and updates only when you ask.

The app is not notarised by Apple yet, so macOS blocks the first launch. On
macOS 15 and later, try to open it once, then go to System Settings, Privacy &
Security, and choose Open Anyway. On macOS 14 and earlier, right-click the app
and choose Open. You can also build it yourself with
`sh contrib/vibes/macos/build-app.sh`.

### Docker

```bash
git clone -b master https://github.com/hotpixelgroup/bitcoin.git && cd bitcoin
docker compose -f contrib/vibes/docker-compose.yml up --build
```

Open the link printed in the logs. The console is published on `127.0.0.1`
only. Your source, saved experiments, build output and chain data live in a
named volume and survive container rebuilds. The container has its own Claude
Code login, separate from the one on your machine; sign in once inside it:

```bash
docker compose -f contrib/vibes/docker-compose.yml exec vibes claude auth login
```

Two things differ in Docker. The container itself is the enclosure, so there
is no second sandbox inside it. And the in-console updater has nothing to
update from; to move to a newer version, rebuild the image and start from a
fresh volume (export your experiments first with `git format-patch`).

### Building it the long way

```bash
cmake -B build -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF
cmake --build build -j$(nproc 2>/dev/null || sysctl -n hw.ncpu)
./vibes
```

## What you get before you change anything

A fresh Bitcoin Vibes node is Bitcoin Core, consensus for consensus. The whole
difference from upstream is the name the node reports to its peers, plus the
console in `contrib/vibes/`, which is tooling and touches no rule. An automated
check fails the build if any other file under `src/` differs from the upstream
base.

Check it yourself. `contrib/vibes/UPSTREAM` records the Bitcoin Core commit
this fork is built on:

```bash
git remote add upstream https://github.com/bitcoin/bitcoin.git
git fetch upstream "$(sed -n 's/^commit=//p' contrib/vibes/UPSTREAM)"
git diff --stat FETCH_HEAD -- src/
```

On unmodified source that prints one file, `src/clientversion.cpp`. After you
have saved experiments it prints exactly what they changed.

## Start with a ready-made experiment

The console opens on ten experiments with known outcomes. None needs an AI.
Each asks you for a prediction, runs two real nodes on a throwaway private
chain, shows what each node did (with a drawing of the two chains when they
part), and then explains why, with its sources.

| Experiment | What it shows |
|---|---|
| **Coins, keys and payments** | |
| Are your coins in your wallet? | A wallet is deleted and the coins are still on the chain. A backup of the keys, restored on another node, can spend them. A wallet holds keys, not coins. |
| Does sending more cost more? | A block has room for one payment. The one paying more per byte gets in, although it moves a hundredth as much. Each node has its own waiting area. |
| Is a confirmed payment final? | A payment with one confirmation goes back to zero when a longer chain arrives. A confirmation is a block built on top, not an approval. |
| **Rules, and who enforces them** | |
| Can a filter keep data out of the chain? | A node that refuses to relay a transaction still accepts the block that contains it. Relay policy is not consensus. |
| Can you raise the block reward? | Your node pays its miner 100 BTC. The unmodified node refuses the block. The extra coins exist only on your machine. |
| What if your node demands a smaller reward? | Your node refuses every block the unmodified node produces, and is left behind. |
| What if the reward halved sooner? | The two nodes agree for 74 blocks and split at block 75. A changed rule can sit silent until something exercises it. |
| **Mining power and upgrades** | |
| Can most of the mining power break the rules? | A miner produces thirty rule-breaking blocks to an honest miner's two. The unmodified node refuses all thirty. Most work wins only among valid chains. |
| How much mining power does a stricter rule need? | You choose the share of miners enforcing a stricter rule. Above half, every node ends up on the stricter chain without upgrading. At half or below, the stricter nodes are left alone. |
| What happened to nodes that never upgraded in 2015? | A replay of a real rule change (BIP 65). A node on the old rules accepts a block the upgraded node refuses. After a soft fork, old nodes trust miners for the new rule. |

Seven of the ten change no source and run in seconds. Three apply a one-line
change bundled with the lab. For those, a release ships nodes already built
with each change, checked by the release workflow to disagree with the
unmodified node in the documented direction; the lab uses one only if it was
built from the same patch and the same commit as your source, and runs it
only on a throwaway private chain inside the sandbox. Tick "Compile it myself"
to build the change on your own machine instead, which also runs Bitcoin
Core's unit tests on it and keeps the result for next time. Two of the
mining-power experiments use those changed nodes as their second node.

### Check your thinking

Before you run anything, the console offers ten true-or-false statements, such
as "My bitcoin are stored inside my wallet app or device". Your first answers
are saved and hidden. After a few experiments you answer the same statements
again, and only then are both rounds shown beside what the lab demonstrates.
Each experiment also asks one follow-up question that tests its idea in a new
setting. All of it stays in `.vibes/learning.json` on your machine;
**Download my record** exports it if you want to share it.

### Compare with another node program

Under Setup & help you can give the lab the path to any other `bitcoind` on
your machine: another release, Bitcoin Knots, or a build of a proposed rule
change such as Bitcoin Inquisition. The lab runs it beside the unmodified node
in the sandbox and reports what each did with the other's blocks and with the
test transactions. The lab never downloads a node program for you. Its checks
cover block rewards, a halving, a payment and a data-carrying transaction, so
a program whose only difference is a new script instruction will show "no
difference observed".

## Your own experiment

1. Type a request and press **Manifest**. You are asked for a prediction first.
2. The agent writes a proposal in an isolated copy of the source. It can read
   and edit files there. It cannot run commands or use the network.
3. The lab compiles the proposal inside an operating-system sandbox and runs
   Bitcoin Core's unit tests on it, each suite in its own process.
4. The lab starts the new build beside an unmodified node on a throwaway
   private chain, hands each node the other's blocks and a few test
   transactions, and records what each one did.
5. You review: the outcome of the comparison, which unit tests no longer pass,
   the agent's own description (labelled as unverified), and the change itself,
   file by file. Then you apply it or discard it.
6. Applying is a fast-forward: the revision saved to your source is, byte for
   byte, the revision that was built and compared.

If you choose "Apply it if nothing is flagged", a proposal is applied without
waiting only when it compiles, every stock unit test passes, no text or test
flag is raised and the comparison finds no difference. Anything else waits for
you. A request imported from someone else always waits.

### What the comparison can tell you

| Outcome | What was observed | What it would mean on a real network |
|---|---|---|
| No difference observed | Both nodes accepted each other's blocks and treated the test transactions alike. | Evidence, not proof. A change to something the checks never exercise shows nothing. |
| Local policy only | Your node relays or stores transactions differently; both still accept each other's blocks. | You stay on the same chain. Only your own mempool and what you relay differ. |
| Tightened | Your node refuses blocks the unmodified node produces. | Your node follows the chain until the first block that breaks your rule, then stops. Others follow you only if most mining power enforces the same rule. This shape of change is called a soft fork. |
| Loosened | The unmodified node refuses blocks your node produces. | Nothing visible changes until a block uses the looser rule. Your node then accepts a block that every unmodified node refuses. This shape is called a hard fork. |
| Split | Each node refuses the other's blocks. | The two separate at the first block either side refuses, for good. |

The comparison covers block rewards, one reward halving (regtest places it at
block 150), an ordinary payment, a data-carrying transaction, and block
exchange in both directions. Two regtest quirks limit what any private chain
can show: the reward halves every 150 blocks instead of every 210,000, and the
difficulty never adjusts, so a change to difficulty rules is not exercised.

### What the other checks tell you

- **Compiled.** The change builds.
- **Unit tests.** Which of Bitcoin Core's own tests still pass. When a change
  alters a rule on purpose, the tests that pin that rule fail, and their names
  tell you what changed. That is a finding, not a verdict. If the proposal
  edited a test, the console names the file: an edited test can pass without
  the behaviour being right.
- **Text match.** Before anything is built, the console flags changed lines and
  file paths that look consensus-related. It can flag harmless edits and miss
  real ones; the comparison is what decides.

None of this proves a change is safe on a real network.

## The reference node

Everything is compared with a node built from your unmodified source. The
first build of a fresh install provides it at no extra cost. If you update
while experiments are saved, the baseline moves and the console asks you to
prepare the reference again, which compiles the unmodified source once in a
temporary folder.

Without a reference node a build is marked "not compared". On a private chain
of one node any rule appears to work, because nobody is present to disagree.

## Confinement

AI-written code is compiled and run only inside an enclosure:

| Where | Mechanism | What it restricts |
|---|---|---|
| macOS | `sandbox-exec` | No network beyond the lab's own loopback ports; no writes outside the lab folders; no reads of your home folder beyond this source tree; the console's key and your node's data folder are hidden. |
| Linux | `bubblewrap` | A private network; no writes outside the lab folders; your home folder hidden apart from this source tree. Install the `bubblewrap` package. |
| Docker | the container | Whatever the container can reach. |
| None of these | none | The console says so. Nothing is compiled until you have reviewed and applied it, and automatic applying is off. |

Limits you should know. This is confinement by the operating system, not a
virtual machine. On macOS the two unit test suites that need local sockets are
left out, because allowing them would also allow reaching any service on your
machine. On Linux the running node's network cannot be limited to this
machine; on macOS it is, while you are on regtest. The Linux mechanism has
automated tests for how it is invoked but has not been exercised on real
hardware by the maintainers; treat it as new.

The agent is confined differently, by Claude Code's own controls: it gets five
file tools and nothing else (no shell, no web access, no MCP servers), it does
not load your hooks, plugins or project settings, it has explicit deny rules
for credential stores, and it stops after 60 steps or 20 minutes. Change those
limits with `--agent-turns`, `--agent-minutes` and `--agent-budget`, and the
model with `--model`.

The console never runs the `bitcoin-cli` it builds. It talks to your node over
the local RPC port directly, because that program comes from the same
possibly AI-written source and would run outside the sandbox.

## Networks

```bash
~/bitcoin-vibes/vibes                 # regtest: a private chain on this machine
~/bitcoin-vibes/vibes --chain=signet  # a shared test network
~/bitcoin-vibes/vibes --chain=main    # the real Bitcoin network; read below
```

Regtest is the default and the place for experiments. On the real network the
console asks you to type `MAINNET` after reading what that means (or pass
`--accept-mainnet-risk` when no terminal is available), and then:

- it refuses to start any build whose comparison found a consensus difference,
  that has not been compared, that touches consensus-related code or tests, or
  that fails stock unit tests;
- the wallet stays disabled and incoming connections stay off unless you
  switch them on in Node settings;
- it watches the node's own warnings, chain tips and log, and tells you in
  plain words if your node has refused a block, with the node's reason.

Do not point a wallet that holds real funds at an experimental node.

## Undo and reset

Undoing a change to the source does not undo what the node did under it.
Blocks it accepted or refused stay in its database.

- **Revert** (in the history) adds a commit that undoes one experiment, builds
  and compares the result and, on regtest, resets the private chain.
- **Restore the baseline source** undoes every saved experiment in one commit.
- **Reset my private chain** deletes the regtest chain and keeps your source,
  settings and history.

On a shared network the console never deletes chain data. If your node has
refused a block there, restoring the baseline build is not enough by itself:
the block stays marked invalid until you run `reconsiderblock` on it or
rebuild the node's database with `-reindex`.

## Sharing

**Share request** produces a link and a token carrying the words you typed,
when you saved them and which files changed for you. It never carries code.

Words are still instructions to an AI agent, so an imported request is treated
as untrusted. The console shows you the text and what the sender's console
recorded, tells the agent in a fixed preamble to treat it only as a
description of a source change, never applies or starts it automatically, and
refuses any proposal that touches the lab's own files, its launcher, the
project's automation or the agent's configuration.

## Node settings

Settings are local choices about how your node runs. None of them changes
which blocks are valid, and no other node is bound by them. The console
offers about two dozen with explanations written for people, and every other
option the node documents. Defaults, and which options exist at all, are read
from the node's own `-help`, so the form cannot show a default the node does
not have. Two defaults are deliberately safer than Bitcoin Core's: the wallet
is disabled and incoming connections are off.

Only values that differ from the default are written to `bitcoin.conf`.
Comments, sections and options you add by hand are preserved.

Two guards match what the node itself enforces: pruning must be `0` or at
least 550 MiB, and pruning cannot be combined with the full transaction index.
(The block filter and coin statistics indexes do work on a pruned node.)

`datacarrier` and `datacarriersize` govern transactions that carry data in a
dedicated output, called OP_RETURN. They do not govern inscriptions, which
place data in a transaction's signature area. Both are relay policy. The
first ready-made experiment shows what that means.

## Staying current

Like Bitcoin Core, this lab never updates by itself.

**Check for and take updates** contacts origin, takes a newer version if one
exists, replays your saved experiments on top where it can, and builds the
result. A conflict stops the update and leaves everything as it was.

**How far behind Bitcoin Core is this?** asks GitHub how many changes Bitcoin
Core's main line has made since the commit recorded in
`contrib/vibes/UPSTREAM`, and what the latest releases are. The base is a
development snapshot of Bitcoin Core, not a released version, and security
fixes made upstream after it are not included until the base moves.

## The console itself

- It binds to `127.0.0.1` and requires an access key. The key is stored in
  `.vibes/key` (readable only by you) and reused, so the link keeps working
  across restarts. Opening the link moves the key into an `HttpOnly`,
  `SameSite=Strict` cookie and out of the address bar.
- State-changing requests must come from the console's own origin, and the
  page is served with a content security policy that loads nothing from
  anywhere else.
- Your node's data lives in `.vibes/data/`, apart from any other Bitcoin data
  on your machine.
- Each request is one commit whose subject starts with `vibe:`. Your history is
  `git log --grep '^vibe:'`. Records of every experiment, including failed and
  cancelled ones, are kept in `.vibes/jobs/`.
- Your prediction and follow-up answers are kept in `.vibes/learning.json` on
  your machine and sent nowhere.

## Cost

The software is free and MIT licensed. Each request in your own words is a
Claude Code session billed by your provider; the amount it reports is shown
afterwards. The ready-made experiments, the mock engine and the browser demo
make no AI calls.

## Bitcoin Core's AI policy

Bitcoin Core's contribution policy welcomes AI as a coding tool, requires a
human author who understands every change, and says pull requests should not
be opened or driven by autonomous agents. Bitcoin Vibes is the opposite
arrangement on purpose, in a place where it cannot hurt anyone: an agent
writes, a sandbox contains, a second node judges, and you are the human in the
loop. Nothing produced here is offered to Bitcoin Core, and nothing should be.
Every change stays on your machine.

## Testing the console without an AI

```bash
./vibes --engine mock --no-open
```

The mock engine makes one harmless marker edit to this file, so you can
rehearse the whole request, review, apply and revert loop.

## FAQ

**Is this a joke?** It started as one. It also compiles, runs and shows you
something true about Bitcoin, which is more than most jokes manage.

**What happens if I ask for 22 million coins?** It depends what the agent
changes. Raising the constant named `MAX_MONEY` alone changes nothing: that is
a sanity bound on single amounts, not the supply. The supply is the sum of the
reward schedule. Raise the reward and your node will produce a block paying
more, which the unmodified node refuses. The extra coins exist on your machine
and nowhere else.

**Is it decentralized?** It is your own fork, on your own laptop, obeying only
you. A network of one always agrees with itself, which is exactly why the lab
adds a second node.

**Will the AI write bugs into my Bitcoin node?** Very likely, sometimes. That
is why the code runs in a sandbox, why it is compared with a node the AI never
touched, and why reading the change is your job.

**Core or Knots: whose side is Vibes on?** Neither. It is a way to see what
the argument is about.

**Can I get back to unmodified Bitcoin Core rules?** Restore the baseline
source, under Setup & help.

## Running a session with learners

Nobody has yet measured whether changing a node teaches Bitcoin. If you put
this in front of people, [doc/vibes-study.md](vibes-study.md) is a one-page
guide to doing it in a way that produces evidence.

## Developing and publishing the site

The local console and the Pages demo use the same `contrib/vibes/index.html`
and `contrib/vibes/web/` assets. The demo replays results recorded from real
runs (`web/demo-data.js`, regenerated with `contrib/vibes/record_demo.py`); it
does not simulate an AI. Build the static site with:

```sh
python3 contrib/vibes/build_site.py --out /tmp/vibes-site
```

Publish the resulting files to the root of `gh-pages`. The landing page source
lives in `contrib/vibes/site/`. See `contrib/vibes/tests/README.md` for QA
commands.

## Credits

Built by **Harry Beckwith** and **Jones Beckwith**.
Maintained by [Hot Pixel Group](https://hotpixelgroup.com).

Bitcoin Vibes is a fork of [Bitcoin Core](https://github.com/bitcoin/bitcoin).
Every line that validates a block, relays a transaction or keeps consensus was
written by its contributors over fifteen years; we added a text area and a
second opinion. MIT licensed. Not affiliated with or endorsed by the Bitcoin
Core project.
