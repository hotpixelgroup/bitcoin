Contributing to Bitcoin Vibes
=============================

Thank you for considering it. Bitcoin Core requires rough consensus among
thousands of strangers. Bitcoin Knots requires one man's blessing. We require a
pull request that works.

This is a real Bitcoin node and it is maintained like one — but the bar for
*participating* is deliberately lower than upstream's, because upstream's bar is
why half the good ideas in this space never shipped.

Where things live
-----------------

| Branch | What it is |
|---|---|
| `master` | The project. Default branch, protected, what people install. |
| `core-master` | A pristine mirror of `bitcoin/bitcoin` master. Never edited by hand. |
| `vibes` | Legacy alias of `master`, kept alive so already-published install links keep working. |

Work happens on a branch off `master` and comes back as a pull request.

The one-minute version
----------------------

```bash
git clone https://github.com/hotpixelgroup/bitcoin.git && cd bitcoin
git switch -c my-change
# do the thing
./vibes --engine mock --no-open     # the whole console loop, no AI, no bill
git commit -am "console: do the thing"
git push -u origin my-change && gh pr create
```

What gets merged quickly
------------------------

- **Anything that makes this easier for a non-technical person.** That is the
  entire project. A clearer error message beats a clever refactor.
- Bug fixes, with a note on how you reproduced it.
- Settings the console should expose but doesn't.
- Better plain-English explanations. The explanations *are* the product: what
  the lab teaches lives in `contrib/vibes/vibeslib/lessons.py`, written by
  people, and every claim in it should be something the lab can show.
- Jokes that land, in the README and the manual. The console itself speaks
  plainly: its text sits beside evidence, warnings and errors, where a joke
  costs clarity. Nothing anywhere lies to make a joke work, and nothing dares
  anyone onto the real network.

What gets a slower look
-----------------------

- **Anything touching consensus code in `src/`.** Not because we are precious,
  but because a fresh install must remain stock Bitcoin Core: 21 million coins,
  50 BTC subsidy, every rule as upstream wrote it. Shipping our monetary
  opinions to strangers would be indistinguishable from an attack. *Your* node
  can be whatever you like. The default cannot.
- New dependencies. The console is standard-library Python on purpose and it
  installs on a clean machine with one command. Both facts are load-bearing.
- Anything that widens the console's exposure beyond loopback.

On AI-written code
------------------

Upstream's [AI policy](doc/AI_POLICY.md) asks that you could have written the
code yourself. We inherited that file and we have kept it — a project whose
premise is an AI rewriting a Bitcoin node should be *more* careful here than
most, not less.

So use whatever tools you like, but you own the diff. If a reviewer asks why a
line is there, "the model wrote it" is not an answer. Three honest sentences
from you beat four paragraphs of generated prose.

Reviewing
---------

Say what you actually tested:

> ACK 1a2b3c4: built it, ran a ready-made experiment on regtest, watched the
> unmodified node refuse the block.

That is worth more than a thumbs up. If you only read the diff, say so; a review
of the reading is still a review, it is just a different one.

This project asks its operators to read a change before they apply it, and it
holds itself to the same rule. Every pull request is read by someone other
than its author before it is merged. When no second person is available, an
independent AI review is attached to the pull request as advice for the
author; it is not approval. Nothing is merged unless CI is green on the exact
commit being merged, administrators included.

Reviewing the lessons
---------------------

Everything the lab teaches is in `contrib/vibes/vibeslib/lessons.py`: ten
experiments, each with a prediction question, an explanation, a follow-up
question and its sources, plus ten true-or-false statements. If you know
Bitcoin well, reading that one file critically is the most valuable review
this project can receive. For each explanation, ask:

- Is every sentence true as written, including the simplifications?
- Does the lab actually show it, or does the text claim more than was observed?
- Would a newcomer come away with a wrong idea that the text did not intend?
- On anything people genuinely disagree about, does it stay out of the argument?

No Bitcoin Core contributor or educator has reviewed these lessons yet. Until
one has, treat them as careful drafts.

Getting it running
------------------

[doc/vibes.md](doc/vibes.md) is the manual. `./vibes --engine mock` runs the
console end to end with no AI and no cost, which is how most console work should
be done.

Code of conduct
---------------

[Here](CODE_OF_CONDUCT.md). It is short.
