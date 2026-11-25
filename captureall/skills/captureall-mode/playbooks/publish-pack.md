### Publish pack

**Deliver a capture as workbook and zips, locally and, when Enrico agrees, in Google Drive with register rows.**

1. Build with `../../captureall-pack/scripts/build_outputs.py <crawl_out> <dest> <Doc-Base> R00 9`.
2. Recalculate the workbook formulas (xlsx skill `recalc.py`) and confirm 0 errors.
3. Open the workbook once: README, Pages, Tokens and IA rows look right.
4. Ask Enrico before any upload. Then follow the Drive standard in `../../captureall-pack/SKILL.md` (session folder, `_superseded`, register rows).
5. For a revision: upload `_R(n+1)`, move the old file to `_superseded`, mark the old register row SUPERSEDED.
6. Send key files in chat with SendUserFile.
7. Run the `captureall` QA gate.

**Reply:** file list with sizes, local paths, Drive folder and register links (if published), revision number.
