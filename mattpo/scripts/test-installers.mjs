// Proves install.sh skips mattpo and still links other plugins. Run: node scripts/test-installers.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const setup = fs.readFileSync(path.join(repo, 'setup.mjs'), 'utf8');
assert.equal(setup.includes('mattpo@'), false);
assert.match(fs.readFileSync(path.join(repo, 'install.sh'), 'utf8'), /plugin" = "mattpo"/);
assert.match(fs.readFileSync(path.join(repo, 'install.ps1'), 'utf8'), /Parent\.Parent\.Name -eq 'mattpo'/);
const market = JSON.parse(fs.readFileSync(path.join(repo, '.claude-plugin/marketplace.json'), 'utf8'));
assert.equal(market.plugins.some((plugin) => plugin.name === 'mattpo' && plugin.source === './mattpo'), true);

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'mattpo-install-'));
fs.mkdirSync(path.join(home, '.claude'));
execFileSync('bash', [path.join(repo, 'install.sh')], { env: { ...process.env, HOME: home }, encoding: 'utf8' });
const skills = path.join(home, '.claude/skills');
const linked = fs.readdirSync(skills);
const target = (name) => fs.readlinkSync(path.join(skills, name));
assert.equal(linked.includes('mattpo-mode'), false);
assert.equal(linked.includes('mattpo-sync'), false);
assert.ok(target('yravgbuilder-mode').includes(`${path.sep}yravgbuilder${path.sep}`));
assert.ok(target('captureall-mode').includes(`${path.sep}captureall${path.sep}`));
assert.ok(target('crawl-live').includes(`${path.sep}loose-skills${path.sep}`));
for (const name of linked) assert.equal(target(name).includes(`${path.sep}mattpo${path.sep}`), false, name);
const before = fs.readFileSync(path.join(repo, 'loose-skills/skills/crawl-live/SKILL.md'));

let powershell = 'not-run';
fs.mkdirSync(path.join(home, 'ps', '.claude'), { recursive: true });
try {
  execFileSync('pwsh', ['-NoProfile', '-File', path.join(repo, 'install.ps1')], {
    env: { ...process.env, HOME: path.join(home, 'ps') },
    encoding: 'utf8',
  });
  powershell = 'ran';
  const copied = fs.readdirSync(path.join(home, 'ps', '.claude/skills'));
  assert.equal(copied.includes('mattpo-mode'), false);
  assert.equal(copied.includes('yravgbuilder-mode'), true);
  assert.equal(copied.includes('captureall-mode'), true);
  assert.equal(copied.includes('crawl-live'), true);
} catch (error) {
  if (error.code === 'ENOENT') powershell = 'pwsh-absent';
  else throw error;
}
assert.equal(fs.readFileSync(path.join(repo, 'loose-skills/skills/crawl-live/SKILL.md')).equals(before), true);
fs.rmSync(home, { recursive: true, force: true });
console.log(`test-installers: bash skip ok; powershell ${powershell}`);
