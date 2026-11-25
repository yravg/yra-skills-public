"""Compare fingerprint maps or two timelines from captureall-match.

Fingerprints: python -I compare.py target.json clone.json [slug-map.json]
  JSON files map "<section>/<slug>" -> "words:bitset" (localStorage.__fp). slug-map maps target key -> clone key.
Timelines:    python -I compare.py --timeline "<target timeline>" "<clone timeline>"
"""
import json
import sys


def overlap(a, b):
    """Jaccard of the two 256-bit word sets."""
    x, y = int(a.split(":")[1], 16), int(b.split(":")[1], 16)
    union = bin(x | y).count("1")
    return 1.0 if union == 0 else bin(x & y).count("1") / union


def fingerprints(target, clone, slugs):
    rows = {"equal": [], "close": [], "different": [], "missing": []}
    for key, a in target.items():
        b = clone.get(slugs.get(key, key))
        if b is None or "none" in (a, b):
            rows["missing"].append((key, a, b))
        elif a == b:
            rows["equal"].append((key,))
        else:
            o = overlap(a, b)
            rows["close" if o >= 0.9 else "different"].append((key, a.split(":")[0], b.split(":")[0], round(o, 2)))
    return rows


def timeline(text):
    return [(int(ms), state) for ms, state in (p.split("=", 1) for p in text.split())]


def timelines(a, b, jitter=120):
    ta, tb = timeline(a), timeline(b)
    states_b = {s: ms for ms, s in tb}
    matched = [(ms, s, states_b[s]) for ms, s in ta if s in states_b]
    drift = [m for m in matched if abs(m[0] - m[2]) > jitter]
    return {"target_states": len(ta), "clone_states": len(tb), "shared_states": len(matched),
            "same_sequence": [s for _, s in ta] == [s for _, s in tb], "drift_over_jitter": drift}


if __name__ == "__main__":
    assert timelines("0=a:1 500=b:2", "0=a:1 540=b:2")["same_sequence"]
    assert overlap("1:" + "0" * 63 + "1", "1:" + "0" * 63 + "1") == 1.0
    if sys.argv[1] == "--timeline":
        print(json.dumps(timelines(sys.argv[2], sys.argv[3]), indent=1))
    else:
        t, c = (json.load(open(p, encoding="utf-8")) for p in sys.argv[1:3])
        s = json.load(open(sys.argv[3], encoding="utf-8")) if len(sys.argv) > 3 else {}
        r = fingerprints(t, c, s)
        print({k: len(v) for k, v in r.items()})
        for k in ("different", "close", "missing"):
            for row in r[k]:
                print(k, *row)
