// No network. A fake tree stands in for the upstream tarball. Run: node scripts/test-sync.mjs
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { ADAPTER_BEGIN, ADAPTER_END, OWN, SyncError, exitCode, referencedSkills, sync } from './sync.mjs';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mattpo-sync-'));
const root = path.join(tmp, 'plugin');
const fake = path.join(tmp, 'fake');
const shaA = 'a'.repeat(40);
const shaB = 'b'.repeat(40);
const shaC = 'c'.repeat(40);
let headSha = shaA;
let fetches = 0;

const put = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const skill = (name, body = 'body\n') => `---\nname: ${name}\ndescription: test\n---\n${body}`;
const provider = {
  head: async () => headSha,
  fetch: async () => { fetches += 1; return fake; },
};
const lock = () => JSON.parse(fs.readFileSync(path.join(root, 'upstream.lock.json'), 'utf8')).upstream;
const coverage = {
  repo: 'mattpocock/skills',
  ref: 'main',
  pluginName: 'mattpocock-skills',
  published: {
    'skills/engineering/ask-matt': { disposition: 'vendor-only', note: 'router' },
    'skills/engineering/tdd': { disposition: 'expose', note: '' },
    'skills/engineering/to-spec': { disposition: 'expose-held', note: 'Publish stays explicit.' },
  },
  unpublished: ['skills/in-progress/loop-me'],
};
const manifest = (skills) => JSON.stringify({
  name: 'mattpocock-skills',
  version: '1.3.2',
  skills: skills.map((item) => `./${item}`),
}, null, 2);

put(path.join(root, 'coverage.json'), JSON.stringify(coverage, null, 2));
put(path.join(root, 'COVERAGE.md'), `${Object.keys(coverage.published).join('\n')}\n${coverage.unpublished.join('\n')}\n`);
for (const name of OWN) put(path.join(root, 'skills', name, 'SKILL.md'), skill(name, 'own\n'));
put(path.join(fake, 'LICENSE'), 'MIT license text\n');
put(path.join(fake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt',
  'skills/engineering/tdd',
  'skills/engineering/to-spec',
]));
put(path.join(fake, 'skills/engineering/ask-matt/SKILL.md'), skill('ask-matt', 'Call the Skill tool with "not-a-skill".\n'));
put(path.join(fake, 'skills/engineering/tdd/SKILL.md'), skill('tdd', 'Call the Skill tool with "to-spec".\n'));
put(path.join(fake, 'skills/engineering/tdd/notes.md'), 'note\n');
put(path.join(fake, 'skills/engineering/to-spec/SKILL.md'), skill('to-spec', 'spec body\n'));
put(path.join(fake, 'skills/in-progress/loop-me/SKILL.md'), skill('loop-me', 'unpublished\n'));
put(path.join(fake, 'scripts/evil.sh'), '#!/bin/sh\necho no\n');

assert.deepEqual(referencedSkills('Call the Skill tool twice, for "grilling" and "domain-modeling".\n'), ['grilling', 'domain-modeling']);
assert.deepEqual(exitCode({ error: new Error('x'), report: { newer: true }, apply: false }), 2);
assert.equal(exitCode({ report: { newer: true, refused: null }, apply: false }), 1);
assert.equal(exitCode({ report: { newer: false, refused: 'no' }, apply: true }), 1);
assert.equal(exitCode({ report: { newer: false, refused: null }, apply: true }), 0);

let result = await sync({ root, provider });
assert.equal(result.applied, false);
assert.equal(result.report.newer, true);
assert.equal(fs.existsSync(path.join(root, 'upstream.lock.json')), false);
assert.equal(fs.existsSync(path.join(root, 'vendor')), false);
assert.equal(fetches, 1);

