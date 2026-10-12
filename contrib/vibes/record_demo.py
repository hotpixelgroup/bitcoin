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
experiments that change source each compile the node.
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
    args = parser.parse_args()
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
        shares = range(slider["min"], slider["max"] + 1, 10) if slider else [None]
        for share in shares:
            body = {"id": item["id"], "prediction": lessons.expected_answer(item, share),
                    "compile": item["kind"] == "patch"}
            if share is not None:
                body["share"] = share
            job = call("/api/curated", body)["job"]
            while call("/api/status")["job"]["state"] in ("running", "cancelling"):
                time.sleep(2)
            summary = call("/api/experiment?id=" + job["id"])["summary"]
            if not summary.get("compare"):
                sys.exit(f"{item['id']} produced no comparison: {summary.get('error')}")
            name = item["id"] if share is None else f"{item['id']}@{share}"
            print(f"{name}: {summary['compare']['headline']}")
            recorded[name] = {
                "compare": summary["compare"], "patch": summary.get("patch", "")[:6000],
                "files": summary.get("files", []), "unit_failures": summary.get("unit_failures") or [],
                "risk": summary.get("risk") or [], "sensitive": summary.get("sensitive") or []}
            if summary["state"] == "review":
                call("/api/cancel", {})       # the next experiment starts from unmodified source
                time.sleep(1)
    today = datetime.date.today().strftime("%-d %B %Y")
    header = ("'use strict';\n"
              f"// Results recorded from real runs of the lab on {today}: two real nodes on\n"
              "// a throwaway regtest chain. Regenerate with contrib/vibes/record_demo.py.\n"
              "// Block hashes differ on every run; outcomes and reasons do not.\n")
    (HERE / "web/demo-data.js").write_text(header + "window.VibesDemoData = " + json.dumps(recorded, indent=1) + ";\n")
    print("wrote web/demo-data.js")


if __name__ == "__main__":
    main()
