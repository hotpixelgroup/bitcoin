# Experiment lab QA — October 9, 2026

Validated locally before GitHub Pages publication:

- Built `bitcoind`, `bitcoin-cli`, and `test_bitcoin`. All 784 Bitcoin unit test cases passed.
- All 17 console integration tests passed: isolated proposal/review/apply, automatic mode, stale-source and dirty-source protection, persistence/restart, sharing, revert, settings validation, HTTP authentication, invalid requests, event replay, build failure, activation recovery, and acceptance comparisons.
- Real disposable regtest checks: observed 50 BTC subsidy, deliberately failed an incorrect expected subsidy, observed coinbase maturity, created/confirmed a test transaction, and recovered from a failed candidate executable to an RPC-ready prior release.
- Browser workflow suite: review/reload/draft persistence, apply/build/verify/activate, consensus review enforcement, discard, build failure/retry, activation failure/recovery, playground, history search, settings, Unicode sharing/imports, and safe rendering of markup in requests. Browser demo made no node API calls.
- Real console UI against a disposable backend: review/reload/apply, source-only outcomes, sharing, settings, offline/reconnect recovery, and disabled submission while the AI engine is unavailable.
- Desktop, tablet, 390px and 320px layouts checked for horizontal overflow. Mobile and desktop screenshots visually inspected.
- Axe accessibility audits: no WCAG A/AA violations reported at 1440px, 390px, and 320px for the landing page, browser demo, and local console with settings expanded. This automated result is not a claim of full accessibility conformance.
- Python/JavaScript/shell syntax, unique HTML IDs, installer dry run, and whitespace checks passed.

Provider-specific AI generation was not invoked by QA. The public lab is an explicitly labeled simulation; real node operations require local installation. Passing general tests does not establish that an arbitrary future wish works or remains compatible with mainnet. Executable recovery does not revert chain data.

Repeatable commands are in `contrib/vibes/tests/README.md`. The existing Vibes CI workflow now includes the integration, browser and accessibility suites.
