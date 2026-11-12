# Closed-beta tester guide

This beta is for the invited test group. You can stop at any time. We are
testing setup, usability, recovery and the explanations; you do not need to
know C++ or get every prediction right.

**Candidate: `beta-v32.1-2` (closed-beta prerelease).** Start only after its
[release page](https://github.com/hotpixelgroup/bitcoin/releases/tag/beta-v32.1-2)
shows the complete downloads and the coordinator confirms verification is
finished. `v31.99-10` is the unchanged stable baseline. The `latest` download
links select stable releases and are not the beta installation route.

## Choose a track

| Track | What runs | Account or AI cost |
|---|---|---|
| [Browser demo](https://hotpixelgroup.github.io/bitcoin/demo.html) | Recorded results from real node runs; no live Bitcoin node | None |
| Installed lab, ready-made lessons | Real nodes on throwaway private regtest chains | No AI account or AI charge |
| Optional custom request | Claude Code proposes a source change, followed by builds and checks | Separate provider access and an agreed spending cap |

Record which track you used. Website help can change independently of an
installed release. For comparable results, stay on the assigned candidate
throughout the session and do not take source updates midway.

Use **regtest only**, with no real funds, wallet backups, seeds or private
requests. Do not point the beta at an existing Bitcoin datadir. Signing and
notarisation are deferred. If macOS or endpoint protection blocks a download
or launch, record the exact warning and stop that installation attempt; do
not disable protections or remove quarantine attributes to make the test pass.

## Install without replacing an existing lab

Prepared downloads are tested on Linux x86_64, Linux ARM64 and Apple silicon
with macOS 15 or later. Other systems, Intel Macs and WSL are exploratory,
not covered by this candidate's release matrix. The console needs working
git and Python 3.8+. On Mac these can come from Apple's command-line tools;
Python from Homebrew also works. Missing tools are a setup result to report.

**Mac app:** download `BitcoinVibes.dmg` from the candidate release. Copy
**Bitcoin Vibes Beta.app** to Applications, keeping your stable app. The beta
has a separate bundle identifier and defaults to
`~/Library/Application Support/Bitcoin Vibes Beta/beta-v32.1-2`; an explicit
`VIBES_HOME` override takes priority. Its first download needs network access.
Leave it open until the console reports preparation finished or an error.

**Shell installer:** download `install.sh` and `SHA256SUMS` from that same
candidate page into a new folder. Review the installer before running it.
To check its checksum with Python:

```sh
python3 - <<'PY'
import hashlib
from pathlib import Path
entries = [line.split() for line in Path('SHA256SUMS').read_text().splitlines()]
matches = [parts[0] for parts in entries if len(parts) == 2 and parts[1] == 'install.sh']
if len(matches) != 1:
    raise SystemExit('Missing or duplicate installer checksum')
if hashlib.sha256(Path('install.sh').read_bytes()).hexdigest() != matches[0]:
    raise SystemExit('Checksum mismatch')
print('Installer checksum matches the release manifest')
PY
```

The checksum detects corruption; it is published by the same release owner.
The release page also explains GitHub build-provenance verification.

Choose a new lab directory. If the example below already exists, choose a
different path rather than overwriting or deleting it:

```sh
VIBES_DIR="$HOME/bitcoin-vibes-beta-v32.1-2" VIBES_NONINTERACTIVE=1 sh ./install.sh
"$HOME/bitcoin-vibes-beta-v32.1-2/vibes" --chain regtest
```

The installer can download matching prepared programs instead of compiling.
Custom source changes may still need a C++ compiler and build dependencies.
The browser opens a private access link. Do not share that link or its `key`.

## Core session: about 30–45 minutes, no AI

1. Note the candidate, OS, browser and installation track. Before exploring,
   answer **Check your thinking**. Skip anything you prefer not to answer.
2. Run **Are your coins in your wallet?**, **Can a filter keep data out of the
   chain?**, **Can you raise the block reward?**, and **How does mining power
   affect a stricter chain?** Make a prediction, inspect the evidence, read the
   explanation and try the follow-up. For mining share, try two values the
   slider actually offers. Your coordinator may assign other lessons.
3. Reload the page and find your last result and saved answers. Close the
   browser tab and reopen the app while its console is still running. The
   existing lab should reopen, retaining its state. Record any difference.
4. Finish the second **Check your thinking** round when ready. Tell the
   coordinator what became clearer, what remains confusing, and whether any
   joke helped or distracted you. There is no preferred feedback.
5. **Download my record** is optional. Review the file before sharing; it
   contains answers, optional reasoning/reflections and can include identifiers
   and times. Do not post it
   publicly unless you deliberately consent to that disclosure.

This candidate adds a five-foundation path, a **Learning / Full lab** view
selector, contextual definitions, a controlled evidence walkthrough, and
separate practice with later-review suggestions. New real-node lessons cover
inputs/change, transaction size/fees, and watch-only wallets/signatures. The
proof-of-work, address-reuse and Lightning activities are explicitly simplified
browser models. The coordinator may assign these in addition to the core tasks
and arrange an optional seven-day follow-up. No reminder or study upload is
sent automatically.

Do not reset your progress or lab to work around a failure. Capture the
reproduction steps first. If setup appears stuck for five minutes with no new
activity, report that observation; a source compilation can legitimately take
longer, so include the last visible phase rather than repeatedly restarting.

If first preparation ends with an error, record the error first, then use
**Your node → Prepare and start node** to retry preparation. It can use a
matching prepared program; **Build & check** instead requests a source build.
There is no need to reset the lab to retry.

## Optional AI session

Do this only after the core session, with separate consent and a coordinator-
approved budget. Claude Code needs its own sign-in; prompts go to its provider.
Ready-made lessons do not need that account.

Use a harmless, narrowly scoped request supplied by the coordinator. Keep
**review before applying** enabled. Inspect the proposed files, build/tests
and comparison results, then apply only if you understand them. Exercise
**Revert** or **Restore the baseline source** and verify the result. A timeout,
build failure or request for extra access is a reportable result; do not turn
off sandboxing or grant broader permissions to force completion. Record costs
and time separately from the no-AI session.

## Report a problem or send feedback

- For a malfunction, use **Report a problem** in the app or open the
  [bug form](https://github.com/hotpixelgroup/bitcoin/issues/new?template=bug.yml).
- For confusing wording, learning or humour feedback, use the
  [feedback form](https://github.com/hotpixelgroup/bitcoin/issues/new?template=beta-feedback.yml).
- For a possible security vulnerability or exposed credential, stop the
  affected test and use the [private security report](https://github.com/hotpixelgroup/bitcoin/security/advisories/new).

New beta builds offer **Setup & help → Report a problem** to preview and copy
limited context. Nothing is submitted automatically. Older stable builds
can use the forms directly and leave that field empty. Include the version,
mode, OS/browser, exact steps, lesson/slider value, expected result, actual
result and a reviewed error excerpt or screenshot.

GitHub issues are public. Remove entire access URLs, credentials, local names
and paths, private requests and wallet data. Do not attach `.vibes`, full
launch logs or source patches by default. If you do not want to post publicly,
give the coordinator your reviewed report through the beta channel they
provided; there is no automatic private upload service.

## Finish

Stop the beta console or its node when finished. Keep its lab folder until
the coordinator has reproduced any problem; deleting it loses evidence and
learning records. Your stable lab and ordinary wallets should remain separate.
Follow the coordinator's agreed retention/deletion plan for feedback records.
