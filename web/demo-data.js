'use strict';
// Results recorded from real runs of the lab on 2026-11-12T00:54:21+00:00: two real nodes on
// a throwaway regtest chain. Regenerate with contrib/vibes/record_demo.py.
// Bitcoin Core 32.1, upstream commit f0de87f040621468b956f01f526a43a010310501.
// Each slider position has its own recording; no inputs are rounded.
window.VibesDemoData = {
 "double-reward": {
  "compare": {
   "rows": [
    {
     "id": "genesis",
     "title": "Do both nodes start from the same first block?",
     "status": "same",
     "reference": "0f9188f13cb7b2c7",
     "candidate": "0f9188f13cb7b2c7",
     "plain": "Yes. Everything below happens on one shared private chain."
    },
    {
     "id": "follow",
     "title": "Does your node accept the blocks an unmodified node produces?",
     "status": "same",
     "reference": "produced 110 valid blocks",
     "candidate": "accepted all 110",
     "plain": "Your node followed the unmodified node's chain block by block."
    },
    {
     "id": "relay-payment",
     "title": "Would each node relay an ordinary payment of 1 BTC?",
     "status": "same",
     "reference": "would relay it",
     "candidate": "would relay it",
     "plain": "Both nodes treat this transaction the same way."
    },
    {
     "id": "relay-data",
     "title": "Would each node relay a transaction carrying 200 bytes of arbitrary data?",
     "status": "same",
     "reference": "would relay it",
     "candidate": "would relay it",
     "plain": "Both nodes treat this transaction the same way."
    },
    {
     "id": "block-with-transactions",
     "title": "Does your node accept a block containing those transactions?",
     "status": "same",
     "reference": "produced the block",
     "candidate": "accepted the block",
     "plain": "Both nodes agree that a block containing these transactions is valid."
    },
    {
     "id": "halving",
     "title": "Does your node follow the chain through the first reward halving?",
     "status": "same",
     "reference": "halved the reward at block 150",
     "candidate": "accepted every block",
     "plain": "On this private chain the block reward halves at block 150. Both nodes agree on when that happens and on the new reward."
    },
    {
     "id": "produce",
     "title": "Does an unmodified node accept the blocks your node produces?",
     "status": "differs",
     "reference": "refused block 153 (reward allowed: 25 BTC)",
     "candidate": "produced a block paying its miner 50 BTC",
     "plain": "The unmodified node refused your node's block: the block pays its miner more than the rules allow (bad-cb-amount). A node enforcing the same rules also rejects that block; a larger subsidy is spendable only on a chain whose participants accept it."
    },
    {
     "id": "settings",
     "title": "Do the nodes report the same relay and mempool settings?",
     "status": "same",
     "reference": "",
     "candidate": "",
     "plain": "Both nodes report the same relay and mempool settings."
    },
    {
     "id": "network",
     "title": "Connected directly, do they agree on one chain?",
     "status": "differs",
     "reference": "block 152",
     "candidate": "block 154",
     "plain": "After the direct-connection attempt, the nodes remained apart: the unmodified node is at block 152 and yours is at block 154, on different chains. The unmodified node will never accept your node's chain, however long it grows. Your node still considers the unmodified chain valid."
    }
   ],
   "ref_rejects": {
    "height": 153,
    "hash": "6d153bdcec557c81",
    "reason": "bad-cb-amount",
    "plain": "the block pays its miner more than the rules allow (bad-cb-amount)"
   },
   "cand_rejects": null,
   "policy": [],
   "network": {
    "connected": true,
    "still_connected": true,
    "converged": false,
    "reference_tip": {
     "height": 152,
     "hash": "398a85c3f502aac94a6bb9c976ae7a244a48a7a39b123e144cf55f553d545bc2"
    },
    "candidate_tip": {
     "height": 154,
     "hash": "7d8ead9a8519f62a7ae3c1c15be2a34cd06454fd12199c0bb1de3e6d53c4d9d9"
    },
    "reference_chains": [
     {
      "height": 153,
      "hash": "6d153bdcec557c81",
      "status": "invalid",
      "branchlen": 1
     },
     {
      "height": 152,
      "hash": "398a85c3f502aac9",
      "status": "active",
      "branchlen": 0
     }
    ],
    "candidate_chains": [
     {
      "height": 154,
      "hash": "7d8ead9a8519f62a",
      "status": "active",
      "branchlen": 0
     }
    ]
   },
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "refused"
       }
      ],
      "note": "152 shared blocks, then 0 of its own; it refused the other side's next block"
     },
     {
      "label": "Chain your node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "152 shared blocks, then 2 of its own"
     }
    ]
   },
   "verdict": "loosened",
   "headline": "The unmodified node rejects blocks your node produces"
  },
  "patch": "diff --git a/src/validation.cpp b/src/validation.cpp\nindex 924b7f60f3..ce074faa5b 100644\n--- a/src/validation.cpp\n+++ b/src/validation.cpp\n@@ -1850,7 +1850,7 @@ CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)\n     if (halvings >= 64)\n         return 0;\n \n-    CAmount nSubsidy = 50 * COIN;\n+    CAmount nSubsidy = 100 * COIN;\n     // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.\n     nSubsidy >>= halvings;\n     return nSubsidy;\n",
  "files": [
   {
    "path": "src/validation.cpp",
    "added": 1,
    "removed": 1
   }
  ],
  "unit_failures": null,
  "ready_made": true,
  "build_status": "not run",
  "test_status": "not run",
  "risk": [
   "the block subsidy"
  ],
  "sensitive": [
   "src/validation.cpp"
  ]
 },
 "halve-reward": {
  "compare": {
   "rows": [
    {
     "id": "genesis",
     "title": "Do both nodes start from the same first block?",
     "status": "same",
     "reference": "0f9188f13cb7b2c7",
     "candidate": "0f9188f13cb7b2c7",
     "plain": "Yes. Everything below happens on one shared private chain."
    },
    {
     "id": "follow",
     "title": "Does your node accept the blocks an unmodified node produces?",
     "status": "differs",
     "reference": "produced 110 valid blocks",
     "candidate": "refused block 1",
     "plain": "Your node accepted 0 blocks, then refused block 1: the block pays its miner more than the rules allow (bad-cb-amount). It will not build on this rejected block. The two nodes could still agree on a different history that both consider valid."
    },
    {
     "id": "produce",
     "title": "Does an unmodified node accept the blocks your node produces?",
     "status": "same",
     "reference": "judged both blocks valid, and ignored them",
     "candidate": "produced blocks paying their miner 25 BTC",
     "plain": "The unmodified node considers your node's blocks valid, because a stricter rule permits these particular blocks under both rule sets. Its active chain contains more proof of work. It would switch to a stricter chain if that chain became its most-work valid chain; it would still not enforce the new rule itself."
    },
    {
     "id": "settings",
     "title": "Do the nodes report the same relay and mempool settings?",
     "status": "same",
     "reference": "",
     "candidate": "",
     "plain": "Both nodes report the same relay and mempool settings."
    },
    {
     "id": "network",
     "title": "Connected directly, do they agree on one chain?",
     "status": "differs",
     "reference": "block 110",
     "candidate": "block 2",
     "plain": "After the direct-connection attempt, the nodes remained apart: the unmodified node is at block 110 and yours is at block 2, on different chains. Your node refuses the unmodified chain. The unmodified node sees your chain as valid but shorter, so it does not follow it."
    }
   ],
   "ref_rejects": null,
   "cand_rejects": {
    "height": 1,
    "hash": "1c37f7b5ba6c5096",
    "reason": "bad-cb-amount",
    "plain": "the block pays its miner more than the rules allow (bad-cb-amount)"
   },
   "policy": [],
   "network": {
    "connected": true,
    "still_connected": true,
    "converged": false,
    "reference_tip": {
     "height": 110,
     "hash": "26bc384bbaf3c7bf802dbaeeb557b7efc3218be6d5ad1d15d2980782b760f826"
    },
    "candidate_tip": {
     "height": 2,
     "hash": "27f8a809bdef3bf03f037e1e1632a8cf5f59221698a3d6b90fa6bddf923d8f5d"
    },
    "reference_chains": [
     {
      "height": 110,
      "hash": "26bc384bbaf3c7bf",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 2,
      "hash": "27f8a809bdef3bf0",
      "status": "valid-fork",
      "branchlen": 2
     }
    ],
    "candidate_chains": [
     {
      "height": 2,
      "hash": "27f8a809bdef3bf0",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 1,
      "hash": "1c37f7b5ba6c5096",
      "status": "invalid",
      "branchlen": 1
     }
    ]
   },
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "0 shared blocks, then 110 of its own (10 drawn)"
     },
     {
      "label": "Chain your node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "refused"
       }
      ],
      "note": "0 shared blocks, then 2 of its own; it refused the other side's next block"
     }
    ]
   },
   "verdict": "tightened",
   "headline": "Your node rejects blocks the unmodified node accepts"
  },
  "patch": "diff --git a/src/validation.cpp b/src/validation.cpp\nindex 924b7f60f3..b4c2488ee5 100644\n--- a/src/validation.cpp\n+++ b/src/validation.cpp\n@@ -1850,7 +1850,7 @@ CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)\n     if (halvings >= 64)\n         return 0;\n \n-    CAmount nSubsidy = 50 * COIN;\n+    CAmount nSubsidy = 25 * COIN;\n     // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.\n     nSubsidy >>= halvings;\n     return nSubsidy;\n",
  "files": [
   {
    "path": "src/validation.cpp",
    "added": 1,
    "removed": 1
   }
  ],
  "unit_failures": null,
  "ready_made": true,
  "build_status": "not run",
  "test_status": "not run",
  "risk": [
   "the block subsidy"
  ],
  "sensitive": [
   "src/validation.cpp"
  ]
 },
 "faster-halving": {
  "compare": {
   "rows": [
    {
     "id": "genesis",
     "title": "Do both nodes start from the same first block?",
     "status": "same",
     "reference": "0f9188f13cb7b2c7",
     "candidate": "0f9188f13cb7b2c7",
     "plain": "Yes. Everything below happens on one shared private chain."
    },
    {
     "id": "follow",
     "title": "Does your node accept the blocks an unmodified node produces?",
     "status": "differs",
     "reference": "produced 110 valid blocks",
     "candidate": "refused block 75",
     "plain": "Your node accepted 74 blocks, then refused block 75: the block pays its miner more than the rules allow (bad-cb-amount). It will not build on this rejected block. The two nodes could still agree on a different history that both consider valid."
    },
    {
     "id": "produce",
     "title": "Does an unmodified node accept the blocks your node produces?",
     "status": "same",
     "reference": "judged both blocks valid, and ignored them",
     "candidate": "produced blocks paying their miner 25 BTC",
     "plain": "The unmodified node considers your node's blocks valid, because a stricter rule permits these particular blocks under both rule sets. Its active chain contains more proof of work. It would switch to a stricter chain if that chain became its most-work valid chain; it would still not enforce the new rule itself."
    },
    {
     "id": "settings",
     "title": "Do the nodes report the same relay and mempool settings?",
     "status": "same",
     "reference": "",
     "candidate": "",
     "plain": "Both nodes report the same relay and mempool settings."
    },
    {
     "id": "network",
     "title": "Connected directly, do they agree on one chain?",
     "status": "differs",
     "reference": "block 110",
     "candidate": "block 76",
     "plain": "After the direct-connection attempt, the nodes remained apart: the unmodified node is at block 110 and yours is at block 76, on different chains. Your node refuses the unmodified chain. The unmodified node sees your chain as valid but shorter, so it does not follow it."
    }
   ],
   "ref_rejects": null,
   "cand_rejects": {
    "height": 75,
    "hash": "169eb5a0ce341be0",
    "reason": "bad-cb-amount",
    "plain": "the block pays its miner more than the rules allow (bad-cb-amount)"
   },
   "policy": [],
   "network": {
    "connected": true,
    "still_connected": true,
    "converged": false,
    "reference_tip": {
     "height": 110,
     "hash": "351f36d0bcad9208d26459a47bd5b98a075bedc3cc38ada1f3edf59931da715a"
    },
    "candidate_tip": {
     "height": 76,
     "hash": "1ee7ad3b154c683bf4c7116146146c5c846e6420cc7f8fbe9a887080cb5faaec"
    },
    "reference_chains": [
     {
      "height": 110,
      "hash": "351f36d0bcad9208",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 76,
      "hash": "1ee7ad3b154c683b",
      "status": "valid-fork",
      "branchlen": 2
     }
    ],
    "candidate_chains": [
     {
      "height": 76,
      "hash": "1ee7ad3b154c683b",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 75,
      "hash": "169eb5a0ce341be0",
      "status": "invalid",
      "branchlen": 1
     }
    ]
   },
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "74 shared blocks, then 36 of its own (10 drawn)"
     },
     {
      "label": "Chain your node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "refused"
       }
      ],
      "note": "74 shared blocks, then 2 of its own; it refused the other side's next block"
     }
    ]
   },
   "verdict": "tightened",
   "headline": "Your node rejects blocks the unmodified node accepts"
  },
  "patch": "diff --git a/src/kernel/chainparams.cpp b/src/kernel/chainparams.cpp\nindex 9764ba95c8..e3e266aef7 100644\n--- a/src/kernel/chainparams.cpp\n+++ b/src/kernel/chainparams.cpp\n@@ -568,7 +568,7 @@ public:\n         m_chain_type = ChainType::REGTEST;\n         consensus.signet_blocks = false;\n         consensus.signet_challenge.clear();\n-        consensus.nSubsidyHalvingInterval = 150;\n+        consensus.nSubsidyHalvingInterval = 75;\n         consensus.BIP34Height = 1; // Always active unless overridden\n         consensus.BIP34Hash = uint256();\n         consensus.BIP65Height = 1;  // Always active unless overridden\n",
  "files": [
   {
    "path": "src/kernel/chainparams.cpp",
    "added": 1,
    "removed": 1
   }
  ],
  "unit_failures": null,
  "ready_made": true,
  "build_status": "not run",
  "test_status": "not run",
  "risk": [
   "the block subsidy"
  ],
  "sensitive": [
   "src/kernel/chainparams.cpp"
  ]
 },
 "keys": {
  "compare": {
   "rows": [
    {
     "id": "where",
     "title": "Node A's wallet shows a balance. Where are those coins recorded?",
     "status": "info",
     "reference": "wallet on node A: 50.0 BTC",
     "candidate": "node B, which has no wallet at all, finds 50.0 BTC at that address",
     "plain": "Node B has never had this wallet, and it can still see the coins, because they are an entry on the chain that every node keeps. The wallet shows a balance by reading the same record."
    },
    {
     "id": "deleted",
     "title": "The wallet is deleted from node A. Are the coins gone?",
     "status": "info",
     "reference": "wallet deleted",
     "candidate": "the chain still records 50.0 BTC at that address",
     "plain": "Nothing on the chain changed. The coins were never inside the wallet. The wallet file was deleted; the backup made earlier still holds its keys."
    },
    {
     "id": "stranger",
     "title": "Can a new wallet, without the key, spend them?",
     "status": "info",
     "reference": "the coins are still on the chain",
     "candidate": "a new wallet without the key: 0.0 BTC",
     "plain": "A wallet is a set of keys. Without the right key the coins are visible to everyone and movable by no one. If the deleted wallet had no backup, they would now stay where they are for good."
    },
    {
     "id": "restored",
     "title": "The backup of the keys is restored on a different node. And now?",
     "status": "differs",
     "reference": "wallet file gone from node A",
     "candidate": "restored on node B: 50.0 BTC, and it can spend",
     "plain": "The same coins are spendable again, from a different machine, because the keys came back. This scene uses a single-key wallet with a private descriptor backup. Other wallets may also need a passphrase, multiple signers or recovery information. A displayed balance alone does not establish who can spend it."
    }
   ],
   "verdict": "none",
   "observed_answer": "chain",
   "headline": "The coins were on the chain all along; the wallet held the keys"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "fees": {
  "compare": {
   "rows": [
    {
     "id": "waiting",
     "title": "Two payments are waiting to be confirmed",
     "status": "info",
     "reference": "10 BTC, paying a fee of 282 satoshis (2 sat/vB)",
     "candidate": "0.1 BTC, paying a fee of 7050 satoshis (50 sat/vB)",
     "plain": "Both transactions take up almost exactly the same space in a block, although one moves a hundred times as much as the other."
    },
    {
     "id": "first",
     "title": "The next block has room for one. Which got in?",
     "status": "differs",
     "reference": "10 BTC payment: still waiting",
     "candidate": "0.1 BTC payment: in the block",
     "plain": "The miner included the 0.1 BTC payment. This node's block assembler prefers the higher fee per virtual byte (sat/vB) for these independent transactions. Miners can choose a different policy, and transaction dependencies can also matter. The amount being sent does not set the fee rate."
    },
    {
     "id": "second",
     "title": "What happened to the other payment?",
     "status": "info",
     "reference": "confirmed one block later",
     "candidate": "",
     "plain": "In this run the lower-fee payment waited for the next block. On a real network it may wait longer, be evicted from mempools or fail relay policy. A low fee provides no guarantee of eventual confirmation."
    },
    {
     "id": "mempool",
     "title": "Did node B ever see either payment waiting?",
     "status": "info",
     "reference": "node A held both in its waiting area",
     "candidate": "node B's waiting area held 0 transactions",
     "plain": "The two nodes were not connected, so node B never heard of either payment until it arrived in a block. There is no single waiting area: each node keeps its own, and they differ."
    }
   ],
   "verdict": "none",
   "observed_answer": "small",
   "headline": "The smaller payment went first, because it paid more per virtual byte"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "reorg": {
  "compare": {
   "rows": [
    {
     "id": "confirmed",
     "title": "Node A: is the payment confirmed?",
     "status": "info",
     "reference": "1 confirmation",
     "candidate": "has not seen it",
     "plain": "Node A's wallet shows the payment with one confirmation: one block has been built that includes it."
    },
    {
     "id": "reorganised",
     "title": "Node A: which chain does it follow now?",
     "status": "differs",
     "reference": "was at block 102 (6384f8ed6564)",
     "candidate": "now at block 103 (408be3311c42)",
     "plain": "Node A switched to node B's chain because it contains more proof of work. The block that confirmed the payment is no longer part of the chain node A follows. This is called a reorganisation."
    },
    {
     "id": "unconfirmed",
     "title": "Node A: is the payment still confirmed?",
     "status": "differs",
     "reference": "1 confirmation before",
     "candidate": "0 confirmations after",
     "plain": "The payment is back to zero confirmations and is waiting in node A's mempool again. One confirmation counts the block containing the payment; each additional block adds one. A confirmation is not an approval by anyone. Each further block makes reversal more expensive, which is why people wait for several, but no number of confirmations is a formal guarantee."
    }
   ],
   "verdict": "none",
   "observed_answer": "zero",
   "headline": "A confirmation was reversed by a chain with more proof of work"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "relay-filter": {
  "compare": {
   "rows": [
    {
     "id": "relay",
     "title": "Would each node relay the data-carrying transaction?",
     "status": "differs",
     "reference": "would relay it",
     "candidate": "refuses to relay it: the transaction carries more data than this node will relay (datacarrier)",
     "plain": "The mempool-admission probe shows whether each node would accept this transaction into its waiting area. It does not measure propagation through a live network."
    },
    {
     "id": "block",
     "title": "Does the filtering node accept the block that contains it?",
     "status": "same",
     "reference": "produced the block",
     "candidate": "accepted the block",
     "plain": "The filtering node accepted the block, and the transaction it refused to relay is now part of its own copy of the chain. A relay filter decides what a node passes along. It cannot guarantee that miners exclude a transaction that can reach them by another route."
    },
    {
     "id": "chain",
     "title": "Are the two nodes still on the same chain?",
     "status": "same",
     "reference": "block 102",
     "candidate": "block 102",
     "plain": "Yes. Nodes with different relay policy stay on one chain, because policy never applies to transactions that are already in a block."
    }
   ],
   "verdict": "policy",
   "observed_answer": "accept",
   "headline": "The filtering node accepted the block containing the transaction"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "miners": {
  "compare": {
   "rows": [
    {
     "id": "power",
     "title": "Who has more mining power?",
     "status": "info",
     "reference": "honest miner: 2 blocks",
     "candidate": "rule-breaking miner: 30 blocks, each paying itself 100 BTC",
     "plain": "Including the shared 3-block beginning, the rule-breaking chain holds 5.7 times the proof of work of the honest chain. The separate branches contain 30 and 2 equally difficult blocks. These blocks were produced on demand; this is a controlled demonstration of chain selection, not a measurement of real hash rate."
    },
    {
     "id": "switch",
     "title": "Does the unmodified node switch to the chain with more work?",
     "status": "differs",
     "reference": "stays on the honest chain, now at block 5",
     "candidate": "offered 30 blocks; 30 refused",
     "plain": "It refused every one. The first because the block pays its miner more than the rules allow (bad-cb-amount), and the rest because they build on a block it had already refused. A node follows the chain with the most work among the chains it considers valid. Work is never weighed for a block that breaks the rules."
    },
    {
     "id": "earned",
     "title": "What did all that mining power buy?",
     "status": "info",
     "reference": "",
     "candidate": "30 blocks that only the rule-breaking miner accepts",
     "plain": "Coins that exist on one machine. With most of the mining power a miner can do real damage inside the rules: leave transactions out, or replace recent blocks to take back its own payments. It cannot create coins, spend someone else's, or change a rule for any node that checks."
    }
   ],
   "verdict": "loosened",
   "observed_answer": "valid",
   "headline": "Thirty rule-breaking blocks were refused by the unmodified node",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "refused"
       }
      ],
      "note": "3 shared blocks, then 2 of its own; it refused the other side's next block"
     },
     {
      "label": "Chain the rule-breaking miner built",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "3 shared blocks, then 30 of its own (10 drawn)"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@10": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 36 blocks",
     "candidate": "miners enforcing the stricter rule: 4 blocks",
     "plain": "The schedule assigns 10% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 36",
     "candidate": "a separate stricter chain, at block 4",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 10,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 10% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "36 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "4 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@15": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 34 blocks",
     "candidate": "miners enforcing the stricter rule: 6 blocks",
     "plain": "The schedule assigns 15% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 34",
     "candidate": "a separate stricter chain, at block 6",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 15,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 15% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "34 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "6 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@20": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 32 blocks",
     "candidate": "miners enforcing the stricter rule: 8 blocks",
     "plain": "The schedule assigns 20% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 32",
     "candidate": "a separate stricter chain, at block 8",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 20,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 20% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "32 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "8 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@25": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 30 blocks",
     "candidate": "miners enforcing the stricter rule: 10 blocks",
     "plain": "The schedule assigns 25% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 30",
     "candidate": "a separate stricter chain, at block 10",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 25,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 25% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "30 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "10 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@30": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 28 blocks",
     "candidate": "miners enforcing the stricter rule: 12 blocks",
     "plain": "The schedule assigns 30% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 28",
     "candidate": "a separate stricter chain, at block 12",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 30,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 30% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "28 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "12 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@35": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 26 blocks",
     "candidate": "miners enforcing the stricter rule: 14 blocks",
     "plain": "The schedule assigns 35% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 26",
     "candidate": "a separate stricter chain, at block 14",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 35,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 35% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "26 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "14 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@40": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 24 blocks",
     "candidate": "miners enforcing the stricter rule: 16 blocks",
     "plain": "The schedule assigns 40% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 24",
     "candidate": "a separate stricter chain, at block 16",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 40,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 40% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "24 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "16 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@45": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 22 blocks",
     "candidate": "miners enforcing the stricter rule: 18 blocks",
     "plain": "The schedule assigns 45% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 22",
     "candidate": "a separate stricter chain, at block 18",
     "plain": "At the end of this schedule, the unmodified node's chain had more accumulated work than the separate stricter chain. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 45,
   "observed_answer": "own",
   "equal_work": false,
   "headline": "With 45% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "22 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "18 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@50": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 20 blocks",
     "candidate": "miners enforcing the stricter rule: 20 blocks",
     "plain": "The schedule assigns 50% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "its own chain, at block 20",
     "candidate": "a separate stricter chain, at block 20",
     "plain": "The branches ended with equal accumulated work. The unmodified node kept its existing chain; equal-work ties do not force a switch. This is the observed outcome of this run, not a prediction that every real network with this hash-rate share must end the same way."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 50,
   "observed_answer": "own",
   "equal_work": true,
   "headline": "With 50% of scheduled blocks, the nodes followed separate chains",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       },
       {
        "kind": "stock",
        "state": "kept"
       }
      ],
      "note": "20 blocks; 0 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "20 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@55": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 18 blocks",
     "candidate": "miners enforcing the stricter rule: 22 blocks",
     "plain": "The schedule assigns 55% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 22)",
     "candidate": "the stricter chain (block 22)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (4 reorganisations). 18 of the 18 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 55,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 55% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "22 blocks; 18 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "22 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@60": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 16 blocks",
     "candidate": "miners enforcing the stricter rule: 24 blocks",
     "plain": "The schedule assigns 60% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 24)",
     "candidate": "the stricter chain (block 24)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (8 reorganisations). 16 of the 16 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 60,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 60% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "24 blocks; 16 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "24 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@65": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 14 blocks",
     "candidate": "miners enforcing the stricter rule: 26 blocks",
     "plain": "The schedule assigns 65% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 26)",
     "candidate": "the stricter chain (block 26)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (12 reorganisations). 14 of the 14 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 65,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 65% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "26 blocks; 14 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "26 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@70": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 12 blocks",
     "candidate": "miners enforcing the stricter rule: 28 blocks",
     "plain": "The schedule assigns 70% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 28)",
     "candidate": "the stricter chain (block 28)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (12 reorganisations). 12 of the 12 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 70,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 70% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "28 blocks; 12 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "28 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@75": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 10 blocks",
     "candidate": "miners enforcing the stricter rule: 30 blocks",
     "plain": "The schedule assigns 75% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 30)",
     "candidate": "the stricter chain (block 30)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (10 reorganisations). 10 of the 10 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 75,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 75% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "30 blocks; 10 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "30 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@80": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 8 blocks",
     "candidate": "miners enforcing the stricter rule: 32 blocks",
     "plain": "The schedule assigns 80% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 32)",
     "candidate": "the stricter chain (block 32)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (8 reorganisations). 8 of the 8 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 80,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 80% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "32 blocks; 8 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "32 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@85": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 6 blocks",
     "candidate": "miners enforcing the stricter rule: 34 blocks",
     "plain": "The schedule assigns 85% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 34)",
     "candidate": "the stricter chain (block 34)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (6 reorganisations). 6 of the 6 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 85,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 85% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "34 blocks; 6 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "34 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "power@90": {
  "compare": {
   "rows": [
    {
     "id": "mined",
     "title": "40 blocks were produced",
     "status": "info",
     "reference": "miners on the unmodified rules: 4 blocks",
     "candidate": "miners enforcing the stricter rule: 36 blocks",
     "plain": "The schedule assigns 90% of block opportunities to the stricter miners. The stricter node refuses the higher subsidy claimed by the other miners. Block difficulty is constant here and the order is deterministic. Real block discovery is random, so a finite run cannot establish a universal threshold."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified node end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 36)",
     "candidate": "the stricter chain (block 36)",
     "plain": "In this schedule the unmodified node switched to the stricter chain (4 reorganisations). 4 of the 4 blocks from the other miners were removed from its active chain. It follows that compatible history but still does not check the stricter subsidy rule itself; a later rule-breaking chain with more work could be accepted by the unmodified node."
    },
    {
     "id": "threshold",
     "title": "Following a chain is different from enforcing its rules",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Sustained majority hash rate can make a compatible stricter chain outgrow a competing chain under fixed assumptions. Actual outcomes also depend on block discovery, miner behavior and which rules users enforce. Activation signalling thresholds are coordination mechanisms, not a rule that changes every node's software or makes old nodes validate a new condition."
    }
   ],
   "verdict": "tightened",
   "share": 90,
   "observed_answer": "strict",
   "equal_work": false,
   "headline": "With 90% of scheduled blocks, the unmodified node followed the stricter chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "36 blocks; 4 blocks from unmodified miners were discarded"
     },
     {
      "label": "Chain the stricter node follows",
      "blocks": [
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "36 blocks, all from miners enforcing the stricter rule"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "softfork": {
  "compare": {
   "rows": [
    {
     "id": "locked",
     "title": "A coin is locked until block 500",
     "status": "info",
     "reference": "both nodes are at block 102",
     "candidate": "the lock uses a rule added to Bitcoin in 2015 (BIP 65)",
     "plain": "BIP 65 gave OP_NOP2 the CHECKLOCKTIMEVERIFY meaning. This demonstration uses two modern nodes, with only that rule disabled on the second. It does not run historical 2015 software. The spend used here requires a transaction locktime of at least 500, so it can first confirm in block 501."
    },
    {
     "id": "early",
     "title": "The coin is spent at block 103, in a block mined under the old rules",
     "status": "differs",
     "reference": "refused the block: a signature or script in the block fails the rules (block-script-verify-flag-failed (Locktime requirement not satisfied))",
     "candidate": "accepted the block: with CLTV disabled, that instruction is a no-op",
     "plain": "The same block is accepted with CLTV disabled and refused with it enabled. This illustrates a soft fork: the new rule forbids some spends the older rule allowed. All the other modern rules remain enabled in this scene."
    },
    {
     "id": "apart",
     "title": "Are the two nodes still on the same chain?",
     "status": "differs",
     "reference": "upgraded node: block 102",
     "candidate": "node on the old rules: block 103",
     "plain": "They have parted. The node with CLTV disabled follows a block the CLTV-enforcing node refuses. During the BIP 65 deployment, block-version signalling coordinated enforcement. Signalling itself is not validation: a node needs the new rule implemented and active to check it independently."
    }
   ],
   "verdict": "loosened",
   "observed_answer": "accept",
   "headline": "The node with CLTV disabled accepted a block the enforcing node refused",
   "picture": {
    "lanes": [
     {
      "label": "Chain the CLTV-enforcing node follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "refused"
       }
      ],
      "note": "102 shared blocks, then 0 of its own; it refused the other side's next block"
     },
     {
      "label": "Chain the node with CLTV disabled follows",
      "blocks": [
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "shared",
        "state": "kept"
       },
       {
        "kind": "changed",
        "state": "kept"
       }
      ],
      "note": "102 shared blocks, then 1 of its own"
     }
    ]
   }
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "utxos": {
  "compare": {
   "rows": [
    {
     "id": "inputs",
     "status": "info",
     "title": "Select two whole outputs",
     "reference": "2 inputs: 100 BTC",
     "candidate": "Send 60 BTC",
     "plain": "An input spends a previous output in full. The payment does not shave 60 BTC off a balance field."
    },
    {
     "id": "outputs",
     "status": "info",
     "title": "Create the recipient and change outputs",
     "reference": "Recipient: 60 BTC",
     "candidate": "Change: 39.99999584 BTC",
     "plain": "The wallet constructed both outputs before broadcasting. The 416 satoshi difference is the transaction fee, not a separate payment output."
    },
    {
     "id": "confirmed",
     "status": "same",
     "title": "The second node checks the payment in a block",
     "reference": "Original outputs spent",
     "candidate": "Inputs = recipient + change + 416 satoshis fee",
     "plain": "Both nodes checked the same transaction. Change is a new output controlled by the sender; it is not a refund sent later by a miner."
    }
   ],
   "verdict": "none",
   "observed_answer": "change",
   "headline": "Two outputs became a payment, change and a fee"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "fee-size": {
  "compare": {
   "rows": [
    {
     "id": "one",
     "status": "info",
     "title": "One input pays 1 BTC",
     "reference": "141 virtual bytes",
     "candidate": "282 satoshis fee",
     "plain": "The wallet was asked to use one input and a fee rate of 2 satoshis per virtual byte."
    },
    {
     "id": "two",
     "status": "differs",
     "title": "Two inputs also pay 1 BTC",
     "reference": "208 virtual bytes",
     "candidate": "416 satoshis fee",
     "plain": "This payment uses the same output types and requested fee rate, but another input needs more transaction data."
    },
    {
     "id": "checked",
     "status": "same",
     "title": "Both payments reach the other node in a block",
     "reference": "Both send 1 BTC",
     "candidate": "The two-input payment costs more",
     "plain": "In this controlled comparison, input count changed virtual size and the total fee. Input and output types, witness data and wallet estimation also affect size; input count alone is not a universal price list."
    }
   ],
   "verdict": "none",
   "observed_answer": "two",
   "headline": "The same amount cost more when the transaction used more space"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 },
 "watch-only": {
  "compare": {
   "rows": [
    {
     "id": "watch",
     "status": "info",
     "title": "Copy public wallet information to node B",
     "reference": "Node A has the private keys",
     "candidate": "Node B recognizes 1 unspent output(s)",
     "plain": "A public descriptor tells the second wallet what to watch. It does not include the private key needed by these single-signature outputs."
    },
    {
     "id": "sign",
     "status": "differs",
     "title": "Ask both wallets to sign the same payment",
     "reference": "Node A completed the signatures",
     "candidate": "Node B could not complete them",
     "plain": "A displayed balance is not spending authority. In this scene the signer supplied the missing signatures, and the other node validated the signed payment."
    }
   ],
   "verdict": "none",
   "observed_answer": "signer",
   "headline": "The watching wallet could see the coins but could not sign"
  },
  "patch": "",
  "files": [],
  "unit_failures": null,
  "ready_made": false,
  "build_status": "not run",
  "test_status": "passed",
  "risk": [],
  "sensitive": []
 }
};
