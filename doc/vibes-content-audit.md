# Bitcoin Vibes educational audit

Reviewed 31 October 2026. This records the content corrections in the product
audit PR. Runtime, browser and packaging verification are recorded separately
in the release audit results.

## Review method

Read all ten experiments, their prediction and follow-up choices, the ten
before/after statements, every comparison verdict, the network descriptions,
and the corresponding README, manual and landing-page claims. Compare each
explanation with the actual scene implementation and with primary references.
The node-source links in the lessons now point to the project's recorded
upstream base, rather than a moving `master` branch.

The lesson must separate three things: what a particular run observed, the
mechanism that explains it, and the limits of applying it to a real network.
A missing observation must not be filled in by a fixed lesson answer.

## Findings and corrections

| Area | Problem | Correction and evidence |
|---|---|---|
| Comparison outcomes | “Policy changed; consensus did not” treated limited tests as a proof about all consensus rules. | Describe the transaction-policy difference and absence of an observed block disagreement. Preserve the possibility of untested differences. |
| Tightening | Majority mining power was presented as the only way a stricter chain could grow or be followed. | Explain the subset relationship of a pure soft fork and selection by accumulated valid work. A minority can still mine a compatible branch; old nodes following it do not independently enforce the new rule. [Consensus guide](https://developer.bitcoin.org/devguide/block_chain.html), [BIP 9](https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki). |
| Loosening | Accepting a looser rule was described as automatically leaving the existing chain. | A changed node can remain on the existing chain. Divergence requires blocks using the new permission and a branch that the changed node follows. |
| Two-way disagreement | Rejection in both directions was said to prove permanent separation. | Report the two observed rejections. They do not exclude a possible branch satisfying both rule sets or a later software change. |
| Keys and backups | A seed or key backup was equated with the whole wallet and universal spending power. | Explain this single-signature scene separately from watch-only, multisignature, passphrase and script recovery requirements. [Wallet guide](https://developer.bitcoin.org/devguide/wallets.html), [BIP 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki), [Core descriptors](https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/doc/descriptors.md). |
| Fees | Fees were described per raw byte, miner ordering as mandatory, and almost any fee as enough in an empty block. | Use satoshis per virtual byte, identify the configured miner's behavior, and explain that policy floors and related transactions matter. [BIP 141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki), [Core 30.0 release notes](https://bitcoincore.org/en/releases/30.0/). |
| Reorganisations | “Longer” was used without requiring a valid higher-work branch; a reorg was said always to put a payment back in the waiting area. | Specify accumulated valid work and the scene's lack of a conflicting spend. A conflict can instead invalidate the payment. [Consensus guide](https://developer.bitcoin.org/devguide/block_chain.html). |
| Relay filters | The explanation implied filters cannot affect miners or propagation at all. | A relay filter does not change block validity. It can affect propagation and mining templates, but does not guarantee exclusion from valid blocks. [Core policy](https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/doc/policy/README.md), [Core 30.0 release notes](https://bitcoincore.org/en/releases/30.0/). |
| Subsidy | Block reward and new issuance were conflated; changing `MAX_MONEY` was said to change nothing. | Distinguish subsidy from fees and the issuance schedule from the separate consensus range checks. Raising that bound alone does not increase the subsidy. [Subsidy and coinbase checks](https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/validation.cpp), [amount bounds](https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/consensus/amount.h). |
| Smaller subsidy | An unsupported claim about BIP 110, August 2026 and 2.5% signaling was used as evidence. | Remove that quantitative historical claim. The scene itself demonstrates rejection of an overclaim; no external historical example is needed. Also distinguish no compatible blocks from slow compatible mining. |
| Earlier halving | Agreement until height 75 was described as complete compatibility. | State that the first 74 reference blocks were accepted, and the height-75 reference block exercised the difference. Underclaiming miners can still make blocks accepted by both. |
| Rule-breaking miner | Thirty branch blocks versus two branch blocks was described as fifteen times total chainwork, ignoring their shared prefix. | Ask which valid chain is followed without the false ratio. Describe the branches as constructed regtest examples, not measurements of hash power. |
| Mining share | A deterministic forty-block schedule was presented as a universal 50% threshold; a 3% share was equated with permanent 3% chain growth. | Label the schedule and its limitations. Grade the observed active-chain outcome, not `share > 50`. Remove the growth-rate assertion and separate signaling, activation and enforcement. |
| Soft fork | A modern regtest configuration was advertised as a historical replay of unupgraded 2015 nodes. The historical signaling account also omitted BIP 65's two thresholds. | Describe a controlled BIP 65 demonstration with its check disabled on one modern node. Do not infer historical network behavior from this scene. [BIP 65 specification and deployment](https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki). |
| Networks and storage | Regtest isolation, zero coin value and mainnet storage requirements were absolute properties. | Scope isolation to the lab configuration; describe test coins as intended for testing. Explain that pruning reduces retained block storage but does not avoid initial historical download and verification. [Chain parameters](https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/kernel/chainparams.cpp). |
| Documentation | The inherited upstream README appeared to describe this fork's CI and releases. | Label the inherited section as upstream process information; point readers to the fork's own workflows and releases. |

## Scoring and persistence

All ten statements use IDs ending in `-v2` as one revised questionnaire.
Six changed wording materially; versioning the whole round also prevents
silently mixing four old immutable answers with six new answers. Previous
entries remain available in the exported record. The current questionnaire
still has three true and seven false statements.

The mining-share experiment has no fixed answer in the catalogue. Scene
results supply `compare.observed_answer` only when the required observations
were obtained. The browser and server must use that result when scoring a
prediction. `expected_answer()` remains a compatibility helper for the
designed answer of fixed scenes; it does not replace runtime evidence.

## Content checks

- `python3 -m py_compile contrib/vibes/vibeslib/lessons.py` passes.
- Lesson payload checks confirm ten experiments, ten unique belief IDs,
  valid fixed-scene answer choices, three true statements, and no mining-share
  answer derived from an input threshold.
- The static site builds from the same lesson payload as the console.
- Full scene replay, browser assertions and release checks are reported with
  the integrated PR verification results rather than claimed by this content
  review alone.
