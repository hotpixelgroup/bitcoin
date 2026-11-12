window.VibesLessons = {
 "prediction": {
  "question": "What do you expect the comparison to show?",
  "options": [
   {
    "id": "none",
    "text": "No difference in the tested blocks and transactions."
   },
   {
    "id": "policy",
    "text": "Different transaction policy, with no block disagreement in these checks."
   },
   {
    "id": "loosened",
    "text": "Only the unmodified node will reject some of the other node's test blocks."
   },
   {
    "id": "tightened",
    "text": "Only my node will reject some of the other node's test blocks."
   },
   {
    "id": "split",
    "text": "Both nodes will reject some of the other node's test blocks."
   },
   {
    "id": "unsure",
    "text": "I am not sure."
   }
  ]
 },
 "verdicts": {
  "identical": {
   "title": "Same node source as the reference",
   "meaning": "The files that feed this build match the unmodified reference. The lab did not need to repeat the comparison for this build.",
   "mainnet": "The source contains the reference rules. Configuration, chain state and network connectivity still affect how the node operates."
  },
  "inconclusive": {
   "title": "The comparison could not be completed",
   "meaning": "At least one required check could not be carried out. The rows below show which observations are available and which are missing. An unfinished check does not establish agreement.",
   "mainnet": "Treat this build as unknown. The lab waits for your review and does not start it on a shared network."
  },
  "none": {
   "title": "No difference observed",
   "meaning": "The completed checks found no difference in block acceptance or in the test transactions. They do not establish that every rule is unchanged.",
   "mainnet": "This is evidence, not proof of compatibility. The lab tests subsidy limits, a halving, ordinary payments, a data-carrying transaction and block exchange. Other changes can remain invisible until a different block exercises them."
  },
  "policy": {
   "title": "Transaction policy differs; no block disagreement observed",
   "meaning": "The nodes treated unconfirmed transactions differently but accepted the blocks exchanged in these checks. Other consensus differences may be untested.",
   "mainnet": "A policy-only change can alter your mempool, relay, fee estimates or mining templates while leaving block validity unchanged. A local relay filter does not guarantee exclusion from blocks: a miner can receive a valid transaction another way. These checks alone cannot prove the change is policy-only."
  },
  "tightened": {
   "title": "Tightened in these checks: your node rejected a reference block",
   "meaning": "Your node rejected a block the reference accepts, while the reference accepted the tested blocks from your node. This is the pattern expected from stricter rules, but a limited test cannot classify every possible block.",
   "mainnet": "A pure tightening is a soft fork: blocks valid under the stricter rules are also valid under the old rules. Your node refuses any chain containing a block that breaks its new rule. It can continue on a compatible branch if one is mined. Old nodes follow that branch if it has the most work among branches they accept; they still do not check the new rule themselves. Adoption and activation are separate from this compatibility relationship."
  },
  "loosened": {
   "title": "Loosened in these checks: the reference rejected your node's block",
   "meaning": "Your node accepted a block the reference rejects. The tested reference blocks were accepted by your node.",
   "mainnet": "Allowing previously invalid blocks is a hard-forking change. Existing nodes continue to reject those blocks regardless of their proof of work. A changed node can still follow the existing chain; a separate branch appears only if blocks using the new permission are mined and followed. Extra outputs on that branch are not valid on the unchanged chain."
  },
  "split": {
   "title": "Block disagreement in both directions",
   "meaning": "Each node rejected at least one tested block accepted by the other. This is not evidence that every possible block would be rejected.",
   "mainnet": "These builds can follow incompatible branches. A shared branch may still satisfy both sets of rules; convergence depends on the blocks produced, their work and the rules each node runs. The comparison cannot prove a permanent split."
  }
 },
 "networks": {
  "regtest": "The lab uses an isolated regtest chain with coins intended only for testing. Blocks are mined on demand. With this build's defaults, the subsidy halves every 150 blocks rather than mainnet's 210,000 and difficulty does not retarget. Regtest can be networked if deliberately configured; the lab's scenes are isolated.",
  "signet": "A shared test network whose blocks must satisfy an additional signing challenge. Its coins are intended for testing. Changed consensus rules can cause disagreement when a block exercises the difference.",
  "testnet": "The older public test network, testnet3. Its coins are intended for testing. Other operators use it, so changed rules can cause disagreement with their nodes.",
  "testnet4": "The testnet4 public test network. Its coins are intended for testing. Changed rules can cause disagreement with other nodes when the difference is exercised.",
  "main": "The real Bitcoin network. Coins have real value. Changed validation rules can cause your node to reject the network's chain or accept a conflicting branch, so its payment information may be incompatible with other people's nodes."
 },
 "groups": [
  {
   "id": "money",
   "title": "Coins, keys and payments",
   "blurb": "What a wallet controls, what a fee buys, and what a confirmation means."
  },
  {
   "id": "rules",
   "title": "Rules, and who enforces them",
   "blurb": "Change a rule on one node and watch what a second node does about it."
  },
  {
   "id": "power",
   "title": "Mining power and upgrades",
   "blurb": "What mining power can force, what it cannot, and how a rule change really takes effect."
  }
 ],
 "curated": [
  {
   "id": "keys",
   "group": "money",
   "kind": "scene",
   "title": "Are your coins in your wallet?",
   "summary": "A wallet receives 50 BTC. Then the wallet is deleted. Then a backup of its keys is restored on a different node.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"My bitcoin are stored in my wallet.\"",
   "lesson": "Confirmed coins are recorded as unspent transaction outputs, with conditions for spending them; they are not files inside a wallet. This scene uses a single-signature wallet. Deleting it did not change the chain, and restoring its complete backup on node B recovered the ability to spend the 50 BTC. A wallet can hold private keys, or only watch for payments while a separate device signs. Recovery needs all required secrets and wallet information: a seed phrase alone may be insufficient when there is a passphrase, multiple signers or additional scripts. Treat a complete usable spending backup like the wallet itself. A custodial exchange balance is different: the exchange controls the on-chain spending keys and owes you a balance. The chain did not notice the wallet's dramatic exit.",
   "sources": [
    {
     "title": "BIP 39: recovery words and optional passphrase",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki"
    },
    {
     "title": "Bitcoin developer guide: wallets",
     "url": "https://developer.bitcoin.org/devguide/wallets.html"
    },
    {
     "title": "Bitcoin Core: output descriptors and spending conditions",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/descriptors.md"
    }
   ],
   "followup": {
    "question": "You buy bitcoin on an exchange and leave it there. Who can move those coins on the chain?",
    "options": [
     {
      "id": "me",
      "text": "I can, with my exchange password."
     },
     {
      "id": "exchange",
      "text": "The exchange, which holds the keys. I hold a claim on the exchange."
     },
     {
      "id": "both",
      "text": "Both of us hold a copy of the keys."
     }
    ],
    "answer": "exchange",
    "why": "A password logs you in to the exchange's website. The keys that move coins on the chain are the exchange's until you withdraw to a wallet whose keys you hold."
   },
   "question": "A wallet holding 50 BTC is deleted from the computer it was on. What has happened to the coins?",
   "options": [
    {
     "id": "gone",
     "text": "They are destroyed. They were stored in that wallet."
    },
    {
     "id": "chain",
     "text": "The chain is unchanged; the wallet's local spending information was deleted."
    },
    {
     "id": "node",
     "text": "They return to the node that mined them."
    }
   ],
   "answer": "chain"
  },
  {
   "id": "utxos",
   "group": "money",
   "kind": "scene",
   "title": "Where does the change in a payment come from?",
   "summary": "Spend two 50 BTC outputs to make a 60 BTC payment. Inspect the new outputs and the fee on both nodes.",
   "needs": "No AI and no compiling. Runs on a private chain.",
   "belief": "A payment subtracts an amount from an on-chain account balance.",
   "lesson": "Bitcoin payments spend whole unspent transaction outputs, or UTXOs. This wallet selected two inputs totaling 100 BTC and created a 60 BTC recipient output plus change. The difference between the input and output totals is the fee. Both original outputs are spent; the change is a new output with its own spending conditions. Wallet software normally constructs the change before broadcasting. No miner sends a refund. This scene deliberately fixes the inputs; a real wallet's coin selection may choose differently.",
   "sources": [
    {
     "title": "Bitcoin developer guide: transactions and change",
     "url": "https://developer.bitcoin.org/devguide/transactions.html"
    }
   ],
   "followup": {
    "question": "An input is worth 20,000 satoshis. A payment output is 12,000 and the fee is 500. How much change is created?",
    "options": [
     {
      "id": "7500",
      "text": "7,500 satoshis."
     },
     {
      "id": "8000",
      "text": "8,000 satoshis."
     },
     {
      "id": "refund",
      "text": "Whatever the miner refunds."
     }
    ],
    "answer": "7500",
    "why": "20,000 = 12,000 + 7,500 + 500. The fee is the input total minus the output total."
   },
   "question": "Two whole outputs total 100 BTC. You send 60 BTC with a fee. What happens to the rest?",
   "options": [
    {
     "id": "change",
     "text": "The transaction creates a change output for the sender."
    },
    {
     "id": "miner",
     "text": "The miner refunds it in a later payment."
    },
    {
     "id": "balance",
     "text": "Part of each original output remains unspent."
    }
   ],
   "answer": "change"
  },
  {
   "id": "fees",
   "group": "money",
   "kind": "scene",
   "title": "Does sending more cost more?",
   "summary": "Two payments wait for a block that has room for only one: 10 BTC paying a low fee, and 0.1 BTC paying a higher one.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"The fee is a percentage of what you send, and the network sets it.\"",
   "lesson": "A fee bids for block space, rather than being a percentage of the amount sent. The two transactions here have similar virtual sizes, so the configured miner selected the one paying the higher fee rate, measured in satoshis per virtual byte (sat/vB). Virtual size accounts for transaction weight; it is not the raw byte count. Miners choose their own transactions and may consider related transactions together, so a higher individual fee rate is not a universal priority guarantee. Relay and mining fee floors can also apply when blocks have room. Each node has its own waiting area, called a mempool: node B did not receive these unconfirmed payments because the nodes were disconnected. The 10 BTC payment brought a bigger number, not a better bid.",
   "sources": [
    {
     "title": "Bitcoin developer guide: transaction fees",
     "url": "https://developer.bitcoin.org/devguide/transactions.html#transaction-fees-and-change"
    },
    {
     "title": "BIP 141: transaction weight and virtual size",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki"
    },
    {
     "title": "Bitcoin Core: transaction relay policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/policy/README.md"
    }
   ],
   "followup": {
    "question": "Your payment has been unconfirmed for an hour while blocks are full. What is the most likely reason?",
    "options": [
     {
      "id": "amount",
      "text": "The amount is too small for miners to bother with."
     },
     {
      "id": "bid",
      "text": "Other transactions offer higher fee rates for the space they use."
     },
     {
      "id": "approval",
      "text": "The network has not approved it yet."
     }
    ],
    "answer": "bid",
    "why": "A low fee rate is a common reason to wait during congestion. It is not the only possible cause: propagation, transaction dependencies and miner policy also matter."
   },
   "question": "The configured miner has room for one of two similarly sized payments. One sends 10 BTC at 2 sat/vB, the other 0.1 BTC at 50 sat/vB. Which does it choose?",
   "options": [
    {
     "id": "big",
     "text": "The 10 BTC payment. Larger payments take priority."
    },
    {
     "id": "small",
     "text": "The 0.1 BTC payment. It pays more for the space it takes."
    },
    {
     "id": "first",
     "text": "Whichever was sent first."
    }
   ],
   "answer": "small"
  },
  {
   "id": "fee-size",
   "group": "money",
   "kind": "scene",
   "title": "Can two equal payments have different fees?",
   "summary": "Send 1 BTC with one input, then 1 BTC with two inputs. Keep the fee rate and output types the same.",
   "needs": "No AI and no compiling. Runs on a private chain.",
   "belief": "Two payments of the same value always cost the same fee.",
   "lesson": "The requested fee rate is 2 satoshis per virtual byte in both payments. The two-input transaction has a larger virtual size and pays a larger total fee. Both send 1 BTC. Input and output types, signatures and other data affect virtual size, so input count is not a universal fee formula. A wallet can sometimes replace an unconfirmed transaction with one paying more, or a recipient can pay for a child transaction; node policies and transaction dependencies matter. Neither method guarantees confirmation or reverses a confirmed payment.",
   "sources": [
    {
     "title": "BIP 141: transaction weight and virtual size",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki"
    },
    {
     "title": "Bitcoin Core: transaction relay policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/policy/README.md"
    },
    {
     "title": "Bitcoin Core: mempool replacement policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/policy/mempool-replacements.md"
    }
   ],
   "followup": {
    "question": "A transaction is 200 virtual bytes at 5 satoshis per virtual byte. What is its total fee?",
    "options": [
     {
      "id": "1000",
      "text": "1,000 satoshis."
     },
     {
      "id": "5",
      "text": "5 satoshis."
     },
     {
      "id": "percent",
      "text": "5% of the payment."
     }
    ],
    "answer": "1000",
    "why": "200 \u00d7 5 = 1,000 satoshis. A fee rate prices space, not the amount sent."
   },
   "question": "At the same fee rate, which of these otherwise similar payments costs more in total fees?",
   "options": [
    {
     "id": "same",
     "text": "They cost the same because both send 1 BTC."
    },
    {
     "id": "two",
     "text": "The two-input payment, because it uses more space here."
    },
    {
     "id": "one",
     "text": "The one-input payment, because it is simpler."
    }
   ],
   "answer": "two"
  },
  {
   "id": "watch-only",
   "group": "money",
   "kind": "scene",
   "title": "Does seeing a balance mean you can spend it?",
   "summary": "Copy public wallet descriptors to a second node, then ask both wallets to sign the same payment.",
   "needs": "No AI and no compiling. Uses temporary lab wallets only.",
   "belief": "A wallet displaying my coins necessarily holds their spending keys.",
   "lesson": "A watch-only wallet can recognize outputs and help prepare payments without possessing spending keys. In this single-signature scene, only the original wallet completed the signatures. The second node could still validate the signed payment. With a hardware signer, watching and signing can be deliberately separated. Recovery requires the secrets and wallet information for the actual spending conditions: a passphrase, descriptor or multiple signers may also be needed. Public descriptors can reveal wallet activity, even when they cannot authorize spending. This lab uses disposable keys, never a personal wallet backup.",
   "sources": [
    {
     "title": "Bitcoin Core: output descriptors",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/descriptors.md"
    },
    {
     "title": "Bitcoin developer guide: wallets",
     "url": "https://developer.bitcoin.org/devguide/wallets.html"
    }
   ],
   "followup": {
    "question": "A 2-of-3 wallet has three independent signing keys. Is a backup of just one key sufficient to spend by itself?",
    "options": [
     {
      "id": "yes",
      "text": "Yes, any seed is enough."
     },
     {
      "id": "no",
      "text": "No. Two keys and the required wallet information are needed."
     },
     {
      "id": "public",
      "text": "Yes, if the balance is visible."
     }
    ],
    "answer": "no",
    "why": "The threshold is two signatures. Recovery must also reconstruct the wallet's spending script; a seed count alone is not a complete recovery plan."
   },
   "question": "Node B has the wallet's public information but no private keys. Which wallet can complete the signatures here?",
   "options": [
    {
     "id": "both",
     "text": "Both wallets, because both see the coins."
    },
    {
     "id": "signer",
     "text": "Only node A's wallet, which has the private keys."
    },
    {
     "id": "network",
     "text": "Neither; the network must sign first."
    }
   ],
   "answer": "signer"
  },
  {
   "id": "reorg",
   "group": "money",
   "kind": "scene",
   "title": "Is a confirmed payment final?",
   "summary": "Two nodes share a chain. One confirms a payment in a block the other never sees; the other then builds a valid chain with more work and no conflicting spend.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"A confirmation means the network approved my payment.\"",
   "lesson": "One confirmation means the payment is in the active chain; each block built on top adds another. Nodes choose the chain with the most accumulated proof of work among chains their rules accept. In this scene, the replacement chain is valid, has more work and contains no conflicting spend, so the payment returns to zero confirmations and can be mined again. A conflicting spend could instead make it invalid. More confirmations generally make replacing that history harder; they are not an absolute guarantee. Six is a convention, not a consensus rule for ordinary payments. That first confirmation comes without a lifetime appointment.",
   "sources": [
    {
     "title": "Bitcoin: A Peer-to-Peer Electronic Cash System",
     "url": "https://bitcoin.org/bitcoin.pdf"
    },
    {
     "title": "Bitcoin developer guide: block chain",
     "url": "https://developer.bitcoin.org/devguide/block_chain.html"
    }
   ],
   "followup": {
    "question": "Why do exchanges wait for several confirmations before crediting a deposit?",
    "options": [
     {
      "id": "votes",
      "text": "Each confirmation is another node voting to approve it."
     },
     {
      "id": "work",
      "text": "Each further block makes replacing that history more expensive."
     },
     {
      "id": "rule",
      "text": "The software requires six before a payment is valid."
     }
    ],
    "answer": "work",
    "why": "Confirmations measure accumulated proof of work on top of a payment. Nobody votes, and no fixed number is written into the rules."
   },
   "question": "Node A's payment has one confirmation. It adopts a valid higher-work chain without that payment or a conflicting spend. What happens to the payment?",
   "options": [
    {
     "id": "stays",
     "text": "It stays confirmed. A confirmation cannot be undone."
    },
    {
     "id": "zero",
     "text": "It goes back to zero confirmations."
    },
    {
     "id": "gone",
     "text": "It is destroyed, and the coins are lost."
    }
   ],
   "answer": "zero"
  },
  {
   "id": "relay-filter",
   "group": "rules",
   "kind": "scene",
   "title": "Can a filter keep data out of the chain?",
   "summary": "Two nodes with the same source. One uses the older 83-byte OP_RETURN script policy limit; the other accepts the larger test transaction.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"If enough of us filter it, it stays off the chain.\"",
   "lesson": "A relay filter is policy: a local choice about which unconfirmed transactions a node keeps and passes on. That relay policy is not used to decide whether a transaction already in a block is consensus-valid. Here the filtering node refused the unconfirmed transaction, then accepted the block containing it, and both nodes stayed on one chain. Filters affect propagation and can influence miners using those policies, but cannot guarantee exclusion: a miner can receive a consensus-valid transaction directly or through other peers. The scene establishes that distinction, not whether a particular filtering policy is useful. The transaction arrived in a block without an invitation to the filtering node's mempool.",
   "sources": [
    {
     "title": "Bitcoin Core: transaction relay policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/doc/policy/README.md"
    },
    {
     "title": "Bitcoin Core 30.0 release notes",
     "url": "https://bitcoincore.org/en/releases/30.0/"
    }
   ],
   "followup": {
    "question": "Bitcoin Core 30 raised its default relay limit for data-carrying outputs from 83 bytes to 100,000. What did that change about which blocks are valid?",
    "options": [
     {
      "id": "nothing",
      "text": "Nothing. It changed a relay default, not a consensus rule."
     },
     {
      "id": "bigger",
      "text": "Blocks may now contain more data than before."
     },
     {
      "id": "fork",
      "text": "Nodes on older versions now reject newer blocks."
     }
    ],
    "answer": "nothing",
    "why": "A relay default is policy. Blocks carrying that much data were already valid before the change, and nodes with either setting accept the same blocks."
   },
   "question": "A transaction carrying 200 bytes of data is mined into a block by someone else. What does the filtering node do with that block?",
   "options": [
    {
     "id": "reject",
     "text": "It rejects the block, because the block contains a transaction it refuses."
    },
    {
     "id": "accept",
     "text": "It accepts the block. The filter only affected what it relayed."
    },
    {
     "id": "strip",
     "text": "It accepts the block but removes that transaction from its copy."
    }
   ],
   "answer": "accept"
  },
  {
   "id": "double-reward",
   "group": "rules",
   "kind": "patch",
   "title": "Can you raise the block reward?",
   "summary": "One line of source changes the new coins a miner may pay itself from 50 to 100 per block (on this private chain the starting reward is 50).",
   "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
   "belief": "\"The developers could just change the 21 million limit.\"",
   "lesson": "The subsidy is the new bitcoin a block may create; the total block reward also includes transaction fees. Mainnet starts at a 50 BTC subsidy and halves it every 210,000 blocks. The schedule, satoshi rounding and other validity checks constrain issuance. MAX_MONEY is a separate consensus range check, not a switch that raises the subsidy. This patch doubles the starting subsidy on your private chain, whose halvings occur every 150 blocks. Your node accepted its changed reward; the reference rejected an overpaying block with bad-cb-amount. Other nodes using unchanged rules reject it too. A software release cannot force them to accept the extra outputs; people must choose compatible rules for their own nodes. The reference node was not impressed by the larger number.",
   "sources": [
    {
     "title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/src/validation.cpp"
    },
    {
     "title": "Bitcoin Core source: MAX_MONEY is \"not the total money supply\"",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/src/consensus/amount.h"
    }
   ],
   "followup": {
    "question": "Suppose every Bitcoin Core maintainer agreed to release a version with a higher reward. What would make the new reward real?",
    "options": [
     {
      "id": "merge",
      "text": "Merging the change. Nodes update automatically."
     },
     {
      "id": "miners",
      "text": "A majority of miners producing blocks with the higher reward."
     },
     {
      "id": "run",
      "text": "Nothing short of the people who run nodes and accept payments choosing to run it."
     }
    ],
    "answer": "run",
    "why": "Bitcoin Core has no automatic update, and a block that breaks a node's rules is refused however much mining power produced it. A rule changes only where people choose to run the changed software."
   },
   "question": "What do you expect the comparison to show?",
   "options": [
    {
     "id": "none",
     "text": "No difference in the tested blocks and transactions."
    },
    {
     "id": "policy",
     "text": "Different transaction policy, with no block disagreement in these checks."
    },
    {
     "id": "loosened",
     "text": "Only the unmodified node will reject some of the other node's test blocks."
    },
    {
     "id": "tightened",
     "text": "Only my node will reject some of the other node's test blocks."
    },
    {
     "id": "split",
     "text": "Both nodes will reject some of the other node's test blocks."
    },
    {
     "id": "unsure",
     "text": "I am not sure."
    }
   ],
   "answer": "loosened"
  },
  {
   "id": "halve-reward",
   "group": "rules",
   "kind": "patch",
   "title": "What if your node demands a smaller reward?",
   "summary": "One line of source lowers the reward your node allows from 50 to 25 per block.",
   "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
   "belief": "\"If my node enforces a stricter rule, the network has to follow it.\"",
   "lesson": "This patch lowers the starting subsidy limit to 25 BTC. In the check, the reference miner claimed its full 50 BTC subsidy, so your node rejected the block. The reference accepts blocks claiming the smaller subsidy because miners may claim less than the maximum. Your node cannot make another node change its checks. It can follow a compatible branch if miners build one, or remain at its last accepted block if nobody does. A smaller mining share can still produce a growing branch; whether other nodes follow it depends on accumulated valid work and later miner behavior, not a vote by node count. A stricter rule does not arrive with a complimentary mining crew.",
   "sources": [
    {
     "title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/src/validation.cpp"
    },
    {
     "title": "Bitcoin developer guide: consensus and chain selection",
     "url": "https://developer.bitcoin.org/devguide/block_chain.html"
    }
   ],
   "followup": {
    "question": "A group of node operators starts rejecting blocks that most miners keep producing. What happens to the group's nodes?",
    "options": [
     {
      "id": "follow",
      "text": "Miners must change their blocks to satisfy those nodes."
     },
     {
      "id": "stall",
      "text": "Those nodes stop following the chain everyone else is on."
     },
     {
      "id": "vote",
      "text": "The rule takes effect once enough nodes signal for it."
     }
    ],
    "answer": "stall",
    "why": "The nodes reject any chain containing a block that violates their rule. Their accepted branch can keep growing if miners produce compatible blocks."
   },
   "question": "What do you expect the comparison to show?",
   "options": [
    {
     "id": "none",
     "text": "No difference in the tested blocks and transactions."
    },
    {
     "id": "policy",
     "text": "Different transaction policy, with no block disagreement in these checks."
    },
    {
     "id": "loosened",
     "text": "Only the unmodified node will reject some of the other node's test blocks."
    },
    {
     "id": "tightened",
     "text": "Only my node will reject some of the other node's test blocks."
    },
    {
     "id": "split",
     "text": "Both nodes will reject some of the other node's test blocks."
    },
    {
     "id": "unsure",
     "text": "I am not sure."
    }
   ],
   "answer": "tightened"
  },
  {
   "id": "faster-halving",
   "group": "rules",
   "kind": "patch",
   "title": "What if the reward halved sooner?",
   "summary": "On this private chain the reward halves every 150 blocks. One line of source makes your node halve it every 75.",
   "needs": "No AI. Runs at once with a ready-made node, or compiles the change yourself.",
   "belief": "\"A rule change takes effect straight away, so I would notice at once.\"",
   "lesson": "The nodes accepted the same first 74 reference blocks. At height 75 the changed node allowed at most half its earlier subsidy while the reference miner still claimed the old amount, so it rejected that block. A miner claiming less could have produced a block both accepted. Changed rules can remain invisible until a particular height, time or transaction exercises them. Successful checks therefore demonstrate only the behaviors tested, rather than proving that the builds have identical consensus rules. Block 75 was when the fine print stopped being theoretical.",
   "sources": [
    {
     "title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/src/validation.cpp"
    },
    {
     "title": "Bitcoin Core source: regtest halves every 150 blocks (chainparams.cpp)",
     "url": "https://github.com/bitcoin/bitcoin/blob/f0de87f040621468b956f01f526a43a010310501/src/kernel/chainparams.cpp"
    }
   ],
   "followup": {
    "question": "A changed node has followed the real network without trouble for a month. What does that show about its consensus rules?",
    "options": [
     {
      "id": "safe",
      "text": "They are compatible. A month of blocks would have exposed any difference."
     },
     {
      "id": "limited",
      "text": "It accepted that month's blocks. Untested differences may still exist."
     },
     {
      "id": "nothing",
      "text": "Nothing at all. Following the chain is unrelated to consensus rules."
     }
    ],
    "answer": "limited",
    "why": "Agreement on that history shows that those blocks passed its checks. It does not establish that the two versions would accept every possible block."
   },
   "question": "What do you expect the comparison to show?",
   "options": [
    {
     "id": "none",
     "text": "No difference in the tested blocks and transactions."
    },
    {
     "id": "policy",
     "text": "Different transaction policy, with no block disagreement in these checks."
    },
    {
     "id": "loosened",
     "text": "Only the unmodified node will reject some of the other node's test blocks."
    },
    {
     "id": "tightened",
     "text": "Only my node will reject some of the other node's test blocks."
    },
    {
     "id": "split",
     "text": "Both nodes will reject some of the other node's test blocks."
    },
    {
     "id": "unsure",
     "text": "I am not sure."
    }
   ],
   "answer": "tightened"
  },
  {
   "id": "miners",
   "group": "power",
   "kind": "scene",
   "title": "Can most of the mining power break the rules?",
   "summary": "A miner whose node pays itself 100 BTC per block produces 30 blocks. An honest miner produces 2. Both are offered to an unmodified node.",
   "needs": "No AI. Uses the ready-made node from \"Can you raise the block reward?\".",
   "belief": "\"Miners control Bitcoin\", and \"the longest chain wins.\"",
   "lesson": "A node chooses the chain with the most proof of work among chains it considers valid. The reference refused the first overpaying block and the descendants built on it, even though the competing branch contained more work. Majority mining power can censor transactions or attempt to reorganize recent history, including double-spending the miner's own payments. It cannot make an over-subsidy block or an unauthorized signature pass an unchanged node's checks. This scene compares constructed branches at regtest difficulty; producing more blocks here is not a measurement of real mining power. More hash power is not a permission slip to change another node's rules.",
   "sources": [
    {
     "title": "Bitcoin: A Peer-to-Peer Electronic Cash System",
     "url": "https://bitcoin.org/bitcoin.pdf"
    },
    {
     "title": "Bitcoin developer guide: consensus and chain selection",
     "url": "https://developer.bitcoin.org/devguide/block_chain.html"
    }
   ],
   "followup": {
    "question": "What can a miner with 60% of the mining power do?",
    "options": [
     {
      "id": "print",
      "text": "Create coins beyond the schedule."
     },
     {
      "id": "steal",
      "text": "Spend coins from anyone's address."
     },
     {
      "id": "reorder",
      "text": "Try to exclude transactions or replace its own recent payments with conflicting spends."
     }
    ],
    "answer": "reorder",
    "why": "A majority miner can attempt censorship and reorganisations using valid blocks. It still cannot make an invalid block pass another node's checks."
   },
   "variant": "double-reward",
   "question": "The rule-breaking branch has more accumulated proof of work. Which chain does the unmodified node follow?",
   "options": [
    {
     "id": "longest",
     "text": "The rule-breaking chain. The chain with the most work wins."
    },
    {
     "id": "valid",
     "text": "The honest chain. It refuses every rule-breaking block, however many there are."
    },
    {
     "id": "split",
     "text": "It follows both until one side gives up."
    }
   ],
   "answer": "valid"
  },
  {
   "id": "power",
   "group": "power",
   "kind": "scene",
   "title": "How does mining power affect a stricter chain?",
   "summary": "Forty discoveries are scheduled in the share you choose. Some miners enforce a 25 BTC subsidy limit; others may claim 50. Compare the active chains.",
   "needs": "No AI. Uses the ready-made node from \"What if your node demands a smaller reward?\".",
   "belief": "\"Nodes vote, and a rule takes effect when enough nodes want it.\"",
   "lesson": "This is a controlled schedule of forty block discoveries, not a prediction of a real network. Miners using the stricter rule accept only the lower-subsidy branch; unmodified miners accept both kinds of block and follow whichever valid branch has more work. With this schedule, a larger enforcing share can make the reference switch to the stricter branch. It still does not check the new rule itself. Real discoveries are random, equal-work ties depend on which block arrives first, and miner choices can change. A forty-block outcome does not establish a universal activation threshold. Activation rules, signaling and ongoing enforcement are separate questions. Try different shares and compare the observed chains. Following a stricter chain does not download the stricter rulebook.",
   "sources": [
    {
     "title": "Bitcoin developer guide: consensus and chain selection",
     "url": "https://developer.bitcoin.org/devguide/block_chain.html"
    },
    {
     "title": "BIP 9: activation states and enforcement",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki"
    }
   ],
   "followup": {
    "question": "Ten thousand nodes enforce a stricter rule while miners keep producing blocks that violate it. Does the node count force those blocks to become acceptable?",
    "options": [
     {
      "id": "wins",
      "text": "The rule takes effect, because so many nodes enforce it."
     },
     {
      "id": "alone",
      "text": "No. Each node still rejects blocks that violate its own rule."
     },
     {
      "id": "nothing",
      "text": "Nothing changes for anyone."
     }
    ],
    "answer": "alone",
    "why": "Node count does not alter block validity. An accepted branch needs compatible blocks; its progress depends on mining and network conditions."
   },
   "variant": "halve-reward",
   "slider": {
    "label": "Share of mining power enforcing the stricter rule",
    "min": 10,
    "max": 90,
    "step": 5,
    "value": 30,
    "unit": "%"
   },
   "question": "With the share you chose, where do the nodes that did not change end up?",
   "options": [
    {
     "id": "own",
     "text": "On a different active chain from the stricter node."
    },
    {
     "id": "strict",
     "text": "On the stricter chain, without ever being upgraded."
    },
    {
     "id": "stuck",
     "text": "Nowhere. Both chains stop."
    }
   ],
   "answer": null
  },
  {
   "id": "softfork",
   "group": "power",
   "kind": "scene",
   "title": "What does a node miss when it does not enforce a soft fork?",
   "summary": "A controlled demonstration of BIP 65, introduced in 2015. Two modern nodes differ in one check: only one enforces the time lock.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"Old nodes are protected by a rule change even if they do not upgrade.\"",
   "lesson": "BIP 65 gave the existing NOP2 instruction a new meaning: OP_CHECKLOCKTIMEVERIFY rejects spends that do not satisfy a specified transaction lock time. That is a soft fork because it invalidates some spends previously allowed. This scene uses two modern regtest nodes, with that check disabled on one; it demonstrates the rule difference rather than replaying the 2015 network. The disabled node accepted an early spend that the enforcing node rejected. An unupgraded node can still follow a valid stricter chain, but does not independently check the new condition. Following a compatible chain is different from validating every rule on it. The disabled check did exactly what 'disabled' advertised.",
   "sources": [
    {
     "title": "BIP 65: OP_CHECKLOCKTIMEVERIFY",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki"
    },
    {
     "title": "BIP 9: activation states and enforcement",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki"
    }
   ],
   "followup": {
    "question": "After a soft fork, what is a node that has not upgraded relying on?",
    "options": [
     {
      "id": "itself",
      "text": "Its own checks, which still cover every rule."
     },
     {
      "id": "miners",
      "text": "Miners enforcing the new rule, which it cannot check itself."
     },
     {
      "id": "devs",
      "text": "The developers, who can update it remotely."
     }
    ],
    "answer": "miners",
    "why": "It still checks every rule it knows. The new rule is invisible to it, so for that rule alone it accepts whatever the most-work chain contains."
   },
   "question": "Someone spends the locked coin far too early, in a block. What does the node with the time-lock check disabled do with that block?",
   "options": [
    {
     "id": "reject",
     "text": "It rejects the block. The coin is locked."
    },
    {
     "id": "accept",
     "text": "It accepts the block. Its active checks do not enforce that lock."
    },
    {
     "id": "crash",
     "text": "It stops, because it meets an instruction it does not understand."
    }
   ],
   "answer": "accept"
  }
 ],
 "learning": {
  "beginner_route": [
   "keys",
   "utxos",
   "fees",
   "relay-filter",
   "double-reward"
  ],
  "glossary": {
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
   "time lock": "A spending condition requiring a specified block height or time to be reached."
  },
  "terms": {
   "keys": [
    "BTC",
    "private key",
    "UTXO"
   ],
   "utxos": [
    "UTXO",
    "input",
    "change"
   ],
   "fees": [
    "BTC",
    "sat/vB",
    "mempool"
   ],
   "fee-size": [
    "input",
    "sat/vB"
   ],
   "watch-only": [
    "private key",
    "descriptor"
   ],
   "reorg": [
    "confirmation",
    "proof of work"
   ],
   "relay-filter": [
    "policy",
    "consensus rule",
    "OP_RETURN"
   ],
   "double-reward": [
    "subsidy",
    "consensus rule"
   ],
   "halve-reward": [
    "subsidy",
    "soft fork"
   ],
   "faster-halving": [
    "subsidy",
    "consensus rule"
   ],
   "miners": [
    "subsidy",
    "proof of work"
   ],
   "power": [
    "hash rate",
    "soft fork",
    "proof of work"
   ],
   "softfork": [
    "soft fork",
    "time lock"
   ]
  },
  "takeaways": {
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
   "softfork": "A node that omits a new check cannot independently detect violations of that check."
  },
  "practice": {
   "keys": [
    {
     "id": "keys-backup-1",
     "question": "A laptop fails, but its complete usable wallet backup survives. Did the on-chain outputs disappear?",
     "options": [
      {
       "id": "0",
       "text": "Yes, the coins were on the laptop."
      },
      {
       "id": "1",
       "text": "No; restoring the required spending information can restore access."
      },
      {
       "id": "2",
       "text": "Miners must create replacement coins."
      }
     ],
     "answer": "1",
     "why": "Device loss does not delete outputs. Access depends on recovering the information required by their spending conditions."
    },
    {
     "id": "keys-watch-1",
     "question": "An app shows an address balance but holds no signing keys. What does that establish?",
     "options": [
      {
       "id": "0",
       "text": "It can see the outputs, but that alone does not show it can spend."
      },
      {
       "id": "1",
       "text": "It can spend because it can see the balance."
      },
      {
       "id": "2",
       "text": "It owns a copy of the coins."
      }
     ],
     "answer": "0",
     "why": "Visibility and signing authority are separate. A watch-only wallet can display outputs it cannot spend."
    }
   ],
   "utxos": [
    {
     "id": "utxo-sum-1",
     "question": "Two inputs total 30,000 satoshis. The payment is 18,000 and the fee is 600. What is the change?",
     "options": [
      {
       "id": "0",
       "text": "12,000 satoshis."
      },
      {
       "id": "1",
       "text": "600 satoshis."
      },
      {
       "id": "2",
       "text": "11,400 satoshis."
      }
     ],
     "answer": "2",
     "why": "30,000 \u2212 18,000 \u2212 600 = 11,400. The sender constructs a new change output."
    },
    {
     "id": "utxo-whole-1",
     "question": "You spend a 40,000-satoshi output to pay 25,000, with change and a fee. What remains of the original output?",
     "options": [
      {
       "id": "0",
       "text": "It remains worth 15,000."
      },
      {
       "id": "1",
       "text": "It is spent in full; change is a new output."
      },
      {
       "id": "2",
       "text": "It becomes the miner's account."
      }
     ],
     "answer": "1",
     "why": "An input consumes the whole referenced output. Remaining value is represented by a new output, less the fee."
    }
   ],
   "fees": [
    {
     "id": "fees-equal-space-1",
     "question": "Two independent payments use equal virtual space. One sends less BTC but pays a higher fee rate. What does this lab's configured miner prefer?",
     "options": [
      {
       "id": "0",
       "text": "The one sending more BTC."
      },
      {
       "id": "1",
       "text": "The one with the higher fee rate."
      },
      {
       "id": "2",
       "text": "Always the older one."
      }
     ],
     "answer": "1",
     "why": "The configured assembler compares the fee bid for space. Actual miners can choose other policies, and dependencies matter."
    },
    {
     "id": "fees-no-guarantee-1",
     "question": "You broadcast a very low-fee payment. Does an eventually empty block guarantee confirmation?",
     "options": [
      {
       "id": "0",
       "text": "Yes, every payment is eventually included."
      },
      {
       "id": "1",
       "text": "Yes, if it sends enough BTC."
      },
      {
       "id": "2",
       "text": "No; relay/mining floors and miner choices can still prevent it."
      }
     ],
     "answer": "2",
     "why": "Unconfirmed transactions have no universal inclusion guarantee, even when some blocks have room."
    }
   ],
   "fee-size": [
    {
     "id": "fee-size-math-1",
     "question": "A transaction uses 150 virtual bytes at 4 sat/vB. What total fee does that describe?",
     "options": [
      {
       "id": "0",
       "text": "600 satoshis."
      },
      {
       "id": "1",
       "text": "4% of its value."
      },
      {
       "id": "2",
       "text": "150 satoshis."
      }
     ],
     "answer": "0",
     "why": "150 \u00d7 4 = 600 satoshis."
    },
    {
     "id": "fee-bump-1",
     "question": "A wallet offers to increase an unconfirmed transaction's fee. What can that promise?",
     "options": [
      {
       "id": "0",
       "text": "It reverses a confirmed payment."
      },
      {
       "id": "1",
       "text": "It may improve the bid if accepted under node policy; confirmation is still not guaranteed."
      },
      {
       "id": "2",
       "text": "The next miner must include it."
      }
     ],
     "answer": "1",
     "why": "Replacement is a policy-governed change to an unconfirmed transaction. A higher fee does not command miners or undo confirmations."
    }
   ],
   "watch-only": [
    {
     "id": "watch-recovery-1",
     "question": "For a 2-of-3 wallet, you recover two signing keys but lose the information describing the wallet's script. Is recovery automatically assured?",
     "options": [
      {
       "id": "0",
       "text": "Yes, every pair of seeds reconstructs every wallet."
      },
      {
       "id": "1",
       "text": "Yes, if an explorer shows a balance."
      },
      {
       "id": "2",
       "text": "No; the required wallet/script information must also be recovered."
      }
     ],
     "answer": "2",
     "why": "Recovery must reconstruct the actual spending conditions, not just reach a count of seed phrases."
    },
    {
     "id": "watch-public-1",
     "question": "Is sharing a public descriptor always harmless because it cannot sign?",
     "options": [
      {
       "id": "0",
       "text": "No. It can reveal addresses and link wallet activity."
      },
      {
       "id": "1",
       "text": "Yes, it contains no useful information."
      },
      {
       "id": "2",
       "text": "It gives the recipient all private keys."
      }
     ],
     "answer": "0",
     "why": "A public descriptor can expose wallet structure and activity without granting spending authority."
    }
   ],
   "reorg": [
    {
     "id": "reorg-conflict-1",
     "question": "A higher-work valid branch contains a conflicting spend of your payment's input. Must your original payment return to the mempool?",
     "options": [
      {
       "id": "0",
       "text": "Yes, every displaced payment returns."
      },
      {
       "id": "1",
       "text": "No; the conflict can make it invalid on the new active chain."
      },
      {
       "id": "2",
       "text": "It is automatically paid twice."
      }
     ],
     "answer": "1",
     "why": "The original scene had no conflicting spend. With a conflict, a displaced transaction may no longer be valid."
    },
    {
     "id": "reorg-valid-1",
     "question": "A branch has more work but contains a block your node rejects. Must your node follow it?",
     "options": [
      {
       "id": "0",
       "text": "Yes, work overrides all checks."
      },
      {
       "id": "1",
       "text": "Only if most visible nodes follow it."
      },
      {
       "id": "2",
       "text": "No; chain selection considers branches that satisfy its rules."
      }
     ],
     "answer": "2",
     "why": "Validity is checked before comparing accumulated work."
    }
   ],
   "relay-filter": [
    {
     "id": "relay-route-1",
     "question": "A miner receives a valid transaction through a private route after your node refuses to relay it. What determines your node's acceptance of its block?",
     "options": [
      {
       "id": "0",
       "text": "Its block-validity rules."
      },
      {
       "id": "1",
       "text": "Whether its own mempool contained the transaction."
      },
      {
       "id": "2",
       "text": "Whether the miner used your route."
      }
     ],
     "answer": "0",
     "why": "Local relay policy does not become an extra consensus check on transactions inside a block."
    },
    {
     "id": "relay-effect-1",
     "question": "Does a local relay policy have no effect at all?",
     "options": [
      {
       "id": "0",
       "text": "Correct; policy is meaningless."
      },
      {
       "id": "1",
       "text": "No. It can affect propagation, mempools and mining templates without changing block validity."
      },
      {
       "id": "2",
       "text": "It rewrites all peers' rules."
      }
     ],
     "answer": "1",
     "why": "Policy affects local and network behavior even when it does not change block validity."
    }
   ],
   "double-reward": [
    {
     "id": "reward-unmined-1",
     "question": "A node allows a larger subsidy, but nobody mines a block using that permission. Must it immediately leave the old chain?",
     "options": [
      {
       "id": "0",
       "text": "Yes, editing code always creates a chain."
      },
      {
       "id": "1",
       "text": "Yes, its name changed."
      },
      {
       "id": "2",
       "text": "No; it can keep following blocks that satisfy both sets of rules."
      }
     ],
     "answer": "2",
     "why": "A permission difference becomes visible when a block exercises it."
    },
    {
     "id": "reward-fees-1",
     "question": "A miner's payout exceeds the subsidy but includes permitted transaction fees. Is the amount alone evidence of excess issuance?",
     "options": [
      {
       "id": "0",
       "text": "No. Allowed fees must be separated from the subsidy."
      },
      {
       "id": "1",
       "text": "Yes, all payout is newly issued."
      },
      {
       "id": "2",
       "text": "Yes, fees are forbidden."
      }
     ],
     "answer": "0",
     "why": "The coinbase can claim the allowed subsidy plus transaction fees. Only the subsidy is new issuance."
    }
   ],
   "halve-reward": [
    {
     "id": "strict-minority-1",
     "question": "A minority of miners follows stricter compatible rules. Can that branch grow?",
     "options": [
      {
       "id": "0",
       "text": "No block can ever be produced."
      },
      {
       "id": "1",
       "text": "Yes, if those miners produce valid blocks; convergence with other nodes is a separate question."
      },
      {
       "id": "2",
       "text": "Only after every old node upgrades."
      }
     ],
     "answer": "1",
     "why": "Minority hash rate can produce a branch. Its growth does not guarantee it becomes the most-work branch accepted by other nodes."
    },
    {
     "id": "strict-subset-1",
     "question": "In a pure tightening, how do blocks valid under the new rules relate to the old rules?",
     "options": [
      {
       "id": "0",
       "text": "They are all invalid under the old rules."
      },
      {
       "id": "1",
       "text": "There is no relationship."
      },
      {
       "id": "2",
       "text": "They are also valid under the old rules."
      }
     ],
     "answer": "2",
     "why": "That subset relationship defines a pure soft fork; it does not by itself coordinate activation."
    }
   ],
   "faster-halving": [
    {
     "id": "latent-test-1",
     "question": "Two builds agree on ordinary payments but differ on a script condition that was never tested. What can you conclude?",
     "options": [
      {
       "id": "0",
       "text": "Agreement was observed only on the tested inputs."
      },
      {
       "id": "1",
       "text": "Every consensus rule is identical."
      },
      {
       "id": "2",
       "text": "The script difference cannot matter."
      }
     ],
     "answer": "0",
     "why": "Unexercised differences remain possible. Test coverage limits every compatibility claim."
    },
    {
     "id": "halving-boundary-1",
     "question": "A node halves its subsidy earlier than a reference. When can the difference first affect a block's acceptance?",
     "options": [
      {
       "id": "0",
       "text": "Whenever someone opens its UI."
      },
      {
       "id": "1",
       "text": "When a block claims more subsidy than the earlier schedule permits."
      },
      {
       "id": "2",
       "text": "Only when all nodes upgrade."
      }
     ],
     "answer": "1",
     "why": "The rule must be exercised by a block; simply following earlier compatible blocks does not test the boundary."
    }
   ],
   "miners": [
    {
     "id": "miners-invalid-1",
     "question": "A miner produces 100 rule-breaking blocks while another produces one valid block. Does the count alone make the first branch acceptable?",
     "options": [
      {
       "id": "0",
       "text": "Yes, the majority wins every check."
      },
      {
       "id": "1",
       "text": "Yes, after ten minutes."
      },
      {
       "id": "2",
       "text": "No; invalid blocks are rejected before chain selection."
      }
     ],
     "answer": "2",
     "why": "Work and block counts do not waive a node's validity rules."
    },
    {
     "id": "miners-censor-1",
     "question": "Can a powerful miner choose to leave a particular valid payment out of its blocks?",
     "options": [
      {
       "id": "0",
       "text": "Yes. Choosing inclusion is different from making invalid issuance valid."
      },
      {
       "id": "1",
       "text": "No; every valid payment must be included immediately."
      },
      {
       "id": "2",
       "text": "Only by changing the supply limit."
      }
     ],
     "answer": "0",
     "why": "Miners choose their block contents. Inclusion power is not permission to violate the rules of unchanged nodes."
    }
   ],
   "power": [
    {
     "id": "power-random-1",
     "question": "A miner has 60% of hash rate. Must it find exactly 24 of the next 40 blocks?",
     "options": [
      {
       "id": "0",
       "text": "Yes, the protocol schedules them."
      },
      {
       "id": "1",
       "text": "No; real discoveries are random, unlike the lab's controlled schedule."
      },
      {
       "id": "2",
       "text": "Yes, if its software is newer."
      }
     ],
     "answer": "1",
     "why": "A finite schedule illustrates a mechanism, not a universal prediction or activation threshold."
    },
    {
     "id": "power-follow-1",
     "question": "An older node follows a stricter branch. Is that proof it checks the new restriction?",
     "options": [
      {
       "id": "0",
       "text": "Yes, following a chain installs its rules."
      },
      {
       "id": "1",
       "text": "Yes, work updates software."
      },
      {
       "id": "2",
       "text": "No; compatible blocks can pass its older checks."
      }
     ],
     "answer": "2",
     "why": "Following compatible blocks and independently enforcing the extra rule are different behaviors."
    }
   ],
   "softfork": [
    {
     "id": "soft-check-1",
     "question": "A node does not enforce a new spending condition. Where does assurance about that condition have to come from?",
     "options": [
      {
       "id": "0",
       "text": "Other participants enforcing it; this node cannot independently detect its violations."
      },
      {
       "id": "1",
       "text": "The condition's name."
      },
      {
       "id": "2",
       "text": "The number of old nodes."
      }
     ],
     "answer": "0",
     "why": "The missing check remains missing even if the active chain happens to comply."
    },
    {
     "id": "soft-signal-1",
     "question": "A miner signals support for an upgrade. Does the signal itself prove it validates every new condition?",
     "options": [
      {
       "id": "0",
       "text": "Yes, signaling is validation."
      },
      {
       "id": "1",
       "text": "No; signaling, activation and enforcement are separate."
      },
      {
       "id": "2",
       "text": "Yes, the signal changes all nodes."
      }
     ],
     "answer": "1",
     "why": "Coordination signals are not direct evidence of all the software checks a participant performs."
    }
   ],
   "work": [
    {
     "id": "work-target-1",
     "question": "In a hash-target model, requiring another leading hexadecimal zero makes success per independent trial approximately\u2026",
     "options": [
      {
       "id": "0",
       "text": "Twice as likely."
      },
      {
       "id": "1",
       "text": "Unchanged."
      },
      {
       "id": "2",
       "text": "Sixteen times less likely."
      }
     ],
     "answer": "2",
     "why": "Each hexadecimal digit has sixteen possible values. This toy condition illustrates probability, not Bitcoin's complete header and target rules."
    },
    {
     "id": "work-clock-1",
     "question": "Bitcoin targets an average block interval. Does that mean every block arrives on a ten-minute timer?",
     "options": [
      {
       "id": "0",
       "text": "No; individual intervals vary, and difficulty adjusts over many blocks."
      },
      {
       "id": "1",
       "text": "Yes, all miners wait for the timer."
      },
      {
       "id": "2",
       "text": "Yes, except for small payments."
      }
     ],
     "answer": "0",
     "why": "Proof-of-work discoveries are probabilistic. An average is not a schedule."
    }
   ],
   "privacy": [
    {
     "id": "privacy-owner-1",
     "question": "Two payments use the same address. What does the public chain establish by itself?",
     "options": [
      {
       "id": "0",
       "text": "The recipient's legal name."
      },
      {
       "id": "1",
       "text": "The repeated destination script; identity still needs outside evidence."
      },
      {
       "id": "2",
       "text": "The recipient's password."
      }
     ],
     "answer": "1",
     "why": "Visible transaction links do not automatically identify a person."
    },
    {
     "id": "privacy-fresh-1",
     "question": "Does using a fresh address guarantee that nobody can link your transactions?",
     "options": [
      {
       "id": "0",
       "text": "Yes, permanently."
      },
      {
       "id": "1",
       "text": "Yes, if the amount is small."
      },
      {
       "id": "2",
       "text": "No; other transaction patterns and outside information can still link activity."
      }
     ],
     "answer": "2",
     "why": "Avoiding reuse removes one obvious link. It is not a guarantee of anonymity."
    }
   ],
   "lightning": [
    {
     "id": "lightning-capacity-1",
     "question": "A channel has enough total capacity, but too little spendable balance on your side. Can capacity alone guarantee your outgoing payment?",
     "options": [
      {
       "id": "0",
       "text": "No; directional liquidity and other channel/route constraints matter."
      },
      {
       "id": "1",
       "text": "Yes, total capacity is all that matters."
      },
      {
       "id": "2",
       "text": "Yes, because off-chain payments have no constraints."
      }
     ],
     "answer": "0",
     "why": "Channel capacity and outgoing liquidity are different. Real channels also reserve value for fees and other requirements."
    },
    {
     "id": "lightning-settle-1",
     "question": "Do ordinary channel balance updates each create a newly confirmed base-chain transaction?",
     "options": [
      {
       "id": "0",
       "text": "Yes, every update must be mined first."
      },
      {
       "id": "1",
       "text": "No; participants update enforceable channel state, with opening and closing interacting with the chain."
      },
      {
       "id": "2",
       "text": "No; channels have no relationship to Bitcoin."
      }
     ],
     "answer": "1",
     "why": "Channels use Bitcoin's on-chain enforcement while allowing updates without confirming each payment separately."
    }
   ]
  },
  "workshops": [
   {
    "id": "work",
    "title": "Try a proof-of-work model",
    "summary": "Hash a toy message and change the target. Compare effort with a probability, not a timer.",
    "source": "https://developer.bitcoin.org/devguide/block_chain.html#proof-of-work"
   },
   {
    "id": "privacy",
    "title": "Trace address reuse",
    "summary": "Compare a repeated destination with fresh destinations in a fictional transaction graph.",
    "source": "https://developer.bitcoin.org/devguide/transactions.html#avoiding-key-reuse"
   },
   {
    "id": "lightning",
    "title": "Move a channel balance",
    "summary": "Explore outgoing liquidity in a simplified two-party channel, then settle the latest balance.",
    "source": "https://github.com/lightning/bolts/blob/master/02-peer-protocol.md"
   }
  ]
 },
 "beliefs": [
  {
   "id": "coins-in-wallet-v2",
   "statement": "My bitcoin are stored inside my wallet app or device.",
   "truth": false,
   "experiment": "keys"
  },
  {
   "id": "backup-is-wallet-v2",
   "statement": "A complete, usable spending backup can restore access after a wallet is lost.",
   "truth": true,
   "experiment": "keys"
  },
  {
   "id": "fee-by-amount-v2",
   "statement": "Bitcoin requires a higher fee just because the amount sent is larger.",
   "truth": false,
   "experiment": "fees"
  },
  {
   "id": "mempools-differ-v2",
   "statement": "Two nodes can hold different sets of unconfirmed transactions.",
   "truth": true,
   "experiment": "fees"
  },
  {
   "id": "confirmation-final-v2",
   "statement": "Once a payment has one confirmation, it can never be undone.",
   "truth": false,
   "experiment": "reorg"
  },
  {
   "id": "filters-block-v2",
   "statement": "A node's relay filter makes a filtered transaction invalid even inside a block.",
   "truth": false,
   "experiment": "relay-filter"
  },
  {
   "id": "devs-change-supply-v2",
   "statement": "Releasing new software automatically raises the supply limit enforced by unchanged nodes.",
   "truth": false,
   "experiment": "double-reward"
  },
  {
   "id": "miners-print-v2",
   "statement": "Most mining power can make unchanged nodes accept coins beyond their subsidy rules.",
   "truth": false,
   "experiment": "miners"
  },
  {
   "id": "majority-tightens-v2",
   "statement": "A node can follow a stricter chain without independently checking its new rule.",
   "truth": true,
   "experiment": "power"
  },
  {
   "id": "old-nodes-check-v2",
   "statement": "After a rule is tightened, nodes that have not upgraded still check the new rule themselves.",
   "truth": false,
   "experiment": "softfork"
  }
 ],
 "static_flag_note": "This is a text match on the proposed change, made before anything is built. It can flag harmless edits and miss real ones. The comparison below supplies observations about compatibility; it also has limited coverage.",
 "no_reference_note": "This build was not compared with an unmodified node, because no reference node is available yet. A node accepting its own blocks does not establish compatibility with other nodes. Prepare a reference node to see what an unmodified node does with this change."
};
