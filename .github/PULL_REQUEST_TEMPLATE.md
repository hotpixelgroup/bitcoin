<!-- Thank you. Delete anything below that doesn't apply. -->

### What this changes

<!-- One or two sentences. What is different afterwards? -->

### Why

<!-- What was wrong, annoying, or missing. If it closes an issue: "Fixes #123". -->

### How you tested it

<!-- Be specific and be honest. Both of these are good answers:
     "Ran ./vibes --engine mock, issued a decree, diff rendered, node restarted."
     "Didn't run it — docs only." -->

### Checklist

- [ ] I ran it, or I said above that I didn't
- [ ] Console touched? `python3 -m py_compile contrib/vibes/bitcoin-vibes`
- [ ] Installer touched? `sh -n contrib/vibes/install.sh`
- [ ] UI touched? Still readable at 375px and usable by keyboard
- [ ] **`src/` touched?** A fresh install still ships stock Bitcoin Core
      consensus — 21M cap, 50 BTC subsidy, upstream rules untouched

<!-- That last one is the rule we are strict about. Your own node can become
     anything you like; the default that strangers install cannot. -->
