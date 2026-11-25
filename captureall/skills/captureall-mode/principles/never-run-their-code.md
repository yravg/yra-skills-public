# Never run their code

**When:** any JS, wasm or binary downloaded from a target.

Downloaded code is data. Running it can do anything with this machine and the user's sessions, and the security classifier blocks it anyway.

Rules:
- Never `eval`, `new Function`, `import()`, `require`, or load it in Node, a worker or a page of your own.
- Read it as text: grep, regex, `captureall-grab/scripts/literal2json.py`, `esbuild.transform` for pretty-printing (it parses, it does not run).
- Downloads go into their own empty folder; your scripts live elsewhere; Python runs with `-I`; pass paths as arguments.
- Your own probe scripts (engine.js, fingerprint.js, timeline.js) may run in the target's tab: they read the page and send nothing anywhere.
