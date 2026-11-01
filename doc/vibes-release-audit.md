# Bitcoin Vibes release audit

Audited 31 October 2026 against `c0b7c1afa44756f5f05d73550194aa951d07d2d5`.
The scope is the teaching lab, browser demo, installer, packaging and their
verification. Bitcoin Core consensus source under `src/` is unchanged.

## Findings addressed

- Audited all ten lessons, ten questionnaire statements, predictions, follow-ups,
  comparison verdicts and matching documentation against primary references.
  [The content audit](vibes-content-audit.md) records each factual correction.
- Grade completed matching experiments from observations. Reject incomplete or
  unrelated jobs and invalid options; preserve first answers and prevent duplicate
  counts. Save questionnaire rounds atomically and version the whole questionnaire.
- Distinguish valid block observations, consensus rejections, incomplete validation
  and infrastructure failures. Mining-share answers come from actual active-chain
  membership; a controlled branch probe checks shorter-branch compatibility.
- Measure actual coinbase outputs instead of mistaking the scheduled subsidy for
  the amount a miner claimed. Remove unsupported finality and historical claims.
- Match Bitcoin Core configuration precedence, boolean/integer parsing, scoped
  options and the testnet3 chain alias. Preserve other networks when saving and
  exclude consensus overrides and external signer commands from ordinary settings.
- Put learning before node operations. Label every demo result as a replay, remove
  fake running-node status, expose a starting action and next experiment, and
  improve mobile navigation, keyboard focus, dialogs and reduced-motion behavior.
- Preserve unsaved questionnaire choices during polling, retry lost score writes,
  restore scored follow-ups reliably, prevent confirmation-dialog races and keep
  earlier demo records exportable. Show useful asset-loading and offline errors.
- Require exact recorded slider inputs, refuse incomplete recordings, replace
  fixtures atomically, and preserve the distinction between unrun and passing tests.
- Reuse installed programs only when complete and attributable to clean matching
  source. Never stamp dirty or unreadable source as a release build. Remove stale
  CMake paths from container packages and establish the container reference from
  its initial source commit. Make container build concurrency configurable.
- Prevent the static-site output from overlapping its source tree. Add real HTTP
  browser coverage and retain the verified static site and real-node recordings
  as CI artifacts.

## Verification

The baseline Python suite passed 125 tests with eight optional real-node checks
skipped. The original static browser workflow and axe audit also passed; those
checks did not catch the content and real-console defects above.

Local verification completed during integration:

| Check | Result |
|---|---|
| Fresh Apple Silicon stock node, CLI and unit-test build | Passed |
| Full stock Bitcoin Core suite | 784 test cases passed |
| Three deliberately changed teaching-node builds | Passed |
| Integrated app suite against real regtest nodes | 138 tests passed, no skips (integration snapshot) |
| Stock validation suite and changed subsidy variants | Stock passes; doubled/halved subsidy produce expected stock-test findings; earlier regtest halving is not exercised by this suite |
| Real authenticated console in Chrome | Review, discard, apply, reload, history, mobile and offline controls pass |
| Expanded axe audit | Zero detected violations in four states at 1440, 390 and 320 pixels |
| Packaging and recorder regressions | Six packaging checks and two recording checks pass |
| Source/diff checks | Python and JavaScript parse; no whitespace errors; no `src/` changes |

Final integrated browser, fixture and Linux CI results will be recorded here
before this PR is marked ready.

The host antivirus classified temporary Bitcoin node executables as CoinMiner
and removed them during a recording run. The recorder rejected that run and
preserved the previous fixtures. No antivirus settings were changed. Final
recording verification is performed by the isolated Linux CI job. The local
Docker build also stalled with its daemon unresponsive; no existing user
containers were stopped or reset.

## Deployment

The current public site uses the `gh-pages` branch at `/`. This PR does not
merge itself, publish a release or change Pages settings. CI builds the complete
site into the `bitcoin-vibes-site` artifact, including `.nojekyll`, for review
and deployment from the approved commit.

To inspect a local build:

```sh
python3 contrib/vibes/build_site.py --out /tmp/vibes-site
python3 -m http.server 21880 --bind 127.0.0.1 --directory /tmp/vibes-site
```

The test README documents all commands. The Linux node job produces a separate
`bitcoin-vibes-recorded-demo` artifact by exercising every supported demo input
through the real console API with freshly built stock and changed nodes.

A paid live AI session, Mac notarisation and real-mainnet operation are outside
these verification results. The lab remains a teaching environment; a finite
comparison does not establish arbitrary modified code is safe.
