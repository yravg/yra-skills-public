"""Print the `.stage <descendant>` rules of a demo stylesheet (top level and inside @media), which size a demo on the
target's item page. `.stage:has(...)` and other rules styling the stage box itself are left out.

Usage: python -I stage_rules.py <demo.css> [more.css ...]
"""
import re
import sys


def blocks(css):
    """Top-level (prelude, body) pairs of minified CSS."""
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0:
            break
        depth, k = 1, j + 1
        while depth:
            depth += {"{": 1, "}": -1}.get(css[k], 0)
            k += 1
        out.append((css[i:j].strip(), css[j + 1:k - 1]))
        i = k
    return out


def staged(prelude):
    return any(re.match(r"\.stage\s", s.strip()) for s in prelude.split(","))


def stage_rules(css):
    keep = []
    for pre, body in blocks(css):
        if pre.startswith("@media") or pre.startswith("@container"):
            inner = [f"{p}{{{b}}}" for p, b in blocks(body) if staged(p)]
            if inner:
                keep.append(f"{pre}{{{''.join(inner)}}}")
        elif not pre.startswith("@") and staged(pre):
            keep.append(f"{pre}{{{body}}}")
    return "".join(keep)


if __name__ == "__main__":
    sample = ".x{a:1}.stage .x{zoom:1.1}.stage:has(.x){b:2}@media (width<=760px){.stage .x{zoom:1}.y{c:3}}"
    assert stage_rules(sample) == ".stage .x{zoom:1.1}@media (width<=760px){.stage .x{zoom:1}}", stage_rules(sample)
    print("".join(stage_rules(open(f, encoding="utf-8").read()) for f in sys.argv[1:]))
