# Running a session with learners

This page helps a teacher, meetup organiser or maintainer observe where
learners get stuck and how they explain the results. It does not establish
that changing a node teaches better than another approach. For a closed beta,
use the [beta learner protocol](vibes-beta-study.md), which adds consent,
privacy, separate humour feedback and predefined criteria for widening the beta.

## Who and what you need

- Five to ten consenting people who do not work on Bitcoin software. A small
  sample can expose problems; it does not establish how common they are.
- One machine per person with the lab installed and a reference node ready, or
  the [browser demo](https://hotpixelgroup.github.io/bitcoin/demo.html), which
  replays recorded results and needs nothing installed.
- One observer per learner if you can manage it. The observer watches and
  writes; they do not explain.

## The session

1. **Before.** The learner opens **Check your thinking** and answers the ten
   statements. Nothing is marked. Ask them to say out loud why they chose each
   answer; write down the reasons, in their words.
2. **Experiments.** They run these four, in this order, with no help:
   *Are your coins in your wallet?*, *Can a filter keep data out of the
   chain?*, *Can you raise the block reward?* and *How does mining power affect
   a stricter chain?* (at two well-separated supported shares). They make each
   prediction before running it.
3. **After.** They answer the ten statements again, then read the comparison
   the console shows.
4. **One question.** "What surprised you?" Write the answer down verbatim.
5. **Export.** **Download my record** saves their answers as a file.

## What to write down while watching

- Every place they stop, re-read, or ask what a word means. The word, and
  where it was on the page.
- Every prediction they got wrong, and what they said when they saw the
  result.
- Anything they concluded that is not true, in their own words. Check whether
  the explanation or interface encouraged that conclusion.
- Anything they tried to do that the lab would not let them.

Do not correct them during the session. Afterwards is fine.

## What to compare

The exported record includes before/after, prediction and follow-up scores.
Follow-ups ask about a different setting, but a correct option alone does not
demonstrate understanding. Compare scores with the learner's own explanation;
do not label a learner's understanding from those numbers alone. Repeated
questions, feedback and prior knowledge can all affect the result.

Be careful what you claim from this. A handful of people and a before-and-after
design can show where the lab confuses people and whether answers move at all.
It cannot show that the lab works better than reading an explanation, which
would need a comparison group.

## Sending results back

Sharing notes or **Download my record** exports is optional. Exports contain
answers and identifiers, and can include times; they are not guaranteed
anonymous. Review them before sharing and never include seeds, wallet backups,
access links, keys or account details. Get separate, informed permission before
attaching participant data or quotations to a public issue at
[github.com/hotpixelgroup/bitcoin](https://github.com/hotpixelgroup/bitcoin/issues).
The [beta protocol](vibes-beta-study.md#consent-and-privacy) covers consent and
retention. A reproducible description of a confusing result can be useful
without anyone's raw record.
