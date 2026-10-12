# Testing the lab

Console workflows, safety rules, the installer and the update path. Hermetic:
temporary git repositories, a stand-in agent, no network, no node.

```sh
python3 -m unittest discover -s contrib/vibes/tests -v
```

The same suite plus the checks that need a real node: the two-node lab scenes,
starting the node inside the sandbox, recovery from a build that will not
start, and resetting the private chain.

```sh
VIBES_QA_BIN="$PWD/build/bin" python3 -m unittest discover -s contrib/vibes/tests -v
```

The static site and the browser demo:

```sh
python3 contrib/vibes/build_site.py --out /tmp/vibes-site
python3 -m http.server 21880 --bind 127.0.0.1 --directory /tmp/vibes-site
# In another terminal, with playwright and axe-core installed:
node contrib/vibes/tests/browser_qa.cjs
node contrib/vibes/tests/accessibility_qa.cjs
```

`VIBES_QA_URL` overrides the test server. `VIBES_BROWSER_CHANNEL=chrome` uses
installed Chrome. `PLAYWRIGHT_MODULE` and `AXE_MODULE` can point at existing
installations.

## What is covered

| Area | Where | Needs a node |
|---|---|---|
| Propose, review, apply, revert, restore the baseline, restart recovery | `test_console.py` WorkflowTests | no |
| What must wait for review: no sandbox, consensus-looking code, test edits, imported requests, observed differences | SafetyTests | no |
| Proposals that edit the lab, top-level build tooling or files that change what git shows are refused; unusual file names cannot slip past the path checks | SafetyTests | no |
| A proposal is compiled in a copy of the build folder; an interrupted one is undone at the next start; a branch that cannot be put back is reported | SafetyTests | no |
| "The same node" covers everything that feeds the build; an unfinished comparison never counts as agreement | SafetyTests, RegtestRulesTests, SharedNetworkTests | no |
| Shared requests with invisible characters are refused; sender notes are bounded; the agent's read rules cover the home folder; an old Claude Code is not used | SafetyTests | no |
| Stopping a lab run leaves no nodes behind | RealNodeTests | yes |
| Where the reference node may come from: the first unshared build, never a proposal's own build, never a shared build folder | ReferenceRuleTests | no |
| What the machine's own sandbox stops, tried from inside it: writes elsewhere, reading the key, the home folder and shared temporary files, the network; and that a compiler still works there | RealSandboxTests | no (skipped where there is no sandbox) |
| The agent's command line: file tools only, no bypass flag, deny rules | SafetyTests | no |
| The real agent path, driven by a stand-in for the `claude` program, and its time limit | SafetyTests | no |
| Which builds may start on a shared network; the mainnet confirmation; wallet and listening defaults | SharedNetworkTests | no |
| Unit test suites run apart, with crashes and hangs reported by name | RegtestRulesTests | no |
| Settings: defaults read from the build, pruning rules, hand edits preserved | SettingsTests | no |
| Every ready-made experiment is complete, and its patch still applies to this source | LessonTests | no |
| Plain-language alerts when a node refuses a block | HealthTests | no |
| Sandbox profiles and the environment given to confined code | SandboxProfileTests | no |
| HTTP: key handling, content security policy, cross-origin refusal, learning record | HttpTests | no |
| Two real nodes: identical, policy-only, filter scene, reorganisation scene | RealNodeTests | yes |
| Keys scene (restore from a backup on another node), fees scene, replay of the 2015 soft fork | RealNodeTests | yes |
| Ready-made changed nodes: kept after a build, stale when the change or the base moves, published ones refused unless they match | ReadyMadeTests | no |
| Scenes that need a changed node or the reference say how to get one; an outside program must be a named executable | ReadyMadeTests | no |
| Before-and-after statements scored per statement; the slider scene's answer depends on the share | HttpTests, LessonTests | no |
| Node start inside the sandbox, bad-build recovery, private chain reset | RealNodeTests | yes |
| Installer: shallow-clone update, truthful messages, release tag installs | `test_install.py` UpdateTests | no |
| Ready-made node: checksum, commit match, archive safety | `test_install.py` PrebuiltTests | no |
| Browser demo: recorded results, predictions, lessons, safe rendering of shared text, narrow screens | `browser_qa.cjs` | no |
| Accessibility audit at three widths | `accessibility_qa.cjs` | no |

CI additionally builds the node and Bitcoin Core's unit tests from source,
checks that `src/` differs from the upstream base in one file only, applies
each ready-made source change to confirm an unmodified node disagrees in the
documented direction, and runs the rule-breaking-miner scene and the
mining-power scene (at 30% and 70%) with the nodes it has just built.

## What is not covered by automated tests

- A live AI session. The agent path is exercised with a stand-in program, never
  with a real model.
- The Linux sandbox (`bubblewrap`) anywhere but GitHub's Ubuntu machines,
  where the CI job fails unless the sandbox starts, compiles the node inside
  it, and runs these tests inside it with real nodes.
- The Mac app, notarisation, and the Docker image beyond "it builds and the
  console answers".
- The real console page in a browser. The browser tests drive the static demo,
  which shares the page and script but not the server.
