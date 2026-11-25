// Static checks of the docs-health instructions. No Claude session. Run: node scripts/test-docs-health.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const mode = read('skills/mattpo-mode/SKILL.md');
const play = read('skills/mattpo-mode/playbooks/docs-health.md');
const principle = read('skills/mattpo-mode/principles/one-source-on-demand.md');
const core = read('skills/mattpo/SKILL.md');
const help = read('skills/mattpo-help/SKILL.md');
const architecture = read('skills/mattpo-mode/playbooks/architecture.md');
const vendorToSpec = read('vendor/skills/engineering/to-spec/SKILL.md');

assert.match(mode, /`docs-health\.md`/);
assert.match(mode, /`one-source-on-demand\.md`/);
assert.match(mode, /Changing this plugin is not that acceptance/);
assert.match(play, /\*\*Reply:\*\*/);
assert.match(principle, /\*\*When:\*\*/);
for (const word of ['glossary', 'domain model', 'architecture', 'ADR', 'AGENTS.md', 'standards', 'NOT RUN', 'canonical', 'read-only', 'yravg adaptation', 'youtu.be/mU8WKII1gpk']) {
  assert.match(play, new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), word);
}
assert.match(play, /not permission to edit a product repo/);
assert.match(play, /after the user accepts that hunk/);
assert.match(play, /not a measured token saving|No measured token saving/);
assert.match(play, /not a quotation/);
assert.match(core, /NOT RUN/);
assert.match(core, /not a measured token saving/);
assert.match(core, /not permission to rewrite that repo's glossary/);
assert.match(help, /Docs health/);
assert.match(help, /Do not edit them yet/);
assert.match(architecture, /docs-health\.md/);
assert.equal(play.includes('<!-- yravg-adapter:'), false);
assert.doesNotMatch(vendorToSpec, /yravg adaptation/);
assert.equal(JSON.parse(read('.claude-plugin/plugin.json')).version, '0.1.1');
const lock = JSON.parse(read('upstream.lock.json')).upstream;
assert.equal(lock.sha, 'abeeaf95660ba9e8b7c753eb38f441ca707a8823');

console.log('test-docs-health: routing, gating, and snapshot lock ok');
