# Security Policy

Bitcoin Vibes is a real Bitcoin node. Please treat security findings the way you
would for any node, with one wrinkle: this one lets its operator rewrite its own
source code on purpose, so we need to be clear about what counts as a bug.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's [private vulnerability
reporting](https://github.com/hotpixelgroup/bitcoin/security/advisories/new), or
email **harry@hotpixelgroup.com**.

Tell us what you found, how to reproduce it, and what an attacker gets. You will
get an acknowledgement within a few days. We are a small project and will not
pretend to a 24-hour SLA we cannot keep.

## What is in scope

- Anything that lets a **remote** party reach the Vibe Console. It binds to
  loopback, demands a per-session key, and rejects cross-origin requests. A hole
  in any of that is serious — it would let a web page rewrite somebody's node.
- Session key leakage, fixation, or predictability.
- The console causing the node to run with settings the operator did not choose,
  or writing a `bitcoin.conf` that bricks it.
- Anything letting a decree escape the guarded tool allowlist without the
  operator turning on YOLO mode.
- Everything upstream Bitcoin Core would consider a vulnerability, in the parts
  of `src/` we have not touched. Those are also worth reporting
  [upstream](https://bitcoincore.org/en/contact/) — they wrote them.

## What is not a vulnerability

- **The AI changed the code.** That is the product.
- **A decree broke consensus and the node forked.** Also the product. The
  console names the rule you changed and states the consequence before it
  commits.
- **YOLO mode ran something dangerous.** It is labelled, it is off by default,
  and it asks for confirmation. That is a loaded gun with a safety catch, not a
  misfire.
- **Someone with your session key changed your node.** They had the key. That
  is the door, not a window.

## Supported versions

`master`. This is a young project moving quickly; we do not backport. If you are
running something older, the fix is to pull.
