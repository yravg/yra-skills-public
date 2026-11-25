#!/usr/bin/env python3
"""Call Refero MCP. Usage: refero.py tools | refero.py call <tool> '<json>' | refero.py self-check"""

import json
import os
import sys
import urllib.error
import urllib.request

URL = "https://api.refero.design/mcp"


def token():
    env = os.environ.get("REFERO_MCP_TOKEN", "").strip()
    if env:
        return env
    path = os.path.expanduser("~/.cursor/mcp.json")
    with open(path, encoding="utf-8") as f:
        servers = json.load(f).get("mcpServers") or {}
    for name, cfg in servers.items():
        if name.lower() != "refero":
            continue
        auth = ((cfg.get("headers") or {}).get("Authorization") or "").strip()
        if auth.lower().startswith("bearer "):
            return auth.split(" ", 1)[1].strip()
        if auth:
            return auth
    sys.exit("Refero token missing. Set REFERO_MCP_TOKEN or add Refero to ~/.cursor/mcp.json.")


def parse(raw):
    raw = raw.strip()
    if not raw:
        return None
    if raw[0] in "{[":
        return json.loads(raw)
    msgs = []
    for block in raw.split("\n\n"):
        data = "\n".join(
            line[5:].strip() for line in block.splitlines() if line.startswith("data:")
        )
        if data and data != "[DONE]":
            msgs.append(json.loads(data))
    if not msgs:
        return None
    return msgs[-1] if len(msgs) == 1 else msgs


def post(body, session=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer " + token(),
        "MCP-Protocol-Version": "2025-03-26",
    }
    if session:
        headers["Mcp-Session-Id"] = session
    req = urllib.request.Request(URL, json.dumps(body).encode(), headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            sid = res.headers.get("mcp-session-id") or session
            return sid, parse(res.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        sys.exit(f"Refero HTTP {e.code}: {detail}")


def rpc(method, params, session, req_id):
    body = {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params}
    return post(body, session)


def session():
    sid, init = post(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "refero-skill", "version": "1"},
            },
        }
    )
    if isinstance(init, dict) and init.get("error"):
        sys.exit(json.dumps(init["error"]))
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, sid)
    return sid


def text_of(res):
    if not isinstance(res, dict):
        return json.dumps(res)
    if res.get("error"):
        return json.dumps(res["error"])
    result = res.get("result", res)
    content = result.get("content") if isinstance(result, dict) else None
    if isinstance(content, list):
        parts = [c.get("text", "") for c in content if isinstance(c, dict)]
        if any(parts):
            return "\n".join(parts)
    return json.dumps(result, indent=2)


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print("usage: refero.py tools | refero.py call <tool> '<json>' | refero.py self-check")
        return 2
    sid = session()
    cmd = argv[1]
    if cmd == "tools":
        _, res = rpc("tools/list", {}, sid, 2)
        print(text_of(res))
        return 0
    if cmd == "self-check":
        _, res = rpc(
            "tools/call",
            {
                "name": "refero_search_styles",
                "arguments": {"query": "developer tool", "page": 1, "response_format": "json"},
            },
            sid,
            2,
        )
        body = text_of(res)
        if "uuid" not in body and "title" not in body:
            sys.exit("self-check failed:\n" + body[:500])
        print("ok")
        return 0
    if cmd == "call":
        if len(argv) < 3:
            sys.exit("usage: refero.py call <tool> '<json>'")
        args = json.loads(argv[3] if len(argv) > 3 else "{}")
        _, res = rpc("tools/call", {"name": argv[2], "arguments": args}, sid, 2)
        print(text_of(res))
        return 0
    sys.exit("usage: refero.py tools | refero.py call <tool> '<json>' | refero.py self-check")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
