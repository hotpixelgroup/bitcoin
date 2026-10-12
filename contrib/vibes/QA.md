# Experiment lab QA: 12 October 2026

What was checked for the two-node lab, on one machine (macOS, Apple silicon
toolchain as installed, the macOS sandbox). Read the last section first: it
lists what was not checked.

The lab was then read by a second reviewer who had not written it. The section
"Independent review" below records what that found and how each fix was
checked.

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

- 106 console tests and 17 installer tests (`python3 -m unittest discover -s
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

## Independent review

After the lab was merged, a reviewer who had not written it read the console,
the sandbox, the lab script, the page, the installer and the release workflow,
without running them. It reported four serious problems and eight lesser ones.
Each was addressed before anything was released, and the fixes were then
reviewed a second time; that second review found gaps in several of them,
which are listed after the table with what was done. Both reviews are attached
to the pull request that made the fixes. What is still open is under "Not
checked".

| What the review found | What changed | How the fix was checked |
|---|---|---|
| On Linux, confined code could still see `/run` and `/tmp`, where local service sockets live, and shared the operator's terminal session | Those places and `/var` are replaced by empty folders, and every command gets its own session | The arguments by unit test; the behaviour by the CI job, which fails unless `bubblewrap` starts, recompiles part of the node and links it inside it, and runs the real-node tests and the probes below inside it |
| On macOS, confined code could ask other programs to act for it and could signal any process | Launch services, launchd, Apple events and signals to anything outside the sandbox are denied; shared temporary folders and other disks are hidden; a node on a real network cannot reach local sockets such as a key agent's | Probed directly: `open -a` fails, a signal to an outside process fails and the key agent's socket is refused, while a build, the unit tests, the lab scenes and node start still work. Tests now try writes, reads and the network from inside the sandbox (RealSandboxTests) |
| In Docker, a proposal was compiled before review, with the network and the container's AI sign-in in reach | A container no longer counts as confinement; Docker is review-first | Unit test |
| "Same as the unmodified node" looked only at `src/`; build tooling could be edited; a proposal's build could leave things behind in the shared build folder | Identity covers every file that can feed the build; top-level build tooling is refused; a proposal is compiled in a copy of the build folder that is thrown away; the reference never comes from a proposal's build or from a build folder that a build of changed source could write to | Unit tests (ReferenceRuleTests), and the real run described under this table |
| Unusual file names, or a `.gitattributes` in a subfolder, could hide a change from the path checks or from the reviewer | Paths are read unquoted and NUL-separated; changes are always shown as text; those files are refused at any depth | Unit tests with accented, quoted and tab-containing names |
| A build that could not produce a block was reported as "No difference observed" | A new outcome, "The comparison could not be completed", which blocks automatic applying and shared networks | Unit tests |
| If the operator's branch could not be put back after a build, the console hid it | The console reports it and shows the real state; SIGTERM and SIGHUP are handled like Ctrl-C | Unit test |
| The agent could read most of the home folder | Its read rules cover everything under the home folder except the path to its workspace; an old Claude Code is not used | Unit test of the rules; not tried with a live agent |
| Invisible characters other than bidirectional ones passed the shared-request filter | Zero-width, tag, private-use and variation characters are refused, in the page and on the server | Unit and browser tests |
| Stopping a lab run left its two nodes running on macOS | Nodes stay in the lab's process group and the lab stops them | A real-node test, which fails against the old code |
| A crafted sharing token could break the page until its storage was cleared | Token fields are validated before use | Browser test |
| Smaller items | The release is a draft until every file is attached; no partial upgrade on Arch; the access key file is private from creation; the installer runs nothing if cut short; the operator's git hooks are not run on AI-edited source | Unit tests where practical; the release change runs for the first time when a release is made |

After both rounds of fixes, the lab was run through the real console inside
the macOS sandbox, on a temporary branch, starting from a build folder that
had compiled changed source before and with no reference node:

- At start, the console did not adopt the program in that build folder as the
  reference. Asked to prepare one, it compiled the unmodified source in a
  folder of its own and deleted that folder afterwards.
- Build and check of the unmodified source was judged identical, and the node
  kept for it was the reference node itself, byte for byte.
- The doubled-reward proposal was compiled before review in a copy of the
  build folder, and found to be "loosened" as before. Afterwards the build
  folder's node program and its configuration had the same content and the
  same file times as before the proposal, no copy was left behind, the
  reference was untouched and the source was back on its branch. Compiling in
  a copy did not slow the run down on this machine, where the copy shares disk
  space with the original.
- A second console started for the same source while the first was running
  refused to start and disturbed nothing.
- The halved-reward proposal was compiled, reviewed and applied; the applied
  revision was the one that had been built. Restore the baseline then produced
  a build judged identical, kept as the reference node itself.
- The keys, fees, rule-breaking-miner, mining-power (at 70%), soft-fork replay
  and relay-filter scenes all ran inside the tightened sandbox with their
  documented outcomes.
- The console was stopped once with a terminate signal and once with a
  hang-up signal: each time it stopped its node and exited cleanly.

That run was made after the second round. After the third, the automated
suites were run again in full, including the real-node tests and the probes
from inside the sandbox, and a shorter run through the console repeated the
proposal build and a cancelled build.

### The second review, of the fixes themselves

| What it found | What was done |
|---|---|
| A build file under `doc/` was outside the "same node" check, although the build reads it; a proposal's own build could still become the reference | A build file counts wherever it lives; a proposal's build never becomes the reference |
| A program started during a proposal's build on macOS can outlive it and keep permission to write to the build folder | The reference is never taken from a build folder that a build of changed source could write to; after the first proposal it is compiled in a folder of its own. Whatever a confined command leaves in its process group is ended when the command ends |
| Starting a second console while the first was building moved the build folder and the branch from under it | One console process per lab folder, enforced with a lock taken before any tidying up |
| The refused-paths check was case-sensitive, and a Mac's usual filesystem is not | Compared without regard to case; file names that are not plain letters, digits and `. _ - @ +` are refused |
| Showing a change to a binary file as text could stop the job with an error | Output that is not valid text is shown with replacement marks |
| Tidying up on exit could be cut short by a second signal or a closed terminal; a linked or missing build folder was mishandled | Signals are ignored and terminal errors tolerated while tidying up; a linked build folder is refused; whatever is found in the build folder's place is cleared before it is put back |
| Two nodes that refused nothing and still ended on different chains were reported as "no difference" | Reported as "could not be completed" |
| Tools installed under `/home/linuxbrew` vanished from the Linux sandbox | A tool's own folders are shown again from any hidden place |
| The manual and this record claimed more than the code did in three places | Reworded; the limits it pointed to are now stated in the manual and the security policy |

### The third check, of the second round

A narrower check of the second round found two more problems of substance and
some smaller ones. This was the last round of review before release; three
rounds each found something, so more may remain.

| What it found | What was done |
|---|---|
| Confined code may write to its build folder, so it could put a link to the home folder in its place; the next build would then have been given permission to write there | A folder a command may write to is never followed through a link: the sandbox refuses, nothing is compiled in a linked build folder, and a linked scratch folder is replaced by a real one |
| A documentation-only proposal, judged identical, could leave a program from a shared build folder as the node to run when no reference existed | Unmodified source from a shared folder is always the reference, compiled apart if need be, for proposals too |
| With the network open, denying every local socket on macOS also blocked the system's name lookups | The lookup service is allowed again; a test looks up a name from inside the sandbox and confirms another local socket is refused |
| Two sandbox tests asserted things that hold on macOS and not on Linux | They assert what must hold on both: nothing arrives outside, and no secret is read |
| A second console still rewrote the lab's own copies of its scripts before finding out it was second | The lock is taken before anything is written |
| A lab folder from an earlier version was trusted as never shared | Any lab folder with past jobs and no version stamp is treated as shared |
| Two nodes that never connected, holding the same blocks only because the lab handed them over, were "no difference" | Reported as "could not be completed" |
| Cancelling could stall if a leftover process kept the output open | The whole process group is ended, whether or not its first process has gone |

Not closed, and stated as limits instead: the sandboxes still start from
"everything readable" and hide chosen places, not the other way round; on
macOS confined code can read other programs' command lines and environment
variables, and a program that outlives a build could alter a later build of
changed source; the agent runs with your full environment under Claude Code's
own rules; tools from Homebrew on Linux may not run inside the sandbox; a
shared request that needs invisible joiners (some scripts, some emoji) is
refused and has to be retyped.

## Not checked

- **A live AI session.** The agent's command line was accepted by Claude Code
  2.1.220 when run without a prompt, and the agent path was driven end to end
  with a stand-in program. No request was sent to a real model, so how a real
  agent behaves under these restrictions (file tools only, no shell, the wider
  read rules) has not been observed, and neither has whether Claude Code
  enforces every rule as written.
- **Linux beyond CI.** The `bubblewrap` sandbox runs in the CI job on
  GitHub's Ubuntu machines, with real nodes. It has not been tried on a
  desktop Linux machine or on another distribution, and nobody has tried to
  break out of it.
- **Breaking out of either sandbox.** The probes above show that particular
  routes are closed. They are not an attempt by a specialist to find others.
- **Docker.** CI builds the image and checks that the console answers. The
  review-first behaviour inside it is covered by a unit test only.
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