result = await sync({ root, provider, apply: true });
assert.equal(result.applied, true);
assert.equal(lock().sha, shaA);
assert.equal(fs.existsSync(path.join(root, 'skills/ask-matt')), false);
assert.equal(fs.existsSync(path.join(root, 'vendor/mattpocock-skills')), false);
assert.match(fs.readFileSync(path.join(root, 'vendor/skills/engineering/ask-matt/SKILL.md'), 'utf8'), /not-a-skill/);
assert.equal(fs.existsSync(path.join(root, 'vendor/skills/in-progress/loop-me')), false);
assert.equal(fs.existsSync(path.join(root, 'vendor/scripts/evil.sh')), false);
const generated = fs.readFileSync(path.join(root, 'skills/tdd/SKILL.md'), 'utf8');
assert.match(generated, /yravg adaptation/);
assert.ok(generated.includes(ADAPTER_BEGIN) && generated.includes(ADAPTER_END));
assert.ok(generated.endsWith('Call the Skill tool with "to-spec".\n'));
assert.equal(fs.readFileSync(path.join(root, 'skills/tdd/notes.md'), 'utf8'), 'note\n');
assert.match(fs.readFileSync(path.join(root, 'skills/to-spec/SKILL.md'), 'utf8'), /Publish stays explicit\./);
assert.doesNotMatch(fs.readFileSync(path.join(root, 'vendor/skills/engineering/to-spec/SKILL.md'), 'utf8'), /yravg adaptation/);
for (const name of OWN) assert.match(fs.readFileSync(path.join(root, 'skills', name, 'SKILL.md'), 'utf8'), /own\n$/);

fetches = 0;
result = await sync({ root, provider });
assert.equal(result.report.newer, false);
assert.equal(fetches, 0, 'up to date check does not download');
result = await sync({ root, provider, apply: true });
assert.equal(result.applied, false);
assert.equal(fetches, 0, 'up to date apply does not download');

headSha = shaB;
put(path.join(fake, 'skills/engineering/tdd/SKILL.md'), skill('tdd', 'Call the Skill tool with "to-spec".\nmore\n'));
put(path.join(fake, 'skills/engineering/tdd/extra.md'), 'extra\n');
result = await sync({ root, provider, apply: true });
assert.equal(result.applied, true);
assert.equal(lock().sha, shaB);
assert.match(fs.readFileSync(path.join(root, 'skills/tdd/SKILL.md'), 'utf8'), /more\n$/);
assert.equal(fs.readFileSync(path.join(root, 'skills/tdd/extra.md'), 'utf8'), 'extra\n');
for (const name of OWN) assert.match(fs.readFileSync(path.join(root, 'skills', name, 'SKILL.md'), 'utf8'), /own\n$/);

const licenseBefore = fs.readFileSync(path.join(root, 'vendor/LICENSE'), 'utf8');
const shaBeforeLicense = lock().sha;
headSha = shaC;
put(path.join(fake, 'LICENSE'), 'a different license\n');
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /LICENSE changed/);
assert.equal(result.applied, false);
assert.equal(lock().sha, shaBeforeLicense);
assert.equal(fs.readFileSync(path.join(root, 'vendor/LICENSE'), 'utf8'), licenseBefore);
result = await sync({ root, provider });
assert.match(result.report.refused, /LICENSE changed/);
assert.equal(fs.readFileSync(path.join(root, 'vendor/LICENSE'), 'utf8'), licenseBefore);

put(path.join(fake, 'LICENSE'), licenseBefore);
fs.rmSync(path.join(fake, 'LICENSE'));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /LICENSE is missing/);
assert.equal(lock().sha, shaBeforeLicense);
put(path.join(fake, 'LICENSE'), licenseBefore);

put(path.join(fake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt',
  'skills/engineering/tdd',
  'skills/engineering/to-spec',
  'skills/engineering/wizard',
]));
put(path.join(fake, 'skills/engineering/wizard/SKILL.md'), skill('wizard'));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /added: skills\/engineering\/wizard/);
assert.equal(fs.existsSync(path.join(root, 'skills/wizard')), false);
assert.equal(lock().sha, shaBeforeLicense);

put(path.join(fake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt',
  'skills/engineering/tdd',
]));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /removed: skills\/engineering\/to-spec/);
assert.equal(fs.existsSync(path.join(root, 'skills/to-spec/SKILL.md')), true);

put(path.join(fake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt',
  'skills/engineering/tdd',
  'skills/productivity/to-spec',
]));
put(path.join(fake, 'skills/productivity/to-spec/SKILL.md'), skill('to-spec'));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /skill path set changed/);
put(path.join(fake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt',
  'skills/engineering/tdd',
  'skills/engineering/to-spec',
]));

const link = path.join(fake, 'skills/engineering/tdd/linked.md');
fs.symlinkSync(path.join(fake, 'LICENSE'), link);
await assert.rejects(sync({ root, provider, apply: true }), (error) => error instanceof SyncError && error.code === 'unsafe' && /symlink/.test(error.message));
assert.equal(lock().sha, shaBeforeLicense);
fs.unlinkSync(link);

