<!-- Thank you. Delete anything below that doesn't apply. -->

### What this changes

<!-- One or two sentences. What is different afterwards? -->

### Why

<!-- What was wrong, annoying, or missing. If it closes an issue: "Fixes #123". -->

### How you tested it

<!-- Be specific and be honest. Both of these are good answers:
     "Ran ./vibes --engine mock, ran a ready-made experiment, comparison rendered."
     "Didn't run it — docs only." -->

### Checklist

- [ ] I ran it, or I said above that I didn't
- [ ] `python3 -m unittest discover -s contrib/vibes/tests` passes
- [ ] UI touched? Still readable at 375px and usable by keyboard
- [ ] User-facing claims (README, manual, console text) match what the code does
- [ ] **`src/` touched?** A fresh install still ships stock Bitcoin Core
      consensus: `src/` differs from the upstream base in `clientversion.cpp` only

### Review

This project asks its operators to read a change before they apply it. It holds
itself to the same rule.

- [ ] Someone other than the author has read the diff. If no person is
      available, an independent AI review is attached as a comment; that is
      advice for the author, not approval
- [ ] CI is green on the exact commit being merged

<!-- The src/ rule is the one we are strict about. Your own node can become
     anything you like; the default that strangers install cannot. -->
