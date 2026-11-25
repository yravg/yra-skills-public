"""Generic graph backend for the Second Brain + Local graph front-end.

Two independent pieces:

1. ``WikiVault`` — indexes a folder of Markdown notes that link with
   ``[[wikilinks]]`` (Obsidian style). Gives ``graph()`` (whole vault) and
   ``local_graph(focus)`` (1-hop star), plus ``expand()`` for chat context.
2. ``star_around`` / ``merge_live_neighbors`` — build a star for *any* entity
   (a ticket, a letter, a COP) from explicit neighbour lists, and attach
   live records that reference the focus by text.

Both emit the node/edge contract the JS expects:
    node = {id, label, title, group, kind, degree, focus?, via?, note?, color?}
    edge = {source, target}

Optional FastAPI wiring at the bottom (``make_router``).
Run ``python graph_api.py`` for the self-check.
"""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Callable, Iterable

WIKILINK = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)

# Group (folder) -> colour. Semantic themes (Canopy) keep these; others use the palette.
FOLDER_COLORS = {
    "00 Meta": "#f1c453", "10 Contract": "#6fb3ff", "20 Tables": "#8fd9e6",
    "30 Mechanisms & Risks": "#ff8a80", "40 Templates": "#c8a4ff", "50 Registers": "#7fd1a6",
    "60 Chat Imports": "#c9c9c9", "65 Learning": "#ffb347", "80 WI": "#5ee0c8",
}
HUB_NAMES = {"Home"}          # omitted from local graphs unless include_hubs
HUB_TYPES = {"moc"}           # frontmatter type: moc → hub
LIVE_NEIGHBOR_CAP = 40


class Note:
    __slots__ = ("name", "path", "group", "meta", "links", "backlinks", "body")

    def __init__(self, name: str, path: Path, group: str, meta: dict, links: list[str], body: str):
        self.name, self.path, self.group, self.meta, self.links, self.body = name, path, group, meta, links, body
        self.backlinks: set[str] = set()


def parse_frontmatter(text: str) -> tuple[dict, str]:
    m = FRONTMATTER.match(text)
    if not m:
        return {}, text
    meta: dict = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            meta[k.strip()] = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
        else:
            meta[k.strip()] = v.strip("'\"")
    return meta, text[m.end():]


class WikiVault:
    def __init__(self, root: str | Path, hub_names: set[str] = HUB_NAMES, hub_types: set[str] = HUB_TYPES):
        self.root = Path(root)
        self.hub_names, self.hub_types = hub_names, hub_types
        self.notes: dict[str, Note] = {}
        self.reload()

    def reload(self) -> None:
        notes: dict[str, Note] = {}
        for p in self.root.rglob("*.md"):
            if any(part.startswith(".") for part in p.relative_to(self.root).parts):
                continue
            text = p.read_text(encoding="utf-8", errors="replace")
            meta, body = parse_frontmatter(text)
            rel = p.relative_to(self.root)
            group = rel.parts[0] if len(rel.parts) > 1 else "root"
            links = list(dict.fromkeys(l.strip() for l in WIKILINK.findall(body)))
            notes[p.stem] = Note(p.stem, p, group, meta, links, body)
        for n in notes.values():
            for l in n.links:
                if l in notes:
                    notes[l].backlinks.add(n.name)
        self.notes = notes

    def is_hub(self, n: Note) -> bool:
        return n.name in self.hub_names or str(n.meta.get("type", "")) in self.hub_types

    def _node(self, n: Note, **extra) -> dict:
        d = {"id": n.name, "label": n.name, "title": n.name, "group": n.group, "kind": "note",
             "degree": len([l for l in n.links if l in self.notes]) + len(n.backlinks),
             "color": FOLDER_COLORS.get(n.group)}
        d.update(extra)
        return d

    def graph(self) -> dict:
        nodes = [self._node(n) for n in self.notes.values()]
        edges, seen = [], set()
        for n in self.notes.values():
            for l in n.links:
                if l in self.notes and (n.name, l) not in seen:
                    seen.add((n.name, l)); edges.append({"source": n.name, "target": l})
        return {"nodes": nodes, "edges": edges}

    def local_graph(self, focus: str, include_hubs: bool = False) -> dict:
        f = self.notes.get(focus)
        if not f:
            return {"focus": focus, "nodes": [], "edges": []}
        out = [l for l in f.links if l in self.notes]
        inc = sorted(f.backlinks)
        nodes = [self._node(f, focus=True, via="focus")]
        edges = []
        for name in dict.fromkeys(out + inc):
            n = self.notes[name]
            if not include_hubs and self.is_hub(n):
                continue
            via = "both" if name in out and name in inc else "out" if name in out else "in"
            nodes.append(self._node(n, via=via))
            edges.append({"source": focus, "target": name} if via != "in" else {"source": name, "target": focus})
        return {"focus": focus, "nodes": nodes, "edges": edges}

    def expand(self, names: Iterable[str], hops: int = 1) -> list[str]:
        """Names plus their wikilink neighbours, ``hops`` deep. Used for chat context."""
        seen = list(dict.fromkeys(n for n in names if n in self.notes))
        frontier = list(seen)
        for _ in range(hops):
            nxt = []
            for name in frontier:
                for l in self.notes[name].links:
                    if l in self.notes and l not in seen:
                        seen.append(l); nxt.append(l)
            frontier = nxt
        return seen


