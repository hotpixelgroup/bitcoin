# Closed-beta coordination and release checks

Use `v31.99-10` as the immutable stable baseline. The fixes and reporting
workflow are assigned to **`beta-v32.1-1`**, published as a prerelease with
`latest=false`. Do not move an existing tag or replace its assets. Signing
preparation remains on its separate deferred branch and is excluded here.

## Before inviting anyone

- Confirm final PR CI is green, including full Core tests, app tests against
  real nodes, sandbox checks, all recorded inputs, browser workflows and
  accessibility/layout checks.
- Publish the candidate only after its three native builds and prepublication
  full-installer/cold-entry checks pass. Then require all three public-download
  smoke jobs to pass. Verify asset hashes/provenance and that stable `latest`
  still resolves to `v31.99-10`.
- Check the Mac beta stamp, `.beta` bundle identifier and isolated default lab
  directory. Test ordinary reopen while a console is already running as well
  as full stop/relaunch persistence. No protection bypass is a passing result.
- Review the [tester guide](vibes-beta.md), [learner protocol](vibes-beta-study.md),
  public bug/feedback forms and private security-report route. Use reviewed
  synthetic examples for flow checks; do not submit test issues or contact
  people automatically.
- Assign a coordinator, a private contact route and response owner before
  handing out the guide. No invitation list, support inbox or private
  reporting destination is configured by these files.

## Cohort and coverage

Invite 5–10 consenting volunteers yourself. Record pseudonymous participant
IDs and distribute the supported platforms across the cohort. Include fresh
and existing-user scenarios, Chrome/Safari-family browsers, keyboard-only
navigation and small screens. Docker, Intel Mac and other environments are
exploratory unless separately verified. Record installation friction and
unsigned-Mac warnings distinctly from lesson outcomes.

Use the learner protocol's fixed tasks and rubric. Include every lesson
across the cohort. Keep the recorded browser demo, installed native lessons
and optional AI sessions as separate tracks. The optional AI test needs
separate consent, provider authentication and an explicit spending cap.

## Triage

| Priority | Examples | Response |
|---|---|---|
| Stop affected beta testing | Credential exposure, unintended non-regtest activity, unexpected writes outside the chosen lab, saved-data loss, wrong destructive recovery guidance | Preserve evidence privately, isolate the affected flow and investigate before resuming it |
| Blocks a core task | Supported-platform installation/start failure, crash, lost result, unusable controls, misleading lesson claim | Reproduce on the pinned version; fix and verify before expanding the cohort |
| Usability/content feedback | Confusing wording, navigation friction, unhelpful humour, minor layout issues | Record the task and impact; group repeated observations and retest changes |

Ask for the exact release/source revision, mode, OS/browser, steps, last
visible phase and a reviewed excerpt. Never request raw `.vibes` folders,
wallet material, private prompts or unredacted launch logs. Do not promise
that learning exports are anonymous. Agree retention and obtain consent for
recordings, quotes and sharing. Public issues need the participant's deliberate
choice; the app's context-copy function is not a submission or telemetry system.

For a reproduced issue, add a regression at the layer that exposed it. Record
what was tested and the remaining limit. A closed issue alone is not evidence
of a fix. Publish another immutable candidate if shipped bytes change, and
record which participants used which version rather than silently updating
them midway through a session.

## Expansion and rollback

Use the predefined gates in the learner protocol. Also require completed
setup/lesson/persistence flows on each supported platform and no unresolved
critical defect. Report raw counts and assistance, not just percentages; a
small uncontrolled sample does not prove educational effectiveness.

If a candidate fails its release or public-download gate, keep invitations
paused. If a public candidate has a serious defect, mark it unsuitable in its
release notes and direct testers to stop that flow. Keep stable `v31.99-10`
available; return affected testers to a separate stable lab only after reviewing
their evidence. Do not overwrite tags, delete participants' data, or downgrade
a changed chain database as a recovery shortcut.

## Creating the beta release

The release workflow has a boolean **`prerelease`** input. Stable tag-push
releases retain the normal stable policy; the closed-beta run must be manually
dispatched from its exact tag with `prerelease=true`.

The beta uses the `beta-v…` tag prefix. The release workflow's tag-push
trigger and older stable apps' release-update lookup both match `v*`, so they
do not select this beta tag. Push a new annotated `beta-v…` tag only after
final PR/master verification. Temporarily enable Actions if required, then
manually dispatch the release workflow **from that exact tag**, supplying its
tag name and `prerelease=true`. Confirm the run's source is the tagged commit.
Restore the repository's original Actions setting after all jobs finish.

The workflow rejects a beta tag dispatched as stable, or a stable tag
dispatched as beta. Final checks must confirm `isPrerelease=true`, the full
asset set and unchanged stable `latest`. Source checkouts that deliberately
follow development branches are a separate update track. This document is a
checklist, not evidence that a release, cohort or paid AI test has happened.
