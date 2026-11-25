"""Check a pstack-style plugin folder. Usage: python -I check_plugin.py <plugin_dir>"""
import json
import re
import sys
from pathlib import Path


def frontmatter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\r?\n(.*?)\r?\n---", text, re.S)
    if not m:
        return None, text
    # shortcut: reads top-level "key: value" lines only, no full YAML; enough for name/description
    fields = dict(re.findall(r"^([\w-]+):\s*(.*)$", m.group(1), re.M))
    return fields, text


def check(root):
    fails = []
    root = Path(root)
    manifest = root / ".claude-plugin" / "plugin.json"
    try:
        slug = json.loads(manifest.read_text(encoding="utf-8"))["name"]
    except (OSError, ValueError, KeyError) as e:
        return [f"plugin.json missing or has no name: {e}"]

    for f in ["README.md", f"agents/{slug}-agent.md"]:
        if not (root / f).is_file():
            fails.append(f"missing {f}")

    skills = root / "skills"
    for name in [slug, f"{slug}-mode", f"{slug}-help"]:
        if not (skills / name / "SKILL.md").is_file():
            fails.append(f"missing skills/{name}/SKILL.md")

    for sk in sorted(skills.glob("*/SKILL.md")) if skills.is_dir() else []:
        fm, text = frontmatter(sk)
        d = sk.parent.name
        if fm is None:
            fails.append(f"{d}: no frontmatter")
            continue
        if fm.get("name") != d:
            fails.append(f"{d}: frontmatter name '{fm.get('name')}' != folder")
        if not fm.get("description"):
            fails.append(f"{d}: no description")
        if "<slug>" in text or "<Name>" in text:
            fails.append(f"{d}: template placeholder left")

    mode = skills / f"{slug}-mode"
    if (mode / "SKILL.md").is_file():
        text = (mode / "SKILL.md").read_text(encoding="utf-8")
        listed = set(re.findall(r"`(?:\w+/)?([\w.-]+\.md)`", text))
        all_md = {p.name for p in mode.glob("*/*.md")}
        for f in sorted(listed - all_md - {"SKILL.md"}):
            fails.append(f"mode: names {f} but no such file")
        for sub in ["principles", "playbooks"]:
            on_disk = {p.name for p in (mode / sub).glob("*.md")}
            if not on_disk:
                fails.append(f"mode: no {sub}/*.md")
            for f in sorted(on_disk - listed):
                fails.append(f"mode: {sub}/{f} not named in SKILL.md")
        for pb in sorted((mode / "playbooks").glob("*.md")):
            if "**Reply:**" not in pb.read_text(encoding="utf-8"):
                fails.append(f"playbook {pb.name}: no **Reply:** line")
        for pr in sorted((mode / "principles").glob("*.md")):
            if "**When:**" not in pr.read_text(encoding="utf-8"):
                fails.append(f"principle {pr.name}: no **When:** line")

    agent = root / "agents" / f"{slug}-agent.md"
    if agent.is_file():
        fm, _ = frontmatter(agent)
        if not fm or fm.get("name") != f"{slug}-agent" or not fm.get("description"):
            fails.append("agent: frontmatter needs name and description")
    return fails


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    fails = check(sys.argv[1])
    for f in fails:
        print("FAIL", f)
    print("OK" if not fails else f"{len(fails)} problem(s)")
    sys.exit(1 if fails else 0)
