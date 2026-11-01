# Copyright (c) 2026-present The Bitcoin Vibes developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""The words the lab teaches with.

The explanations are fixed in the source and reviewed with their evidence, so
what an operator learns does not depend on a live agent response. The console adds
observations (which node refused which block, and why); this file supplies the
explanation that goes with each kind of observation.

House rule for this file: name the common belief, say plainly why it is wrong,
then give the mechanism. Never claim more than the lab observed.
"""

# The question asked before any experiment that changes the node's source.
# Option ids are the comparison verdicts the lab can observe.
PREDICTION = {
    "question": "Before you run it: what will an unmodified node do with this change?",
    "options": [
        {"id": "none", "text": "No difference in the tested blocks and transactions."},
        {"id": "policy", "text": "Different transaction policy, with no block disagreement in these checks."},
        {"id": "loosened", "text": "The unmodified node will refuse some blocks my node accepts."},
        {"id": "tightened", "text": "My node will refuse some blocks the unmodified node accepts."},
        {"id": "split", "text": "Block disagreements in both directions."},
        {"id": "unsure", "text": "I am not sure."},
    ],
}

# What each observed outcome means, and what it would mean on a real network.
VERDICTS = {
    "identical": {
        "title": "Same node source as the reference",
        "meaning": "The files that feed this build match the unmodified reference. The lab did "
                   "not need to repeat the comparison for this build.",
        "mainnet": "The source contains the reference rules. Configuration, chain state and "
                   "network connectivity still affect how the node operates.",
    },
    "inconclusive": {
        "title": "The comparison could not be completed",
        "meaning": "At least one required check could not be carried out. The rows below show "
                   "which observations are available and which are missing. An unfinished check "
                   "does not establish agreement.",
        "mainnet": "Treat this build as unknown. The lab waits for your review and does not "
                   "start it on a shared network.",
    },
    "none": {
        "title": "No difference observed",
        "meaning": "The completed checks found no difference in block acceptance or in the "
                   "test transactions. They do not establish that every rule is unchanged.",
        "mainnet": "This is evidence, not proof of compatibility. The lab tests subsidy limits, "
                   "a halving, ordinary payments, a data-carrying transaction and block exchange. "
                   "Other changes can remain invisible until a different block exercises them.",
    },
    "policy": {
        "title": "Transaction policy differs; no block disagreement observed",
        "meaning": "The nodes treated unconfirmed transactions differently but accepted the "
                   "blocks exchanged in these checks. Other consensus differences may be untested.",
        "mainnet": "A policy-only change can alter your mempool, relay, fee estimates or mining "
                   "templates while leaving block validity unchanged. A local relay filter does "
                   "not guarantee exclusion from blocks: a miner can receive a valid transaction "
                   "another way. These checks alone cannot prove the change is policy-only.",
    },
    "tightened": {
        "title": "Tightened in these checks: your node rejected a reference block",
        "meaning": "Your node rejected a block the reference accepts, while the reference "
                   "accepted the tested blocks from your node. This is the pattern expected from "
                   "stricter rules, but a limited test cannot classify every possible block.",
        "mainnet": "A pure tightening is a soft fork: blocks valid under the stricter rules are "
                   "also valid under the old rules. Your node refuses any chain containing a block "
                   "that breaks its new rule. It can continue on a compatible branch if one is "
                   "mined. Old nodes follow that branch if it has the most work among branches "
                   "they accept; they still do not check the new rule themselves. Adoption and "
                   "activation are separate from this compatibility relationship.",
    },
    "loosened": {
        "title": "Loosened in these checks: the reference rejected your node's block",
        "meaning": "Your node accepted a block the reference rejects. The tested reference "
                   "blocks were accepted by your node.",
        "mainnet": "Allowing previously invalid blocks is a hard-forking change. Existing nodes "
                   "continue to reject those blocks regardless of their proof of work. A changed "
                   "node can still follow the existing chain; a separate branch appears only if "
                   "blocks using the new permission are mined and followed. Extra outputs on "
                   "that branch are not valid on the unchanged chain.",
    },
    "split": {
        "title": "Block disagreement in both directions",
        "meaning": "Each node rejected at least one tested block accepted by the other. This "
                   "is not evidence that every possible block would be rejected.",
        "mainnet": "These builds can follow incompatible branches. A shared branch may still "
                   "satisfy both sets of rules; convergence depends on the blocks produced, their "
                   "work and the rules each node runs. The comparison cannot prove a permanent split.",
    },
}

# Shown beside the regex and path flags, which fire before anything is built.
STATIC_FLAG_NOTE = (
    "This is a text match on the proposed change, made before anything is built. It can flag "
    "harmless edits and miss real ones. The comparison below supplies "
    "observations about compatibility; it also has limited coverage.")

NO_REFERENCE_NOTE = (
    "This build was not compared with an unmodified node, because no reference node is "
    "available yet. A node accepting its own blocks does not establish compatibility with "
    "other nodes. Prepare a reference node to see what an unmodified node does "
    "with this change.")

NETWORKS = {
    "regtest": "The lab uses an isolated regtest chain with coins intended only for testing. "
               "Blocks are mined on demand. With this build's defaults, the subsidy halves every "
               "150 blocks rather than mainnet's 210,000 and difficulty does not retarget. "
               "Regtest can be networked if deliberately configured; the lab's scenes are isolated.",
    "signet": "A shared test network whose blocks must satisfy an additional signing challenge. "
              "Its coins are intended for testing. Changed consensus rules can cause disagreement "
              "when a block exercises the difference.",
    "testnet": "The older public test network, testnet3. Its coins are intended for testing. "
               "Other operators use it, so changed rules can cause disagreement with their nodes.",
    "testnet4": "The testnet4 public test network. Its coins are intended for testing. Changed "
                "rules can cause disagreement with other nodes when the difference is exercised.",
    "main": "The real Bitcoin network. Coins have real value. Changed validation rules can "
            "cause your node to reject the network's chain or accept a conflicting branch, so "
            "its payment information may be incompatible with other people's nodes.",
}

MAINNET_WARNING = """\
You asked to run on the real Bitcoin network (--chain=main).

