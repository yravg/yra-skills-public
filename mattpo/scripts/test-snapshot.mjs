// Checks the committed snapshot. No network. Run: node scripts/test-snapshot.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTER_END, OWN, referencedSkills } from './sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coverage = JSON.parse(fs.readFileSync(path.join(root, 'coverage.json'), 'utf8'));
const doc = fs.readFileSync(path.join(root, 'COVERAGE.md'), 'utf8');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'upstream.lock.json'), 'utf8')).upstream;
const expectedSha = 'abeeaf95660ba9e8b7c753eb38f441ca707a8823';

assert.equal(lock.sha, expectedSha);
assert.equal(lock.repo, 'mattpocock/skills');
assert.equal(lock.plugin_version, '1.3.2');
assert.match(fs.readFileSync(path.join(root, 'vendor/LICENSE'), 'utf8'), /MIT License/);
assert.match(fs.readFileSync(path.join(root, 'vendor/LICENSE'), 'utf8'), /Copyright \(c\) 2026 Matt Pocock/);
assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor/LICENSE'))).digest('hex'), lock.license_sha256);
assert.match(fs.readFileSync(path.join(root, 'vendor/skills/engineering/pr/CREDITS.md'), 'utf8'), /Dex Horthy/);

const published = Object.keys(coverage.published);
assert.equal(published.length, 27);
assert.equal(published.filter((item) => coverage.published[item].disposition === 'vendor-only').join(','), 'skills/engineering/ask-matt');
const exposed = published.filter((item) => coverage.published[item].disposition !== 'vendor-only');
assert.equal(exposed.length, 26);
assert.equal(coverage.unpublished.length, 12);
for (const item of [...published, ...coverage.unpublished]) assert.ok(doc.includes(item), item);

const vendorFiles = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.lstatSync(abs).isDirectory()) walk(abs);
    else vendorFiles.push(path.relative(path.join(root, 'vendor'), abs).split(path.sep).join('/'));
  }
};
walk(path.join(root, 'vendor'));
assert.equal(vendorFiles.length, Object.keys(lock.files).length);
for (const file of vendorFiles) {
  const hash = createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor', file))).digest('hex');
  assert.equal(hash, lock.files[file], file);
}
for (const item of coverage.unpublished) {
  assert.equal(vendorFiles.some((file) => file === item || file.startsWith(`${item}/`)), false, item);
}
assert.equal(fs.existsSync(path.join(root, 'vendor/skills/engineering/ask-matt/SKILL.md')), true);
assert.equal(fs.existsSync(path.join(root, 'skills/ask-matt')), false);

const exposedNames = new Set(exposed.map((item) => item.split('/').at(-1)));
for (const name of exposedNames) {
  const generated = fs.readFileSync(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
  assert.match(generated, /yravg adaptation/);
  const marker = `${ADAPTER_END}\n`;
  assert.equal(generated.includes(marker), true, name);
  const upstream = fs.readFileSync(path.join(root, 'vendor', exposed.find((item) => item.endsWith(`/${name}`)), 'SKILL.md'), 'utf8');
  const front = upstream.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)[0];
  assert.ok(generated.startsWith(front), name);
  assert.equal(generated.split(marker)[1], upstream.slice(front.length), name);
  for (const ref of referencedSkills(generated.split(marker)[1])) {
    assert.ok(exposedNames.has(ref), `${name} -> ${ref}`);
  }
}
for (const name of OWN) assert.equal(fs.existsSync(path.join(root, 'skills', name, 'SKILL.md')), true, name);
const plugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/plugin.json'), 'utf8'));
assert.equal(plugin.name, 'mattpo');
assert.equal(plugin.version, '0.1.1');
assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /\/mattpo:mattpo-mode/);
assert.doesNotMatch(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /tested in Claude Code|installed and tested/i);

console.log('test-snapshot: 27 published, 26 exposed, 1 vendor-only, 12 unpublished');
