# yra-skills-public

Claude Code plugins and standalone skills by yravg.

## Plugins

| Plugin | What it does |
|---|---|
| `captureall` | Capture a website or app into an inventory, a pack, a parity plan, or a rebuild. Includes the grab skills. |
| `tastestack` | Design-quality toolkit. Vendored impeccable (Apache-2.0), tastemaker (MIT), and stageshow (MIT) keep their notices. |
| `yravglive` | Live page for headless agent workers in a repo. |
| `spec-to-canvas` | Turn a PRD or spec into a design canvas drawn on the real app. |
| `canvas-to-app` | Build that canvas into the app, keeping the codebase architecture. |
| `yra-extras` | `yra-sk-likepstack` and `yraverage-hub`. |
| `yravgbuilder` | House standard for enterprise and business apps: catalogue UI, Rust only for heavy cores, Tauri desktop, one QA gate. |
| `mattpo` | Pinned Matt Pocock engineering skills plus a yravg manager. The snapshot is MIT (Matt Pocock); the manager code is MIT (yravg). Not enabled by `setup.mjs`. |

`loose-skills/skills/` holds standalone skills. Third-party skills in that folder ship with their own `LICENSE` file.

## Install

Requires Node.js and the Claude Code CLI.

```bash
git clone https://github.com/yravg/yra-skills-public
cd yra-skills-public
node setup.mjs
./install.sh
```

On Windows, run `.\install.ps1` instead of `./install.sh`.

One plugin at a time:

```text
/plugin marketplace add yravg/yra-skills-public
/plugin install captureall@yra-skills-public
```

`install.sh` and `install.ps1` link or copy skills from each plugin and from `loose-skills`. They skip `mattpo`, so names such as `tdd` and `teach` stay on the plugin prefix.

Skills that depend on npm (for example `loose-skills/skills/reanimate/scripts`) need `npm install` in that folder. `node_modules` is not committed.

## License

MIT for yravg's code. See `LICENSE`. Other components keep the licenses named in `NOTICE`.