# ---------- stars for non-note entities ----------
def star_around(focus: dict, neighbors: list[dict]) -> dict:
    """focus = {id,label,kind,...}; neighbors = [{id,label,kind,via?,...}]."""
    nodes = [dict(focus, focus=True, via="focus", degree=len(neighbors))]
    edges = []
    for n in neighbors:
        nodes.append(dict(n, via=n.get("via", "out"), degree=n.get("degree", 1)))
        edges.append({"source": focus["id"], "target": n["id"]})
    return {"focus": focus["id"], "nodes": nodes, "edges": edges}


def merge_live_neighbors(graph: dict, records: Iterable[dict], mentions: Callable[[dict, str], bool],
                         to_node: Callable[[dict], dict], cap: int = LIVE_NEIGHBOR_CAP) -> dict:
    """Attach live records (letters, tickets…) whose text mentions the focus, as via='in'."""
    focus = graph["focus"]; have = {n["id"] for n in graph["nodes"]}; added = 0
    for r in records:
        if added >= cap:
            break
        if not mentions(r, focus):
            continue
        n = to_node(r)
        if n["id"] in have:
            continue
        have.add(n["id"]); added += 1
        graph["nodes"].append(dict(n, via="in", degree=n.get("degree", 1)))
        graph["edges"].append({"source": n["id"], "target": focus})
    return graph


# ---------- citation → contract hub ----------
CITE_PATTERNS = {
    "article": re.compile(r"\bArticle\s+(\d+(?:\.\d+)*)", re.I),
    "exhibit": re.compile(r"\bExhibit\s+([A-L])\b", re.I),
    "annex": re.compile(r"\bAnnex\s+([1-7])\b", re.I),
}


def parse_cites(text: str, hub_note: Callable[[str, str], str | None]) -> list[dict]:
    """Return contract hub nodes for citations found in ``text``.
    hub_note(kind, ident) -> vault note name (or None to skip)."""
    out, seen = [], set()
    for kind, rx in CITE_PATTERNS.items():
        for m in rx.finditer(text):
            ident = m.group(1).upper()
            key = f"contract:{kind}:{ident}"
            if key in seen:
                continue
            seen.add(key)
            out.append({"id": key, "label": f"{kind.title()} {ident}", "kind": "contract",
                        "group": "10 Contract", "note": hub_note(kind, ident), "color": FOLDER_COLORS["10 Contract"]})
    return out


# ---------- FastAPI (optional) ----------
def make_router(vault: WikiVault, entity_graph: Callable[[str, str, bool], dict] | None = None):
    """GET /graph?layer=vault|<other>&focus=&hubs=0|1
    layer=vault → WikiVault; any other layer → entity_graph(layer, focus, hubs)."""
    from fastapi import APIRouter  # type: ignore
    r = APIRouter()

    @r.get("/graph")
    def graph(layer: str = "vault", focus: str = "", hubs: int = 0):
        if layer == "vault":
            return vault.local_graph(focus, bool(hubs)) if focus else vault.graph()
        if entity_graph is None:
            return {"nodes": [], "edges": []}
        return entity_graph(layer, focus, bool(hubs))
    return r


if __name__ == "__main__":
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        (root / "10 Contract").mkdir(); (root / "00 Meta").mkdir()
        (root / "00 Meta" / "Home.md").write_text("---\ntype: moc\n---\n[[Exhibit B]] [[Article 7]]", encoding="utf-8")
        (root / "10 Contract" / "Exhibit B.md").write_text("---\ntags: [pricing]\n---\nSee [[Article 7|art 7]] and [[Article 7#Rates]]", encoding="utf-8")
        (root / "10 Contract" / "Article 7.md").write_text("Body", encoding="utf-8")
        v = WikiVault(root)
        g = v.graph()
        assert {n["id"] for n in g["nodes"]} == {"Home", "Exhibit B", "Article 7"}
        assert {(e["source"], e["target"]) for e in g["edges"]} == {("Home", "Exhibit B"), ("Home", "Article 7"), ("Exhibit B", "Article 7")}
        lg = v.local_graph("Article 7")
        assert [n["id"] for n in lg["nodes"]] == ["Article 7", "Exhibit B"], lg   # Home hidden (moc)
        assert lg["nodes"][1]["via"] == "in"
        assert v.local_graph("Article 7", include_hubs=True)["nodes"][-1]["id"] == "Home"
        assert v.expand(["Home"]) == ["Home", "Exhibit B", "Article 7"]
        assert v.notes["Exhibit B"].meta["tags"] == ["pricing"]
        cites = parse_cites("per Article 7.2 and Exhibit b", lambda k, i: f"{k}-{i}")
        assert [c["id"] for c in cites] == ["contract:article:7.2", "contract:exhibit:B"]
        s = star_around({"id": "WI-1", "label": "WI-1", "kind": "wi"}, [{"id": "COP-3", "label": "COP-3", "kind": "cop"}])
        s = merge_live_neighbors(s, [{"id": "L-9", "text": "re WI-1"}], lambda r, f: f in r["text"], lambda r: {"id": r["id"], "label": r["id"], "kind": "letter"})
        assert [n["id"] for n in s["nodes"]] == ["WI-1", "COP-3", "L-9"] and s["nodes"][2]["via"] == "in"
    print("graph_api self-check OK")
