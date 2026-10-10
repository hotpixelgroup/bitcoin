# Experiment lab QA

Run the Python workflow/integration suite (temporary git repositories and HTTP servers):

```sh
python3 -m unittest discover -s contrib/vibes/tests -v
```

Include real disposable regtest subsidy and transaction checks:

```sh
VIBES_QA_BIN="$PWD/build/bin" python3 -m unittest discover -s contrib/vibes/tests -v
```

Build and serve the Pages site, then run browser and accessibility checks:

```sh
python3 contrib/vibes/build_site.py --out /tmp/vibes-site
python3 -m http.server 21880 --bind 127.0.0.1 --directory /tmp/vibes-site
# In another terminal, with playwright and axe-core installed:
node contrib/vibes/tests/browser_qa.cjs
node contrib/vibes/tests/accessibility_qa.cjs
```

`VIBES_QA_URL` overrides the test server. `VIBES_BROWSER_CHANNEL=chrome` uses installed Chrome. `PLAYWRIGHT_MODULE` and `AXE_MODULE` can point at existing installations. Tests cover desktop, tablet, 390px and 320px layouts, review/reload, draft persistence, build/activation, failure/recovery, history, settings, sharing/imports, reduced motion, form labels, no browser demo API calls, and WCAG audits. The CI workflow runs these checks on source changes.

The browser demo is simulated. Python integration tests execute the real console workflows in temporary repositories; the optional regtest tests launch real executables in disposable data directories. Provider-specific AI generation is not called by automated QA.
