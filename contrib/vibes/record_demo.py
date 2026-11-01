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
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from vibeslib import lessons  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--url", default="http://127.0.0.1:21212")
    parser.add_argument("--repo", default=str(HERE.parents[1]), help="repo whose console is running")
    parser.add_argument("--ready", action="store_true", help="use already-built changed nodes instead of compiling proposals")
    parser.add_argument("--timeout", type=float, default=1800, help="maximum seconds per experiment")
    parser.add_argument("--out", type=Path, default=HERE / "web/demo-data.js", help="output recording file")
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error('--timeout must be positive')
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
            comparison = summary.get("compare") or {}
            if summary["state"] not in ("done", "review") or not comparison or comparison.get("verdict") == "inconclusive":
                sys.exit(f"{item['id']} produced no comparison: {summary.get('error')}")
            if any(row.get("status") in ("error", "skipped") for row in comparison.get("rows", [])):
                sys.exit(f"{item['id']} has an incomplete observation; existing recordings were preserved")
            name = item["id"] if share is None else f"{item['id']}@{share}"
            print(f"{name}: {summary['compare']['headline']}", flush=True)
            recorded[name] = {
                "compare": summary["compare"], "patch": summary.get("patch", "")[:6000],
                "files": summary.get("files", []),
                "unit_failures": summary.get("unit_failures") if summary.get("test_status") in ("passed", "findings") and item["kind"] == "patch" else None,
                "ready_made": bool(summary.get("ready_made")),
                "build_status": summary.get("build_status", "not run"),
                "test_status": summary.get("test_status", "not run"),
                "risk": summary.get("risk") or [], "sensitive": summary.get("sensitive") or []}
            if summary["state"] == "review":
                call("/api/cancel", {})       # the next experiment starts from unmodified source
                time.sleep(1)
    today = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    header = ("'use strict';\n"
              f"// Results recorded from real runs of the lab on {today}: two real nodes on\n"
              "// a throwaway regtest chain. Regenerate with contrib/vibes/record_demo.py.\n"
              "// Each slider position has its own recording; no inputs are rounded.\n")
    target = args.out.resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(".js.tmp")
    temporary.write_text(header + "window.VibesDemoData = " + json.dumps(recorded, indent=1) + ";\n")
    temporary.replace(target)
    print("wrote", target)


if __name__ == "__main__":
    main()
