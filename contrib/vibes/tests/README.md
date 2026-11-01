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
node contrib/vibes/tests/live_browser_qa.cjs
# Install Playwright's Chromium and WebKit runtimes for this check:
node contrib/vibes/tests/form_layout_qa.cjs
```

`VIBES_QA_URL` overrides the test server. `VIBES_BROWSER_CHANNEL=chrome` uses
installed Chrome. `PLAYWRIGHT_MODULE` and `AXE_MODULE` can point at existing
installations.

The form-layout check measures native radio/checkbox boxes against the first
line of their labels, including wrapped answers, fieldsets, preferences and
settings. It also checks label clicks, keyboard operation and visible focus in
Chromium and WebKit. Desktop and narrow viewports include 200%-equivalent
reflow cases (half the CSS viewport with twice the output pixel density),
rather than automating a browser's zoom controls. `VIBES_FORM_ENGINES` selects
engines, and `VIBES_FORM_SCREENSHOT_DIR` saves visual evidence.

`node contrib/vibes/tests/demo_qa.cjs` checks the lesson payload, exact replay
inputs, scoring, questionnaire persistence and damaged browser storage without
launching a browser. The live browser check starts its own disposable console,
uses its real HTTP authentication and git worktrees with the mock agent, and
exercises review, discard, apply, history, mobile layout and disconnection.
It does not require a running node or a paid AI session.

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
| What the machine's own sandbox stops, tried from inside it: writes elsewhere, reading the key, the home folder and shared temporary files, the network, local sockets; and that a compiler and name lookups still work there | RealSandboxTests | no (skipped where there is no sandbox) |
| A link planted in a writable folder's place grants nothing; a lab folder from an earlier version is treated as shared | SafetyTests | no |
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
| Keys scene (restore from a backup on another node), fees scene, controlled CLTV demonstration using modern nodes | RealNodeTests | yes |
| Ready-made changed nodes: kept after a build, stale when the change or the base moves, published ones refused unless they match | ReadyMadeTests | no |
| Scenes that need a changed node or the reference say how to get one; an outside program must be a named executable | ReadyMadeTests | no |
| Before-and-after statements scored per statement; the slider scene's answer depends on the share | HttpTests, LessonTests | no |
| Node start inside the sandbox, bad-build recovery, private chain reset | RealNodeTests | yes |
| Installer: shallow-clone update, truthful messages, release tag installs | `test_install.py` UpdateTests | no |
| Ready-made node: checksum, commit match, archive safety | `test_install.py` PrebuiltTests | no |
| Full noninteractive installer skips compiler/AI installs when prepared programs work; failed CLI preserves old build; tool stubs and download retries | `test_install.py` ColdInstallerTests, UpdateTests | no |
| Browser demo: recorded results, predictions, lessons, safe rendering of shared text, narrow screens | `browser_qa.cjs` | no |
| Accessibility audit of landing, prediction dialog, finished result and questionnaire at three widths | `accessibility_qa.cjs` | no |
| Real HTTP console in a browser: authentication, propose/review/discard/apply, reload, history, narrow screens and offline controls | `live_browser_qa.cjs` | no |
| Direct and cross-site Strict-cookie entry, script fallback, blocked cookies, wrong keys and origin protection in Chromium and WebKit | `session_entry_qa.cjs` | no |
| Loading, missing program, preparation, setup errors, ready without AI, quiet live regions and offline retry in both engines | `first_launch_qa.cjs` | no |
| Exact recordings for all 17 slider positions; scoring and persistence contracts | `demo_qa.cjs` | no |
| Installer build provenance and container first/repeated startup | `test_packaging.py` | no |
| Native form alignment, wrapping, label targets and keyboard focus across browser engines | `form_layout_qa.cjs` | no |
| Release completeness, checksums, architecture, source/patch provenance, Mac system-library/minimum-OS guards, existing-lab notices and cold launcher retries | `test_release.py` | no |

CI additionally builds the node and Bitcoin Core's unit tests from source,
checks that `src/` differs from the upstream base in one file only, applies
each ready-made source change to confirm an unmodified node disagrees in the
documented direction, and runs the rule-breaking-miner scene and the
mining-power scene (at 30% and 70%) with the nodes it has just built.

The release workflow verifies all 15 assets and exercises candidate first
launch before publication. It then repeats the smoke test from actual public
downloads on fresh Linux x86_64, Linux ARM64 and Apple-silicon runners. Both
paths run the full pinned installer with `VIBES_NONINTERACTIVE=1`, not isolated
installer stages. A prepared node must work without installing compiler tools
or an AI engine. Native execution is restricted to GitHub Actions.

On Mac the check mounts the DMG read-only, verifies its version, release pins,
icon and signature, copies the app, and runs its actual bundled launcher with
a new `VIBES_HOME`. That launcher must fetch the tagged source and automatically
prepare and start its node. Linux runs the installed `./vibes` entry. Neither
uses `--no-autostart` or replaces `HOME`. The check uses `--no-open` and the mock
engine, authenticates through the strict HttpOnly cookie bootstrap, fetches
the HTML and its assets, mines a private regtest block, runs the first lesson,
saves its prediction, runs all three changed nodes, and relaunches the same
entry to confirm its block, lesson result and learning record survive.

`verify_release.py --assets DIR --tag TAG --commit FULL_SHA` inspects the full
download set without running its programs. `--first-launch-assets DIR
--platform SLUG --tag TAG --commit FULL_SHA` runs candidate first launch on CI;
it stamps a temporary installer outside the asset directory and passes the
candidate archive URL through both installer and app setup. The release tag
must already exist on the configured repository. `--public --platform SLUG
--tag TAG --commit FULL_SHA` verifies attestations and exercises the public
assets. These checks make no paid AI calls and do not change an existing lab.

## What is not covered by automated tests

- A live AI session. The agent path is exercised with a stand-in program, never
  with a real model.
- The Linux sandbox (`bubblewrap`) anywhere but GitHub's Ubuntu machines,
  where the CI job fails unless the sandbox starts, recompiles part of the
  node and links it inside it, and runs these tests inside it with real nodes.
- Apple Gatekeeper's first-launch experience and notarisation with maintainer
  credentials. The Mac release checks execute the bundle launcher directly
  with browser opening suppressed; they do not drive Finder or approve OS
  permission dialogs. An ad-hoc signature does not establish an approved
  Developer ID or notarisation.
- A real AI proposal and compiler-driven proposal in the browser. The live
  browser suite drives the real console and mock-agent source workflow;
  compilation, activation and recovery are exercised by the Python real-node
  tests and CI.
