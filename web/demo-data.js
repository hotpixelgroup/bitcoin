'use strict';
// Results recorded from real runs of the lab on 12 October 2026: two real
// nodes on a throwaway regtest chain. The unit test findings for the three
// source changes come from compiling each one through the console.
// Regenerate with contrib/vibes/record_demo.py.
// Block hashes differ on every run; outcomes and reasons do not.
window.VibesDemoData = {
 "relay-filter": {
  "compare": {
   "rows": [
    {
     "id": "relay",
     "title": "Would each node relay the data-carrying transaction?",
     "status": "differs",
     "reference": "would relay it",
     "candidate": "refuses to relay it: the transaction carries more data than this node will relay (datacarrier)",
     "plain": "The filtering node keeps the transaction out of its own waiting area and does not pass it on. The default node relays it."
    },
    {
     "id": "block",
     "title": "Does the filtering node accept the block that contains it?",
     "status": "same",
     "reference": "produced the block",
     "candidate": "accepted the block",
     "plain": "The filtering node accepted the block, and the transaction it refused to relay is now part of its own copy of the chain. A relay filter decides what a node passes along. It cannot decide what miners include."
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
   "headline": "Local policy only"
  },
  "patch": "",
  "files": [],
  "unit_failures": [],
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
     "reference": "was at block 102 (0ed3182eb910)",
     "candidate": "now at block 103 (022e822bbe49)",
     "plain": "Node A switched to node B's chain because it contains more proof of work. The block that confirmed the payment is no longer part of the chain node A follows. This is called a reorganisation."
    },
    {
     "id": "unconfirmed",
     "title": "Node A: is the payment still confirmed?",
     "status": "differs",
     "reference": "1 confirmation before",
     "candidate": "0 confirmations after",
     "plain": "The payment is back to zero confirmations and is waiting in node A's mempool again. A confirmation is a block built on top of a payment, not an approval by anyone. Each further block makes reversal more expensive, which is why people wait for several, but no number of confirmations is a formal guarantee."
    }
   ],
   "verdict": "none",
   "headline": "A confirmation was reversed by a longer chain"
  },
  "patch": "",
  "files": [],
  "unit_failures": [],
  "risk": [],
  "sensitive": []
 },
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
     "plain": "The unmodified node refused your node's block: the block pays its miner more than the rules allow (bad-cb-amount). Every node running the unmodified rules would do the same, so coins created this way exist only on your own node."
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
     "plain": "Connected directly, the nodes stayed apart: the unmodified node is at block 152 and yours is at block 154, on different chains. The unmodified node will never accept your node's chain, however long it grows. Your node still considers the unmodified chain valid."
    }
   ],
   "ref_rejects": {
    "height": 153,
    "hash": "5e8f6275f742f24a",
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
     "hash": "4f6600084034dfbbd21ad578e72c20ca3c49c3534e77b325c5fccada16144635"
    },
    "candidate_tip": {
     "height": 154,
     "hash": "429bf15578e48dfa68c848f9572db61c7ce1dc7ca7d1324316d899489af6b044"
    },
    "reference_chains": [
     {
      "height": 153,
      "hash": "5e8f6275f742f24a",
      "status": "invalid",
      "branchlen": 1
     },
     {
      "height": 152,
      "hash": "4f6600084034dfbb",
      "status": "active",
      "branchlen": 0
     }
    ],
    "candidate_chains": [
     {
      "height": 154,
      "hash": "429bf15578e48dfa",
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
  "unit_failures": [
   "argsman_tests (did not finish within 30 seconds)",
   "baseindex_tests/baseindex_no_commit_ahead_of_flush",
   "blockchain_tests (did not finish within 30 seconds)",
   "blockfilter_index_tests (did not finish within 30 seconds)",
   "blockmanager_tests (did not finish within 30 seconds)",
   "chainstate_write_tests/write_during_multiblock_activation",
   "coinstatsindex_tests/coinstatsindex_initial_sync",
   "coinstatsindex_tests/coinstatsindex_unclean_shutdown",
   "disconnected_transactions/disconnectpool_memory_limits",
   "interfaces_tests (did not finish within 30 seconds)",
   "miner_tests/CreateNewBlock_validity",
   "miniminer_tests (did not finish within 30 seconds)",
   "rbf_tests (did not finish within 30 seconds)",
   "spend_tests/SubtractFee",
   "spend_tests/wallet_duplicated_preset_inputs_test",
   "txdownload_tests/handle_missing_inputs",
   "txdownload_tests/tx_rejection_types",
   "txindex_tests/txindex_initial_sync",
   "txospenderindex_tests/txospenderindex_initial_sync",
   "txpackage_tests (did not finish within 30 seconds)",
   "txvalidation_tests (did not finish within 30 seconds)",
   "txvalidationcache_tests/checkinputs_test",
   "txvalidationcache_tests/tx_mempool_block_doublespend",
   "validation_chainstate_tests/chainstate_update_tip",
   "validation_chainstate_tests/connect_tip_does_not_cache_inputs_on_failed_connect",
   "validation_chainstatemanager_tests (did not finish within 30 seconds)",
   "validation_tests/block_subsidy_test",
   "validation_tests/subsidy_limit_test",
   "wallet_tests (did not finish within 30 seconds)"
  ],
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
     "plain": "Your node accepted 0 blocks, then refused block 1: the block pays its miner more than the rules allow (bad-cb-amount). From that block on it would stop following any network that still runs the unmodified rules."
    },
    {
     "id": "produce",
     "title": "Does an unmodified node accept the blocks your node produces?",
     "status": "same",
     "reference": "judged both blocks valid, and ignored them",
     "candidate": "produced blocks paying their miner 25 BTC",
     "plain": "The unmodified node considers your node's blocks valid, because a stricter rule never produces anything the looser rule forbids. It still ignores them: its own chain contains more proof of work. Other nodes would follow your stricter chain only if most mining power enforced your rule."
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
     "plain": "Connected directly, the nodes stayed apart: the unmodified node is at block 110 and yours is at block 2, on different chains. Your node refuses the unmodified chain. The unmodified node sees your chain as valid but shorter, so it does not follow it."
    }
   ],
   "ref_rejects": null,
   "cand_rejects": {
    "height": 1,
    "hash": "5794a892c2cfacde",
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
     "hash": "069b8719e3a04c1eb377f9259a1fc98f4ab9e1f8ef1ec2b38ce8b74397e46522"
    },
    "candidate_tip": {
     "height": 2,
     "hash": "304a7debbb2cdee31f86e2ec8003edf5b003a69405700c4b4f161bf25a04a7c3"
    },
    "reference_chains": [
     {
      "height": 110,
      "hash": "069b8719e3a04c1e",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 2,
      "hash": "304a7debbb2cdee3",
      "status": "valid-fork",
      "branchlen": 2
     }
    ],
    "candidate_chains": [
     {
      "height": 2,
      "hash": "304a7debbb2cdee3",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 1,
      "hash": "5794a892c2cfacde",
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
  "unit_failures": [
   "argsman_tests (did not finish within 30 seconds)",
   "baseindex_tests/baseindex_no_commit_ahead_of_flush",
   "blockchain_tests (did not finish within 30 seconds)",
   "blockfilter_index_tests (did not finish within 30 seconds)",
   "blockmanager_tests (did not finish within 30 seconds)",
   "chainstate_write_tests/write_during_multiblock_activation",
   "coinstatsindex_tests/coinstatsindex_initial_sync",
   "coinstatsindex_tests/coinstatsindex_unclean_shutdown",
   "disconnected_transactions/disconnectpool_memory_limits",
   "interfaces_tests (did not finish within 30 seconds)",
   "miner_tests/CreateNewBlock_validity",
   "miniminer_tests (did not finish within 30 seconds)",
   "rbf_tests (did not finish within 30 seconds)",
   "spend_tests/SubtractFee",
   "spend_tests/wallet_duplicated_preset_inputs_test",
   "txdownload_tests/handle_missing_inputs",
   "txdownload_tests/tx_rejection_types",
   "txindex_tests/txindex_initial_sync",
   "txospenderindex_tests/txospenderindex_initial_sync",
   "txpackage_tests (did not finish within 30 seconds)",
   "txvalidation_tests (did not finish within 30 seconds)",
   "txvalidationcache_tests/checkinputs_test",
   "txvalidationcache_tests/tx_mempool_block_doublespend",
   "validation_chainstate_tests/chainstate_update_tip",
   "validation_chainstate_tests/connect_tip_does_not_cache_inputs_on_failed_connect",
   "validation_chainstatemanager_tests (did not finish within 30 seconds)",
   "validation_tests/block_subsidy_test",
   "validation_tests/subsidy_limit_test",
   "wallet_tests (did not finish within 30 seconds)"
  ],
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
     "plain": "Your node accepted 74 blocks, then refused block 75: the block pays its miner more than the rules allow (bad-cb-amount). From that block on it would stop following any network that still runs the unmodified rules."
    },
    {
     "id": "produce",
     "title": "Does an unmodified node accept the blocks your node produces?",
     "status": "same",
     "reference": "judged both blocks valid, and ignored them",
     "candidate": "produced blocks paying their miner 25 BTC",
     "plain": "The unmodified node considers your node's blocks valid, because a stricter rule never produces anything the looser rule forbids. It still ignores them: its own chain contains more proof of work. Other nodes would follow your stricter chain only if most mining power enforced your rule."
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
     "plain": "Connected directly, the nodes stayed apart: the unmodified node is at block 110 and yours is at block 76, on different chains. Your node refuses the unmodified chain. The unmodified node sees your chain as valid but shorter, so it does not follow it."
    }
   ],
   "ref_rejects": null,
   "cand_rejects": {
    "height": 75,
    "hash": "3a528a200e037cea",
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
     "hash": "41efc266cb6710465048f9c1e215e21ee88b6243cc3ce03f3dbb4194f226b8af"
    },
    "candidate_tip": {
     "height": 76,
     "hash": "27268868183990bef72bbfabf0e3620e038863d7656735f62264e19fa0e5d824"
    },
    "reference_chains": [
     {
      "height": 110,
      "hash": "41efc266cb671046",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 76,
      "hash": "27268868183990be",
      "status": "valid-fork",
      "branchlen": 2
     }
    ],
    "candidate_chains": [
     {
      "height": 76,
      "hash": "27268868183990be",
      "status": "active",
      "branchlen": 0
     },
     {
      "height": 75,
      "hash": "3a528a200e037cea",
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
  "unit_failures": [
   "argsman_tests (did not finish within 30 seconds)",
   "baseindex_tests/baseindex_no_commit_ahead_of_flush",
   "blockchain_tests (did not finish within 30 seconds)",
   "blockfilter_index_tests (did not finish within 30 seconds)",
   "blockmanager_tests (did not finish within 30 seconds)",
   "chainstate_write_tests/write_during_multiblock_activation",
   "coinstatsindex_tests/coinstatsindex_initial_sync",
   "coinstatsindex_tests/coinstatsindex_unclean_shutdown",
   "disconnected_transactions/disconnectpool_memory_limits",
   "interfaces_tests (did not finish within 30 seconds)",
   "miniminer_tests (did not finish within 30 seconds)",
   "rbf_tests (did not finish within 30 seconds)",
   "spend_tests/SubtractFee",
   "spend_tests/wallet_duplicated_preset_inputs_test",
   "txdownload_tests/handle_missing_inputs",
   "txdownload_tests/tx_rejection_types",
   "txindex_tests/txindex_initial_sync",
   "txospenderindex_tests/txospenderindex_initial_sync",
   "txpackage_tests (did not finish within 30 seconds)",
   "txvalidation_tests (did not finish within 30 seconds)",
   "txvalidationcache_tests/checkinputs_test",
   "txvalidationcache_tests/tx_mempool_block_doublespend",
   "validation_chainstate_tests/chainstate_update_tip",
   "validation_chainstate_tests/connect_tip_does_not_cache_inputs_on_failed_connect",
   "validation_chainstatemanager_tests (did not finish within 30 seconds)",
   "wallet_tests (did not finish within 30 seconds)"
  ],
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
     "plain": "Nothing on the chain changed. The coins were never inside the wallet. What was deleted is the only copy of the key that can move them."
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
     "plain": "The same coins are spendable again, from a different machine, because the keys came back. A backup of a wallet is a backup of its keys (usually written as a list of words). Anyone who holds that backup holds the coins; anyone who shows you a balance without giving you the keys holds them for you."
    }
   ],
   "verdict": "none",
   "headline": "The coins were on the chain all along; the wallet held the keys"
  },
  "patch": "",
  "files": [],
  "unit_failures": [],
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
     "reference": "10 BTC, paying a fee of 282 satoshis (2 per byte)",
     "candidate": "0.1 BTC, paying a fee of 7050 satoshis (50 per byte)",
     "plain": "Both transactions take up almost exactly the same space in a block, although one moves a hundred times as much as the other."
    },
    {
     "id": "first",
     "title": "The next block has room for one. Which got in?",
     "status": "differs",
     "reference": "10 BTC payment: still waiting",
     "candidate": "0.1 BTC payment: in the block",
     "plain": "The miner included the 0.1 BTC payment. A miner fills a block with whatever pays most per byte of space, because space is what is scarce. The amount being sent does not enter into it, and nobody set either fee but the sender."
    },
    {
     "id": "second",
     "title": "What happened to the other payment?",
     "status": "info",
     "reference": "confirmed one block later",
     "candidate": "",
     "plain": "It waited for space. When blocks are full, a low fee means a longer wait, not a rejected payment. When blocks have room, almost any fee is enough."
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
   "headline": "The smaller payment went first, because it paid more per byte"
  },
  "patch": "",
  "files": [],
  "unit_failures": [],
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
     "plain": "Before 2015 the instruction this lock uses did nothing at all. The upgrade gave it a meaning: this coin cannot be spent before the stated block."
    },
    {
     "id": "early",
     "title": "The coin is spent at block 103, in a block mined under the old rules",
     "status": "differs",
     "reference": "refused the block: a signature or script in the block fails the rules (block-script-verify-flag-failed (Locktime requirement not satisfied))",
     "candidate": "accepted the block: to the old rules the lock is an instruction that does nothing",
     "plain": "The same block is valid to the node that never upgraded and invalid to the node that did. This is what a soft fork is: the new rules forbid something the old rules allowed, so old nodes cannot see the difference."
    },
    {
     "id": "apart",
     "title": "Are the two nodes still on the same chain?",
     "status": "differs",
     "reference": "upgraded node: block 102",
     "candidate": "node on the old rules: block 103",
     "plain": "They have parted. The node on the old rules is following a block the rest of the network refuses. In 2015 this did not happen, because the new rule was switched on only after 95% of recent blocks came from miners who had said they would enforce it, so no block like this one was built on."
    }
   ],
   "verdict": "loosened",
   "headline": "A node that never upgraded accepted a block the upgraded node refused",
   "picture": {
    "lanes": [
     {
      "label": "Chain the upgraded node follows",
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
      "label": "Chain the node on the old rules follows",
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
  "unit_failures": [],
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
     "plain": "The rule-breaking miner's chain holds about 6 times the proof of work of the honest one. If the chain with the most work simply won, it would win here."
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
   "headline": "Thirty blocks of mining power, refused by one node that checked",
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
  "unit_failures": [],
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
     "plain": "10% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "their own, at block 36",
     "candidate": "stricter nodes are alone at block 4",
     "plain": "The stricter chain never became the longest, so no unmodified node ever switched to it. The nodes enforcing the stricter rule are on a shorter chain of their own, and the miners who enforced it earned rewards that exist only there. Enforcing a rule without most of the mining power splits you off; it does not bring anyone with you."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 10,
   "headline": "With 10% of mining power, the stricter nodes were left on their own chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "20% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "their own, at block 32",
     "candidate": "stricter nodes are alone at block 8",
     "plain": "The stricter chain never became the longest, so no unmodified node ever switched to it. The nodes enforcing the stricter rule are on a shorter chain of their own, and the miners who enforced it earned rewards that exist only there. Enforcing a rule without most of the mining power splits you off; it does not bring anyone with you."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 20,
   "headline": "With 20% of mining power, the stricter nodes were left on their own chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "30% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "their own, at block 28",
     "candidate": "stricter nodes are alone at block 12",
     "plain": "The stricter chain never became the longest, so no unmodified node ever switched to it. The nodes enforcing the stricter rule are on a shorter chain of their own, and the miners who enforced it earned rewards that exist only there. Enforcing a rule without most of the mining power splits you off; it does not bring anyone with you."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 30,
   "headline": "With 30% of mining power, the stricter nodes were left on their own chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "40% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "their own, at block 24",
     "candidate": "stricter nodes are alone at block 16",
     "plain": "The stricter chain never became the longest, so no unmodified node ever switched to it. The nodes enforcing the stricter rule are on a shorter chain of their own, and the miners who enforced it earned rewards that exist only there. Enforcing a rule without most of the mining power splits you off; it does not bring anyone with you."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 40,
   "headline": "With 40% of mining power, the stricter nodes were left on their own chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "50% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "their own, at block 20",
     "candidate": "stricter nodes are alone at block 20",
     "plain": "The stricter chain never became the longest, so no unmodified node ever switched to it. The nodes enforcing the stricter rule are on a shorter chain of their own, and the miners who enforced it earned rewards that exist only there. Enforcing a rule without most of the mining power splits you off; it does not bring anyone with you."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 50,
   "headline": "With 50% of mining power, the stricter nodes were left on their own chain",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "55% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 22)",
     "candidate": "the stricter chain (block 22)",
     "plain": "The stricter chain grew fastest, so the unmodified nodes kept switching to it (4 times), without being upgraded and without being asked. 18 of the 18 blocks from miners on the old rules were discarded, along with their rewards. This is how a soft fork takes effect for everyone: a majority of mining power refuses to build on anything else."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 55,
   "headline": "With 55% of mining power, the stricter rule became the rule for everyone",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "60% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 24)",
     "candidate": "the stricter chain (block 24)",
     "plain": "The stricter chain grew fastest, so the unmodified nodes kept switching to it (8 times), without being upgraded and without being asked. 16 of the 16 blocks from miners on the old rules were discarded, along with their rewards. This is how a soft fork takes effect for everyone: a majority of mining power refuses to build on anything else."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 60,
   "headline": "With 60% of mining power, the stricter rule became the rule for everyone",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "70% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 28)",
     "candidate": "the stricter chain (block 28)",
     "plain": "The stricter chain grew fastest, so the unmodified nodes kept switching to it (12 times), without being upgraded and without being asked. 12 of the 12 blocks from miners on the old rules were discarded, along with their rewards. This is how a soft fork takes effect for everyone: a majority of mining power refuses to build on anything else."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 70,
   "headline": "With 70% of mining power, the stricter rule became the rule for everyone",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "80% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 32)",
     "candidate": "the stricter chain (block 32)",
     "plain": "The stricter chain grew fastest, so the unmodified nodes kept switching to it (8 times), without being upgraded and without being asked. 8 of the 8 blocks from miners on the old rules were discarded, along with their rewards. This is how a soft fork takes effect for everyone: a majority of mining power refuses to build on anything else."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 80,
   "headline": "With 80% of mining power, the stricter rule became the rule for everyone",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
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
     "plain": "90% of the mining power enforces the stricter rule. Its blocks are valid to every node. Blocks from the other miners are valid only to unmodified nodes. Here the two kinds of block arrive in an even pattern; on a real network they arrive at random, which makes the outcome near the halfway line a matter of luck."
    },
    {
     "id": "outcome",
     "title": "Which chain did the unmodified nodes end up following?",
     "status": "differs",
     "reference": "the stricter chain (block 36)",
     "candidate": "the stricter chain (block 36)",
     "plain": "The stricter chain grew fastest, so the unmodified nodes kept switching to it (4 times), without being upgraded and without being asked. 4 of the 4 blocks from miners on the old rules were discarded, along with their rewards. This is how a soft fork takes effect for everyone: a majority of mining power refuses to build on anything else."
    },
    {
     "id": "threshold",
     "title": "Where is the line?",
     "status": "info",
     "reference": "",
     "candidate": "",
     "plain": "Just above half. With more than half the mining power the stricter chain outgrows any other; with half or less it does not. Real activations have waited for far more than half (95% in 2015, 90% in 2021), because near the line the two sides trade places for a long time and payments on the losing side are undone."
    }
   ],
   "verdict": "tightened",
   "share": 90,
   "headline": "With 90% of mining power, the stricter rule became the rule for everyone",
   "picture": {
    "lanes": [
     {
      "label": "Chain the unmodified nodes follow",
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
      "label": "Chain the stricter nodes follow",
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
  "unit_failures": [],
  "risk": [],
  "sensitive": []
 }
};