What that means here:
  * This node's source can be rewritten by an AI. A change to a consensus rule
    can cause disagreement when a block exercises the changed rule. A
    node with looser rules does not automatically leave the existing chain.
  * The lab refuses to start a build on this network unless a comparison with
    an unmodified node found no consensus difference. That comparison checks a
    limited set of behaviours; passing it is evidence, not proof.
  * The wallet stays disabled and incoming connections stay off unless you
    switch them on in Node settings. Never point a wallet holding real funds
    at an experimental node.
  * Initial synchronisation downloads and verifies historical blocks. Pruning
    can reduce retained block storage, but does not avoid that initial download.
"""

# ----- curated experiments ---------------------------------------------------
#
# Each has a known outcome, a prediction to make first, a fixed explanation,
# one follow-up question that tests the idea in a new setting, and the sources
# its claims rest on.
#
# kind "scene"  two real nodes, no source change, no AI, no compiling
# kind "patch"  a small bundled source change (experiments/<patch>). It runs
#               at once with a ready-made node when one is available, or is
#               compiled and compared like any other proposal.
#
# "variant" names the patch whose changed node a scene needs as its second
# node. "slider" lets the operator choose a number before the scene runs.
GROUPS = (
    {"id": "money", "title": "Coins, keys and payments",
     "blurb": "Where your bitcoin actually are, what a fee buys, and what a confirmation is."},
    {"id": "rules", "title": "Rules, and who enforces them",
     "blurb": "Change a rule on one node and watch what a second node does about it."},
    {"id": "power", "title": "Mining power and upgrades",
     "blurb": "What mining power can force, what it cannot, and how a rule change really takes effect."},
)

WHITEPAPER = {"title": "Bitcoin: A Peer-to-Peer Electronic Cash System", "url": "https://bitcoin.org/bitcoin.pdf"}
POLICY_DOC = {"title": "Bitcoin Core: transaction relay policy",
              "url": "https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/doc/policy/README.md"}
VALIDATION_SRC = {"title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
                  "url": "https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/validation.cpp"}
BIP65 = {"title": "BIP 65: OP_CHECKLOCKTIMEVERIFY", "url": "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki"}
ACTIVATION = {"title": "BIP 9: activation states and enforcement",
              "url": "https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki"}
BIP141 = {"title": "BIP 141: transaction weight and virtual size",
          "url": "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki"}
CHAIN_GUIDE = {"title": "Bitcoin developer guide: consensus and chain selection",
               "url": "https://developer.bitcoin.org/devguide/block_chain.html"}

CURATED = (
    {
        "id": "keys", "group": "money",
        "kind": "scene", "scene": "keys",
        "title": "Are your coins in your wallet?",
        "summary": "A wallet receives 50 BTC. Then the wallet is deleted. Then a backup of its keys "
                   "is restored on a different node.",
        "needs": "No AI and no compiling. Runs in a few seconds.",
        "question": "A wallet holding 50 BTC is deleted from the computer it was on. What has "
                    "happened to the coins?",
        "options": [
            {"id": "gone", "text": "They are destroyed. They were stored in that wallet."},
            {"id": "chain", "text": "The chain is unchanged; the wallet's local spending information was deleted."},
            {"id": "node", "text": "They return to the node that mined them."},
        ],
        "answer": "chain",
        "belief": "\"My bitcoin are stored in my wallet.\"",
        "lesson": "Confirmed coins are recorded as unspent transaction outputs, with conditions for spending "
                  "them; they are not files inside a wallet. This scene uses a single-signature wallet. Deleting it did "
                  "not change the chain, and restoring its complete backup on node B recovered the ability to "
                  "spend the 50 BTC. A wallet can hold private keys, or only watch for payments while a separate "
                  "device signs. Recovery needs all required secrets and wallet information: a seed phrase alone "
                  "may be insufficient when there is a passphrase, multiple signers or additional scripts. Treat "
                  "a complete usable spending backup like the wallet itself. A custodial exchange balance is "
                  "different: the exchange controls the on-chain spending keys and owes you a balance.",
        "sources": [
            {"title": "BIP 39: recovery words and optional passphrase",
             "url": "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"},
            {"title": "Bitcoin developer guide: wallets",
             "url": "https://developer.bitcoin.org/devguide/wallets.html"},
            {"title": "Bitcoin Core: output descriptors and spending conditions",
             "url": "https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/doc/descriptors.md"},
        ],
        "followup": {
            "question": "You buy bitcoin on an exchange and leave it there. Who can move those coins on the chain?",
            "options": [
                {"id": "me", "text": "I can, with my exchange password."},
                {"id": "exchange", "text": "The exchange, which holds the keys. I hold a claim on the exchange."},
                {"id": "both", "text": "Both of us hold a copy of the keys."},
            ],
            "answer": "exchange",
            "why": "A password logs you in to the exchange's website. The keys that move coins on "
                   "the chain are the exchange's until you withdraw to a wallet whose keys you hold.",
        },
    },
    {
        "id": "fees", "group": "money",
        "kind": "scene", "scene": "fees",
        "title": "Does sending more cost more?",
        "summary": "Two payments wait for a block that has room for only one: 10 BTC paying a low "
                   "fee, and 0.1 BTC paying a higher one.",
        "needs": "No AI and no compiling. Runs in a few seconds.",
        "question": "The configured miner has room for one of two similarly sized payments. "
                    "One sends 10 BTC at 2 sat/vB, the other 0.1 BTC at 50 sat/vB. Which does it choose?",
        "options": [
            {"id": "big", "text": "The 10 BTC payment. Larger payments take priority."},
            {"id": "small", "text": "The 0.1 BTC payment. It pays more for the space it takes."},
            {"id": "first", "text": "Whichever was sent first."},
        ],
        "answer": "small",
        "belief": "\"The fee is a percentage of what you send, and the network sets it.\"",
        "lesson": "A fee bids for block space, rather than being a percentage of the amount sent. The two "
                  "transactions here have similar virtual sizes, so the configured miner selected the one paying "
                  "the higher fee rate, measured in satoshis per virtual byte (sat/vB). Virtual size accounts for "
                  "transaction weight; it is not the raw byte count. Miners choose their own transactions and may "
                  "consider related transactions together, so a higher individual fee rate is not a universal "
                  "priority guarantee. Relay and mining fee floors can also apply when blocks have room. Each "
                  "node has its own waiting area, called a mempool: node B did not receive these unconfirmed "
                  "payments because the nodes were disconnected.",
        "sources": [
            {"title": "Bitcoin developer guide: transaction fees",
             "url": "https://developer.bitcoin.org/devguide/transactions.html#transaction-fees-and-change"},
            BIP141, POLICY_DOC,
        ],
        "followup": {
            "question": "Your payment has been unconfirmed for an hour while blocks are full. What is the most likely reason?",
            "options": [
                {"id": "amount", "text": "The amount is too small for miners to bother with."},
                {"id": "bid", "text": "Other transactions offer higher fee rates for the space they use."},
                {"id": "approval", "text": "The network has not approved it yet."},
            ],
            "answer": "bid",
            "why": "A low fee rate is a common reason to wait during congestion. It is not the only "
                   "possible cause: propagation, transaction dependencies and miner policy also matter.",
        },
    },
    {
        "id": "reorg", "group": "money",
        "kind": "scene", "scene": "reorg",
        "title": "Is a confirmed payment final?",
        "summary": "Two nodes share a chain. One confirms a payment in a block the other never "
                   "sees; the other then builds a valid chain with more work and no conflicting spend.",
        "needs": "No AI and no compiling. Runs in a few seconds.",
        "question": "Node A's payment has one confirmation. It adopts a valid higher-work chain "
                    "without that payment or a conflicting spend. What happens to the payment?",
        "options": [
            {"id": "stays", "text": "It stays confirmed. A confirmation cannot be undone."},
            {"id": "zero", "text": "It goes back to zero confirmations."},
            {"id": "gone", "text": "It is destroyed, and the coins are lost."},
        ],
        "answer": "zero",
        "belief": "\"A confirmation means the network approved my payment.\"",
        "lesson": "One confirmation means the payment is in the active chain; each block built on top adds "
                  "another. Nodes choose the chain with the most accumulated proof of work among chains their "
                  "rules accept. In this scene, the replacement chain is valid, has more work and contains no "
                  "conflicting spend, so the payment returns to zero confirmations and can be mined again. A "
                  "conflicting spend could instead make it invalid. More confirmations generally make replacing "
                  "that history harder; they are not an absolute guarantee. Six is a convention, not a consensus "
                  "rule for ordinary payments.",
        "sources": [WHITEPAPER,
                    {"title": "Bitcoin developer guide: block chain",
                     "url": "https://developer.bitcoin.org/devguide/block_chain.html"}],
        "followup": {
            "question": "Why do exchanges wait for several confirmations before crediting a deposit?",
            "options": [
                {"id": "votes", "text": "Each confirmation is another node voting to approve it."},
                {"id": "work", "text": "Each further block makes replacing that history more expensive."},
                {"id": "rule", "text": "The software requires six before a payment is valid."},
            ],
            "answer": "work",
            "why": "Confirmations measure accumulated proof of work on top of a payment. Nobody "
                   "votes, and no fixed number is written into the rules.",
        },
    },
    {
        "id": "relay-filter", "group": "rules",
        "kind": "scene", "scene": "policy",
        "title": "Can a filter keep data out of the chain?",
        "summary": "Two nodes with the same source. One uses the older 83-byte OP_RETURN script "
                   "policy limit; the other accepts the larger test transaction.",
        "needs": "No AI and no compiling. Runs in a few seconds.",
        "question": "A transaction carrying 200 bytes of data is mined into a block by someone "
                    "else. What does the filtering node do with that block?",
        "options": [
            {"id": "reject", "text": "It rejects the block, because the block contains a transaction it refuses."},
            {"id": "accept", "text": "It accepts the block. The filter only affected what it relayed."},
            {"id": "strip", "text": "It accepts the block but removes that transaction from its copy."},
        ],
        "answer": "accept",
        "belief": "\"If enough of us filter it, it stays off the chain.\"",
        "lesson": "A relay filter is policy: a local choice about which unconfirmed transactions a node keeps and "
                  "passes on. That relay policy is not used to decide whether a transaction already in a block is "
                  "consensus-valid. Here the filtering node refused the unconfirmed transaction, then accepted "
                  "the block containing it, and both nodes stayed on one chain. Filters affect propagation and "
                  "can influence miners using those policies, but cannot guarantee exclusion: a miner can receive "
                  "a consensus-valid transaction directly or through other peers. The scene establishes that "
                  "distinction, not whether a particular filtering policy is useful.",
        "sources": [POLICY_DOC,
                    {"title": "Bitcoin Core 30.0 release notes", "url": "https://bitcoincore.org/en/releases/30.0/"}],
        "followup": {
            "question": "Bitcoin Core 30 raised its default relay limit for data-carrying outputs "
                        "from 83 bytes to 100,000. What did that change about which blocks are valid?",
            "options": [
                {"id": "nothing", "text": "Nothing. It changed a relay default, not a consensus rule."},
                {"id": "bigger", "text": "Blocks may now contain more data than before."},
                {"id": "fork", "text": "Nodes on older versions now reject newer blocks."},
            ],
            "answer": "nothing",
            "why": "A relay default is policy. Blocks carrying that much data were already valid "
                   "before the change, and nodes with either setting accept the same blocks.",
        },
    },
    {
        "id": "double-reward", "group": "rules",
        "kind": "patch", "patch": "double-reward.diff",
        "title": "Can you raise the block reward?",
        "summary": "One line of source changes the new coins a miner may pay itself from 50 to "
                   "100 per block (on this private chain the starting reward is 50).",
        "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
        "prompt": "Double the block subsidy: the starting reward becomes 100 BTC instead of 50.",
        "expected": "loosened",
        "belief": "\"The developers could just change the 21 million limit.\"",
        "lesson": "The subsidy is the new bitcoin a block may create; the total block reward also includes "
                  "transaction fees. Mainnet starts at a 50 BTC subsidy and halves it every 210,000 blocks. The "
                  "schedule, satoshi rounding and other validity checks constrain issuance. MAX_MONEY is a "
                  "separate consensus range check, not a switch that raises the subsidy. This patch doubles the "
                  "starting subsidy on your private chain, whose halvings occur every 150 blocks. Your node "
                  "accepted its changed reward; the reference rejected an overpaying block with bad-cb-amount. "
                  "Other nodes using unchanged rules reject it too. A software release cannot force them to "
                  "accept the extra outputs; people must choose compatible rules for their own nodes.",
        "sources": [VALIDATION_SRC,
                    {"title": "Bitcoin Core source: MAX_MONEY is \"not the total money supply\"",
                     "url": "https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/consensus/amount.h"}],
        "followup": {
            "question": "Suppose every Bitcoin Core maintainer agreed to release a version with a "
                        "higher reward. What would make the new reward real?",
            "options": [
                {"id": "merge", "text": "Merging the change. Nodes update automatically."},
                {"id": "miners", "text": "A majority of miners producing blocks with the higher reward."},
                {"id": "run", "text": "Nothing short of the people who run nodes and accept payments choosing to run it."},
            ],
            "answer": "run",
            "why": "Bitcoin Core has no automatic update, and a block that breaks a node's rules "
                   "is refused however much mining power produced it. A rule changes only where "
                   "people choose to run the changed software.",
        },
    },
    {
        "id": "halve-reward", "group": "rules",
        "kind": "patch", "patch": "halve-reward.diff",
        "title": "What if your node demands a smaller reward?",
        "summary": "One line of source lowers the reward your node allows from 50 to 25 per block.",
        "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
        "prompt": "Halve the block subsidy: the starting reward becomes 25 BTC instead of 50.",
        "expected": "tightened",
        "belief": "\"If my node enforces a stricter rule, the network has to follow it.\"",
        "lesson": "This patch lowers the starting subsidy limit to 25 BTC. In the check, the reference miner "
                  "claimed its full 50 BTC subsidy, so your node rejected the block. The reference accepts blocks "
                  "claiming the smaller subsidy because miners may claim less than the maximum. Your node cannot "
                  "make another node change its checks. It can follow a compatible branch if miners build one, or "
                  "remain at its last accepted block if nobody does. A smaller mining share can still produce a "
                  "growing branch; whether other nodes follow it depends on accumulated valid work and later "
                  "miner behavior, not a vote by node count.",
        "sources": [VALIDATION_SRC, CHAIN_GUIDE],
        "followup": {
            "question": "A group of node operators starts rejecting blocks that most miners keep "
                        "producing. What happens to the group's nodes?",
            "options": [
                {"id": "follow", "text": "Miners must change their blocks to satisfy those nodes."},
                {"id": "stall", "text": "Those nodes stop following the chain everyone else is on."},
                {"id": "vote", "text": "The rule takes effect once enough nodes signal for it."},
            ],
            "answer": "stall",
            "why": "The nodes reject any chain containing a block that violates their rule. Their "
                   "accepted branch can keep growing if miners produce compatible blocks.",
        },
    },
    {
        "id": "faster-halving", "group": "rules",
        "kind": "patch", "patch": "faster-halving.diff",
        "title": "What if the reward halved sooner?",
        "summary": "On this private chain the reward halves every 150 blocks. One line of source "
                   "makes your node halve it every 75.",
        "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
        "prompt": "Change the regtest subsidy halving interval from 150 blocks to 75.",
        "expected": "tightened",
        "belief": "\"A rule change takes effect straight away, so I would notice at once.\"",
        "lesson": "The nodes accepted the same first 74 reference blocks. At height 75 the changed node allowed "
                  "at most half its earlier subsidy while the reference miner still claimed the old amount, so it "
                  "rejected that block. A miner claiming less could have produced a block both accepted. Changed "
                  "rules can remain invisible until a particular height, time or transaction exercises them. "
                  "Successful checks therefore demonstrate only the behaviors tested, rather than proving that "
                  "the builds have identical consensus rules.",
        "sources": [VALIDATION_SRC,
                    {"title": "Bitcoin Core source: regtest halves every 150 blocks (chainparams.cpp)",
                     "url": "https://github.com/bitcoin/bitcoin/blob/6b059d9dbdbd4d5b6f52993f93bf291181bf3900/src/kernel/chainparams.cpp"}],
        "followup": {
            "question": "A changed node has followed the real network without trouble for a month. "
                        "What does that show about its consensus rules?",
            "options": [
                {"id": "safe", "text": "They are compatible. A month of blocks would have exposed any difference."},
                {"id": "limited", "text": "Only that no block in that month exercised a rule it changed."},
                {"id": "nothing", "text": "Nothing at all. Following the chain is unrelated to consensus rules."},
            ],
            "answer": "limited",
            "why": "A node disagrees only when a block arrives that its changed rule treats "
                   "differently. Agreement so far says the difference has not been exercised yet.",
        },
    },
    {
        "id": "miners", "group": "power",
        "kind": "scene", "scene": "miners", "variant": "double-reward",
        "title": "Can most of the mining power break the rules?",
        "summary": "A miner whose node pays itself 100 BTC per block produces 30 blocks. An honest "
                   "miner produces 2. Both are offered to an unmodified node.",
        "needs": "No AI. Uses the ready-made node from \"Can you raise the block reward?\".",
        "question": "The rule-breaking branch has more accumulated proof of work. Which chain "
                    "does the unmodified node follow?",
        "options": [
            {"id": "longest", "text": "The rule-breaking chain. The chain with the most work wins."},
            {"id": "valid", "text": "The honest chain. It refuses every rule-breaking block, however many there are."},
            {"id": "split", "text": "It follows both until one side gives up."},
        ],
        "answer": "valid",
        "belief": "\"Miners control Bitcoin\", and \"the longest chain wins.\"",
        "lesson": "A node chooses the chain with the most proof of work among chains it considers valid. The "
                  "reference refused the first overpaying block and the descendants built on it, even though the "
                  "competing branch contained more work. Majority mining power can censor transactions or attempt "
                  "to reorganize recent history, including double-spending the miner's own payments. It cannot "
                  "make an over-subsidy block or an unauthorized signature pass an unchanged node's checks. This "
                  "scene compares constructed branches at regtest difficulty; producing more blocks here is not a "
                  "measurement of real mining power.",
        "sources": [WHITEPAPER, CHAIN_GUIDE],
        "followup": {
            "question": "What can a miner with 60% of the mining power do?",
            "options": [
                {"id": "print", "text": "Create coins beyond the schedule."},
                {"id": "steal", "text": "Spend coins from anyone's address."},
                {"id": "reorder", "text": "Leave out transactions, and undo its own recent payments."},
            ],
            "answer": "reorder",
            "why": "Majority mining power controls which valid blocks get built. It gives no power "
                   "to make an invalid block valid, so it cannot forge coins or signatures.",
        },
    },
    {
        "id": "power", "group": "power",
        "kind": "scene", "scene": "power", "variant": "halve-reward",
        "slider": {"label": "Share of mining power enforcing the stricter rule", "min": 10, "max": 90,
                   "step": 5, "value": 30, "unit": "%"},
        "title": "How does mining power affect a stricter chain?",
        "summary": "Forty discoveries are scheduled in the share you choose. Some miners enforce a "
                   "25 BTC subsidy limit; others may claim 50. Compare the active chains.",
        "needs": "No AI. Uses the ready-made node from \"What if your node demands a smaller reward?\".",
        "question": "With the share you chose, where do the nodes that did not change end up?",
        "options": [
            {"id": "own", "text": "On a different active chain from the stricter node."},
            {"id": "strict", "text": "On the stricter chain, without ever being upgraded."},
            {"id": "stuck", "text": "Nowhere. Both chains stop."},
        ],
        "answer": None,  # The correct prediction comes from the observed active chains.
        "belief": "\"Nodes vote, and a rule takes effect when enough nodes want it.\"",
        "lesson": "This is a controlled schedule of forty block discoveries, not a prediction of a real network. "
                  "Miners using the stricter rule accept only the lower-subsidy branch; unmodified miners accept "
                  "both kinds of block and follow whichever valid branch has more work. With this schedule, a "
                  "larger enforcing share can make the reference switch to the stricter branch. It still does not "
                  "check the new rule itself. Real discoveries are random, equal-work ties depend on which block "
                  "arrives first, and miner choices can change. A forty-block outcome does not establish a "
                  "universal activation threshold. Activation rules, signaling and ongoing enforcement are "
                  "separate questions. Try different shares and compare the observed chains.",
        "sources": [CHAIN_GUIDE, ACTIVATION],
        "followup": {
            "question": "Ten thousand nodes enforce a stricter rule while miners keep producing blocks "
                        "that violate it. Does the node count force those blocks to become acceptable?",
            "options": [
                {"id": "wins", "text": "The rule takes effect, because so many nodes enforce it."},
                {"id": "alone", "text": "No. Each node still rejects blocks that violate its own rule."},
                {"id": "nothing", "text": "Nothing changes for anyone."},
            ],
            "answer": "alone",
            "why": "Node count does not alter block validity. An accepted branch needs compatible "
                   "blocks; its progress depends on mining and network conditions.",
        },
    },
    {
        "id": "softfork", "group": "power",
        "kind": "scene", "scene": "softfork",
        "title": "What does a node miss when it does not enforce a soft fork?",
        "summary": "A controlled demonstration of BIP 65, introduced in 2015. Two modern nodes "
                   "differ in one check: only one enforces the time lock.",
        "needs": "No AI and no compiling. Runs in a few seconds.",
        "question": "Someone spends the locked coin far too early, in a block. What does the node "
                    "with the time-lock check disabled do with that block?",
        "options": [
            {"id": "reject", "text": "It rejects the block. The coin is locked."},
            {"id": "accept", "text": "It accepts the block. Its active checks do not enforce that lock."},
            {"id": "crash", "text": "It stops, because it meets an instruction it does not understand."},
        ],
        "answer": "accept",
        "belief": "\"Old nodes are protected by a rule change even if they do not upgrade.\"",
        "lesson": "BIP 65 gave the existing NOP2 instruction a new meaning: OP_CHECKLOCKTIMEVERIFY rejects spends "
                  "that do not satisfy a specified transaction lock time. That is a soft fork because it "
                  "invalidates some spends previously allowed. This scene uses two modern regtest nodes, with "
                  "that check disabled on one; it demonstrates the rule difference rather than replaying the 2015 "
                  "network. The disabled node accepted an early spend that the enforcing node rejected. An "
                  "unupgraded node can still follow a valid stricter chain, but does not independently check the "
                  "new condition. Following a compatible chain is different from validating every rule on it.",
        "sources": [BIP65, ACTIVATION],
        "followup": {
            "question": "After a soft fork, what is a node that has not upgraded relying on?",
            "options": [
                {"id": "itself", "text": "Its own checks, which still cover every rule."},
                {"id": "miners", "text": "Miners enforcing the new rule, which it cannot check itself."},
                {"id": "devs", "text": "The developers, who can update it remotely."},
            ],
            "answer": "miners",
            "why": "It still checks every rule it knows. The new rule is invisible to it, so for "
                   "that rule alone it accepts whatever the most-work chain contains.",
        },
    },
)

# Statements asked before any experiment and again afterwards, so that what
# changed can be measured on the same questions. A mix of true and false, so
# that always answering one way scores badly.
BELIEFS = (
    {"id": "coins-in-wallet-v2", "truth": False, "experiment": "keys",
     "statement": "My bitcoin are stored inside my wallet app or device."},
    {"id": "backup-is-wallet-v2", "truth": True, "experiment": "keys",
     "statement": "A complete, usable spending backup can restore access after a wallet is lost."},
    {"id": "fee-by-amount-v2", "truth": False, "experiment": "fees",
     "statement": "Bitcoin requires a higher fee just because the amount sent is larger."},
    {"id": "mempools-differ-v2", "truth": True, "experiment": "fees",
     "statement": "Two nodes can hold different sets of unconfirmed transactions."},
    {"id": "confirmation-final-v2", "truth": False, "experiment": "reorg",
     "statement": "Once a payment has one confirmation, it can never be undone."},
    {"id": "filters-block-v2", "truth": False, "experiment": "relay-filter",
     "statement": "A node's relay filter makes a filtered transaction invalid even inside a block."},
    {"id": "devs-change-supply-v2", "truth": False, "experiment": "double-reward",
     "statement": "Releasing new software automatically raises the supply limit enforced by unchanged nodes."},
    {"id": "miners-print-v2", "truth": False, "experiment": "miners",
     "statement": "Most mining power can make unchanged nodes accept coins beyond their subsidy rules."},
    {"id": "majority-tightens-v2", "truth": True, "experiment": "power",
     "statement": "A node can follow a stricter chain without independently checking its new rule."},
    {"id": "old-nodes-check-v2", "truth": False, "experiment": "softfork",
     "statement": "After a rule is tightened, nodes that have not upgraded still check the new rule themselves."},
)


def curated(experiment_id):
    for item in CURATED:
        if item["id"] == experiment_id:
            return item
    return None


def expected_answer(item, share=None):
    """The designed answer for a fixed scene, not a substitute for observations.

    The mining-power scene has no fixed answer: grade its observed_answer.
    The optional share argument is retained for callers from older versions.
    """
    return item.get("answer") if item["kind"] == "scene" else item["expected"]


def public_catalogue():
    """The curated list as the browser needs it (answers included: the
    lesson is shown only after the operator commits to a prediction)."""
    out = []
    for item in CURATED:
        entry = {key: item[key] for key in ("id", "group", "kind", "title", "summary", "needs",
                                            "belief", "lesson", "sources", "followup")}
        for key in ("variant", "slider"):
            if key in item:
                entry[key] = item[key]
        if item["kind"] == "scene":
            entry.update(question=item["question"], options=item["options"], answer=item.get("answer"))
        else:
            entry.update(question=PREDICTION["question"], options=PREDICTION["options"],
                         answer=item["expected"])
        out.append(entry)
    return out


def payload():
    """Everything the page needs to teach with."""
    return {"prediction": PREDICTION, "verdicts": VERDICTS, "networks": NETWORKS,
            "groups": GROUPS, "curated": public_catalogue(),
            "beliefs": [{"id": b["id"], "statement": b["statement"], "truth": b["truth"],
                         "experiment": b["experiment"]} for b in BELIEFS],
            "static_flag_note": STATIC_FLAG_NOTE, "no_reference_note": NO_REFERENCE_NOTE}


def as_script():
    """The same payload as a script, so the console page and the static demo
    load their lessons the same way."""
    import json
    return "window.VibesLessons = " + json.dumps(payload(), indent=1) + ";\n"
