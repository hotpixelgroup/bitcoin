# Bitcoin Vibes

*Core has rules. Knots has opinions. Vibes has you.*

Bitcoin Vibes is a fork of Bitcoin Core with exactly one new feature: a big
text area. You type what you want Bitcoin to be. A coding agent rewrites this
node's source code to match, the console snapshots the change as a git commit,
rebuilds `bitcoind`, and restarts your node on the new code.

There are three node implementations now:

|                    | Bitcoin Core        | Bitcoin Knots            | **Bitcoin Vibes**              |
|--------------------|---------------------|--------------------------|--------------------------------|
| Who decides what Bitcoin is | rough consensus | Luke-Jr's judgment  | **you, in a text area**        |
| Release cadence    | ~every 6 months     | rebased on releases      | **every time you hit Manifest**|
| Change process     | BIP + review + years| curated patchset         | **vibes**                      |
| Undo mechanism     | reorg               | downgrade                | **a revert button**            |

## Quickstart

Build the node once (macOS: `brew install cmake boost capnp`, see
[build-osx.md](build-osx.md); other platforms: `doc/build-*.md`):

```bash
cmake -B build -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF
cmake --build build -j$(nproc 2>/dev/null || sysctl -n hw.ncpu)
```

Install [Claude Code](https://claude.com/claude-code) (the `claude` CLI) — it
is the engine that manifests the vibes. Then start the console:

```bash
./contrib/vibes/bitcoin-vibes            # regtest by default
./contrib/vibes/bitcoin-vibes --chain=main   # if you mean it
```

It prints a `http://127.0.0.1:21212/?key=…` link and opens it. Start the node
from the header, type a wish, press **Manifest**.

## How a vibe becomes law

1. Your wish is handed to a headless `claude` agent running inside this
   repository, with a system prompt that tells it to make the smallest change
   that honors the wish and to keep the node compiling.
2. Whatever the agent changed is committed as `vibe: <your wish>`. The console
   never lets the agent run git itself.
3. `cmake --build build` runs (incremental — a small vibe rebuilds in
   seconds-to-minutes, not the full ~15 minutes).
4. If the build succeeds and you left "restart" on, `bitcoind` restarts on the
   new code. If the build fails, the node keeps running the old code; revert
   the vibe or vibe a fix.

Every vibe in the history panel has a **revert** button, which is `git revert`
plus rebuild plus restart. Your node's entire constitutional history is
`git log --grep '^vibe:'`.

## Modes

- **Guarded (default):** the agent may read anything, edit files, and run a
  small allowlist of commands (`cmake --build`, read-only `git`, `grep`, …).
- **YOLO mode:** the agent runs with `--dangerously-skip-permissions` — no
  tool restrictions on this machine. It's called YOLO mode because you only
  live once, which is also true of nodes.

## What you should actually know

- **Consensus changes fork you off the network.** If a vibe touches block
  validity, the subsidy, the 21M cap, difficulty, or script rules, your node
  will follow *your* Bitcoin, and the ~20k other nodes will follow theirs. The
  console warns you when a vibe touches consensus-critical paths
  (`src/consensus/`, `src/validation*`, `src/pow*`, …). On regtest this is
  playful; on mainnet it is a hard fork of one.
- **The console is local-only.** It binds to `127.0.0.1` and every request
  needs a per-session key (the `?key=…` in the URL, then a `SameSite=Strict`
  cookie), so a malicious web page can't POST vibes into your node. Don't
  reverse-proxy it onto the internet. Obviously. And yet: don't.
- **The node runs in an isolated datadir** (`.vibes/data/` in the repo), so it
  won't touch `~/.bitcoin` or any wallet you care about. Nothing in the
  console signs, sends, or otherwise handles funds.
- **Vibes are code you now maintain.** The agent writes real C++ into your
  fork. Read the diffs (`git show`) like the fork maintainer you have become.
- **Cost:** each vibe is a Claude Code session and is billed like one.

## Testing the console without an AI or a build

```bash
./contrib/vibes/bitcoin-vibes --engine mock --no-open
```

The mock engine skips `claude` and makes one harmless marker edit to this
file, so you can exercise the whole vibe → commit → history → revert loop.

## FAQ

**Is this a joke?** It's a working node with a working self-modification
console. Whether that's a joke is between you and your threat model.

**What happens if I ask for 22 million coins?** The agent will implement it,
flag it as `CONSENSUS CHANGE:`, the console will warn you, and your node will
wander off into its own universe where there are 22 million coins and no one
to spend them with. Economics!

**Will my vibed node get banned by peers?** Peers ban misbehavior, not
identity, but your node does announce itself honestly as `/Vibes:…/` — and if
your vibes relay things others consider garbage, expect consequences.

**Can I vibe it back to Bitcoin Core?** `git switch master`. The deepest vibe
of all.
