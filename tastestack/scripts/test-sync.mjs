// No network: a fake upstream tree stands in for gh/git. Run: node scripts/test-sync.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sync, UPSTREAMS, OWN } from './sync.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-sync-'));
const root = path.join(tmp, 'plugin'), fake = path.join(tmp, 'fake');
const put = (f, t) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };
const skill = n => `---\nname: ${n}\ndescription: test\n---\nbody\n`;
const heads = { impeccable: 'a1', tastemaker: 'b1', stageshow: 'c1' };
const provider = { head: async u => heads[u.name], fetch: async u => path.join(fake, u.name) };
const lock = () => JSON.parse(fs.readFileSync(path.join(root, 'upstream.lock.json'), 'utf8'));

for (const n of OWN) put(path.join(root, 'skills', n, 'SKILL.md'), skill(n) + 'own\n');
put(path.join(fake, 'impeccable/.agent/skills/impeccable/SKILL.md'), skill('impeccable'));
put(path.join(fake, 'impeccable/LICENSE'), 'apache');
put(path.join(fake, 'tastemaker/skills/tastemaker/SKILL.md'), skill('tastemaker'));
put(path.join(fake, 'tastemaker/skills/taste-brief/SKILL.md'), skill('taste-brief'));
put(path.join(fake, 'tastemaker/LICENSE'), 'mit');
put(path.join(fake, 'stageshow/stageshow/SKILL.md'), skill('stageshow'));
put(path.join(fake, 'stageshow/stageshow/LICENSE'), 'mit2');
// stageshow's copy source is the repo subfolder "stageshow"
const fakeProvider = { ...provider, fetch: async u => path.join(fake, u.name) };

// 1. first check: everything is new; apply fills vendor, skills, lock
let r = await sync({ root, provider: fakeProvider });
assert.ok(r.report.every(x => x.newer), 'first run: all new');
r = await sync({ root, provider: fakeProvider, apply: true });
assert.ok(r.applied);
assert.deepEqual(fs.readdirSync(path.join(root, 'skills')).sort(), ['impeccable', 'stageshow', ...OWN, 'tastemaker', 'tastemaker-brief'].sort());
assert.match(fs.readFileSync(path.join(root, 'skills/tastemaker-brief/SKILL.md'), 'utf8'), /^name: tastemaker-brief$/m);
assert.match(fs.readFileSync(path.join(root, 'vendor/tastemaker/skills/taste-brief/SKILL.md'), 'utf8'), /^name: taste-brief$/m, 'vendor stays verbatim');
assert.equal(lock().upstreams.stageshow.sha, 'c1');
assert.match(fs.readFileSync(path.join(root, 'UPSTREAM.md'), 'utf8'), /taste-brief.*tastemaker-brief/);

for (const n of OWN) assert.match(fs.readFileSync(path.join(root, 'skills', n, 'SKILL.md'), 'utf8'), /own\n$/, `own skill ${n} untouched by apply`);

// 2. same heads: nothing newer
r = await sync({ root, provider: fakeProvider });
assert.ok(r.report.every(x => !x.newer), 'lock compare: up to date');

// 3. a changed file with a new sha is reported in the diff and applied
heads.tastemaker = 'b2';
put(path.join(fake, 'tastemaker/skills/taste-brief/SKILL.md'), skill('taste-brief') + 'more\n');
put(path.join(fake, 'tastemaker/skills/taste-new/SKILL.md'), skill('taste-new'));
r = await sync({ root, provider: fakeProvider, apply: true });
const t = r.report.find(x => x.name === 'tastemaker');
assert.deepEqual([t.diff.added.length, t.diff.changed.length, t.diff.removed.length], [1, 1, 0]);
assert.equal(lock().upstreams.tastemaker.sha, 'b2');
assert.ok(fs.existsSync(path.join(root, 'skills/tastemaker-new/SKILL.md')));

// 4. licence change is refused, vendor and lock untouched
heads.impeccable = 'a2';
put(path.join(fake, 'impeccable/LICENSE'), 'something else');
put(path.join(fake, 'impeccable/.agent/skills/impeccable/SKILL.md'), skill('impeccable') + 'x\n');
r = await sync({ root, provider: fakeProvider, apply: true });
assert.match(r.report.find(x => x.name === 'impeccable').refused, /licence file LICENSE changed/);
assert.equal(lock().upstreams.impeccable.sha, 'a1');
assert.equal(fs.readFileSync(path.join(root, 'vendor/impeccable/LICENSE'), 'utf8'), 'apache');
put(path.join(fake, 'impeccable/LICENSE'), 'apache'); // restore, then a vanished licence is refused too
fs.rmSync(path.join(fake, 'impeccable/LICENSE'));
r = await sync({ root, provider: fakeProvider, apply: true });
assert.match(r.report.find(x => x.name === 'impeccable').refused, /missing/);
put(path.join(fake, 'impeccable/LICENSE'), 'apache');

// 5. two upstream folders that map to one exposed name abort before anything is swapped
heads.tastemaker = 'b3';
put(path.join(fake, 'tastemaker/skills/tastemaker-brief/SKILL.md'), skill('tastemaker-brief'));
const keep = lock().upstreams.tastemaker.sha;
await assert.rejects(sync({ root, provider: fakeProvider, apply: true }), /two skills map to "tastemaker-brief"/);
assert.equal(lock().upstreams.tastemaker.sha, keep);
fs.rmSync(path.join(fake, 'tastemaker/skills/tastemaker-brief'), { recursive: true });

// 6. a skill without a name is refused; after fixing, exposed names are unique
put(path.join(fake, 'tastemaker/skills/taste-bad/SKILL.md'), 'no frontmatter\n');
await assert.rejects(sync({ root, provider: fakeProvider, apply: true }), /skill without a name/);
fs.rmSync(path.join(fake, 'tastemaker/skills/taste-bad'), { recursive: true });
await sync({ root, provider: fakeProvider, apply: true });
const names = fs.readdirSync(path.join(root, 'skills')).map(d => fs.readFileSync(path.join(root, 'skills', d, 'SKILL.md'), 'utf8').match(/^name: (.+)$/m)[1]);
assert.equal(new Set(names).size, names.length, 'regenerated skill names are unique');
for (const n of OWN) assert.ok(names.includes(n), `own skill ${n} survived every apply`);
assert.ok(UPSTREAMS.every(u => u.licenseFiles.length));

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-sync: all checks passed');
