# Experiment lab QA: 12 October 2026

What was checked for the two-node lab, on one machine (macOS, Apple silicon
toolchain as installed, the macOS sandbox). Read the last section first: it
lists what was not checked.

## Run on a real node, through the real console

- **Build and check of unmodified source.** Compiled `bitcoind`, `bitcoin-cli`
  and `test_bitcoin` inside the sandbox. Ran 150 unit test suites, each in its
  own process, with networking denied; all passed. (`sock_tests` and
  `ipc_tests` are left out under the macOS sandbox because they need local
  sockets.) The build was kept as the unmodified reference node.
- **All ten ready-made experiments**, started through the console's HTTP API
  inside the macOS sandbox and, for one of them, by clicking through the page
  in a browser:

  | Experiment | Observed | Unit test suites or cases no longer passing |
  |---|---|---|
  | Are your coins in your wallet? | Wallet deleted; the chain still recorded 50 BTC; a backup restored on the other node could spend it | not applicable |
  | Does sending more cost more? | With room for one payment, the 0.1 BTC payment at 50 satoshis per byte confirmed before the 10 BTC payment at 2 | not applicable |
  | Is a confirmed payment final? | One confirmation went back to zero after a longer chain arrived | not applicable |
  | Can a filter keep data out of the chain? | Local policy only: the filtering node refused to relay the transaction and accepted the block containing it | not applicable |
  | Can you raise the block reward? | Loosened: the unmodified node refused block 153 with `bad-cb-amount` | 29 |
  | What if your node demands a smaller reward? | Tightened: the changed node refused block 1 with `bad-cb-amount` | 29 |
  | What if the reward halved sooner? | Tightened: the nodes agreed for 74 blocks, and the changed node refused block 75 | 26 |
  | Can most of the mining power break the rules? | The unmodified node refused all 30 rule-breaking blocks and stayed on the 2-block honest chain | not applicable |
  | How much mining power does a stricter rule need? | At 30% the stricter nodes were left on their own chain; at 70% the unmodified node followed the stricter chain | not applicable |
  | What happened to nodes that never upgraded in 2015? | The node on the old rules accepted a block spending a time-locked coin early; the upgraded node refused it: "Locktime requirement not satisfied" | not applicable |

  The three that change source were each applied in an isolated copy, checked
  out, compiled, tested and compared before review, and the branch was put back
  each time. Each was then run again from the changed node kept by that build,
  without compiling. The mining-power scene was also run directly at ten shares
  from 10% to 90%; it flips between 50% and 55%. The results in
  `web/demo-data.js` are these runs.
- **Explaining instead of failing.** Before any changed node existed, the
  scenes that need one stopped with a message saying which experiment to
  compile first.
- **Comparison with an outside program.** Pointed at a separately built node
  with a doubled reward, by path, the lab reported it as loosened. A path that
  is not a node program was refused.
- **Sandbox behaviour, probed directly.** Inside the generated profile: reading
  the console's key, `~/.ssh` and `~/.zshrc` was refused; writing into the
  source tree was refused; an outbound connection failed; a loopback port the
  lab had been given worked and another loopback port did not. The lab
  comparison, an incremental build, a `cmake` configure and the unit tests all
  ran inside it.
- **Node lifecycle inside the sandbox.** Start, RPC over the local port
  (the console no longer runs the built `bitcoin-cli`), block production, a
  build that will not start followed by a return to the previous build, and a
  private chain reset.
- **A consensus change applied, then undone.** The doubled reward was applied
  (a fast-forward: the saved revision was the revision already built, so
  nothing was rebuilt), started on regtest and used to produce blocks. With the
  reference node deleted, it was rebuilt from a temporary checkout of the
  unmodified source, which is a full compile, leaving no temporary files.
  Restore the baseline then undid the change in one commit, rebuilt, found the
  build identical to the reference, reset the private chain and restarted the
  node at block 0.
- **Cancelling a run** while a proposal was checked out returned the source to
  its branch.
- **Upstream check** against GitHub returned the base commit, the number of
  changes Bitcoin Core has made since, and the latest releases.

## Automated suites

- 73 console tests and 17 installer tests (`python3 -m unittest discover -s
  contrib/vibes/tests`), all passing, including the tests that need a real
  node. See `tests/README.md` for what each group covers.
- Browser checks of the landing page and demo in Chrome via Playwright: the
  prediction dialog, recorded results, the written explanation with its
  sources and follow-up question, the drawing of the two chains, the
  mining-power slider on both sides of one half, the keys scene, the ten
  statements answered twice with nothing marked until the second round, the
  learning tally, persistence across reload, a shared request containing
  markup rendered as text, a shared request with hidden control characters
  refused, no API requests from the demo, no page errors, and no horizontal
  overflow at 1440, 768, 390 and 320 pixels.
- The shell logic CI uses to check the experiments was run locally with bash
  against separately built nodes.
- Axe accessibility audit of the landing page and of the demo with a finished
  experiment on screen, at 1440, 390 and 320 pixels: no WCAG A or AA
  violations reported. An automated result is not a claim of full conformance.
- The page consistency check from CI (balanced tags, unique ids, every id the
  script uses exists, nothing inline that the content security policy would
  block), JavaScript syntax checks, shell syntax checks and the static site
  build.

## Not checked

- **A live AI session.** The agent's command line was accepted by Claude Code
  2.1.220 when run without a prompt, and the agent path was driven end to end
  with a stand-in program. No request was sent to a real model, so how a real
  agent behaves under these restrictions (file tools only, no shell) has not
  been observed.
- **Linux.** The `bubblewrap` arguments have unit tests for their shape and
  have never run on a Linux machine. The CI job tries to enable user
  namespaces on the hosted runner so that they do; until that job has passed,
  treat the Linux sandbox as unproven.
- **Docker.** The image was rewritten (unprivileged user, working copy in a
  volume, its own Claude Code state) and has not been built. A CI workflow now
  builds it and checks that the console answers.
- **The Mac app**, the release workflow, signing and notarisation. None can run
  outside GitHub Actions or without credentials. That includes the new step
  that builds and ships the three changed nodes, and the console's download of
  them, which is covered by tests against a local folder only.
- **Whether any of this teaches.** No learner has used it. The lessons have
  not been reviewed by a Bitcoin Core contributor or an educator. Both are
  things only people can do; `doc/vibes-study.md` and the "Reviewing the
  lessons" section of CONTRIBUTING.md say how.
- **Live proposals.** The lab can run a node program you supply beside the
  unmodified one, but it has no ready-made experiment for any pending proposal,
  and its checks do not exercise new script instructions.
- **Other networks.** Everything above ran on regtest. The rules for shared
  networks (the mainnet confirmation, refusing consensus-changing builds, the
  refused-block alert) are covered by unit tests only.
- **Anyone else.** No one but the maintainers has used this.

Repeatable commands are in `contrib/vibes/tests/README.md`.
