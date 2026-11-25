---
name: yra-sk-likepstack
description: Turn any body of work (a project folder, a repo, a set of standalone skills, a recurring workflow from past chats) into a pstack-style plugin - one manager "<slug>-mode" skill with principles, playbooks and autonomy limits, leaf skills, a help skill and a delegate agent - the same shape as cursor/plugins pstack and Enrico's samplepack plugin. Use for /yra-sk-likepstack, "make this a plugin like pstack", "package this work as a skillset", "plugin like samplepack".
---

# yra-sk-likepstack

Package a body of work as a pstack-shaped plugin. Reference builds: `cursor/plugins/pstack` (poteto-mode + principle skills) and Enrico's `samplepack` plugin (installed copy under `~/.claude/plugins/synced/*/samplepack/`). Open samplepack when unsure how a part should read; it is the house example.

Templates for every file are in `references/templates.md`. The checker is `scripts/check_plugin.py`.

## The shape

```
<slug>/
  .claude-plugin/plugin.json        name, version, description, author, license, keywords
  README.md                         start here, what is inside (table), notes
  agents/<slug>-agent.md            delegate for bounded helper work inside a mode run
  skills/
    <slug>-mode/SKILL.md            the manager: non-negotiables, principles index, autonomy, subagents, reply, playbooks index
    <slug>-mode/principles/*.md     one rule per file: When / rule / how it applies
    <slug>-mode/playbooks/*.md      one task type per file: numbered steps + Reply line
    <slug>-mode/references/*.md     file access, templates, status snapshot (only if needed)
    <slug>/SKILL.md                 the domain core: facts, folder flow, QA gate
    <slug>-<leaf>/SKILL.md          2-5 specialist skills, each with scripts/ and references/ as needed
    <slug>-help/SKILL.md            how to use the toolkit; never starts work
```

`<slug>-mode` and `<slug>-help` carry `disable-model-invocation: true` (user types them). The core and leaf skills stay model-invocable so the mode and the agent can call them.

## Steps

Copy these into the task list.

1. **Name the work.** Get the slug (short, lowercase, e.g. `samplepack`), one-line purpose, the user's role, and where the plugin folder goes. No folder given: ask; default `<plugin-folder>`.
2. **Read the sources.** Everything the user points at: project folders, existing standalone skills, CLAUDE.md/AGENTS.md, memory files, past transcripts, issued documents. Collect: recurring task types, hard rules learned the hard way, file and folder conventions, tools and scripts in use, what needs the user's sign-off, output formats. Delegate bulk reading to subagents; keep the synthesis here.
3. **Draft the inventory** and show it to the user before writing files:
   - principles (5-10): each a rule that changed a real decision, with its trigger;
   - playbooks (4-12): one per recurring task type; always include `investigation` (read-only question) and `session-pickup` (resume earlier work);
   - leaf skills (2-5): split by specialist area (file type, document type, system), not by task;
   - non-negotiables: trigger -> action lines;
   - autonomy: "Just do it" list and "Always pause" list;
   - what the delegate agent does and never does.
   Ask only what the sources cannot answer (usually the pause list and delivery formats).
4. **Write the files** from `references/templates.md`. Reuse existing skill text and scripts by moving them into the leaf skills, not by rewriting. Every principle and playbook named in the mode's index must have its file, and every file must be named in the index.
5. **Scrub.** No secrets, tokens, passwords, personal IDs, or client project material. This plugin is MIT. Do not publish client material.
6. **Check.** Run `python -I "<this skill dir>/scripts/check_plugin.py" "<plugin dir>"`. Fix every FAIL. Then read the mode SKILL.md once as a new user would: can a fresh chat run a playbook from it alone?
7. **Install.** Pick with the user:
   - Claude app (how samplepack was installed): zip the plugin folder's contents (plugin.json path inside zip: `.claude-plugin/plugin.json`) and upload it under Plugins -> My Uploads.
   - Local test: `claude --plugin-dir "<plugin dir>"`.
   - Cursor: copy `.claude-plugin/plugin.json` to `.cursor-plugin/plugin.json` in the same folder.
   After install, tell the user to remove any standalone copies of the moved skills from `~/.claude/skills` so only one copy answers (confirm before deleting anything).
8. **Report.** Plugin path, the inventory table, how to start (`/<slug>-mode <goal>`), install status, what was not checked.

## Writing rules

- Plain, short imperative sentences (writing-for-agents style). One idea per line.
- The mode file is an index: principles and playbooks are one line each with their file; the detail lives in the leaf file.
- Playbook steps are numbered and concrete enough to copy verbatim into a task list. Each ends with `**Reply:**` saying what the answer must contain.
- Principle files start with `**When:**`.
- Agent description includes 1-2 `<example>` blocks (Context / user / assistant / commentary), like samplepack-agent.
- Skill-to-skill paths are relative: `../<name>/SKILL.md`.
- Keep each SKILL.md under ~200 lines; push detail into `references/`.
