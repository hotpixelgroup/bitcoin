"""Reviewed prompts and terminology. No generated answers or remote services."""

BEGINNER_ROUTE = ["keys", "utxos", "fees", "relay-filter", "double-reward"]

GLOSSARY = {
    "BTC": "One bitcoin. One BTC contains 100,000,000 satoshis.",
    "UTXO": "An unspent transaction output: an amount with conditions that must be satisfied to spend it.",
    "input": "A reference to a previous output that this transaction spends in full.",
    "change": "A new output returning the remainder to the sender after the payment and fee.",
    "private key": "A secret used to make signatures that satisfy particular spending conditions.",
    "descriptor": "A description of a wallet's output scripts and keys. Public descriptors can reveal activity without granting spending access.",
    "sat/vB": "Satoshis per virtual byte: a fee rate per unit of transaction size. Virtual size accounts for Bitcoin's transaction-weight rules.",
    "mempool": "One node's local collection of unconfirmed transactions. Nodes can have different collections.",
    "confirmation": "Inclusion in the active chain; each later block adds another confirmation. Reorganisations can change this count.",
    "proof of work": "Evidence of computational work meeting a block's target. A node first checks validity, then compares accumulated work.",
    "policy": "A node's local choices about unconfirmed transactions, including what it stores and relays.",
    "consensus rule": "A rule a node uses to decide whether a block or transaction in a block is valid.",
    "OP_RETURN": "A script instruction commonly used in outputs carrying data that cannot be spent.",
    "subsidy": "The maximum newly issued bitcoin a block may claim. The miner may also collect transaction fees.",
    "soft fork": "A pure tightening of validity rules: every block valid under the stricter rules is also valid under the older rules.",
    "hash rate": "The rate of proof-of-work attempts. A share of hash rate is not a guaranteed share of blocks in a finite time.",
    "time lock": "A spending condition requiring a specified block height or time to be reached.",
}

TERMS = {
    "keys": ["BTC", "private key", "UTXO"], "utxos": ["UTXO", "input", "change"],
    "fees": ["BTC", "sat/vB", "mempool"], "fee-size": ["input", "sat/vB"],
    "watch-only": ["private key", "descriptor"], "reorg": ["confirmation", "proof of work"],
    "relay-filter": ["policy", "consensus rule", "OP_RETURN"],
    "double-reward": ["subsidy", "consensus rule"], "halve-reward": ["subsidy", "soft fork"],
    "faster-halving": ["subsidy", "consensus rule"], "miners": ["subsidy", "proof of work"],
    "power": ["hash rate", "soft fork", "proof of work"], "softfork": ["soft fork", "time lock"],
}

TAKEAWAYS = {
    "keys": "The chain records the outputs; the wallet supplies information needed to spend them.",
    "utxos": "Inputs are spent whole. The transaction creates payment and change outputs; the difference is the fee.",
    "fees": "The configured miner chose the better bid for space, not the larger payment.",
    "fee-size": "The same amount and fee rate can produce different total fees when transaction sizes differ.",
    "watch-only": "Recognizing a payment and authorizing a spend are different capabilities.",
    "reorg": "Confirmations can change when a node adopts a valid chain with more accumulated work.",
    "relay-filter": "Refusing to relay a transaction does not make it invalid inside a block.",
    "double-reward": "The second node still applies its own subsidy limit.",
    "halve-reward": "A stricter node rejects blocks that break its rule, even when other nodes accept them.",
    "faster-halving": "A rule difference stays invisible until a block exercises it.",
    "miners": "Extra proof of work cannot make a rule-breaking block valid to an unchanged node.",
    "power": "Following a stricter chain does not mean independently checking its extra rule.",
    "softfork": "A node that omits a new check cannot independently detect violations of that check.",
}


def question(identity, prompt, options, answer, why):
    return {"id": identity, "question": prompt,
            "options": [{"id": str(i), "text": text} for i, text in enumerate(options)],
            "answer": str(answer), "why": why}


