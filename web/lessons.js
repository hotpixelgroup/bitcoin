window.VibesLessons = {
 "prediction": {
  "question": "Before you run it: what will an unmodified node do with this change?",
  "options": [
   {
    "id": "none",
    "text": "Nothing visible. Both nodes keep accepting each other's blocks and transactions."
   },
   {
    "id": "policy",
    "text": "They relay transactions differently, but still accept each other's blocks."
   },
   {
    "id": "loosened",
    "text": "The unmodified node will refuse the blocks my node produces."
   },
   {
    "id": "tightened",
    "text": "My node will refuse the blocks the unmodified node produces."
   },
   {
    "id": "split",
    "text": "Each node will refuse the other's blocks."
   },
   {
    "id": "unsure",
    "text": "I am not sure."
   }
  ]
 },
 "verdicts": {
  "identical": {
   "title": "Same rules as the unmodified node",
   "meaning": "This build has the same node source as the unmodified reference, so there is nothing to compare.",
   "mainnet": "On a real network this node follows the same chain as every other unmodified node."
  },
  "inconclusive": {
   "title": "The comparison could not be completed",
   "meaning": "At least one check could not be carried out, for example because this build could not produce a block of its own. The checks that did run found no difference, but a check that never ran is not a check that passed.",
   "mainnet": "Treat this build as unknown. The lab does not apply it without your review and does not start it on a shared network. The rows below show which check did not run and why."
  },
  "none": {
   "title": "No difference observed",
   "meaning": "In every check the lab ran, the two nodes accepted each other's blocks and treated the test transactions the same way.",
   "mainnet": "That is evidence, not proof. The lab checks block rewards, a reward halving, ordinary payments, a data-carrying transaction and block exchange in both directions. A change to a rule those checks never exercise would not show up here."
  },
  "policy": {
   "title": "Local policy changed; consensus did not",
   "meaning": "Your node relays or stores transactions differently, and both nodes still accept each other's blocks.",
   "mainnet": "On a real network your node would stay on the same chain as everyone else. Only your own waiting area for unconfirmed transactions (the mempool), your fee estimates and what you pass on to peers would differ. A relay filter cannot keep a transaction out of a block: miners decide what a block contains."
  },
  "tightened": {
   "title": "Tightened: your node rejects blocks the unmodified node accepts",
   "meaning": "Your node now refuses something the unmodified rules allow. The unmodified node still considers your node's blocks valid, because a stricter rule never produces anything the looser rule forbids.",
   "mainnet": "On a real network your node would follow the chain until the first block that breaks your stricter rule, then stop there while everyone else carried on. Payments confirmed after that point would never appear on your node. Others would follow your stricter chain only if most mining power enforced the same rule. Bitcoin's name for this shape of change is a soft fork."
  },
  "loosened": {
   "title": "Loosened: the unmodified node rejects blocks your node produces",
   "meaning": "Your node now accepts something the unmodified rules forbid. Every unmodified node refuses a block that uses the looser rule.",
   "mainnet": "On a real network nothing visible would change at first: nobody else produces blocks that use your looser rule, so your node would keep following the same chain. The difference appears only if a block using the looser rule is ever mined. Your node would accept it and every unmodified node would refuse it, leaving your node on a chain nobody else recognises. Coins that exist only on that chain cannot be spent with anyone else. Bitcoin's name for this shape of change is a hard fork."
  },
  "split": {
   "title": "Split: each node rejects the other's blocks",
   "meaning": "The two nodes disagree in both directions. Neither will ever accept the other's chain.",
   "mainnet": "On a real network your node would separate from everyone else at the first block either side refused, and stay separate for good. Coins on your side could be spent only with nodes running the same changed rules."
  }
 },
 "networks": {
  "regtest": "A private test network that exists only on this machine. Blocks are produced on demand, coins have no value, and nothing you do here reaches anyone else. Two regtest quirks matter: the block reward halves every 150 blocks instead of every 210,000, and the difficulty never adjusts.",
  "signet": "A shared test network whose blocks must be signed by its operator. Coins have no value. Other people's nodes are on it, so a node with changed consensus rules will stop agreeing with them.",
  "testnet": "The old public test network (testnet3). Coins have no value. Other people's nodes are on it, so a node with changed consensus rules will stop agreeing with them.",
  "testnet4": "The current public test network. Coins have no value. Other people's nodes are on it, so a node with changed consensus rules will stop agreeing with them.",
  "main": "The real Bitcoin network. Coins have real value. A node with changed consensus rules here either stops following the network or follows a chain nobody else recognises, and anything it tells a wallet about payments can then be wrong."
 },
 "groups": [
  {
   "id": "money",
   "title": "Coins, keys and payments",
   "blurb": "Where your bitcoin actually are, what a fee buys, and what a confirmation is."
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
   "lesson": "Nothing that could be called a coin is ever stored in a wallet. The chain that every node keeps records which outputs exist and what it takes to spend them. A wallet holds keys, and shows a balance by reading the chain. Node B had never seen this wallet and could still find the 50 BTC. When the wallet was deleted the chain did not change; when the keys were restored on another machine the coins could be spent again. Two things follow. A backup of the keys, usually a list of words, is the wallet: whoever holds it holds the coins, and no one can reset it for you. And a balance shown by an exchange is not this: the exchange holds the keys and owes you the amount.",
   "sources": [
    {
     "title": "Mai et al., User Mental Models of Cryptocurrency Systems (SOUPS 2020)",
     "url": "https://www.usenix.org/system/files/soups2020-mai.pdf"
    },
    {
     "title": "Bitcoin developer guide: wallets",
     "url": "https://developer.bitcoin.org/devguide/wallets.html"
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
     "text": "Nothing. They are recorded on the chain; only the key to move them was deleted."
    },
    {
     "id": "node",
     "text": "They return to the node that mined them."
    }
   ],
   "answer": "chain"
  },
  {
   "id": "fees",
   "group": "money",
   "kind": "scene",
   "title": "Does sending more cost more?",
   "summary": "Two payments wait for a block that has room for only one: 10 BTC paying a low fee, and 0.1 BTC paying a higher one.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"The fee is a percentage of what you send, and the network sets it.\"",
   "lesson": "A block has limited space, and a fee is a bid for some of it. Both payments took almost the same number of bytes, so the miner chose the one bidding more per byte, and the amount being moved never entered into it. Nobody sets the fee but the sender: when blocks are full a low bid waits, and when they have room almost any bid is enough. The scene also showed that node B never saw either payment waiting. Each node keeps its own waiting area for unconfirmed transactions, called a mempool, and no two are guaranteed to match.",
   "sources": [
    {
     "title": "Bitcoin developer guide: transaction fees",
     "url": "https://developer.bitcoin.org/devguide/transactions.html#transaction-fees-and-change"
    },
    {
     "title": "Bitcoin Core: transaction relay policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/README.md"
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
      "text": "Other transactions are paying more per byte, so they are chosen first."
     },
     {
      "id": "approval",
      "text": "The network has not approved it yet."
     }
    ],
    "answer": "bid",
    "why": "Nobody approves a payment. It waits because block space went to transactions that bid more for it."
   },
   "question": "A block has room for one more payment. One sends 10 BTC with a small fee, the other sends 0.1 BTC with a larger fee. Which one gets in?",
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
   "id": "reorg",
   "group": "money",
   "kind": "scene",
   "title": "Is a confirmed payment final?",
   "summary": "Two nodes share a chain. One confirms a payment in a block the other never sees; the other then builds a longer chain without it.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"A confirmation means the network approved my payment.\"",
   "lesson": "A confirmation is not an approval by anyone. It is a count of blocks: one for the block that includes the payment, plus one for each block built on top. Nodes follow the valid chain with the most proof of work, so when a longer chain arrives that does not contain the block, the payment goes back to waiting. Each extra block makes that reversal more expensive for whoever attempts it, which is why people wait for several before treating a payment as settled. Six is a convention, not a rule in the software.",
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
   "question": "Node A's payment has one confirmation. Node A then learns of a longer chain that does not contain it. What happens to the payment?",
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
   "summary": "Two identical nodes. One is told to refuse data-carrying transactions larger than 83 bytes, the limit Bitcoin Core used before version 30.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"If enough of us filter it, it stays off the chain.\"",
   "lesson": "A relay filter is policy: a local choice about which unconfirmed transactions a node keeps and passes on. It is never applied to transactions that are already in a block. The filtering node refused to relay the transaction, then accepted the block containing it, and both nodes stayed on one chain. Filters change what crosses your node. They cannot change what miners include, and a transaction can reach a miner without crossing your node at all. Whether filters are still worth running is a question people disagree about; what a filter can and cannot do is not.",
   "sources": [
    {
     "title": "Bitcoin Core: transaction relay policy",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/doc/policy/README.md"
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
   "lesson": "There is no number 21,000,000 that anyone could edit to print more coins. The limit is the sum of a schedule: 50 new coins per block, halved every 210,000 blocks. You changed that schedule on your node, and your node happily produced a block paying 100. The unmodified node refused it with the reason bad-cb-amount. Every other node would do the same, so the extra coins exist only on your machine. Changing the supply is not a matter of editing code: it takes everyone who checks blocks choosing to run the changed rule.",
   "sources": [
    {
     "title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp"
    },
    {
     "title": "Bitcoin Core source: MAX_MONEY is \"not the total money supply\"",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/src/consensus/amount.h"
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
   "question": "Before you run it: what will an unmodified node do with this change?",
   "options": [
    {
     "id": "none",
     "text": "Nothing visible. Both nodes keep accepting each other's blocks and transactions."
    },
    {
     "id": "policy",
     "text": "They relay transactions differently, but still accept each other's blocks."
    },
    {
     "id": "loosened",
     "text": "The unmodified node will refuse the blocks my node produces."
    },
    {
     "id": "tightened",
     "text": "My node will refuse the blocks the unmodified node produces."
    },
    {
     "id": "split",
     "text": "Each node will refuse the other's blocks."
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
   "lesson": "Your node now refuses any block whose miner claims more than 25. Unmodified miners claim 50, so your node rejected the very first block and stopped. The unmodified node carried on without noticing. It even considers your node's blocks valid, since claiming less than the maximum was always allowed; it simply ignores them because its own chain has more proof of work. A stricter rule spreads only when most mining power enforces it. Without that, the node that tightened is the one left behind. That is what happened to the nodes enforcing BIP 110 in August 2026: with about 2.5% of blocks signalling support, they rejected the majority chain and their own chain stalled.",
   "sources": [
    {
     "title": "BIP 110: Reduced Data Temporary Softfork (closed)",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0110.mediawiki"
    },
    {
     "title": "Bitcoin Optech: soft fork activation",
     "url": "https://bitcoinops.org/en/topics/soft-fork-activation/"
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
    "why": "A node can only refuse blocks for itself. Unless most mining power builds blocks its rule accepts, a stricter node is left on a chain that stops growing."
   },
   "question": "Before you run it: what will an unmodified node do with this change?",
   "options": [
    {
     "id": "none",
     "text": "Nothing visible. Both nodes keep accepting each other's blocks and transactions."
    },
    {
     "id": "policy",
     "text": "They relay transactions differently, but still accept each other's blocks."
    },
    {
     "id": "loosened",
     "text": "The unmodified node will refuse the blocks my node produces."
    },
    {
     "id": "tightened",
     "text": "My node will refuse the blocks the unmodified node produces."
    },
    {
     "id": "split",
     "text": "Each node will refuse the other's blocks."
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
   "lesson": "For 74 blocks the two nodes agreed completely, and a short test would have called this change harmless. At block 75 your node expected the reward to halve, the unmodified node did not, and your node refused the block. Changed rules can sit silent until the chain reaches the height, time or kind of transaction that exercises them. That is why one block on a private chain proves very little, and why the lab runs the chain past a halving.",
   "sources": [
    {
     "title": "Bitcoin Core source: GetBlockSubsidy in validation.cpp",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp"
    },
    {
     "title": "Bitcoin Core source: regtest halves every 150 blocks (chainparams.cpp)",
     "url": "https://github.com/bitcoin/bitcoin/blob/master/src/kernel/chainparams.cpp"
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
      "text": "Only that no block in that month exercised a rule it changed."
     },
     {
      "id": "nothing",
      "text": "Nothing at all. Following the chain is unrelated to consensus rules."
     }
    ],
    "answer": "limited",
    "why": "A node disagrees only when a block arrives that its changed rule treats differently. Agreement so far says the difference has not been exercised yet."
   },
   "question": "Before you run it: what will an unmodified node do with this change?",
   "options": [
    {
     "id": "none",
     "text": "Nothing visible. Both nodes keep accepting each other's blocks and transactions."
    },
    {
     "id": "policy",
     "text": "They relay transactions differently, but still accept each other's blocks."
    },
    {
     "id": "loosened",
     "text": "The unmodified node will refuse the blocks my node produces."
    },
    {
     "id": "tightened",
     "text": "My node will refuse the blocks the unmodified node produces."
    },
    {
     "id": "split",
     "text": "Each node will refuse the other's blocks."
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
   "lesson": "A node follows the chain with the most proof of work among the chains it considers valid. Proof of work is never weighed for a block that breaks a rule: the first of the thirty blocks was refused for paying its miner too much, and the rest for building on it. Mining power decides the order of valid transactions, and a miner with most of it can do real harm inside the rules: it can leave transactions out, and it can replace recent blocks to take back payments it made itself. It cannot create coins, spend coins that belong to someone else, or change a rule for any node that checks. That limit holds only for people who check with a node of their own, or rely on someone who does.",
   "sources": [
    {
     "title": "Bitcoin: A Peer-to-Peer Electronic Cash System",
     "url": "https://bitcoin.org/bitcoin.pdf"
    },
    {
     "title": "Bitcoin Wiki: majority attack",
     "url": "https://en.bitcoin.it/wiki/Majority_attack"
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
      "text": "Leave out transactions, and undo its own recent payments."
     }
    ],
    "answer": "reorder",
    "why": "Majority mining power controls which valid blocks get built. It gives no power to make an invalid block valid, so it cannot forge coins or signatures."
   },
   "variant": "double-reward",
   "question": "The rule-breaking miner's chain has fifteen times the proof of work of the honest one. Which chain does the unmodified node follow?",
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
   "title": "How much mining power does a stricter rule need?",
   "summary": "Forty blocks are produced. A share of the miners, which you choose, enforce a stricter rule (a reward of 25 instead of 50); the rest do not.",
   "needs": "No AI. Uses the ready-made node from \"What if your node demands a smaller reward?\".",
   "belief": "\"Nodes vote, and a rule takes effect when enough nodes want it.\"",
   "lesson": "Blocks that follow the stricter rule are valid to every node; blocks that break it are valid only to nodes that never changed. So unmodified nodes will follow the stricter chain whenever it is the one with the most work, and that happens when more than half the mining power builds only on it. Below that line the nodes enforcing the stricter rule are simply left on a shorter chain of their own. The number of nodes on either side never entered into it. This is why real rule changes have waited for miners first: 95% of recent blocks in 2015, 90% in 2021. Try the slider on both sides of one half.",
   "sources": [
    {
     "title": "Bitcoin Optech: soft fork activation",
     "url": "https://bitcoinops.org/en/topics/soft-fork-activation/"
    },
    {
     "title": "BIP 65: OP_CHECKLOCKTIMEVERIFY",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki"
    },
    {
     "title": "BIP 110: Reduced Data Temporary Softfork (closed)",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0110.mediawiki"
    }
   ],
   "followup": {
    "question": "Ten thousand nodes start enforcing a stricter rule, but only 3% of mining power does. What happens?",
    "options": [
     {
      "id": "wins",
      "text": "The rule takes effect, because so many nodes enforce it."
     },
     {
      "id": "alone",
      "text": "Those ten thousand nodes end up on a slow chain of their own."
     },
     {
      "id": "nothing",
      "text": "Nothing changes for anyone."
     }
    ],
    "answer": "alone",
    "why": "Each node refuses blocks only for itself. With 3% of mining power building blocks they accept, those nodes follow a chain that grows at 3% of the speed, while everyone else carries on."
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
   "answer_by_share": {
    "above": "strict",
    "below": "own",
    "line": 50
   },
   "question": "With the share you chose, where do the nodes that did not change end up?",
   "options": [
    {
     "id": "own",
     "text": "On their own chain. The stricter nodes are left behind on a shorter one."
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
   "title": "What happened to nodes that never upgraded in 2015?",
   "summary": "A replay of a real rule change (BIP 65). A coin is locked until block 500 with the rule added in 2015. One node enforces that rule; the other never upgraded.",
   "needs": "No AI and no compiling. Runs in a few seconds.",
   "belief": "\"Old nodes are protected by a rule change even if they do not upgrade.\"",
   "lesson": "Before 2015 the instruction used by this lock did nothing. The upgrade gave it a meaning, which made some previously valid spends invalid: a tightening, or soft fork. A node that never upgraded still sees the old meaning, so it accepted an early spend that the upgraded node refused, and followed a block the rest of the network would reject. Old nodes keep working after a soft fork only as long as miners never build such a block, which is why this change was switched on only after 95% of recent blocks came from miners who had said they would enforce it. An old node is not checking the new rule. It is trusting miners to.",
   "sources": [
    {
     "title": "BIP 65: OP_CHECKLOCKTIMEVERIFY",
     "url": "https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki"
    },
    {
     "title": "Bitcoin Optech: soft fork activation",
     "url": "https://bitcoinops.org/en/topics/soft-fork-activation/"
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
   "question": "Someone spends the locked coin far too early, in a block. What does the node that never upgraded do with that block?",
   "options": [
    {
     "id": "reject",
     "text": "It rejects the block. The coin is locked."
    },
    {
     "id": "accept",
     "text": "It accepts the block. It does not know the lock means anything."
    },
    {
     "id": "crash",
     "text": "It stops, because it meets an instruction it does not understand."
    }
   ],
   "answer": "accept"
  }
 ],
 "beliefs": [
  {
   "id": "coins-in-wallet",
   "statement": "My bitcoin are stored inside my wallet app or device.",
   "truth": false,
   "experiment": "keys"
  },
  {
   "id": "backup-is-wallet",
   "statement": "Anyone who holds a backup of a wallet's keys can spend its coins.",
   "truth": true,
   "experiment": "keys"
  },
  {
   "id": "fee-by-amount",
   "statement": "Sending a larger amount of bitcoin costs a higher fee.",
   "truth": false,
   "experiment": "fees"
  },
  {
   "id": "mempools-differ",
   "statement": "Two nodes can hold different sets of unconfirmed transactions.",
   "truth": true,
   "experiment": "fees"
  },
  {
   "id": "confirmation-final",
   "statement": "Once a payment has one confirmation, it can never be undone.",
   "truth": false,
   "experiment": "reorg"
  },
  {
   "id": "filters-block",
   "statement": "If enough node operators refuse to relay a kind of transaction, it cannot get into a block.",
   "truth": false,
   "experiment": "relay-filter"
  },
  {
   "id": "devs-change-supply",
   "statement": "The developers of the Bitcoin software could raise the 21 million limit by releasing a new version.",
   "truth": false,
   "experiment": "double-reward"
  },
  {
   "id": "miners-print",
   "statement": "A miner with most of the mining power can create extra coins.",
   "truth": false,
   "experiment": "miners"
  },
  {
   "id": "majority-tightens",
   "statement": "A stricter rule takes effect for every node once most of the mining power enforces it.",
   "truth": true,
   "experiment": "power"
  },
  {
   "id": "old-nodes-check",
   "statement": "After a rule is tightened, nodes that have not upgraded still check the new rule themselves.",
   "truth": false,
   "experiment": "softfork"
  }
 ],
 "static_flag_note": "This is a text match on the proposed change, made before anything is built. It can flag harmless edits and miss real ones. What the change actually does to compatibility is decided by the comparison with an unmodified node, shown below.",
 "no_reference_note": "This build was not compared with an unmodified node, because no reference node is available yet. On a private chain of one node any rule appears to work, because nobody is present to disagree. Prepare a reference node to see what an unmodified node does with this change."
};
