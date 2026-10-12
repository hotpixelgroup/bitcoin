#!/usr/bin/env python3
# Copyright (c) 2026-present The Bitcoin Vibes developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Two-node lab scenes for Bitcoin Vibes.

One node alone proves nothing: on a private chain of one, any rule "works",
because nobody is present to disagree. Every scene here therefore starts two
nodes on a throwaway regtest chain and reports what each one does with the
other's blocks and transactions.

This file is deliberately self-contained (standard library only, no sibling
imports). The console runs it as a separate process inside the operating
system sandbox, together with the node programs it starts, so the programs
under test and the code that drives them share one enclosure. Results are
printed to stdout as one JSON object per line; the console treats every value
as data to display, never as instructions.

    lab_runner.py --scene compare --reference DIR --candidate DIR \
                  --workdir DIR --ports 18501,18502,18503,18504
"""

import argparse
import base64
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# A fixed regtest address, so block production never depends on a wallet.
FIXED_ADDRESS = "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn"
COIN = 100_000_000
# submitblock answers that mean "valid": null (new best block), "duplicate"
# (already had it) and "inconclusive" (valid, but not on the best chain).
ACCEPTED = (None, "duplicate", "inconclusive")
# Fields of getmempoolinfo that describe traffic, not settings.
VOLATILE_MEMPOOL = {"loaded", "size", "bytes", "usage", "total_fee",
                    "unbroadcastcount", "mempoolminfee"}

# Plain words for the reasons a node gives when it refuses a block or a
# transaction. Unknown reasons are shown as the node reported them.
REJECT_REASONS = {
    "bad-cb-amount": "the block pays its miner more than the rules allow",
    "bad-cb-height": "the block does not record its own height correctly",
    "bad-cb-length": "the first transaction in the block is malformed",
    "bad-cb-missing": "the block has no miner payout transaction",
    "bad-blk-length": "the block is larger than the rules allow",
    "bad-blk-weight": "the block is heavier than the rules allow",
    "bad-blk-sigops": "the block contains more signature operations than the rules allow",
    "bad-txnmrklroot": "the block's summary of its transactions does not match them",
    "bad-txns-premature-spend-of-coinbase":
        "the block spends newly created coins before they have matured",
    "bad-txns-inputs-missingorspent": "the block spends coins that do not exist or were already spent",
    "bad-txns-in-belowout": "a transaction in the block spends more than it has",
    "bad-txns-nonfinal": "the block contains a transaction that is not yet allowed to confirm",
    "bad-diffbits": "the block claims the wrong difficulty",
    "high-hash": "the block's proof of work does not meet the required difficulty",
    "time-too-old": "the block's timestamp is earlier than the rules allow",
    "time-too-new": "the block's timestamp is too far in the future",
    "bad-version": "the block uses a version the rules no longer accept",
    "bad-witness-nonce-size": "the block's witness data is malformed",
    "bad-witness-merkle-match": "the block's witness data does not match its commitment",
    "block-script-verify-flag-failed": "a signature or script in the block fails the rules",
    "mandatory-script-verify-flag-failed": "a signature or script fails the rules",
    "prev-blk-not-found": "the block builds on a block this node does not have",
    "bad-prevblk": "the block builds on a block this node considers invalid",
    "duplicate-invalid": "the node had already judged this block invalid",
    "datacarrier": "the transaction carries more data than this node will relay",
    "scriptpubkey": "the transaction uses an output type this node will not relay",
    "min relay fee not met": "the transaction pays less than this node's minimum relay fee",
    "dust": "the transaction creates an output too small for this node to relay",
    "tx-size": "the transaction is larger than this node will relay",
    "non-mandatory-script-verify-flag": "a script in the transaction breaks this node's relay policy",
}


def explain_reject(reason):
    """A plain sentence for a reject reason, keeping the node's own code."""
    text = str(reason or "").strip()
    for code, plain in REJECT_REASONS.items():
        if text == code or text.startswith(code):
            return f"{plain} ({text[:120]})"
    return f"the node gave the reason \"{text[:120]}\""


def btc(satoshis):
    """Whole-number satoshis as a readable amount, e.g. 50 BTC."""
    whole, frac = divmod(int(satoshis), COIN)
    if frac == 0:
        return f"{whole} BTC"
    return f"{whole}.{frac:08d}".rstrip("0") + " BTC"


def emit(kind, **fields):
    sys.stdout.write(json.dumps({"t": kind, **fields}) + "\n")
    sys.stdout.flush()


def step(text):
    emit("step", text=text)


class RpcError(RuntimeError):
    def __init__(self, method, code, message):
        super().__init__(f"{method}: {message}")
        self.method, self.code, self.message = method, code, message


