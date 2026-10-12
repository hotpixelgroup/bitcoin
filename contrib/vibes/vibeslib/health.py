# Copyright (c) 2026-present The Bitcoin Vibes developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Read what a running node says about itself and say it in plain words.

A node whose rules were tightened does not crash when it meets a block it
refuses. It marks the block invalid, stays where it is, and carries on
answering questions as if nothing happened. The only places it admits what
occurred are its warnings, its list of chain tips and its log. This module
reads those and turns them into alerts the operator cannot miss.
"""

import re

# Warnings every development build prints; not a sign of trouble.
ROUTINE_WARNINGS = ("pre-release test build",)

REASON_LOG = re.compile(r"\b(bad-[a-z0-9-]+|high-hash|time-too-(?:old|new)|"
                        r"(?:mandatory|block)-script-verify-flag-failed[^,)\n]*)")
BLOCK_LINE = re.compile(r"block|ConnectTip|InvalidChain", re.I)


def reject_reason(log_tail):
    """The most recent reason the node logged for refusing a block, if any."""
    reason = ""
    for line in (log_tail or "").splitlines():
        found = REASON_LOG.search(line)
        if found and BLOCK_LINE.search(line):
            reason = found.group(1)[:120]
    return reason


def node_alerts(chain, info, tips, peers, warnings, log_tail="", explain=None):
    """Alerts for the operator, most serious first.

    chain     the network the console was started on
    info      getblockchaininfo result
    tips      getchaintips result
    peers     number of connected peers
    warnings  warnings reported by the node (string or list)
    explain   optional function turning a reject code into a plain sentence
    """
    alerts = []
    if not info:
        return alerts
    height = info.get("blocks", 0)

    refused = [t for t in (tips or []) if t.get("status") == "invalid"]
    ahead = [t for t in refused if t.get("height", 0) >= height]
    if ahead:
        worst = max(ahead, key=lambda t: t.get("height", 0))
        reason = reject_reason(log_tail)
        why = ""
        if reason:
            why = " Its reason: " + (explain(reason) if explain else reason) + "."
        detail = (f"Your node is at block {height}. It has refused block "
                  f"{worst.get('height')} ({str(worst.get('hash', ''))[:16]}) and will not "
                  f"build on it.{why}")
        if chain == "regtest":
            detail += (" On this private chain that means a block was produced under different "
                       "rules from the ones this node now enforces.")
        else:
            detail += (" If the rest of the network accepts that block, your node has stopped "
                       "following the network: new blocks and payments will no longer appear "
                       "here. Undoing the source change does not clear this by itself; use "
                       "Reset in Setup and help, or restore the baseline build.")
        alerts.append({"level": "danger", "title": "Your node has refused a block",
                       "detail": detail})

    if isinstance(warnings, str):
        warnings = [warnings] if warnings else []
    for text in warnings or []:
        if not text or any(routine in text for routine in ROUTINE_WARNINGS):
            continue
        alerts.append({"level": "danger" if "invalid chain" in text.lower() else "warn",
                       "title": "The node reports a warning", "detail": str(text)[:400]})

    headers = info.get("headers", height)
    if not info.get("initialblockdownload") and headers - height > 6:
        alerts.append({"level": "warn", "title": "Your node is behind the headers it has seen",
                       "detail": f"It knows of block headers up to {headers} but has only "
                                 f"accepted blocks up to {height}. It is either still "
                                 "downloading, or it is refusing the blocks on offer."})

    if chain != "regtest" and peers == 0 and not info.get("initialblockdownload"):
        alerts.append({"level": "warn", "title": "No peers connected",
                       "detail": "Your node is not connected to any other node, so it cannot "
                                 "learn about new blocks. Peers also disconnect a node that "
                                 "sends them blocks they consider invalid."})
    return alerts
