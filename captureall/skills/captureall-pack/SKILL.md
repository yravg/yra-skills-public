---
name: captureall-pack
description: Package a capture - inventory workbook (Pages, Sections, Captures, Code, CSS Animations, Keyframes, Transitions, Tokens, Fonts, A11y, IA, States, Console Errors, Errors), zip packs per section with frames and GIFs, raw JSON zips - and, when the user asks, publish to a Google Drive folder they name, with session subfolders, revision numbers and a revision register. Use when a crawl or capture needs its deliverables built, uploaded or revised.
---

# Captureall pack

Scripts in `scripts/`: `build_outputs.py` (workbook + packs, needs `pip install openpyxl pillow`) and `drive_drop.js` (Drive upload helper for a browser tab). Both descend from Robo Capture (Jay / RoboLabs, CC BY 4.0).

## Build

1. `python build_outputs.py <crawl_out_dir> <dest_dir> <Doc-Base> R00 9` (last value: max zip size in MB).
2. Outputs: `<Doc-Base>_Inventory_R00.xlsx`, `<Doc-Base>_Pack_R00_<Section>[_partN].zip` (per page: `capture_<variant>.json`, `web-capture_<variant>.txt`, `code/`, `frames/`, `anim_<variant>.gif`), `<Doc-Base>_Captures_R00_<Section>.zip` (raw JSON).
3. Run the xlsx skill's `recalc.py` on the workbook and confirm 0 errors (summary sheets use formulas).
4. Open the README sheet: source, scope, schema, code policy, attribution are right.

The Tokens, Fonts, A11y, IA, States and Console Errors sheets fill only when crawl.js ran with `pageData` (default on) and `states`.

## Publish only to a folder the user names

Ask before the first upload of a session. Do not assume a default Drive folder.

| Item | Value |
|---|---|
| Root folder | The folder the user names for this session. |
| Session subfolder | `YYYY-MM-DD_HHMM_<Session-Name>` (local time of session start; Session-Name = short Title-Case-With-Hyphens of the task). Create it under that root, and create `_superseded` inside it. |
| File names | `<Doc-Base>_R00.ext` for first issue; each revision increments `R01, R02 …` (two digits). Multi-part: `<Doc-Base>_R00_<part>.ext`. Never overwrite a rev. |
| Revision rule | Upload new `_R(n+1)` to the session folder, move the older rev into `_superseded`, mark the old register row `SUPERSEDED`, and append a `LATEST` row. The session folder top level then holds only the latest files. |
| Register | A sheet the user points at, if they want one. Suggested tabs: `LATEST` (a view, not edited by hand), `Register` (Logged, Session, Session Folder URL, Document, Rev, File Name, File URL, Status, Supersedes, Change / Note, Size (MB), Tool / Source), `Sessions` (Started, Session, Folder URL, Scope, Status, Last Rev). |
| Revisiting a session | If the user continues earlier work, reuse that session folder instead of creating a new one. |

**Uploading binaries to Drive** (tested 2026-10-27, 23 files / 130 MB OK; Drive MCP `create_file` is only practical for small text): use Claude in Chrome on a tab at `https://drive.google.com/drive/folders/<sessionFolderId>` and `scripts/drive_drop.js`. Rules: ≤10 MB per `file_upload` call (split zips to ≤9 MB), source paths must be inside the working directory. After upload, `search_files` with `parentId = '<folder>'` to get file ids/URLs for the register. Also deliver key files in chat (SendUserFile).

### Drive drop sequence (Claude in Chrome)

1. Tab on the target Drive folder → `javascript_tool` with the `DRIVE_DROP_PREP` IIFE from `scripts/drive_drop.js` (defines `window.__rcFire`).
2. `find` "file input element" → ref → `file_upload(ref, paths)` (≤10 MB total per call).
3. `javascript_tool`: `window.__rcFire()` — do NOT await or poll inside the tool (long waits make the tool fail); repeat 2–3 per batch with the same ref.
4. Wait ~60 s, `search_files` `parentId = '<folder>'` (paginate with pageToken) → check names and fileSize against local → ids/URLs → register rows.

### Revision procedure

1. Upload `<Doc>_R01.ext` to the same folder.
2. `update_file(fileId=<R00 id>, parentId=<_superseded id>)`.
3. Register: `get_values Register!A:L` → find the R00 row → `update_values Register!H<row>` = `SUPERSEDED`; append the R01 row with Status `LATEST`, Supersedes `R00`, Change / Note = what changed.
4. Update `Sessions` Last Rev / Status.

## QA

Workbook recalculated with 0 errors; captures count in README matches `captures.json`; zips ≤ the size limit and open; every uploaded file found in Drive with the same size; register rows match the folder.
