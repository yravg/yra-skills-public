#!/usr/bin/env bash
# Symlink every skill in this repo into each agent tool's skills dir (mac/linux/Git Bash).
# Never overwrites a real folder. Skips mattpo so its upstream names (tdd, teach) stay namespaced.
# Re-run after `git pull` only if new skills were added.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
for tool in .claude .codex .cursor .gemini .agents; do
  [ -d "$HOME/$tool" ] || continue
  mkdir -p "$HOME/$tool/skills"
  for s in "$here"/*/skills/*/; do
    n="$(basename "$s")"
    plugin="$(basename "$(dirname "$(dirname "${s%/}")")")"
    if [ "$plugin" = "mattpo" ]; then continue; fi
    t="$HOME/$tool/skills/$n"
    if [ -L "$t" ]; then ln -sfn "${s%/}" "$t"
    elif [ -e "$t" ]; then echo "skip (real dir): $t"
    else ln -s "${s%/}" "$t"; fi
  done
done
echo done
