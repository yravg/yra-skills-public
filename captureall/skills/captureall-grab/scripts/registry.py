"""Map a Vite entry bundle's lazy imports to their dependency chunks and stylesheets, reading it as text only.

Usage: python -I registry.py <assets/index-<hash>.js>  > registry.json
Output: {"demo-ab12.js": {"deps": ["react-x.js", ...], "css": ["demo-cd34.css"]}, ...}
Never executes the bundle.
"""
import json
import re
import sys


def registry(text):
    m = re.search(r"m\.f=\[(.*?)\]\)", text, re.S)  # __vite__mapDeps file table
    files = json.loads("[" + m.group(1) + "]") if m else []
    out = {}
    for imp in re.finditer(r"import\(\s*[`\"']\./([^`\"']+\.js)[`\"']\s*\)(?:\s*,\s*__vite__mapDeps\(\[([\d,\s]*)\]\))?", text):
        name, idx = imp.group(1), imp.group(2)
        deps = [files[int(i)].split("/")[-1] for i in idx.split(",") if i.strip()] if idx and files else []
        out[name] = {"deps": [d for d in deps if d.endswith(".js") and d != name], "css": [d for d in deps if d.endswith(".css")]}
    return out


if __name__ == "__main__":
    data = registry(open(sys.argv[1], encoding="utf-8").read())
    json.dump(data, sys.stdout, indent=1)
    print(f"\n# {len(data)} lazy chunks", file=sys.stderr)