class LabNode:
    """One disposable regtest node with its own data folder and ports."""

    def __init__(self, label, bindir, workdir, rpcport, p2pport, extra=()):
        self.label = label
        self.bindir = Path(bindir)
        self.datadir = Path(workdir) / label
        self.rpcport, self.p2pport = rpcport, p2pport
        self.extra = list(extra)
        self.proc = None
        self.log = None

    def start(self):
        self.datadir.mkdir(parents=True, exist_ok=True)
        self.log = open(self.datadir / "stdout.log", "wb")
        self.proc = subprocess.Popen(
            [str(self.bindir / "bitcoind"), "-regtest", f"-datadir={self.datadir}",
             f"-rpcport={self.rpcport}", "-rpcbind=127.0.0.1", "-rpcallowip=127.0.0.1",
             f"-port={self.p2pport}", "-bind=127.0.0.1", "-server=1", "-listen=1",
             "-discover=0", "-dnsseed=0", "-fixedseeds=0", "-listenonion=0",
             "-natpmp=0", "-fallbackfee=0.0002", "-dbcache=16", *self.extra],
            stdout=self.log, stderr=self.log, start_new_session=True)

    def named(self, method, wallet=None, timeout=30, **params):
        """Call an RPC with named parameters."""
        return self.rpc(method, wallet=wallet, timeout=timeout, _named=params)

    def rpc(self, method, *params, wallet=None, timeout=30, _named=None):
        cookie = (self.datadir / "regtest" / ".cookie").read_text()
        url = f"http://127.0.0.1:{self.rpcport}/" + (f"wallet/{wallet}" if wallet else "")
        request = urllib.request.Request(
            url, data=json.dumps({"jsonrpc": "1.0", "id": "lab", "method": method,
                                  "params": _named if _named is not None else list(params)}).encode(),
            headers={"Authorization": "Basic " + base64.b64encode(cookie.encode()).decode(),
                     "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = json.load(response)
        except urllib.error.HTTPError as error:
            try:
                body = json.load(error)
            except ValueError:
                raise RpcError(method, error.code, f"HTTP {error.code}") from None
        if body.get("error"):
            raise RpcError(method, body["error"].get("code"), body["error"].get("message", ""))
        return body["result"]

    def wait_ready(self, seconds=45):
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            if self.proc.poll() is not None:
                raise RuntimeError(f"The {self.label} node exited while starting. " + self.tail())
            try:
                return self.rpc("getblockchaininfo", timeout=5)
            except (OSError, ValueError, RpcError):
                time.sleep(0.15)
        raise RuntimeError(f"The {self.label} node did not answer within {seconds} seconds. " + self.tail())

    def tail(self, limit=600):
        for name in ("regtest/debug.log", "stdout.log"):
            try:
                text = (self.datadir / name).read_text(errors="replace").strip()
            except OSError:
                continue
            if text:
                return text[-limit:]
        return ""

    def stop(self):
        if self.proc is None:
            return
        try:
            self.rpc("stop", timeout=5)
        except (OSError, ValueError, RpcError):
            pass
        try:
            self.proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait(timeout=5)
        if self.log:
            self.log.close()

    def tip(self):
        info = self.rpc("getblockchaininfo")
        return {"height": info["blocks"], "hash": info["bestblockhash"]}

    def chaintips(self):
        return [{"height": t["height"], "hash": t["hash"][:16], "status": t["status"],
                 "branchlen": t["branchlen"]} for t in self.rpc("getchaintips")][:8]


def shuttle(source, target, hashes):
    """Hand blocks from one node to the other. Returns (accepted, rejection)."""
    accepted = 0
    for block_hash in hashes:
        answer = target.rpc("submitblock", source.rpc("getblock", block_hash, 0))
        if answer not in ACCEPTED:
            height = source.rpc("getblockheader", block_hash)["height"]
            return accepted, {"height": height, "hash": block_hash[:16], "reason": str(answer)[:160],
                              "plain": explain_reject(answer)}
        accepted += 1
    return accepted, None


def make_wallet(node, name="lab"):
    """A wallet on a node, or None when the program was built without one."""
    try:
        node.rpc("createwallet", name)
        return name
    except RpcError as error:
        if error.code == -32601:      # method not found: wallet support absent
            return None
        raise


def signed_payment(node, wallet, outputs):
    """A signed transaction that is not broadcast."""
    raw = node.rpc("createrawtransaction", [], outputs, wallet=wallet)
    funded = node.rpc("fundrawtransaction", raw, wallet=wallet)
    signed = node.rpc("signrawtransactionwithwallet", funded["hex"], wallet=wallet)
    if not signed.get("complete"):
        raise RuntimeError("The lab wallet could not sign its own transaction.")
    return signed["hex"]


def mempool_answer(node, tx_hex):
    result = node.rpc("testmempoolaccept", [tx_hex])[0]
    if result.get("allowed"):
        return {"allowed": True, "reason": ""}
    return {"allowed": False, "reason": str(result.get("reject-reason", ""))[:160]}


def describe_mempool(answer):
    if answer["allowed"]:
        return "would relay it"
    return "refuses to relay it: " + explain_reject(answer["reason"])


def network_view(reference, candidate):
    """Connect the two nodes directly and report whether they settle on one chain."""
    try:
        candidate.rpc("addnode", f"127.0.0.1:{reference.p2pport}", "onetry")
    except RpcError:
        pass
    connected = False
    deadline = time.monotonic() + 8
    settled = 0
    while time.monotonic() < deadline:
        peers = reference.rpc("getconnectioncount")
        connected = connected or peers > 0
        same = reference.tip()["hash"] == candidate.tip()["hash"]
        if connected and same:
            break
        if connected:
            settled += 1
            if settled > 14:          # connected for a few seconds, still apart
                break
        time.sleep(0.25)
    ref_tip, cand_tip = reference.tip(), candidate.tip()
    return {"connected": connected, "still_connected": reference.rpc("getconnectioncount") > 0,
            "converged": ref_tip["hash"] == cand_tip["hash"],
            "reference_tip": ref_tip, "candidate_tip": cand_tip,
            "reference_chains": reference.chaintips(), "candidate_chains": candidate.chaintips()}


def setting_differences(reference, candidate):
    """Relay and mempool settings each node reports about itself."""
    rows = []
    ref, cand = reference.rpc("getmempoolinfo"), candidate.rpc("getmempoolinfo")
    for key in sorted(set(ref) | set(cand)):
        if key in VOLATILE_MEMPOOL:
            continue
        if ref.get(key) != cand.get(key):
            rows.append({"setting": key, "reference": ref.get(key), "candidate": cand.get(key)})
    return rows


VERDICTS = {
    "none": "No difference observed",
    "policy": "Local policy only",
    "tightened": "Your node rejects blocks the unmodified node accepts",
    "loosened": "The unmodified node rejects blocks your node produces",
    "split": "The two nodes reject each other's blocks",
}


def scene_compare(reference, candidate):
    """Stock node versus changed node on one private chain."""
    rows = []

    def row(row_id, title, status, ref_text, cand_text, plain):
        rows.append({"id": row_id, "title": title, "status": status,
                     "reference": ref_text, "candidate": cand_text, "plain": plain})

    result = {"rows": rows, "ref_rejects": None, "cand_rejects": None, "policy": []}

    # 1. Same starting point?
    genesis_ref, genesis_cand = reference.rpc("getblockhash", 0), candidate.rpc("getblockhash", 0)
    if genesis_ref != genesis_cand:
        row("genesis", "Do both nodes start from the same first block?", "differs",
            genesis_ref[:16], genesis_cand[:16],
            "The two nodes disagree about the very first block, so they are on separate "
            "networks from the start and can never exchange blocks.")
        result["cand_rejects"] = {"height": 0, "reason": "different genesis block",
                                  "plain": "the first block differs"}
        result["ref_rejects"] = dict(result["cand_rejects"])
        return finish(result, reference, candidate)
    row("genesis", "Do both nodes start from the same first block?", "same",
        genesis_ref[:16], genesis_cand[:16], "Yes. Everything below happens on one shared private chain.")

    # 2. The unmodified node produces blocks; does the changed node follow?
    step("The unmodified node is producing 110 blocks; your node is checking each one")
    wallet = make_wallet(reference)
    payout = reference.rpc("getnewaddress", wallet=wallet) if wallet else FIXED_ADDRESS
    hashes = reference.rpc("generatetoaddress", 110, payout)
    accepted, rejection = shuttle(reference, candidate, hashes)
    if rejection:
        result["cand_rejects"] = rejection
        row("follow", "Does your node accept the blocks an unmodified node produces?", "differs",
            "produced 110 valid blocks", f"refused block {rejection['height']}",
            f"Your node accepted {accepted} blocks, then refused block {rejection['height']}: "
            f"{rejection['plain']}. From that block on it would stop following any network "
            "that still runs the unmodified rules.")
    else:
        row("follow", "Does your node accept the blocks an unmodified node produces?", "same",
            "produced 110 valid blocks", "accepted all 110",
            "Your node followed the unmodified node's chain block by block.")

    in_step = rejection is None
    # 3. Transactions: relay policy first, then the same transactions inside a block.
    if in_step and wallet:
        step("Offering two test transactions to both nodes")
        probes = (("payment", "an ordinary payment of 1 BTC",
                   [{reference.rpc("getnewaddress", wallet=wallet): 1}]),
                  ("data", "a transaction carrying 200 bytes of arbitrary data",
                   [{"data": "5a" * 200}]))
        mined = []
        for probe_id, what, outputs in probes:
            tx_hex = signed_payment(reference, wallet, outputs)
            ref_answer, cand_answer = mempool_answer(reference, tx_hex), mempool_answer(candidate, tx_hex)
            differs = ref_answer["allowed"] != cand_answer["allowed"]
            if differs:
                result["policy"].append({"probe": probe_id, "reference": ref_answer, "candidate": cand_answer})
            row("relay-" + probe_id, f"Would each node relay {what}?",
                "differs" if differs else "same",
                describe_mempool(ref_answer), describe_mempool(cand_answer),
                "The two nodes apply different relay policy to this transaction. Relay policy "
                "is a local choice: it decides what a node passes on, not what is valid in a block."
                if differs else "Both nodes treat this transaction the same way.")
            if ref_answer["allowed"]:
                reference.rpc("sendrawtransaction", tx_hex)
                mined.append(probe_id)
        if mined:
            block = reference.rpc("generatetoaddress", 1, payout)
            _, rejection = shuttle(reference, candidate, block)
            if rejection:
                result["cand_rejects"] = rejection
                in_step = False
                row("block-with-transactions", "Does your node accept a block containing those transactions?",
                    "differs", "produced the block", f"refused block {rejection['height']}",
                    f"Your node refused the block: {rejection['plain']}.")
            else:
                refused = [p for p in result["policy"] if not p["candidate"]["allowed"]]
                row("block-with-transactions", "Does your node accept a block containing those transactions?",
                    "same", "produced the block", "accepted the block",
                    "Your node refused to relay a transaction and then accepted the block that "
                    "contained it. That is the difference between relay policy and consensus rules: "
                    "a filter keeps a transaction out of your own waiting area, not out of the chain."
                    if refused else
                    "Both nodes agree that a block containing these transactions is valid.")
    elif in_step:
        row("relay-payment", "Would each node relay a test transaction?", "skipped", "", "",
            "Skipped: this unmodified node was built without wallet support, so the lab "
            "cannot create test transactions.")

    # 4. Cross the first reward halving, which regtest places at block 150.
    if in_step:
        step("Continuing past the first reward halving at block 150")
        height = reference.tip()["height"]
        hashes = reference.rpc("generatetoaddress", max(1, 152 - height), payout)
        accepted, rejection = shuttle(reference, candidate, hashes)
        if rejection:
            result["cand_rejects"] = rejection
            in_step = False
            row("halving", "Does your node follow the chain through the first reward halving?", "differs",
                "halved the reward at block 150", f"refused block {rejection['height']}",
                f"Your node refused block {rejection['height']}: {rejection['plain']}. "
                "The two nodes disagree about the reward schedule.")
        else:
            row("halving", "Does your node follow the chain through the first reward halving?", "same",
                "halved the reward at block 150", "accepted every block",
                "On this private chain the block reward halves at block 150. Both nodes "
                "agree on when that happens and on the new reward.")

    # 5. The changed node produces blocks; does the unmodified node accept them?
    step("Your node is producing blocks; the unmodified node is checking them")
    try:
        hashes = candidate.rpc("generatetoaddress", 2, FIXED_ADDRESS)
    except RpcError as error:
        hashes = []
        row("produce", "Does an unmodified node accept the blocks your node produces?", "error",
            "", "could not produce a block",
            "Your node could not assemble a block of its own: " + error.message[:200])
    if hashes:
        stats = candidate.rpc("getblockstats", hashes[0], ["subsidy", "totalfee", "height"])
        paid = btc(stats["subsidy"] + stats["totalfee"])
        allowed = btc(reference_subsidy(stats["height"]))
        # A node does not fully check a block on a branch shorter than its own
        # chain. If the two have already parted, step the unmodified node back
        # to the last block they share while it judges, then let it return.
        set_aside = None
        if result["cand_rejects"] and result["cand_rejects"]["height"]:
            set_aside = reference.rpc("getblockhash", result["cand_rejects"]["height"])
            reference.rpc("invalidateblock", set_aside)
        try:
            accepted, rejection = shuttle(candidate, reference, hashes)
        finally:
            if set_aside:
                reference.rpc("reconsiderblock", set_aside)
        if rejection:
            result["ref_rejects"] = rejection
            row("produce", "Does an unmodified node accept the blocks your node produces?", "differs",
                f"refused block {rejection['height']} (reward allowed: {allowed})",
                f"produced a block paying its miner {paid}",
                f"The unmodified node refused your node's block: {rejection['plain']}. "
                "Every node running the unmodified rules would do the same, so coins "
                "created this way exist only on your own node.")
        elif result["cand_rejects"]:
            row("produce", "Does an unmodified node accept the blocks your node produces?", "same",
                "judged both blocks valid, and ignored them", f"produced blocks paying their miner {paid}",
                "The unmodified node considers your node's blocks valid, because a stricter rule "
                "never produces anything the looser rule forbids. It still ignores them: its own "
                "chain contains more proof of work. Other nodes would follow your stricter chain "
                "only if most mining power enforced your rule.")
        else:
            row("produce", "Does an unmodified node accept the blocks your node produces?", "same",
                "accepted both blocks", f"produced blocks paying their miner {paid}",
                "The unmodified node accepted the blocks your node produced.")

    # 6. Settings each node reports about itself.
    differences = setting_differences(reference, candidate)
    if differences:
        result["settings"] = differences
        listed = "; ".join(f"{d['setting']}: {d['reference']} versus {d['candidate']}" for d in differences[:6])
        row("settings", "Do the nodes report the same relay and mempool settings?", "differs",
            "unmodified defaults", "changed", "They differ (" + listed + "). These are local "
            "settings: they shape what a node keeps and relays, and no other node is bound by them.")
    else:
        row("settings", "Do the nodes report the same relay and mempool settings?", "same",
            "", "", "Both nodes report the same relay and mempool settings.")
    return finish(result, reference, candidate)


def reference_subsidy(height):
    """The unmodified regtest reward at a height: 50 BTC, halved every 150 blocks."""
    halvings = height // 150
    return 0 if halvings >= 64 else (50 * COIN) >> halvings


def finish(result, reference, candidate):
    """Connect the nodes, record the picture of both chains and name the outcome."""
    step("Connecting the two nodes directly to see whether they settle on one chain")
    view = network_view(reference, candidate)
    result["network"] = view
    tightened, loosened = bool(result["cand_rejects"]), bool(result["ref_rejects"])
    if tightened and loosened:
        verdict = "split"
    elif tightened:
        verdict = "tightened"
    elif loosened:
        verdict = "loosened"
    elif result["policy"] or result.get("settings"):
        verdict = "policy"
    else:
        verdict = "none"
    ref_height, cand_height = view["reference_tip"]["height"], view["candidate_tip"]["height"]
    if view["converged"]:
        plain = f"Connected directly, both nodes settled on the same chain at block {ref_height}."
    else:
        plain = (f"Connected directly, the nodes stayed apart: the unmodified node is at block "
                 f"{ref_height} and yours is at block {cand_height}, on different chains. ")
        if verdict == "tightened":
            plain += ("Your node refuses the unmodified chain. The unmodified node sees your chain "
                      "as valid but shorter, so it does not follow it.")
        elif verdict == "loosened":
            plain += ("The unmodified node will never accept your node's chain, however long it "
                      "grows. Your node still considers the unmodified chain valid.")
        else:
            plain += "Neither node will ever accept the other's version of history."
        if view["connected"] and not view["still_connected"]:
            plain += " The unmodified node also dropped the connection to your node."
    if not view["converged"]:
        firsts = [r["height"] for r in (result["cand_rejects"], result["ref_rejects"]) if r and r["height"]]
        common = max(0, min(firsts) - 1) if firsts else min(ref_height, cand_height)
        result["picture"] = split_picture(
            common, ref_height - common, cand_height - common,
            "Chain the unmodified node follows", "Chain your node follows",
            first_refuses=bool(result["ref_rejects"]), second_refuses=bool(result["cand_rejects"]))
    result["rows"].append({"id": "network", "title": "Connected directly, do they agree on one chain?",
                           "status": "same" if view["converged"] else "differs",
                           "reference": f"block {ref_height}", "candidate": f"block {cand_height}",
                           "plain": plain})
    result["verdict"] = verdict
    result["headline"] = VERDICTS[verdict]
    return result


def scene_policy(default, strict):
    """Same program, different relay setting: policy is not consensus."""
    rows = []
    wallet = make_wallet(default)
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    payout = default.rpc("getnewaddress", wallet=wallet)
    step("Building a shared chain of 101 blocks")
    shuttle(default, strict, default.rpc("generatetoaddress", 101, payout))
    step("Creating a transaction that carries 200 bytes of data")
    tx_hex = signed_payment(default, wallet, [{"data": "5a" * 200}])
    open_answer, strict_answer = mempool_answer(default, tx_hex), mempool_answer(strict, tx_hex)
    rows.append({"id": "relay", "title": "Would each node relay the data-carrying transaction?",
                 "status": "differs" if open_answer["allowed"] != strict_answer["allowed"] else "same",
                 "reference": describe_mempool(open_answer), "candidate": describe_mempool(strict_answer),
                 "plain": "The filtering node keeps the transaction out of its own waiting area "
                          "and does not pass it on. The default node relays it."})
    txid = default.rpc("sendrawtransaction", tx_hex)
    step("The default node includes the transaction in a block")
    block = default.rpc("generatetoaddress", 1, payout)
    _, rejection = shuttle(default, strict, block)
    in_block = txid in strict.rpc("getblock", block[0])["tx"] if not rejection else False
    rows.append({"id": "block", "title": "Does the filtering node accept the block that contains it?",
                 "status": "same" if not rejection else "differs",
                 "reference": "produced the block",
                 "candidate": "accepted the block" if not rejection else "refused the block",
                 "plain": "The filtering node accepted the block, and the transaction it refused to "
                          "relay is now part of its own copy of the chain. A relay filter decides "
                          "what a node passes along. It cannot decide what miners include."
                          if in_block else "The filtering node did not accept the block."})
    same_tip = default.tip()["hash"] == strict.tip()["hash"]
    rows.append({"id": "chain", "title": "Are the two nodes still on the same chain?",
                 "status": "same" if same_tip else "differs",
                 "reference": f"block {default.tip()['height']}", "candidate": f"block {strict.tip()['height']}",
                 "plain": "Yes. Nodes with different relay policy stay on one chain, because "
                          "policy never applies to transactions that are already in a block."
                          if same_tip else "The nodes are on different chains."})
    return {"rows": rows, "verdict": "policy" if same_tip else "split",
            "headline": VERDICTS["policy"] if same_tip else VERDICTS["split"]}


def scene_reorg(first, second):
    """A confirmed payment becomes unconfirmed again when a longer chain arrives."""
    rows = []
    wallet = make_wallet(first)
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    payout = first.rpc("getnewaddress", wallet=wallet)
    step("Building a shared chain of 101 blocks")
    shuttle(first, second, first.rpc("generatetoaddress", 101, payout))
    step("Node A makes a payment and confirms it in a block that node B never sees")
    txid = first.rpc("sendtoaddress", first.rpc("getnewaddress", wallet=wallet), 1, wallet=wallet)
    first.rpc("generatetoaddress", 1, FIXED_ADDRESS)
    before = first.rpc("gettransaction", txid, wallet=wallet)["confirmations"]
    old_tip = first.tip()
    rows.append({"id": "confirmed", "title": "Node A: is the payment confirmed?", "status": "info",
                 "reference": f"{before} confirmation", "candidate": "has not seen it",
                 "plain": "Node A's wallet shows the payment with one confirmation: one block "
                          "has been built that includes it."})
    step("Node B, unaware of that block, builds two blocks of its own")
    other = second.rpc("generatetoaddress", 2, FIXED_ADDRESS)
    step("Node A learns about node B's longer chain")
    shuttle(second, first, other)
    after = first.rpc("gettransaction", txid, wallet=wallet)["confirmations"]
    waiting = txid in first.rpc("getrawmempool")
    new_tip = first.tip()
    switched = new_tip["hash"] == second.tip()["hash"]
    rows.append({"id": "reorganised", "title": "Node A: which chain does it follow now?",
                 "status": "differs" if switched else "same",
                 "reference": f"was at block {old_tip['height']} ({old_tip['hash'][:12]})",
                 "candidate": f"now at block {new_tip['height']} ({new_tip['hash'][:12]})",
                 "plain": "Node A switched to node B's chain because it contains more proof of "
                          "work. The block that confirmed the payment is no longer part of the "
                          "chain node A follows. This is called a reorganisation."
                          if switched else "Node A did not switch chains."})
    rows.append({"id": "unconfirmed", "title": "Node A: is the payment still confirmed?",
                 "status": "differs" if after < before else "same",
                 "reference": f"{before} confirmation before", "candidate": f"{after} confirmations after",
                 "plain": ("The payment is back to zero confirmations" +
                           (" and is waiting in node A's mempool again" if waiting else "") +
                           ". A confirmation is a block built on top of a payment, not an approval "
                           "by anyone. Each further block makes reversal more expensive, which is "
                           "why people wait for several, but no number of confirmations is a "
                           "formal guarantee.")
                          if after < before else "The payment kept its confirmation."})
    return {"rows": rows, "verdict": "none", "headline": "A confirmation was reversed by a longer chain"}


def scene_maturity(node, _unused):
    """New coins cannot be spent until 100 more blocks are built on top."""
    rows = []
    wallet = make_wallet(node)
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    address = node.rpc("getnewaddress", wallet=wallet)
    node.rpc("generatetoaddress", 1, address)
    balances = node.rpc("getbalances", wallet=wallet)["mine"]
    rows.append({"id": "immature", "title": "After 1 block: can the miner spend its reward?", "status": "info",
                 "reference": f"immature: {balances['immature']} BTC", "candidate": f"spendable: {balances['trusted']} BTC",
                 "plain": "The block created 50 new bitcoin for its miner, and none of it can be spent yet."})
    step("Producing 100 more blocks")
    node.rpc("generatetoaddress", 100, address)
    balances = node.rpc("getbalances", wallet=wallet)["mine"]
    rows.append({"id": "mature", "title": "After 101 blocks: can the miner spend its reward?", "status": "info",
                 "reference": f"immature: {balances['immature']} BTC", "candidate": f"spendable: {balances['trusted']} BTC",
                 "plain": "The reward from the first block is now spendable; the rewards from the "
                          "100 newer blocks are still waiting. Newly created coins must wait 100 "
                          "blocks, so that a reorganisation cannot leave people holding coins "
                          "from a block that no longer exists."})
    return {"rows": rows, "verdict": "none", "headline": "New coins mature after 100 blocks"}


def split_picture(common, first_after, second_after, first_label, second_label,
                  first_refuses=False, second_refuses=False, first_kind="stock", second_kind="changed"):
    """Two chains that share a beginning and then part, as data for a drawing.

    Each lane is a list of blocks. kind says who produced a block ("shared"
    for the common beginning); state "refused" marks a block from the other
    side that this side would not accept."""
    def lane(label, kind, after, refuses, other_kind):
        blocks = [{"kind": "shared", "state": "kept"}] * min(3, common)
        blocks += [{"kind": kind, "state": "kept"}] * min(after, 10)
        note = f"{common} shared blocks, then {after} of its own"
        if after > 10:
            note += " (10 drawn)"
        if refuses:
            blocks = blocks + [{"kind": other_kind, "state": "refused"}]
            note += "; it refused the other side's next block"
        return {"label": label, "blocks": blocks, "note": note}
    return {"lanes": [lane(first_label, first_kind, first_after, first_refuses, second_kind),
                      lane(second_label, second_kind, second_after, second_refuses, first_kind)]}


def scene_keys(first, second):
    """Coins are entries on the shared record. A wallet holds keys, not coins."""
    rows = []
    wallet = make_wallet(first, "savings")
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    address = first.rpc("getnewaddress", wallet=wallet)
    step("Node A's wallet receives 50 BTC, and both nodes record the block")
    hashes = first.rpc("generatetoaddress", 1, address) + first.rpc("generatetoaddress", 100, FIXED_ADDRESS)
    shuttle(first, second, hashes)
    balance = first.rpc("getbalances", wallet=wallet)["mine"]["trusted"]
    backup = first.rpc("listdescriptors", True, wallet=wallet)["descriptors"]

    def on_chain():
        return second.rpc("scantxoutset", "start", [f"addr({address})"], timeout=120)["total_amount"]
    rows.append({"id": "where", "title": "Node A's wallet shows a balance. Where are those coins recorded?",
                 "status": "info", "reference": f"wallet on node A: {balance} BTC",
                 "candidate": f"node B, which has no wallet at all, finds {on_chain()} BTC at that address",
                 "plain": "Node B has never had this wallet, and it can still see the coins, because they "
                          "are an entry on the chain that every node keeps. The wallet shows a balance by "
                          "reading the same record."})
    step("Deleting the wallet from node A")
    first.rpc("unloadwallet", wallet)
    shutil.rmtree(first.datadir / "regtest" / "wallets" / wallet, ignore_errors=True)
    rows.append({"id": "deleted", "title": "The wallet is deleted from node A. Are the coins gone?",
                 "status": "info", "reference": "wallet deleted",
                 "candidate": f"the chain still records {on_chain()} BTC at that address",
                 "plain": "Nothing on the chain changed. The coins were never inside the wallet. What "
                          "was deleted is the only copy of the key that can move them."})
    step("A stranger's new wallet looks at the same chain")
    second.named("createwallet", wallet_name="stranger")
    stranger = second.rpc("getbalances", wallet="stranger")["mine"]["trusted"]
    rows.append({"id": "stranger", "title": "Can a new wallet, without the key, spend them?",
                 "status": "info", "reference": "the coins are still on the chain",
                 "candidate": f"a new wallet without the key: {stranger} BTC",
                 "plain": "A wallet is a set of keys. Without the right key the coins are visible to "
                          "everyone and movable by no one. If the deleted wallet had no backup, they "
                          "would now stay where they are for good."})
    step("Restoring the backup of the keys on a different node")
    second.named("createwallet", wallet_name="restored", blank=True)
    requests = []
    for item in backup:
        request = {"desc": item["desc"], "timestamp": 0, "active": bool(item.get("active")),
                   "internal": bool(item.get("internal"))}
        if "range" in item:
            request["range"] = item["range"]
        requests.append(request)
    second.rpc("importdescriptors", requests, wallet="restored", timeout=180)
    restored = second.rpc("getbalances", wallet="restored")["mine"]["trusted"]
    spend = ""
    if restored > 0:
        spend = second.rpc("sendtoaddress", second.rpc("getnewaddress", wallet="restored"), 1, wallet="restored")
    rows.append({"id": "restored", "title": "The backup of the keys is restored on a different node. And now?",
                 "status": "differs" if restored > 0 else "error",
                 "reference": "wallet file gone from node A",
                 "candidate": f"restored on node B: {restored} BTC, and it can spend" if spend else f"restored: {restored} BTC",
                 "plain": "The same coins are spendable again, from a different machine, because the "
                          "keys came back. A backup of a wallet is a backup of its keys (usually written "
                          "as a list of words). Anyone who holds that backup holds the coins; anyone "
                          "who shows you a balance without giving you the keys holds them for you."})
    return {"rows": rows, "verdict": "none", "headline": "The coins were on the chain all along; the wallet held the keys"}


def scene_fees(miner, other):
    """Block space is sold by the byte to whoever pays most per byte."""
    rows = []
    wallet = make_wallet(miner)
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    payout = miner.rpc("getnewaddress", wallet=wallet)
    step("Building a chain with two spendable coins")
    shuttle(miner, other, miner.rpc("generatetoaddress", 102, payout))
    step("Two payments are sent on node A")
    big = miner.named("sendtoaddress", wallet=wallet, address=miner.rpc("getnewaddress", wallet=wallet),
                      amount=10, fee_rate=2)
    small = miner.named("sendtoaddress", wallet=wallet, address=miner.rpc("getnewaddress", wallet=wallet),
                        amount=0.1, fee_rate=50)

    def fee(txid):
        return round(-miner.rpc("gettransaction", txid, wallet=wallet)["fee"] * COIN)
    rows.append({"id": "waiting", "title": "Two payments are waiting to be confirmed",
                 "status": "info",
                 "reference": f"10 BTC, paying a fee of {fee(big)} satoshis (2 per byte)",
                 "candidate": f"0.1 BTC, paying a fee of {fee(small)} satoshis (50 per byte)",
                 "plain": "Both transactions take up almost exactly the same space in a block, although "
                          "one moves a hundred times as much as the other."})
    step("The next block has room for only one of them")
    first_block = miner.rpc("generatetoaddress", 1, FIXED_ADDRESS)[0]
    included = miner.rpc("getblock", first_block)["tx"]
    winner = "the 0.1 BTC payment" if small in included and big not in included else \
             "the 10 BTC payment" if big in included and small not in included else "both" \
             if big in included else "neither"
    rows.append({"id": "first", "title": "The next block has room for one. Which got in?",
                 "status": "differs", "reference": "10 BTC payment: " + ("in the block" if big in included else "still waiting"),
                 "candidate": "0.1 BTC payment: " + ("in the block" if small in included else "still waiting"),
                 "plain": f"The miner included {winner}. A miner fills a block with whatever pays most "
                          "per byte of space, because space is what is scarce. The amount being sent "
                          "does not enter into it, and nobody set either fee but the sender."})
    second_block = miner.rpc("generatetoaddress", 1, FIXED_ADDRESS)[0]
    later = big in miner.rpc("getblock", second_block)["tx"]
    rows.append({"id": "second", "title": "What happened to the other payment?",
                 "status": "info", "reference": "confirmed one block later" if later else "still waiting",
                 "candidate": "",
                 "plain": "It waited for space. When blocks are full, a low fee means a longer wait, not "
                          "a rejected payment. When blocks have room, almost any fee is enough."})
    other_pool = len(other.rpc("getrawmempool"))
    rows.append({"id": "mempool", "title": "Did node B ever see either payment waiting?",
                 "status": "info", "reference": "node A held both in its waiting area",
                 "candidate": f"node B's waiting area held {other_pool} transactions",
                 "plain": "The two nodes were not connected, so node B never heard of either payment "
                          "until it arrived in a block. There is no single waiting area: each node keeps "
                          "its own, and they differ."})
    return {"rows": rows, "verdict": "none", "headline": "The smaller payment went first, because it paid more per byte"}


def scene_softfork(upgraded, old):
    """Replay of a real soft fork (BIP 65, activated in December 2015)."""
    rows = []
    wallet = make_wallet(upgraded)
    if not wallet:
        raise RuntimeError("This node was built without wallet support, which this scene needs.")
    payout = upgraded.rpc("getnewaddress", wallet=wallet)
    step("Building a shared chain of 101 blocks")
    shuttle(upgraded, old, upgraded.rpc("generatetoaddress", 101, payout))
    # A coin that the 2015 rule locks until block 500: <500> OP_CHECKLOCKTIMEVERIFY.
    script = "02f401b1"
    locked_address = upgraded.rpc("decodescript", script)["segwit"]["address"]
    step("Locking 1 BTC until block 500 with the rule added in 2015")
    txid = upgraded.rpc("sendtoaddress", locked_address, 1, wallet=wallet)
    shuttle(upgraded, old, upgraded.rpc("generatetoaddress", 1, payout))
    outputs = upgraded.rpc("gettransaction", txid, True, True, wallet=wallet)["decoded"]["vout"]
    index = next(o["n"] for o in outputs if o["scriptPubKey"].get("address") == locked_address)
    destination = upgraded.rpc("getaddressinfo", payout, wallet=wallet)["scriptPubKey"]
    height = upgraded.tip()["height"]
    # Spend it now, long before block 500, by hand: one input, one output, the
    # locking script as the only witness item, and no lock time.
    early_spend = ("02000000" "0001" "01" + bytes.fromhex(txid)[::-1].hex() +
                   index.to_bytes(4, "little").hex() + "00" "fdffffff" "01" +
                   (COIN - 10_000).to_bytes(8, "little").hex() +
                   f"{len(destination) // 2:02x}" + destination +
                   "01" + f"{len(script) // 2:02x}" + script + "00000000")
    rows.append({"id": "locked", "title": "A coin is locked until block 500",
                 "status": "info", "reference": f"both nodes are at block {height}",
                 "candidate": "the lock uses a rule added to Bitcoin in 2015 (BIP 65)",
                 "plain": "Before 2015 the instruction this lock uses did nothing at all. The upgrade "
                          "gave it a meaning: this coin cannot be spent before the stated block."})
    step("A miner running the old rules includes a spend of that coin, far too early")
    try:
        mined = old.rpc("generateblock", FIXED_ADDRESS, [early_spend])["hash"]
    except RpcError as error:
        rows.append({"id": "early", "title": "A miner on the old rules tries to spend it early", "status": "error",
                     "reference": "", "candidate": "could not build the block",
                     "plain": "The node running the old rules refused the early spend too: " + error.message[:200]})
        return {"rows": rows, "verdict": "none", "headline": "Both nodes enforced the lock"}
    _, rejection = shuttle(old, upgraded, [mined])
    rows.append({"id": "early", "title": f"The coin is spent at block {height + 1}, in a block mined under the old rules",
                 "status": "differs" if rejection else "same",
                 "reference": ("refused the block: " + rejection["plain"]) if rejection else "accepted the block",
                 "candidate": "accepted the block: to the old rules the lock is an instruction that does nothing",
                 "plain": "The same block is valid to the node that never upgraded and invalid to the node "
                          "that did. This is what a soft fork is: the new rules forbid something the old "
                          "rules allowed, so old nodes cannot see the difference."
                          if rejection else "Both nodes accepted the block, which is not what this scene expects."})
    view = network_view(upgraded, old)
    rows.append({"id": "apart", "title": "Are the two nodes still on the same chain?",
                 "status": "same" if view["converged"] else "differs",
                 "reference": f"upgraded node: block {view['reference_tip']['height']}",
                 "candidate": f"node on the old rules: block {view['candidate_tip']['height']}",
                 "plain": "They have parted. The node on the old rules is following a block the rest of "
                          "the network refuses. In 2015 this did not happen, because the new rule was "
                          "switched on only after 95% of recent blocks came from miners who had said "
                          "they would enforce it, so no block like this one was built on."
                          if not view["converged"] else "They agree."})
    result = {"rows": rows, "verdict": "loosened" if rejection else "none",
              "headline": "A node that never upgraded accepted a block the upgraded node refused"
              if rejection else "Both nodes agreed"}
    if not view["converged"]:
        result["picture"] = split_picture(
            height, view["reference_tip"]["height"] - height, view["candidate_tip"]["height"] - height,
            "Chain the upgraded node follows", "Chain the node on the old rules follows",
            first_refuses=True, first_kind="stock", second_kind="changed")
    return result


def scene_miners(honest, rogue):
    """Mining power cannot make an invalid block valid."""
    rows = []
    step("Both nodes share a short chain")
    start = honest.rpc("generatetoaddress", 3, FIXED_ADDRESS)
    accepted, rejection = shuttle(honest, rogue, start)
    if rejection:
        raise RuntimeError("This scene needs a second node whose rules are looser than the first's, "
                           "and this one refused an unmodified block: " + rejection["plain"])
    step("The rule-breaking miner produces 30 blocks; the honest miner produces 2")
    rogue_blocks = rogue.rpc("generatetoaddress", 30, FIXED_ADDRESS)
    paid = rogue.rpc("getblockstats", rogue_blocks[0], ["subsidy", "totalfee"])
    before = honest.tip()
    refused, first_reason = 0, None
    for block_hash in rogue_blocks:
        answer = honest.rpc("submitblock", rogue.rpc("getblock", block_hash, 0))
        if answer not in ACCEPTED:
            refused += 1
            first_reason = first_reason or str(answer)
    switched = honest.tip()["hash"] != before["hash"]
    honest_blocks = honest.rpc("generatetoaddress", 2, FIXED_ADDRESS)
    after = honest.tip()
    work = lambda node: int(node.rpc("getblockheader", node.tip()["hash"])["chainwork"], 16)  # noqa: E731
    ratio = work(rogue) / max(1, work(honest))
    rows.append({"id": "power", "title": "Who has more mining power?", "status": "info",
                 "reference": f"honest miner: {len(honest_blocks)} blocks",
                 "candidate": f"rule-breaking miner: {len(rogue_blocks)} blocks, each paying itself "
                              f"{btc(paid['subsidy'] + paid['totalfee'])}",
                 "plain": f"The rule-breaking miner's chain holds about {ratio:.0f} times the proof of "
                          "work of the honest one. If the chain with the most work simply won, it "
                          "would win here."})
    rows.append({"id": "switch", "title": "Does the unmodified node switch to the chain with more work?",
                 "status": "same" if switched else "differs",
                 "reference": f"switched to the rule-breaking chain" if switched else
                 f"stays on the honest chain, now at block {after['height']}",
                 "candidate": f"offered {len(rogue_blocks)} blocks; {refused} refused",
                 "plain": ("It refused every one. The first because " + explain_reject(first_reason) +
                           ", and the rest because they build on a block it had already refused. A node "
                           "follows the chain with the most work among the chains it considers valid. "
                           "Work is never weighed for a block that breaks the rules.")
                 if refused else "The unmodified node accepted the blocks, which is not what this scene expects."})
    rows.append({"id": "earned", "title": "What did all that mining power buy?", "status": "info",
                 "reference": "", "candidate": f"{len(rogue_blocks)} blocks that only the rule-breaking miner accepts",
                 "plain": "Coins that exist on one machine. With most of the mining power a miner can "
                          "do real damage inside the rules: leave transactions out, or replace recent "
                          "blocks to take back its own payments. It cannot create coins, spend someone "
                          "else's, or change a rule for any node that checks."})
    return {"rows": rows, "verdict": "loosened" if refused else "none",
            "headline": "Thirty blocks of mining power, refused by one node that checked",
            "picture": split_picture(len(start), len(honest_blocks), len(rogue_blocks),
                                     "Chain the unmodified node follows",
                                     "Chain the rule-breaking miner built", first_refuses=bool(refused))}


def scene_power(stock, strict, share=60, rounds=40):
    """A stricter rule, enforced by a chosen share of mining power.

    Two nodes stand for two kinds of node: unmodified, and enforcing a
    stricter rule. Each of 40 blocks is produced by one kind of miner, in
    proportion to the share. Every block is offered to both nodes."""
    share = max(5, min(95, int(share)))
    produced = []                                   # (kind, hash)
    reorganised = 0
    for i in range(rounds):
        if ((i + 1) * share) // 100 > (i * share) // 100:
            before = stock.tip()["hash"]
            block_hash = strict.rpc("generatetoaddress", 1, FIXED_ADDRESS)[0]
            stock.rpc("submitblock", strict.rpc("getblock", block_hash, 0))
            header = stock.rpc("getblockheader", block_hash)
            if stock.tip()["hash"] == block_hash and header.get("previousblockhash") != before:
                reorganised += 1
            produced.append(("changed", block_hash))
        else:
            block_hash = stock.rpc("generatetoaddress", 1, FIXED_ADDRESS)[0]
            strict.rpc("submitblock", stock.rpc("getblock", block_hash, 0))
            produced.append(("stock", block_hash))

    def in_chain(node, block_hash):
        try:
            return node.rpc("getblockheader", block_hash)["confirmations"] > 0
        except RpcError:
            return False
    stock_lane = [{"kind": kind, "state": "kept"} for kind, h in produced if in_chain(stock, h)]
    strict_lane = [{"kind": kind, "state": "kept"} for kind, h in produced if in_chain(strict, h)]
    by_stock_miners = [h for kind, h in produced if kind == "stock"]
    by_strict_miners = [h for kind, h in produced if kind == "changed"]
    discarded = sum(1 for h in by_stock_miners if not in_chain(stock, h))
    follows = bool(by_strict_miners) and in_chain(stock, strict.tip()["hash"])
    stock_height, strict_height = stock.tip()["height"], strict.tip()["height"]
    rows = [{"id": "mined", "title": f"{rounds} blocks were produced", "status": "info",
             "reference": f"miners on the unmodified rules: {len(by_stock_miners)} blocks",
             "candidate": f"miners enforcing the stricter rule: {len(by_strict_miners)} blocks",
             "plain": f"{share}% of the mining power enforces the stricter rule. Its blocks are valid "
                      "to every node. Blocks from the other miners are valid only to unmodified nodes. "
                      "Here the two kinds of block arrive in an even pattern; on a real network they "
                      "arrive at random, which makes the outcome near the halfway line a matter of luck."}]
    if follows:
        rows.append({"id": "outcome", "title": "Which chain did the unmodified nodes end up following?",
                     "status": "differs", "reference": f"the stricter chain (block {stock_height})",
                     "candidate": f"the stricter chain (block {strict_height})",
                     "plain": f"The stricter chain grew fastest, so the unmodified nodes kept switching to "
                              f"it ({reorganised} times), without being upgraded and without being asked. "
                              f"{discarded} of the {len(by_stock_miners)} blocks from miners on the old "
                              "rules were discarded, along with their rewards. This is how a soft fork "
                              "takes effect for everyone: a majority of mining power refuses to build on "
                              "anything else."})
    else:
        rows.append({"id": "outcome", "title": "Which chain did the unmodified nodes end up following?",
                     "status": "differs", "reference": f"their own, at block {stock_height}",
                     "candidate": f"stricter nodes are alone at block {strict_height}",
                     "plain": "The stricter chain never became the longest, so no unmodified node ever "
                              "switched to it. The nodes enforcing the stricter rule are on a shorter "
                              "chain of their own, and the miners who enforced it earned rewards that "
                              "exist only there. Enforcing a rule without most of the mining power "
                              "splits you off; it does not bring anyone with you."})
    rows.append({"id": "threshold", "title": "Where is the line?", "status": "info",
                 "reference": "", "candidate": "",
                 "plain": "Just above half. With more than half the mining power the stricter chain "
                          "outgrows any other; with half or less it does not. Real activations have "
                          "waited for far more than half (95% in 2015, 90% in 2021), because near the "
                          "line the two sides trade places for a long time and payments on the losing "
                          "side are undone."})
    return {"rows": rows, "verdict": "tightened", "share": share,
            "headline": (f"With {share}% of mining power, the stricter rule became the rule for everyone"
                         if follows else
                         f"With {share}% of mining power, the stricter nodes were left on their own chain"),
            "picture": {"lanes": [
                {"label": "Chain the unmodified nodes follow", "blocks": stock_lane,
                 "note": f"{len(stock_lane)} blocks; {discarded} blocks from unmodified miners were discarded"},
                {"label": "Chain the stricter nodes follow", "blocks": strict_lane,
                 "note": f"{len(strict_lane)} blocks, all from miners enforcing the stricter rule"}]}}


SCENES = {"compare": scene_compare, "policy": scene_policy, "reorg": scene_reorg,
          "maturity": scene_maturity, "keys": scene_keys, "fees": scene_fees,
          "softfork": scene_softfork, "miners": scene_miners, "power": scene_power}
# Scenes that give a node a different setting instead of a different program:
# (options for the first node, options for the second).
SCENE_ARGS = {
    "policy": ([], ["-datacarriersize=83"]),
    # Room in each block for one ordinary payment and no more.
    "fees": (["-blockreservedweight=2000", "-blockmaxweight=2900"], []),
    # A node on which the 2015 rule (BIP 65) never switches on.
    "softfork": ([], ["-testactivationheight=cltv@1000000"]),
}


def main(argv=None):
    parser = argparse.ArgumentParser(description="Run one two-node lab scene on a throwaway regtest chain")
    parser.add_argument("--scene", required=True, choices=sorted(SCENES))
    parser.add_argument("--reference", required=True, help="folder holding the unmodified bitcoind")
    parser.add_argument("--candidate", required=True, help="folder holding the bitcoind under test")
    parser.add_argument("--workdir", required=True, help="empty scratch folder for both data folders")
    parser.add_argument("--ports", required=True, help="four free loopback ports, comma separated")
    parser.add_argument("--candidate-arg", action="append", default=[],
                        help="extra option for the second node (repeatable)")
    parser.add_argument("--share", type=int, default=60,
                        help="for the power scene: percent of mining power enforcing the stricter rule")
    args = parser.parse_args(argv)
    ports = [int(p) for p in args.ports.split(",")]
    if len(ports) != 4:
        parser.error("--ports needs exactly four ports")
    workdir = Path(args.workdir)
    first_args, second_args = SCENE_ARGS.get(args.scene, ([], []))
    first = LabNode("reference", args.reference, workdir, ports[0], ports[1], first_args)
    second = LabNode("candidate", args.candidate, workdir, ports[2], ports[3],
                     second_args + args.candidate_arg)
    code = 0
    try:
        step("Starting two nodes on a throwaway private chain")
        first.start()
        second.start()
        first.wait_ready()
        second.wait_ready()
        if args.scene == "power":
            result = scene_power(first, second, args.share)
        else:
            result = SCENES[args.scene](first, second)
        emit("result", result=result)
    except Exception as error:                      # noqa: BLE001 - reported to the console
        emit("error", detail=str(error)[:1200])
        code = 1
    finally:
        for node in (second, first):
            try:
                node.stop()
            except Exception:                       # noqa: BLE001
                pass
        shutil.rmtree(workdir / "reference", ignore_errors=True)
        shutil.rmtree(workdir / "candidate", ignore_errors=True)
    return code


if __name__ == "__main__":
    sys.exit(main())
