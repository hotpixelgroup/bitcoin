#!/usr/bin/env python3
# Copyright (c) 2026-present The Bitcoin Vibes developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Record real results of the ready-made experiments for the browser demo.

The demo never invents an outcome: it replays what the lab observed. Run this
against a console that is already running on unmodified source with a
reference node ready (start it with `./vibes --no-open`, then Build & check):

    python3 contrib/vibes/record_demo.py --url http://127.0.0.1:21212

It runs each ready-made experiment in turn through the console's own API,
discards each proposal afterwards, and rewrites web/demo-data.js. The three
experiments that change source each compile the node unless --ready is used
with already-built variants. Ready-made runs record unit tests as not run.
"""
import argparse
import datetime
import json
import math
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from vibeslib import lessons  # noqa: E402


def checked_comparison(item, share, summary):
    """Require a complete observation for this exact supported input."""
    comparison = summary.get("compare")
    if (summary.get("state") not in ("done", "review") or not isinstance(comparison, dict)
            or comparison.get("verdict") not in lessons.VERDICTS
            or comparison.get("verdict") == "inconclusive"):
        raise ValueError(f"{item['id']} produced no completed comparison: {summary.get('error')}")
    rows = comparison.get("rows")
    if (not isinstance(rows, list) or not rows
            or any(not isinstance(row, dict) or row.get("status") not in ("same", "differs", "info")
                   for row in rows)):
        raise ValueError(f"{item['id']} has an incomplete observation; existing recordings were preserved")
    if not isinstance(comparison.get("headline"), str) or not comparison["headline"].strip():
        raise ValueError(f"{item['id']} has no recorded headline")
    if item["kind"] == "scene":
        observed = comparison.get("observed_answer")
        if not isinstance(observed, str) or observed not in {option["id"] for option in item["options"]}:
            raise ValueError(f"{item['id']} has no valid observed answer")
        expected = lessons.expected_answer(item)
        if expected is not None and observed != expected:
            raise ValueError(f"{item['id']} did not demonstrate its expected outcome")
    elif comparison["verdict"] != item["expected"]:
        raise ValueError(f"{item['id']} did not demonstrate its expected outcome")
    if share is not None and (type(comparison.get("share")) is not int or comparison["share"] != share):
        raise ValueError(f"{item['id']} did not record the requested share of {share}%")
    return comparison


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--url", default="http://127.0.0.1:21212")
    parser.add_argument("--repo", default=str(HERE.parents[1]), help="repo whose console is running")
    parser.add_argument("--ready", action="store_true", help="use already-built changed nodes instead of compiling proposals")
    parser.add_argument("--timeout", type=float, default=1800, help="maximum seconds per experiment")
    parser.add_argument("--out", type=Path, default=HERE / "web/demo-data.js", help="output recording file")
    args = parser.parse_args()
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error('--timeout must be finite and positive')
    key = (Path(args.repo) / ".vibes/key").read_text().strip()

    def call(path, body=None):
        request = urllib.request.Request(
            args.url + path, data=json.dumps(body).encode() if body is not None else None,
            headers={"X-Vibe-Key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            sys.exit(f"{path}: {json.load(error).get('error')}")

    def discard_owned_review(job_id):
        # A failed recording must not leave its compiled proposal blocking the
        # next attempt. Never discard a different job started by the operator.
        try:
            current = call("/api/status").get("job") or {}
            if current.get("id") == job_id and current.get("state") == "review":
                call("/api/cancel", {})
                time.sleep(1)
        except (Exception, SystemExit) as error:
            print(f"Could not discard recording proposal {job_id}: {error}", file=sys.stderr)

    recorded = {}
    # The source changes first, compiled, so their changed nodes exist for the
    # scenes that need one.
    ordered = sorted(lessons.CURATED, key=lambda item: item["kind"] != "patch")
    for item in ordered:
        slider = item.get("slider")
        shares = range(slider["min"], slider["max"] + 1, slider["step"]) if slider else [None]
        for share in shares:
            body = {"id": item["id"], "prediction": lessons.expected_answer(item, share),
                    "compile": item["kind"] == "patch" and not args.ready}
            if share is not None:
                body["share"] = share
            job = call("/api/curated", body)["job"]
            try:
                deadline = time.monotonic() + args.timeout
                while True:
                    current = call("/api/status").get("job") or {}
                    if current.get("id") != job["id"]:
                        sys.exit("Another experiment replaced the recording job; recording stopped")
                    if current.get("state") not in ("running", "cancelling"):
                        break
                    if time.monotonic() >= deadline:
                        call("/api/cancel", {})
                        sys.exit(f"{item['id']} did not finish within {args.timeout:g} seconds")
                    time.sleep(2)
                summary = call("/api/experiment?id=" + job["id"])["summary"]
                if summary.get("id") != job["id"] or summary.get("curated") != item["id"]:
                    sys.exit("The console returned a result for a different recording job")
                try:
                    comparison = checked_comparison(item, share, summary)
                except ValueError as error:
                    sys.exit(str(error))
                name = item["id"] if share is None else f"{item['id']}@{share}"
                print(f"{name}: {comparison['headline']}", flush=True)
                recorded[name] = {
                    "compare": comparison, "patch": summary.get("patch", "")[:6000],
                    "files": summary.get("files", []),
                    "unit_failures": summary.get("unit_failures") if summary.get("test_status") in ("passed", "findings") and item["kind"] == "patch" else None,
                    "ready_made": bool(summary.get("ready_made")),
                    "build_status": summary.get("build_status", "not run"),
                    "test_status": summary.get("test_status", "not run"),
                    "risk": summary.get("risk") or [], "sensitive": summary.get("sensitive") or []}
            finally:
                discard_owned_review(job["id"])
    today = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    upstream = dict(line.split("=", 1) for line in (HERE / "UPSTREAM").read_text().splitlines() if "=" in line and not line.startswith("#"))
    header = ("'use strict';\n"
              f"// Results recorded from real runs of the lab on {today}: two real nodes on\n"
              "// a throwaway regtest chain. Regenerate with contrib/vibes/record_demo.py.\n"
              f"// Bitcoin Core {upstream['version']}, upstream commit {upstream['commit']}.\n"
              "// Each slider position has its own recording; no inputs are rounded.\n")
    target = args.out.resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(".js.tmp")
    temporary.write_text(header + "window.VibesDemoData = " + json.dumps(recorded, indent=1) + ";\n")
    temporary.replace(target)
    print("wrote", target)


if __name__ == "__main__":
    main()
