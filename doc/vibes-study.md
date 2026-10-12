# Running a session with learners

Nobody has measured whether changing a node teaches Bitcoin. This page is for
anyone willing to find out: a teacher, a meetup organiser, or the maintainers.
It asks little of the learner and produces a record you can compare across
people.

## Who and what you need

- Five to ten people who do not work on Bitcoin software. Five is enough to
  see where people get stuck.
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
   chain?*, *Can you raise the block reward?* and *How much mining power does a
   stricter rule need?* (at one share below half and one above). They make each
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
- Anything they concluded that is not true. This matters most: the research
  behind this lab found that a wrong idea does more harm than a missing one,
  and that people believe what a tool shows them.
- Anything they tried to do that the lab would not let them.

Do not correct them during the session. Afterwards is fine.

## What to compare

For each learner the exported record gives three numbers: statements right
before, statements right after, and follow-up questions right. The follow-up
questions matter most, because each one asks about a situation the experiment
did not show. A learner who improves on the statements and misses the
follow-ups has remembered the answer without the idea.

Be careful what you claim from this. A handful of people and a before-and-after
design can show where the lab confuses people and whether answers move at all.
It cannot show that the lab works better than reading an explanation, which
would need a comparison group.

## Sending results back

Open an issue at
[github.com/hotpixelgroup/bitcoin](https://github.com/hotpixelgroup/bitcoin/issues)
with the exported records (they contain answers and times, nothing personal)
and your notes. The wrong conclusions people reached are the most useful part.
