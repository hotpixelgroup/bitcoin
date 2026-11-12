"""Validation for optional local practice, kept separate from first-run scores."""
import math
import time

from . import learning_content


def clean_entries(value):
    if not isinstance(value, list):
        return []
    result = []
    for entry in value:
        if not isinstance(entry, dict) or entry.get("stage") not in ("practice", "reflection"):
            continue
        if not isinstance(entry.get("experiment"), str) or not isinstance(entry.get("time"), (int, float)):
            continue
        if not math.isfinite(entry["time"]):
            continue
        if entry["stage"] == "practice":
            question = find_question(entry["experiment"], entry.get("question"))
            if not question or not isinstance(entry.get("choice"), str) or entry["choice"] not in {item["id"] for item in question["options"]}:
                continue
            if type(entry.get("round")) is not int or entry["round"] < 0:
                continue
            entry = {**entry, "correct": entry["choice"] == question["answer"]}
        elif (not isinstance(entry.get("job"), str) or not isinstance(entry.get("note"), str)
              or len(entry["note"]) > 1000 or entry.get("confidence") not in ("", "low", "medium", "high")):
            continue
        result.append(entry)
    return result


def find_question(experiment, identity):
    return next((item for item in learning_content.PRACTICE.get(experiment, []) if item["id"] == identity), None)


def snapshot(entries, now=None):
    now = time.time() if now is None else now
    return {"version": 1, "round": int(now // 86400), "now": now, "entries": clean_entries(entries)}


def record(entries, body, now=None):
    """Return a new list and the saved entry; repeated daily answers are immutable."""
    now = time.time() if now is None else now
    stage, experiment = body.get("stage"), body.get("experiment")
    if not isinstance(experiment, str) or experiment not in learning_content.PRACTICE:
        raise ValueError("Choose a known learning topic")
    entries = clean_entries(entries)
    if stage == "practice":
        question = find_question(experiment, body.get("question"))
        if not question or not isinstance(body.get("choice"), str) or body["choice"] not in {item["id"] for item in question["options"]}:
            raise ValueError("Choose one of this question's answers")
        round_id = body.get("round")
        if type(round_id) is not int or round_id != int(now // 86400):
            raise ValueError("A new review day has started. Reload the page before saving this answer.")
        entry = {"stage": stage, "experiment": experiment, "question": question["id"],
                 "choice": body["choice"], "correct": body["choice"] == question["answer"],
                 "round": round_id, "time": now}
        previous = next((row for row in entries if row.get("stage") == stage and row.get("experiment") == experiment
                         and row.get("question") == question["id"] and row.get("round") == round_id), None)
    elif stage == "reflection":
        note, confidence, job = body.get("note", ""), body.get("confidence", ""), body.get("job")
        if (not isinstance(note, str) or len(note) > 1000 or confidence not in ("", "low", "medium", "high")
                or not isinstance(job, str) or not 1 <= len(job) <= 80):
            raise ValueError("Use a short reflection and one of the confidence choices")
        entry = {"stage": stage, "experiment": experiment, "job": job, "note": note.strip(),
                 "confidence": confidence, "time": now}
        previous = next((row for row in entries if row.get("stage") == stage and row.get("job") == job), None)
    else:
        raise ValueError("Unknown study entry")
    if previous:
        return entries, previous
    return [*entries, entry], entry