const dirtyTarget = path.join(root, 'vendor/skills/engineering/tdd/notes.md');
fs.writeFileSync(dirtyTarget, 'locally edited\n');
headSha = 'd'.repeat(40);
put(path.join(fake, 'skills/engineering/tdd/SKILL.md'), skill('tdd', 'Call the Skill tool with "to-spec".\nclean\n'));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /dirty snapshot/);
assert.equal(fs.readFileSync(dirtyTarget, 'utf8'), 'locally edited\n');
assert.equal(lock().sha, shaBeforeLicense);
fs.writeFileSync(dirtyTarget, 'note\n');

put(path.join(root, 'skills/mattpo/SKILL.md'), skill('mattpo', 'custom own\n'));
result = await sync({ root, provider, apply: true });
assert.equal(result.applied, true);
assert.match(fs.readFileSync(path.join(root, 'skills/mattpo/SKILL.md'), 'utf8'), /custom own\n$/);
assert.match(fs.readFileSync(path.join(root, 'skills/tdd/SKILL.md'), 'utf8'), /clean\n$/);
assert.equal(fs.existsSync(path.join(root, 'skills/tdd/extra.md')), true);

headSha = 'e'.repeat(40);
const keptSha = lock().sha;
put(path.join(fake, 'skills/engineering/to-spec/SKILL.md'), skill('to-spec', 'Call the Skill tool with "missing-skill".\n'));
result = await sync({ root, provider, apply: true });
assert.match(result.report.refused, /not exposed: to-spec calls "missing-skill"/);
assert.equal(lock().sha, keptSha);
put(path.join(fake, 'skills/engineering/to-spec/SKILL.md'), skill('to-spec', 'spec body\n'));

const offlineRoot = path.join(tmp, 'offline');
put(path.join(offlineRoot, 'coverage.json'), JSON.stringify(coverage));
put(path.join(offlineRoot, 'COVERAGE.md'), 'skills/engineering/tdd\nskills/engineering/ask-matt\nskills/engineering/to-spec\nskills/in-progress/loop-me\n');
await assert.rejects(sync({ root: offlineRoot, provider: { head: async () => { throw new Error('no network'); }, fetch: async () => fake }, apply: true }), /no network/);
assert.equal(fs.existsSync(path.join(offlineRoot, 'vendor')), false);

const fetchBoom = path.join(tmp, 'boom');
fs.cpSync(root, fetchBoom, { recursive: true });
const boomBefore = fs.readFileSync(path.join(fetchBoom, 'upstream.lock.json'), 'utf8');
await assert.rejects(sync({
  root: fetchBoom,
  apply: true,
  provider: { head: async () => 'f'.repeat(40), fetch: async () => { throw new Error('reset'); } },
}), /reset/);
assert.equal(fs.readFileSync(path.join(fetchBoom, 'upstream.lock.json'), 'utf8'), boomBefore);

const faultRoot = path.join(tmp, 'fault');
fs.cpSync(root, faultRoot, { recursive: true });
const faultVendor = fs.readFileSync(path.join(faultRoot, 'vendor/LICENSE'), 'utf8');
const faultLock = fs.readFileSync(path.join(faultRoot, 'upstream.lock.json'), 'utf8');
headSha = '1'.repeat(40);
put(path.join(fake, 'skills/engineering/tdd/SKILL.md'), skill('tdd', 'Call the Skill tool with "to-spec".\nfault\n'));
await assert.rejects(sync({ root: faultRoot, provider, apply: true, fault: 'after-vendor-replace' }), /injected fault/);
assert.equal(fs.readFileSync(path.join(faultRoot, 'vendor/LICENSE'), 'utf8'), faultVendor);
assert.equal(fs.readFileSync(path.join(faultRoot, 'upstream.lock.json'), 'utf8'), faultLock);
assert.match(fs.readFileSync(path.join(faultRoot, 'skills/tdd/SKILL.md'), 'utf8'), /clean\n$/);
put(path.join(fake, 'skills/engineering/tdd/SKILL.md'), skill('tdd', 'Call the Skill tool with "to-spec".\nclean\n'));