# Stable question IDs preserve the meaning of saved first attempts. Change an
# ID when changing the claim or its answer. Every concept has varied practice
# in addition to its immediate lesson follow-up.
PRACTICE = {
    "keys": [
        question("keys-backup-1", "A laptop fails, but its complete usable wallet backup survives. Did the on-chain outputs disappear?",
                 ["Yes, the coins were on the laptop.", "No; restoring the required spending information can restore access.", "Miners must create replacement coins."], 1,
                 "Device loss does not delete outputs. Access depends on recovering the information required by their spending conditions."),
        question("keys-watch-1", "An app shows an address balance but holds no signing keys. What does that establish?",
                 ["It can see the outputs, but that alone does not show it can spend.", "It can spend because it can see the balance.", "It owns a copy of the coins."], 0,
                 "Visibility and signing authority are separate. A watch-only wallet can display outputs it cannot spend."),
    ],
    "utxos": [
        question("utxo-sum-1", "Two inputs total 30,000 satoshis. The payment is 18,000 and the fee is 600. What is the change?",
                 ["12,000 satoshis.", "600 satoshis.", "11,400 satoshis."], 2,
                 "30,000 − 18,000 − 600 = 11,400. The sender constructs a new change output."),
        question("utxo-whole-1", "You spend a 40,000-satoshi output to pay 25,000, with change and a fee. What remains of the original output?",
                 ["It remains worth 15,000.", "It is spent in full; change is a new output.", "It becomes the miner's account."], 1,
                 "An input consumes the whole referenced output. Remaining value is represented by a new output, less the fee."),
    ],
    "fees": [
        question("fees-equal-space-1", "Two independent payments use equal virtual space. One sends less BTC but pays a higher fee rate. What does this lab's configured miner prefer?",
                 ["The one sending more BTC.", "The one with the higher fee rate.", "Always the older one."], 1,
                 "The configured assembler compares the fee bid for space. Actual miners can choose other policies, and dependencies matter."),
        question("fees-no-guarantee-1", "You broadcast a very low-fee payment. Does an eventually empty block guarantee confirmation?",
                 ["Yes, every payment is eventually included.", "Yes, if it sends enough BTC.", "No; relay/mining floors and miner choices can still prevent it."], 2,
                 "Unconfirmed transactions have no universal inclusion guarantee, even when some blocks have room."),
    ],
    "fee-size": [
        question("fee-size-math-1", "A transaction uses 150 virtual bytes at 4 sat/vB. What total fee does that describe?",
                 ["600 satoshis.", "4% of its value.", "150 satoshis."], 0, "150 × 4 = 600 satoshis."),
        question("fee-bump-1", "A wallet offers to increase an unconfirmed transaction's fee. What can that promise?",
                 ["It reverses a confirmed payment.", "It may improve the bid if accepted under node policy; confirmation is still not guaranteed.", "The next miner must include it."], 1,
                 "Replacement is a policy-governed change to an unconfirmed transaction. A higher fee does not command miners or undo confirmations."),
    ],
    "watch-only": [
        question("watch-recovery-1", "For a 2-of-3 wallet, you recover two signing keys but lose the information describing the wallet's script. Is recovery automatically assured?",
                 ["Yes, every pair of seeds reconstructs every wallet.", "Yes, if an explorer shows a balance.", "No; the required wallet/script information must also be recovered."], 2,
                 "Recovery must reconstruct the actual spending conditions, not just reach a count of seed phrases."),
        question("watch-public-1", "Is sharing a public descriptor always harmless because it cannot sign?",
                 ["No. It can reveal addresses and link wallet activity.", "Yes, it contains no useful information.", "It gives the recipient all private keys."], 0,
                 "A public descriptor can expose wallet structure and activity without granting spending authority."),
    ],
    "reorg": [
        question("reorg-conflict-1", "A higher-work valid branch contains a conflicting spend of your payment's input. Must your original payment return to the mempool?",
                 ["Yes, every displaced payment returns.", "No; the conflict can make it invalid on the new active chain.", "It is automatically paid twice."], 1,
                 "The original scene had no conflicting spend. With a conflict, a displaced transaction may no longer be valid."),
        question("reorg-valid-1", "A branch has more work but contains a block your node rejects. Must your node follow it?",
                 ["Yes, work overrides all checks.", "Only if most visible nodes follow it.", "No; chain selection considers branches that satisfy its rules."], 2,
                 "Validity is checked before comparing accumulated work."),
    ],
    "relay-filter": [
        question("relay-route-1", "A miner receives a valid transaction through a private route after your node refuses to relay it. What determines your node's acceptance of its block?",
                 ["Its block-validity rules.", "Whether its own mempool contained the transaction.", "Whether the miner used your route."], 0,
                 "Local relay policy does not become an extra consensus check on transactions inside a block."),
        question("relay-effect-1", "Does a local relay policy have no effect at all?",
                 ["Correct; policy is meaningless.", "No. It can affect propagation, mempools and mining templates without changing block validity.", "It rewrites all peers' rules."], 1,
                 "Policy affects local and network behavior even when it does not change block validity."),
    ],
    "double-reward": [
        question("reward-unmined-1", "A node allows a larger subsidy, but nobody mines a block using that permission. Must it immediately leave the old chain?",
                 ["Yes, editing code always creates a chain.", "Yes, its name changed.", "No; it can keep following blocks that satisfy both sets of rules."], 2,
                 "A permission difference becomes visible when a block exercises it."),
        question("reward-fees-1", "A miner's payout exceeds the subsidy but includes permitted transaction fees. Is the amount alone evidence of excess issuance?",
                 ["No. Allowed fees must be separated from the subsidy.", "Yes, all payout is newly issued.", "Yes, fees are forbidden."], 0,
                 "The coinbase can claim the allowed subsidy plus transaction fees. Only the subsidy is new issuance."),
    ],
    "halve-reward": [
        question("strict-minority-1", "A minority of miners follows stricter compatible rules. Can that branch grow?",
                 ["No block can ever be produced.", "Yes, if those miners produce valid blocks; convergence with other nodes is a separate question.", "Only after every old node upgrades."], 1,
                 "Minority hash rate can produce a branch. Its growth does not guarantee it becomes the most-work branch accepted by other nodes."),
        question("strict-subset-1", "In a pure tightening, how do blocks valid under the new rules relate to the old rules?",
                 ["They are all invalid under the old rules.", "There is no relationship.", "They are also valid under the old rules."], 2,
                 "That subset relationship defines a pure soft fork; it does not by itself coordinate activation."),
    ],
    "faster-halving": [
        question("latent-test-1", "Two builds agree on ordinary payments but differ on a script condition that was never tested. What can you conclude?",
                 ["Agreement was observed only on the tested inputs.", "Every consensus rule is identical.", "The script difference cannot matter."], 0,
                 "Unexercised differences remain possible. Test coverage limits every compatibility claim."),
        question("halving-boundary-1", "A node halves its subsidy earlier than a reference. When can the difference first affect a block's acceptance?",
                 ["Whenever someone opens its UI.", "When a block claims more subsidy than the earlier schedule permits.", "Only when all nodes upgrade."], 1,
                 "The rule must be exercised by a block; simply following earlier compatible blocks does not test the boundary."),
    ],
    "miners": [
        question("miners-invalid-1", "A miner produces 100 rule-breaking blocks while another produces one valid block. Does the count alone make the first branch acceptable?",
                 ["Yes, the majority wins every check.", "Yes, after ten minutes.", "No; invalid blocks are rejected before chain selection."], 2,
                 "Work and block counts do not waive a node's validity rules."),
        question("miners-censor-1", "Can a powerful miner choose to leave a particular valid payment out of its blocks?",
                 ["Yes. Choosing inclusion is different from making invalid issuance valid.", "No; every valid payment must be included immediately.", "Only by changing the supply limit."], 0,
                 "Miners choose their block contents. Inclusion power is not permission to violate the rules of unchanged nodes."),
    ],
    "power": [
        question("power-random-1", "A miner has 60% of hash rate. Must it find exactly 24 of the next 40 blocks?",
                 ["Yes, the protocol schedules them.", "No; real discoveries are random, unlike the lab's controlled schedule.", "Yes, if its software is newer."], 1,
                 "A finite schedule illustrates a mechanism, not a universal prediction or activation threshold."),
        question("power-follow-1", "An older node follows a stricter branch. Is that proof it checks the new restriction?",
                 ["Yes, following a chain installs its rules.", "Yes, work updates software.", "No; compatible blocks can pass its older checks."], 2,
                 "Following compatible blocks and independently enforcing the extra rule are different behaviors."),
    ],
    "softfork": [
        question("soft-check-1", "A node does not enforce a new spending condition. Where does assurance about that condition have to come from?",
                 ["Other participants enforcing it; this node cannot independently detect its violations.", "The condition's name.", "The number of old nodes."], 0,
                 "The missing check remains missing even if the active chain happens to comply."),
        question("soft-signal-1", "A miner signals support for an upgrade. Does the signal itself prove it validates every new condition?",
                 ["Yes, signaling is validation.", "No; signaling, activation and enforcement are separate.", "Yes, the signal changes all nodes."], 1,
                 "Coordination signals are not direct evidence of all the software checks a participant performs."),
    ],
    "work": [
        question("work-target-1", "In a hash-target model, requiring another leading hexadecimal zero makes success per independent trial approximately…",
                 ["Twice as likely.", "Unchanged.", "Sixteen times less likely."], 2,
                 "Each hexadecimal digit has sixteen possible values. This toy condition illustrates probability, not Bitcoin's complete header and target rules."),
        question("work-clock-1", "Bitcoin targets an average block interval. Does that mean every block arrives on a ten-minute timer?",
                 ["No; individual intervals vary, and difficulty adjusts over many blocks.", "Yes, all miners wait for the timer.", "Yes, except for small payments."], 0,
                 "Proof-of-work discoveries are probabilistic. An average is not a schedule."),
    ],
    "privacy": [
        question("privacy-owner-1", "Two payments use the same address. What does the public chain establish by itself?",
                 ["The recipient's legal name.", "The repeated destination script; identity still needs outside evidence.", "The recipient's password."], 1,
                 "Visible transaction links do not automatically identify a person."),
        question("privacy-fresh-1", "Does using a fresh address guarantee that nobody can link your transactions?",
                 ["Yes, permanently.", "Yes, if the amount is small.", "No; other transaction patterns and outside information can still link activity."], 2,
                 "Avoiding reuse removes one obvious link. It is not a guarantee of anonymity."),
    ],
    "lightning": [
        question("lightning-capacity-1", "A channel has enough total capacity, but too little spendable balance on your side. Can capacity alone guarantee your outgoing payment?",
                 ["No; directional liquidity and other channel/route constraints matter.", "Yes, total capacity is all that matters.", "Yes, because off-chain payments have no constraints."], 0,
                 "Channel capacity and outgoing liquidity are different. Real channels also reserve value for fees and other requirements."),
        question("lightning-settle-1", "Do ordinary channel balance updates each create a newly confirmed base-chain transaction?",
                 ["Yes, every update must be mined first.", "No; participants update enforceable channel state, with opening and closing interacting with the chain.", "No; channels have no relationship to Bitcoin."], 1,
                 "Channels use Bitcoin's on-chain enforcement while allowing updates without confirming each payment separately."),
    ],
}

WORKSHOPS = [
    {"id": "work", "title": "Try a proof-of-work model", "summary": "Hash a toy message and change the target. Compare effort with a probability, not a timer.",
     "source": "https://developer.bitcoin.org/devguide/block_chain.html#proof-of-work"},
    {"id": "privacy", "title": "Trace address reuse", "summary": "Compare a repeated destination with fresh destinations in a fictional transaction graph.",
     "source": "https://developer.bitcoin.org/devguide/transactions.html#avoiding-key-reuse"},
    {"id": "lightning", "title": "Move a channel balance", "summary": "Explore outgoing liquidity in a simplified two-party channel, then settle the latest balance.",
     "source": "https://github.com/lightning/bolts/blob/master/02-peer-protocol.md"},
]


def payload():
    return {"beginner_route": BEGINNER_ROUTE, "glossary": GLOSSARY, "terms": TERMS,
            "takeaways": TAKEAWAYS, "practice": PRACTICE, "workshops": WORKSHOPS}
