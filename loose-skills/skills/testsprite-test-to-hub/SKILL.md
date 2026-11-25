---
name: testsprite-test-to-hub
description: "Use when asked for /testsprite-test-to-hub, or to send QA or test results to the yraverage Hub. Runs /testsprite-test, then records the run on the Hub's Tests tab (qa_report, with evidence) and files failing cases as Bugfix cards (qa_defect)."
version: 1.0.0
platforms: [windows, macos, linux]
metadata:
  hermes:
    tags: [testing, qa, testsprite, yraverage-hub, mcp]
---

# /testsprite-test-to-hub

This runs the `/testsprite-test` loop, then connects the result to the yraverage Hub:
- **qa_report**: the run, one step per case, a markdown summary and the screenshots and videos appear on the project's **Tests** tab, linked to the card that was tested.
- **qa_defect**: each failing case becomes a card in the **Bugfix** workflow, at stage `agent-reproduce`, with steps to reproduce, expected and actual results, and a link to the run.
- The `qa/` checklist (cases and their last result) shows on the Tests tab by itself once the project's folder is linked.

## Before you start

- **The Hub is up:** `curl -s -o /dev/null -w "%{http_code}" http://localhost:49099/` returns 307 or 200. The Hub URL comes from the project's `.yraverage/project.json`, else `YRAVERAGE_HUB`, else `http://localhost:49099`.
- **`~/.yraverage/hub.mjs` exists.** It is the Hub link script, and `qa-to-hub.mjs` borrows its credentials from it, so no key ever reaches a command line.
- **The folder is linked.** `.yraverage/project.json` exists. If not, run `node ~/.yraverage/hub.mjs link` once from the project root.
- **You have an agent identity.** Use `--agent <name>` (the key file is `~/.yraverage/agents/<name>.key`), or set `YRAVERAGE_HUB_KEY`, or rely on this machine's enrolment in `~/.yraverage/hub.json`. If none exists, ask the owner for the Hub's "Copy agent prompt" token and run `node ~/.yraverage/hub.mjs enrol --token T --name <agent>`. Never print a key.

## Steps

1. **Run `/testsprite-test`** steps 1 to 7. You need a fresh `qa/runs/<run>.json`.
2. **Find the card.** `node ~/.yraverage/hub.mjs status` shows the board. If you claimed a card for this work, pass its code (`T-03-04`) as `--card`. An unknown code makes the report fail, so check it first with `node ~/.yraverage/hub.mjs call board_get_card '{"project":"<id>","code":"T-03-04"}'`.
3. **Dry run** to see exactly what will be sent, with no network calls:
   ```bash
   node ~/.yraverage/qa/qa-to-hub.mjs --card T-03-04 --dry-run
   ```
4. **Send:**
   ```bash
   node ~/.yraverage/qa/qa-to-hub.mjs --card T-03-04 --defects --agent <name>
   ```
   - It sends the newest run by default. `--run <id>` picks another.
   - `--defects` files one Bugfix card per failing case. Severity follows the case priority (high, medium or low). A case that already has an open defect titled `TCnnn: ...` is skipped, so running it again does not create duplicates.
   - `--feature F2` sets where a defect goes when no `--card` is given. A project with no features refuses defects, so the run is still recorded but no card is filed.
   - It keeps a record in `.yraverage/qa-pushed.json` and refuses to send the same run twice. Pass `--force` to send it again on purpose.
5. **Check it landed:** `node ~/.yraverage/hub.mjs call qa_status '{"project":"<id>"}'` should show the run id, its verdict, the evidence count and the defect codes. The script also prints the Tests tab URL.
6. **Report back** with the Hub run id, the verdict and counts, each defect card code with its stage, and the Tests tab URL.

## Inside an MCP client

If the agent has the `yraverage-hub` MCP server (`.mcp.json` in a linked folder), `qa_status`, `qa_report` and `qa_defect` can be called directly. The script is still the better choice for evidence, because it handles base64 encoding, file signatures and the size limits. Use direct calls for a quick text-only report.

## Hub limits (enforced by the Hub, see apps/hub/src/domain/qa.ts)

- Evidence types are png, jpeg, webp, webm, zip and markdown. mp4 is **not** accepted.
- At most 5 MB per file, 24 MB per run and 20 items. Evidence over a limit is listed in the run summary as "not attached" instead of failing the whole report. Failing cases' evidence is packed first.
- Verdicts are pass, fail and partial. Skipped and not-run cases count as partial.
- Only agent keys work for these tools. Personal tokens are refused, and every refusal is audited as `qa.refused`.

## Privacy (Hub rule D-04)

Evidence shows fixture or mock data only. Never upload screenshots that contain real project names, PRD text, emails, tokens or keys. Never post evidence to a public host.

## Pitfalls

- **Do not test against the Hub's own board.** When you test the skill or a fixture, link a separate sandbox folder (it becomes its own project). Reports written to the main Hub project appear on the owner's real Tests tab.
- **Git Bash:** `node ~/.yraverage/...` can be rewritten onto the wrong drive when the current directory is on another drive. Use `node "$(cygpath -m ~)/.yraverage/qa/qa-to-hub.mjs"` in Git Bash. PowerShell and cmd resolve `$HOME` or `%USERPROFILE%` correctly.
- **No feature, no defect card:** filing a defect needs the project to have at least one feature (a PRD bundle or a generated board).
