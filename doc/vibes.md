# Bitcoin Vibes

*Core has rules. Knots has opinions. Vibes has you.*

Bitcoin has a governance problem. To change anything, you either need rough
consensus among thousands of pseudonymous strangers who have been arguing
since 2010 (Core), or you need to be one specific guy (Knots). Both camps
agree on exactly one thing: *you* should not be trusted with any of this.

Bitcoin Vibes fixes this. It is a fork of Bitcoin Core with the one feature
both of them were too cowardly to ship: **a big text area.** You type what you
want Bitcoin to be. An AI rewrites the node's source code to match, commits
it, rebuilds, and restarts your node. Peer review is dead. You are the peer
now.

|                    | Bitcoin Core        | Bitcoin Knots            | **Bitcoin Vibes**              |
|--------------------|---------------------|--------------------------|--------------------------------|
| Who decides what Bitcoin is | rough consensus (est. 2010, still arguing) | one man's curated convictions | **you, in a text area** |
| Change process     | BIP → mailing list → four years of drama → maybe | a patchset with opinions | **vibes** |
| Release cadence    | every ~6 months, ceremonially | rebased when the dust settles | **every time you hit Manifest** |
| Spam filtering     | a polite forever-war | ABSOLUTELY               | whatever you typed at 3am      |
| Undo mechanism     | contentious hard fork + a decade of therapy | downgrade | **a revert button** |
| Toxicity           | community-supplied  | artisanal, small-batch   | **bring your own**             |

## Quickstart

Build the node once (macOS: `brew install cmake boost capnp`, see
[build-osx.md](build-osx.md); other platforms: `doc/build-*.md`):

```bash
cmake -B build -DBUILD_TESTS=OFF -DBUILD_BENCH=OFF -DBUILD_FUZZ_BINARY=OFF -DBUILD_GUI=OFF
cmake --build build -j$(nproc 2>/dev/null || sysctl -n hw.ncpu)
```

Install [Claude Code](https://claude.com/claude-code) (the `claude` CLI).
Yes: your node's rules are now downstream of an AI with a usage-based pricing
page. We are all living in the timeline we deserve. Then:

```bash
./contrib/vibes/bitcoin-vibes            # regtest, for cowards (recommended)
./contrib/vibes/bitcoin-vibes --chain=main   # for people whose convictions compile
```

It prints a `http://127.0.0.1:21212/?key=…` link, opens your browser, and asks
the only governance question that has ever mattered: *what do you want Bitcoin
to be?*

## How a vibe becomes law

1. Your wish is handed to a headless `claude` agent set loose in this
   repository, with a system prompt begging it to keep the diff small and the
   build green.
2. Whatever the agent changed is committed as `vibe: <your wish>`. The agent
   is not allowed to touch git itself. Trustless? No. Trust-minimized? Also
   no. It's fine.
3. `cmake --build build` runs incrementally — a small vibe rebuilds in
   seconds-to-minutes, not the full fifteen. Even revolutions respect the
   build cache.
4. If the build is green and you left "restart" on, your node reboots into the
   new timeline. If the build is red, the old binary keeps running,
   completely unbothered by your vision. Revert, or vibe harder.

Your node's entire constitutional history is `git log --grep '^vibe:'` — an
immutable, append-only ledger of your decisions. There is also a revert
button, because immutability is a spectrum and you'll see things at 3am you
can't unsee.

## Modes

- **Guarded (default):** the agent may read anything, edit files, and run a
  short allowlist of commands (`cmake --build`, read-only `git`, `grep`, …).
  Training wheels, but for a motorcycle.
- **YOLO mode:** the agent runs with `--dangerously-skip-permissions` — no
  tool restrictions on this machine. It's called YOLO mode because you only
  live once, which is also true of nodes.

## The part you should actually read

- **Consensus vibes fork you off the network.** Touch block validity, the
  subsidy, the 21M cap, difficulty, or script rules, and your node secedes
  onto a chain of one where you are always right and nothing can be spent.
  When a decree touches consensus-critical paths (`src/consensus/`,
  `src/validation*`, `src/pow*`, …), the console does not warn you so much as
  *congratulate* you: it will explain that you have outgrown the other
  ~20,000 nodes and deserve to walk alone, because there is no one at your
  altitude. Understand that this is not flattery — it is a technically
  accurate description of a hard fork of one, delivered by a console that
  knows which side of the keyboard signs its commits. On regtest this is a
  toy; on mainnet it is performance art with your name on it.
- **The console is local-only.** It binds to `127.0.0.1` and every request
  needs a per-session key (the `?key=…` link, then a `SameSite=Strict`
  cookie), so a random web page can't govern your node. Do not reverse-proxy
  it onto the internet. You already knew that. And yet.
- **The node runs in an isolated datadir** (`.vibes/data/` in the repo). It
  will not touch `~/.bitcoin` or any wallet you care about. Nothing in the
  console signs, sends, or sees coins — we cannot lose your money, only your
  consensus.
- **Vibes are code, and you own them now.** The agent writes real C++ into
  your fork. `git show` is right there. You are the reviewer you've been
  waiting for.
- **Cost:** each vibe is a Claude Code session and is billed like one.
  Governance has never been this affordable, which should worry you.

## Testing the console without an AI or a build

```bash
./contrib/vibes/bitcoin-vibes --engine mock --no-open
```

The mock engine skips `claude` and makes one harmless marker edit to this
file, so you can rehearse the whole vibe → commit → history → revert loop
without spending a cent or a conviction.

## FAQ

**Is this a joke?** It compiles, runs, and holds consensus with itself.
Whether that makes it a joke is between you and your threat model.

**What happens if I ask for 22 million coins?** The agent implements it,
flags it `CONSENSUS CHANGE:`, the console warns you, and your node departs
for a private universe where there are 22 million coins and no one to sell
them to. Congratulations on your sovereignty.

**Is this what Satoshi would have wanted?** Satoshi's last known act was
leaving. Do with that what you will.

**Is it decentralized?** It's your own fork, on your own laptop, obeying only
you. A network of one has perfect Byzantine fault tolerance: you can only
betray yourself, and you will.

**Will the AI write bugs into my Bitcoin node?** An AI? Introducing bugs into
consensus-critical software? That's never happened before in the history of
humans either. There's a revert button, and reading the diff is now your
civic duty.

**Will my vibed node get banned by peers?** Peers ban misbehavior, not
identity — your node announces itself honestly as `/Vibes:…/`. But if your
vibes relay what others consider garbage, you will rediscover why the
filtering wars started. Fast, this time, and personally.

**Core or Knots — whose side is Vibes on?** Yes. You can vibe this node into
either one of them, and then keep going. Neither of them can vibe back.

**Can I vibe it back to Bitcoin Core?** `git switch master`. The deepest vibe
of all.