const dupRoot = path.join(tmp, 'dup');
const dupCoverage = structuredClone(coverage);
dupCoverage.published['skills/productivity/tdd'] = { disposition: 'expose', note: '' };
put(path.join(dupRoot, 'coverage.json'), JSON.stringify(dupCoverage));
put(path.join(dupRoot, 'COVERAGE.md'), `${Object.keys(dupCoverage.published).join('\n')}\n${dupCoverage.unpublished.join('\n')}\n`);
const dupFake = path.join(tmp, 'dup-fake');
put(path.join(dupFake, 'LICENSE'), 'MIT license text\n');
put(path.join(dupFake, '.claude-plugin/plugin.json'), manifest([
  'skills/engineering/ask-matt', 'skills/engineering/tdd', 'skills/engineering/to-spec', 'skills/productivity/tdd',
]));
put(path.join(dupFake, 'skills/engineering/ask-matt/SKILL.md'), skill('ask-matt'));
put(path.join(dupFake, 'skills/engineering/tdd/SKILL.md'), skill('tdd'));
put(path.join(dupFake, 'skills/engineering/to-spec/SKILL.md'), skill('to-spec'));
put(path.join(dupFake, 'skills/productivity/tdd/SKILL.md'), skill('tdd'));
const dupResult = await sync({
  root: dupRoot,
  apply: true,
  provider: { head: async () => shaA, fetch: async () => dupFake },
});
assert.match(dupResult.report.refused, /duplicate exposed skill name: tdd/);
assert.equal(fs.existsSync(path.join(dupRoot, 'vendor')), false);

const docRoot = path.join(tmp, 'nodoc');
put(path.join(docRoot, 'coverage.json'), JSON.stringify(coverage));
const docResult = await sync({
  root: docRoot,
  apply: true,
  provider: { head: async () => shaA, fetch: async () => { throw new Error('should not fetch'); } },
});
assert.match(docResult.report.refused, /COVERAGE.md is missing/);

const tarDir = path.join(tmp, 'tar');
fs.mkdirSync(tarDir);
const tarPath = path.join(tarDir, 'bad.tgz');
const tarDest = path.join(tarDir, 'out');
const outside = path.join(tarDir, 'outside.txt');
await run('python3', ['-c', `
import tarfile
tar = tarfile.open(${JSON.stringify(tarPath)}, 'w:gz')
info = tarfile.TarInfo('repo-prefix/LICENSE')
data = b'MIT\\n'
info.size = len(data)
import io
tar.addfile(info, io.BytesIO(data))
link = tarfile.TarInfo('repo-prefix/skills/evil-link')
link.type = tarfile.SYMTYPE
link.linkname = ${JSON.stringify(outside)}
tar.addfile(link)
escape = tarfile.TarInfo('repo-prefix/../../pwned.txt')
blob = b'pwned\\n'
escape.size = len(blob)
tar.addfile(escape, io.BytesIO(blob))
tar.close()
`]);
const bad = await run('python3', ['-I', path.join(here, 'extract_tarball.py'), tarPath, tarDest], { encoding: 'utf8' }).then(() => 'ok', (error) => error.stderr || error.stdout || error.message);
assert.match(bad, /refusing/);
assert.equal(fs.existsSync(path.join(tarDir, 'pwned.txt')), false);
assert.equal(fs.existsSync(outside), false);

const goodTar = path.join(tarDir, 'good.tgz');
const goodDest = path.join(tarDir, 'good');
await run('python3', ['-c', `
import io, tarfile
tar = tarfile.open(${JSON.stringify(goodTar)}, 'w:gz')
info = tarfile.TarInfo('repo-prefix/LICENSE')
data = b'MIT\\n'
info.size = len(data)
tar.addfile(info, io.BytesIO(data))
tar.close()
`]);
await run('python3', ['-I', path.join(here, 'extract_tarball.py'), goodTar, goodDest]);
assert.equal(fs.readFileSync(path.join(goodDest, 'LICENSE'), 'utf8'), 'MIT\n');

const source = fs.readFileSync(path.join(here, 'sync.mjs'), 'utf8');
assert.doesNotMatch(source, /git clone|npm install|hooksPath/);
assert.match(source, /spawn\('gh'/);
assert.match(source, /python3/);
assert.doesNotMatch(source, /execFile\(\s*['"]bash['"]/);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-sync: all checks passed');
