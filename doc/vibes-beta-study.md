# Closed beta: a session with learners

Use this protocol with **5–10 consenting volunteers**, preferably people who
have not helped build the lab. Allow 45–60 minutes. Record the exact app
version or source commit, operating system, browser and study track. This is
a usability and comprehension check; a small uncontrolled sample cannot
establish that the app, or its humour, improves learning.

## Consent and privacy

Explain: “We are testing the app, not you. You can skip any question or stop.
May we take notes about confusing words, actions and explanations? Sharing a
learning export is optional.” Obtain separate permission for recordings or
quoted feedback; do not record by default.

The app has no built-in analytics or automatic study upload. Demo learning
records stay in that browser's local storage; installed-lab records stay in
`.vibes/learning.json`. Web hosting still receives ordinary page requests, and
installed setup or updates can contact GitHub. These are separate from study
collection. Exports contain answers and identifiers, and can include times.
Treat them as participant data, not guaranteed anonymous data. Use participant codes.

Review files before sharing; never request wallet backups, seeds, access links,
API keys or account details. Publicly attaching records requires separate,
informed permission. Agree a deletion date before collection; default to
30 days after the beta review, retaining only de-identified aggregate findings.
Deleting your copy does not remove copies others received.

## Keep the two tracks separate

- **Core session, no AI:** use either the browser demo, which replays recorded
  real-node observations, or the installed lab's ready-made experiments,
  which run nodes on throwaway regtest chains. Record which one was used;
  analyse installation problems separately from lesson comprehension. No AI
  account or payment is needed. Use no real funds or mainnet.
- **Optional AI session:** only after the core session, with separate consent
  and an agreed spending limit. Requests go to the AI provider and may incur charges.
  Keep its timings and scores separate. Declining does not fail the core session.

## Session script

Do not show lesson answers, a scoring key or this protocol's evaluation notes
to participants. The app deliberately shows explanations after predictions;
do not add hints before they commit. Ask only neutral prompts such as “What
are you trying to do?” or “What does that mean to you?” Record any help given.

1. Ask about prior Bitcoin familiarity in broad terms. Start with a fresh
   browser profile or lab learning record; preserve an existing record first.
   Complete **Check your thinking** without hints.
2. Say: “Choose a ready-made experiment, make a prediction, run it, and tell
   me what you think the result means.” Include **Are your coins in your
   wallet?**, **Can a filter keep data out of the chain?**, **Can you raise the
   block reward?**, and **How does mining power affect a stricter chain?**
   For the mining-share experiment, try two supported, well-separated settings.
   Assign up to two more per person beforehand so all ten are tried across the
   group. Do not change assignments based on scores.
3. Let them use each follow-up normally. Note hesitation, rereading, unexpected
   actions and the learner's explanation in their own words. After two minutes
   stuck, offer help, mark it assisted, and let them continue or stop. Correct
   factual answers only at the end.
4. Complete the second **Check your thinking** round. Before discussing scores,
   ask these open questions without consulting the lesson text:
   - What would you need to know before relying on a wallet backup?
   - What can you infer from a node refusing an unconfirmed transaction?
   - What would you need to know to predict the effect of changing a block rule?
   - What does seeing two nodes follow one chain tell you about their checks?
5. Ask separately: “Which wording, if any, helped you understand?” and “Which
   wording, if any, confused or distracted you?” Then ask whether they noticed
   humorous lines, and whether those helped, distracted or had no effect. Accept
   “none” and negative responses without defending the copy.
6. Ask them to reload and find their last result. Invite an optional **Download
   my record** export, with a separate sharing choice. Debrief misconceptions
   using the lesson sources and explain the [bug-report flow](vibes-beta.md).
   Do not submit anything on their behalf without consent.

## Decide the gates before the first session

Record raw counts and assisted attempts. Use the lessons and their
[content audit](vibes-content-audit.md) as the factual reference. Apply the same
rubric to everyone: for each open question award **0** for an incorrect
or absent explanation, **1** for a partly correct explanation, and **2** for an
accurate explanation that includes a relevant limitation. Write a short reason
for each mark; have a second reviewer check independently if possible.

Before widening the beta, require:

- No unresolved misleading teaching claim, privacy or fund-safety defect, or
  loss of a saved learning record. Any such observation blocks expansion.
- Every lesson tried by at least one learner; at least 80% of participants
  complete the four core experiments and recover their result after reload
  without action-specific help.
- At least 80% score **6/8 or better** on the four open explanations, with no
  repeated misconception left unaddressed by a content or interface change.
  Recheck a changed explanation with fresh volunteers before claiming the gate passed.
- Each repeated blocker has a reproducible report and verified fix, or an
  explicit decision to keep the beta limited. Automated release checks pass separately.

Report built-in before/after, prediction and follow-up scores separately from
open explanations, usability observations and humour feedback. Repeated
questions, feedback and familiarity affect scores. A right option alone does
not demonstrate understanding; disliking a joke is not a wrong comprehension
answer. These gates do not establish educational efficacy.
