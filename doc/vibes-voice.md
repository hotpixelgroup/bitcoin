# Teaching voice and content review

The lab uses a dry, warm voice. Explain the mechanism and the actual observation
first, then allow one short wry beat about the situation. The node, transaction
or block can be the subject of the joke. The learner is not.

Predictions and answer options stay literal. Correct and incorrect answers get
honest feedback followed by the explanation; a wrong answer earns no invented
praise. Access, setup, errors, costs, backup instructions and network warnings
stay plain and actionable. A recorded result is always described as recorded.

## Copy map

All ten main lessons retain their existing mechanism, observations and limits.
Each now ends with one short line:

| Lesson | Wry beat | What it reinforces |
|---|---|---|
| Keys | “The chain did not notice the wallet's dramatic exit.” | Deleting a local wallet does not delete its confirmed outputs. Complete usable backups still matter. |
| Fees | “The 10 BTC payment brought a bigger number, not a better bid.” | This configured miner chose the higher fee rate, rather than the larger amount sent. |
| Reorganisations | “That first confirmation comes without a lifetime appointment.” | A confirmation describes the active chain and can be reversed. |
| Relay filter | “The transaction arrived in a block without an invitation to the filtering node's mempool.” | A node can reject an unconfirmed transaction under policy and accept a valid block containing it. |
| Larger subsidy | “The reference node was not impressed by the larger number.” | More claimed subsidy does not override the reference node's validity checks. |
| Smaller subsidy | “A stricter rule does not arrive with a complimentary mining crew.” | Local rejection does not produce compatible blocks or recruit miners. |
| Earlier halving | “Block 75 was when the fine print stopped being theoretical.” | The tested rule difference first appeared at a particular height. |
| Rule-breaking miner | “More hash power is not a permission slip to change another node's rules.” | Work cannot make a consensus-invalid block pass unchanged checks. This existing line moved from the follow-up to the main lesson. |
| Mining share | “Following a stricter chain does not download the stricter rulebook.” | Following a compatible branch does not independently enforce its new rule. |
| Soft fork | “The disabled check did exactly what 'disabled' advertised.” | The controlled CLTV example illustrates the absence of that check, not historical network behavior. |

The generic prediction, all follow-ups and all comparison verdicts were reviewed
for the same voice. Their literal wording and the warnings about limited evidence
remain in place. The miner follow-up keeps its mechanism and loses the relocated
line, so the joke is not repeated in the same experiment.

## Limits and verification

This is a content pass, not a new simulation. It changes no option IDs, answers,
questionnaire generation, observed results, comparison logic or node source.
It introduces no new field in the lesson payload and requires no new recordings.
The factual basis remains the primary references linked from the lessons and
the earlier [content audit](vibes-content-audit.md).

Verification checks the generated lesson payload against the existing scoring
and recording contracts, the five lesson tests, Python syntax and a static-site
build. Layout and frontend wording are reviewed separately with the UI changes.
No claim is made that humorous copy improves learning without testing it with
learners.
