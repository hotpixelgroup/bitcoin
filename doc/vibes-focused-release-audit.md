# Focused voice, usability and first-launch pass

This pass follows the broad audit in PR #13 and the layout and packaging fixes
in PR #14. The source of Bitcoin Core and the recorded observations stay the
same. The ten-lesson [voice map](vibes-voice.md) lists each short wry line and
the mechanism it reinforces. Answer options, scoring and safety messages stay
literal.

## Problems corrected

- Cross-site links to the local console could fail in WebKit: a redirect chain
  withheld the newly set `SameSite=Strict` cookie. A public, key-free bootstrap
  document now commits on the console's origin before replacing the access URL
  with the app URL. The cookie remains HttpOnly and Strict, the key leaves the
  address bar, fragments survive, and same-origin checks remain in force.
  Access failures explain how to reopen the lab and allow local cookies.
- First entry with no node program looked ready but had disabled experiments.
  Loading, preparation and preparation errors now explain what is happening
  and provide a focusable path to setup or the activity details. Ready-made
  lessons remain available without AI sign-in once a node program is ready.
- Returning learners can continue with the next unexplored experiment. The
  final lesson leads to reflection. A questionnaire started after exploring
  no longer claims to be a before-experiment baseline. Demo reset clears stale
  scores and activity text. Import confirmation explains when it replaces a
  draft and describes sandbox availability accurately. Repeated unchanged
  status polls no longer rewrite several live regions.
- The landing preview no longer gives the wrong subsidy amount for a recorded
  block after the regtest halving. It describes the observed comparison.
- Installation checks working Python and git, including macOS tool stubs.
  Prepared programs are tried before compiler dependencies. Both node and CLI
  are checked before replacing an installation. Cold source downloads use a
  temporary folder, preserve existing files on failure and can be retried.
  The Mac initial download uses a notification instead of a blocking dialog.
- Setup does not report a running node when startup fails. Staged program
  probes grant the sandbox read access only to their own program directory.

## Verification and limits

Python tests exercise startup failure, prepared-program rejection, installer
retries, file preservation and executable tool detection. Browser checks cover
the learning flow, direct and cross-site entry in Chromium and WebKit,
keyboard focus, narrow layouts, native form alignment and accessibility.
Existing exact recording contracts cover all 26 supported demo inputs.

Release CI builds all three supported native platforms and exercises the full
installer and shipped app entry before publication, then repeats from public
downloads on fresh runners. These checks use cold lab state, automatic startup,
the mock agent and suppressed browser opening. They check session/assets, a
private-chain block, the first lesson and saved prediction, all three changed
nodes, and persistence after relaunch. Published checksums, source and patch
metadata, architectures and build attestations are also verified.

The Mac check executes the copied bundle's launcher directly. GitHub's Mac
image already has developer tools; this is not a factory-clean Mac or a manual
Finder/Gatekeeper test. Tool-stub recovery is tested separately. Ad-hoc signing
does not establish notarisation. No paid AI session or real-funds workflow is
part of this verification, and native Bitcoin programs are executed only on
isolated CI runners. Automated checks cannot establish that all users find the
humour funny or that every possible workflow is defect-free.
