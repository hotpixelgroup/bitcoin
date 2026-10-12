# Security Policy

Bitcoin Vibes is a real Bitcoin node with a console that lets its operator have
the node's source rewritten on purpose. That makes it worth being precise about
what counts as a bug.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's [private vulnerability
reporting](https://github.com/hotpixelgroup/bitcoin/security/advisories/new), or
email **harry@hotpixelgroup.com**.

Tell us what you found, how to reproduce it, and what an attacker gets. You will
get an acknowledgement within a few days. We are a small project and will not
pretend to a 24-hour SLA we cannot keep.

## What is in scope

- Anything that lets a **remote** party reach the console. It binds to
  loopback, demands an access key, and rejects cross-origin requests. A hole in
  any of that is serious: it would let a web page rewrite somebody's node.
- Access key leakage, fixation, or predictability. The key is stored in
  `.vibes/key` and reused across restarts; it should never appear in a log, and
  it should leave the address bar once the page has loaded.
- **Any escape from confinement.** AI-written code is compiled, tested and run
  inside `sandbox-exec` (macOS) or `bubblewrap` (Linux). Reaching the network,
  writing outside the lab's folders, or reading the operator's home folder, the
  console's key or the node's data folder from inside it is a vulnerability.
- **Anything a shared request can make happen** beyond a proposed change to
  node source that then waits for review. That includes getting the agent to
  run a command, read or reveal a file outside its workspace, reach the
  network, alter the lab's own files, or have a proposal applied or started
  without the operator's review.
- The agent gaining any tool beyond reading and editing files in its
  workspace.
- A build starting on a shared network when the console's own rules say it
  should not: one whose comparison found a consensus difference, or that was
  never compared.
- The console failing to report that the node has refused a block.
- A ready-made changed node being used when it was not built from the bundled
  patch on the same commit as the operator's source, or being run anywhere but
  a throwaway private chain inside the sandbox. Releases ship three nodes with
  one deliberately changed rule each; they do not follow Bitcoin's rules and
  must never be started as the operator's own node.
- A node program the operator points the lab at (Compare with another node
  program) reaching anything outside the sandbox.
- The console causing the node to run with settings the operator did not
  choose, or writing a `bitcoin.conf` that bricks it.
- Everything upstream Bitcoin Core would consider a vulnerability, in the parts
  of `src/` we have not touched. Those are also worth reporting
  [upstream](https://bitcoincore.org/en/contact/): they wrote them.

## What is not a vulnerability

- **The AI changed the code.** That is the product. Reviewing the change is the
  operator's job, and the console shows it to them before it is applied.
- **An experiment changed a consensus rule on the private regtest chain.** Also
  the product. The console compares the build with an unmodified node and
  states what was observed.
- **Someone with your access key changed your node.** They had the key. That
  is the door, not a window.
- **The comparison reported "no difference" for a change that does differ.**
  Its checks are limited and the console says so. A missed difference is a bug
  we want to hear about, in the open, as an ordinary issue.

## Known limits

- Confinement is by the operating system, not a virtual machine.
- With no sandbox available (Linux without `bubblewrap`, or other systems),
  builds and nodes run unconfined. The console says so, compiles nothing until
  the operator has reviewed and applied it, and disables automatic applying.
- In Docker the container is the enclosure; there is no second sandbox inside.
- On Linux the running node's network cannot be restricted to the local
  machine.
- The agent is confined by Claude Code's own tool and permission controls, not
  by the operating-system sandbox.
- Releases are not yet signed with a maintainer key and the Mac app is not
  notarised. Releases carry SHA-256 checksums and GitHub build provenance
  attestations, which show an asset was built by this repository's workflow;
  they are not an independent signature.

## Supported versions

The latest release, and `master`. This is a young project moving quickly; we do
not backport. If you are running something older, the fix is to update.

The fork is built on a development snapshot of Bitcoin Core recorded in
`contrib/vibes/UPSTREAM`. Security fixes made upstream after that commit are not
included until the base moves. The console shows the base and, when asked, how
far Bitcoin Core has moved since.
