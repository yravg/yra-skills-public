#!/usr/bin/env node
// Pin mattpocock/skills into vendor/ and regenerate exposed skills.
// Copies files only. Never runs, imports, or installs anything from the payload.
// Default is a read-only check. --apply swaps in a staged tree or leaves the current tree in place.
import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const runFile = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXTRACT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'extract_tarball.py');

export const OWN = ['mattpo', 'mattpo-mode', 'mattpo-help', 'mattpo-sync'];
export const ADAPTER_BEGIN = '<!-- yravg-adapter:begin -->';
export const ADAPTER_END = '<!-- yravg-adapter:end -->';

export class SyncError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function assertSafeRel(rel) {
  if (typeof rel !== 'string' || rel.length === 0 || rel.length > 500) throw new SyncError('unsafe', `bad path: ${rel}`);
  if (rel.includes('\0') || rel.includes('\\') || rel.startsWith('/') || /^[A-Za-z]:/.test(rel)) {
    throw new SyncError('unsafe', `bad path: ${rel}`);
  }
  const parts = rel.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) throw new SyncError('unsafe', `bad path: ${rel}`);
}

function inside(root, target) {
  const base = path.resolve(root);
  const abs = path.resolve(target);
  return abs === base || abs.startsWith(base + path.sep);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function referencedSkills(body) {
  const names = new Set();
  for (const line of body.split('\n')) {
    if (!/skill tool/i.test(line)) continue;
    for (const match of line.matchAll(/["'`]([a-z0-9-]+)["'`]/g)) names.add(match[1]);
  }
  return [...names];
}

function hashTree(dir) {
  const out = {};
  const walk = (abs, rel) => {
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) throw new SyncError('unsafe', `symlink: ${rel || abs}`);
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(abs)) {
        assertSafeRel(name);
        walk(path.join(abs, name), rel ? `${rel}/${name}` : name);
      }
      return;
    }
    if (!st.isFile()) throw new SyncError('unsafe', `not a regular file: ${rel}`);
    out[rel] = sha256(abs);
  };
  if (fs.existsSync(dir)) walk(dir, '');
  delete out[''];
  return out;
}

function sameMap(a, b) {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  return ak.every((key, i) => key === bk[i] && a[key] === b[key]);
}

function diffMaps(prev, next) {
  const added = Object.keys(next).filter((key) => !(key in prev)).sort();
  const removed = Object.keys(prev).filter((key) => !(key in next)).sort();
  const changed = Object.keys(next).filter((key) => key in prev && prev[key] !== next[key]).sort();
  return { added, changed, removed };
}

function filesUnder(abs, rel) {
  const st = fs.lstatSync(abs);
  if (st.isSymbolicLink()) throw new SyncError('unsafe', `symlink: ${rel}`);
  if (st.isFile()) return [rel];
  if (!st.isDirectory()) throw new SyncError('unsafe', `not a file or directory: ${rel}`);
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    assertSafeRel(name);
    const child = `${rel}/${name}`;
    assertSafeRel(child);
    out.push(...filesUnder(path.join(abs, name), child));
  }
  return out;
}

function copyRelFile(srcRoot, destRoot, rel) {
  assertSafeRel(rel);
  const from = path.resolve(srcRoot, ...rel.split('/'));
  const to = path.resolve(destRoot, ...rel.split('/'));
  if (!inside(srcRoot, from) || !inside(destRoot, to)) throw new SyncError('unsafe', `escape: ${rel}`);
  const st = fs.lstatSync(from);
  if (st.isSymbolicLink()) throw new SyncError('unsafe', `symlink: ${rel}`);
  if (!st.isFile()) throw new SyncError('unsafe', `not a file: ${rel}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const [rel] of Object.entries(hashTree(src))) copyRelFile(src, dest, rel);
}

function rm(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function splitFront(text, label) {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) throw new SyncError('unsafe', `${label} has no frontmatter`);
  return { front: match[0], body: text.slice(match[0].length) };
}

function adapterBlock(sha, note) {
  const lines = [
    ADAPTER_BEGIN,
    '# yravg adapter',
    '',
    'This block is a yravg adaptation. It is not part of Matt Pocock\'s upstream skill. The text after the end marker is verbatim upstream text from mattpocock/skills. MIT, Copyright (c) 2026 Matt Pocock. This copy is not an endorsement by Matt Pocock.',
    '',
    `Pinned commit: \`${sha}\`.`,
    '',
    'When the user asks you to change a specific file or write a specific document, do that change. Repo instructions and an owner decision outrank this skill. Ask the single highest-impact unresolved question, then wait. A recommended answer is not consent. Do not start a refactor, a scheduled architecture pass, or a product change the user did not ask for. Test observable behavior. A screenshot supports a visual claim only.',
    '',
    'These actions stay off until the user asks for that action in this conversation: publishing or editing an issue tracker, changing labels, opening or merging a pull request, git commit, push, reset, worktree delete, deploy, sending a message, billing, installing a hook or dependency, and applying an upstream snapshot.',
  ];
  if (note) lines.push('', note);
  lines.push('', ADAPTER_END, '');
  return lines.join('\n');
}

function readCoverage(root) {
  return readJson(path.join(root, 'coverage.json'));
}

function docGap(root, coverage) {
  const file = path.join(root, 'COVERAGE.md');
  if (!fs.existsSync(file)) return 'COVERAGE.md is missing';
  const text = fs.readFileSync(file, 'utf8');
  const paths = [...Object.keys(coverage.published), ...(coverage.unpublished || [])];
  const missing = paths.filter((item) => !text.includes(item));
  return missing.length ? `COVERAGE.md is missing paths: ${missing.join(', ')}` : null;
}

function skillName(skillPath) {
  return skillPath.split('/').at(-1);
}

function stage(srcRoot, coverage, sha) {
  const manifestPath = path.join(srcRoot, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) return { refused: 'plugin.json is missing upstream' };
  if (fs.lstatSync(manifestPath).isSymbolicLink()) throw new SyncError('unsafe', 'symlink: .claude-plugin/plugin.json');
  const plugin = readJson(manifestPath);
  if (plugin.name !== coverage.pluginName) {
    return { refused: `plugin.json name is ${plugin.name}; coverage expects ${coverage.pluginName}` };
  }
  const listed = (plugin.skills || []).map((item) => item.replace(/^\.\//, '').replace(/\/$/, ''));
  const expected = Object.keys(coverage.published);
  const added = listed.filter((item) => !expected.includes(item)).sort();
  const removed = expected.filter((item) => !listed.includes(item)).sort();
  if (added.length || removed.length) {
    return {
      refused: `skill path set changed; update coverage.json and COVERAGE.md before apply. added: ${added.join(', ') || 'none'}. removed: ${removed.join(', ') || 'none'}`,
    };
  }
  const licenseAbs = path.join(srcRoot, 'LICENSE');
  if (!fs.existsSync(licenseAbs)) return { refused: 'LICENSE is missing upstream' };
  if (fs.lstatSync(licenseAbs).isSymbolicLink()) throw new SyncError('unsafe', 'symlink: LICENSE');

  const names = new Map();
  for (const [skillPath, row] of Object.entries(coverage.published)) {
    if (row.disposition === 'vendor-only') continue;
    if (row.disposition !== 'expose' && row.disposition !== 'expose-held') {
      return { refused: `unknown disposition for ${skillPath}` };
    }
    const name = skillName(skillPath);
    if (OWN.includes(name)) return { refused: `exposed skill name collides with an OWN skill: ${name}` };
    if (names.has(name)) return { refused: `duplicate exposed skill name: ${name}` };
    names.set(name, skillPath);
  }

  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'mattpo-stage-'));
  const vendor = path.join(dest, 'vendor');
  copyRelFile(srcRoot, vendor, 'LICENSE');
  copyRelFile(srcRoot, vendor, '.claude-plugin/plugin.json');
  for (const skillPath of expected) {
    const abs = path.resolve(srcRoot, ...skillPath.split('/'));
    if (!inside(srcRoot, abs) || !fs.existsSync(abs)) return { refused: `covered path missing upstream: ${skillPath}`, cleanup: dest };
    for (const fileRel of filesUnder(abs, skillPath)) copyRelFile(srcRoot, vendor, fileRel);
  }

  const exposed = new Set(names.keys());
  const generated = path.join(dest, 'skills');
  const refs = [];
  for (const [name, skillPath] of names) {
    const row = coverage.published[skillPath];
    const sourceDir = path.join(vendor, ...skillPath.split('/'));
    const targetDir = path.join(generated, name);
    const fileRels = [];
    const walk = (abs, rel) => {
      for (const child of fs.readdirSync(abs)) {
        assertSafeRel(child);
        const next = rel ? `${rel}/${child}` : child;
        assertSafeRel(next);
        const childAbs = path.join(abs, child);
        const st = fs.lstatSync(childAbs);
        if (st.isSymbolicLink()) throw new SyncError('unsafe', `symlink: ${skillPath}/${next}`);
        if (st.isDirectory()) walk(childAbs, next);
        else if (st.isFile()) fileRels.push(next);
        else throw new SyncError('unsafe', `not a regular file: ${skillPath}/${next}`);
      }
    };
    walk(sourceDir, '');
    for (const fileRel of fileRels) {
      const from = path.join(sourceDir, ...fileRel.split('/'));
      const to = path.join(targetDir, ...fileRel.split('/'));
      fs.mkdirSync(path.dirname(to), { recursive: true });
      if (fileRel === 'SKILL.md') {
        const raw = fs.readFileSync(from, 'utf8');
        const { front, body } = splitFront(raw, skillPath);
        for (const ref of referencedSkills(body)) {
          if (!exposed.has(ref)) refs.push(`${name} calls "${ref}"`);
        }
        const note = row.disposition === 'expose-held' ? row.note : '';
        fs.writeFileSync(to, `${front}${adapterBlock(sha, note)}${body}`);
      } else {
        fs.copyFileSync(from, to);
      }
    }
  }
  if (refs.length) return { refused: `exposed skill depends on a skill that is not exposed: ${refs.sort().join('; ')}`, cleanup: dest };
  return {
    dest,
    vendor,
    generated,
    license_sha256: sha256(path.join(vendor, 'LICENSE')),
    plugin_version: String(plugin.version || ''),
    files: hashTree(vendor),
  };
}

function readLock(root) {
  const file = path.join(root, 'upstream.lock.json');
  if (!fs.existsSync(file)) return null;
  return readJson(file).upstream;
}

function ownHashes(root) {
  const out = {};
  for (const name of OWN) {
    const dir = path.join(root, 'skills', name);
    if (!fs.existsSync(dir)) continue;
    for (const [rel, hash] of Object.entries(hashTree(dir))) out[`${name}/${rel}`] = hash;
  }
  return out;
}

function generatedNames(root) {
  const dir = path.join(root, 'skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => !OWN.includes(name));
}

function backupState(root) {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'mattpo-backup-'));
  const vendor = path.join(root, 'vendor');
  if (fs.existsSync(vendor)) copyDir(vendor, path.join(dest, 'vendor'));
  fs.mkdirSync(path.join(dest, 'skills'), { recursive: true });
  for (const name of generatedNames(root)) copyDir(path.join(root, 'skills', name), path.join(dest, 'skills', name));
  for (const file of ['upstream.lock.json', 'UPSTREAM.md']) {
    const abs = path.join(root, file);
    if (fs.existsSync(abs)) fs.copyFileSync(abs, path.join(dest, file));
  }
  return dest;
}

function restoreState(root, backup) {
  const vendor = path.join(root, 'vendor');
  rm(vendor);
  if (fs.existsSync(path.join(backup, 'vendor'))) copyDir(path.join(backup, 'vendor'), vendor);
  for (const name of generatedNames(root)) rm(path.join(root, 'skills', name));
  const backedSkills = path.join(backup, 'skills');
  if (fs.existsSync(backedSkills)) {
    for (const name of fs.readdirSync(backedSkills)) {
      copyDir(path.join(backedSkills, name), path.join(root, 'skills', name));
    }
  }
  for (const file of ['upstream.lock.json', 'UPSTREAM.md']) {
    const live = path.join(root, file);
    const saved = path.join(backup, file);
    rm(live);
    if (fs.existsSync(saved)) fs.copyFileSync(saved, live);
  }
}

function writeUpstreamMd(root, lock, exposed) {
  const lines = [
    '# Upstream',
    '',
    'Generated by `scripts/sync.mjs`. `vendor/` is the verbatim snapshot. Exposed skills under `skills/` add a yravg adapter header and then the verbatim body. OWN skills are not in this list.',
    '',
    `| Repo | Ref | Commit | Plugin version | Licence sha256 | Synced |`,
    `|---|---|---|---|---|---|`,
    `| https://github.com/${lock.repo} | ${lock.ref} | \`${lock.sha}\` | ${lock.plugin_version} | \`${lock.license_sha256}\` | ${lock.synced_at} |`,
    '',
    '## Exposed skills',
    '',
    ...exposed.map((name) => `- ${name}`),
    '',
  ];
  fs.writeFileSync(path.join(root, 'UPSTREAM.md'), `${lines.join('\n')}\n`);
}

function dirtyReason(root, lock) {
  const vendor = path.join(root, 'vendor');
  if (!lock && fs.existsSync(vendor)) return 'vendor present without a lock';
  if (lock && !fs.existsSync(vendor)) return 'vendor missing while the lock exists';
  if (lock && fs.existsSync(vendor) && !sameMap(hashTree(vendor), lock.files)) return 'dirty snapshot: vendor bytes differ from the lock';
  return null;
}

function cleanup(staged) {
  if (staged?.dest) rm(staged.dest);
  if (staged?.cleanup) rm(staged.cleanup);
}

export async function sync({ root = ROOT, provider, apply = false, fault = null, now = () => new Date().toISOString() } = {}) {
  if (!provider) provider = ghProvider;
  const coverage = readCoverage(root);
  const gap = docGap(root, coverage);
  const lock = readLock(root);
  let sha;
  try {
    sha = await provider.head();
  } catch (error) {
    throw new SyncError('offline', error.message);
  }
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new SyncError('offline', 'upstream head is not a commit sha');
  const report = { sha, prev: lock?.sha ?? null, newer: lock?.sha !== sha, refused: null, diff: null };
  if (!report.newer) return { report, applied: false };
  if (gap && apply) {
    report.refused = gap;
    return { report, applied: false };
  }

  let staged;
  try {
    const src = await provider.fetch(sha);
    staged = stage(src, coverage, sha);
  } catch (error) {
    cleanup(staged);
    if (error instanceof SyncError) throw error;
    throw new SyncError('offline', error.message);
  }
  if (staged.refused) {
    report.refused = staged.refused;
    cleanup(staged);
    return { report, applied: false };
  }
  if (lock && lock.license_sha256 && lock.license_sha256 !== staged.license_sha256) {
    report.refused = 'LICENSE changed upstream; read it, then update the lock by hand after coverage review';
    cleanup(staged);
    return { report, applied: false };
  }
  const liveVendor = path.join(root, 'vendor');
  report.diff = diffMaps(fs.existsSync(liveVendor) ? hashTree(liveVendor) : {}, staged.files);
  if (!apply) {
    cleanup(staged);
    return { report, applied: false };
  }
  const dirty = dirtyReason(root, lock);
  if (dirty) {
    report.refused = dirty;
    cleanup(staged);
    return { report, applied: false };
  }

  const beforeOwn = ownHashes(root);
  const backup = backupState(root);
  try {
    rm(liveVendor);
    copyDir(staged.vendor, liveVendor);
    if (fault === 'after-vendor-replace') throw new SyncError('fault', 'injected fault');
    fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
    for (const name of generatedNames(root)) rm(path.join(root, 'skills', name));
    if (fs.existsSync(staged.generated)) {
      for (const name of fs.readdirSync(staged.generated)) {
        copyDir(path.join(staged.generated, name), path.join(root, 'skills', name));
      }
    }
    const next = {
      repo: coverage.repo,
      ref: coverage.ref,
      sha,
      synced_at: now(),
      license_sha256: staged.license_sha256,
      plugin_version: staged.plugin_version,
      files: staged.files,
    };
    fs.writeFileSync(path.join(root, 'upstream.lock.json'), `${JSON.stringify({ upstream: next }, null, 2)}\n`);
    writeUpstreamMd(root, next, fs.existsSync(staged.generated) ? fs.readdirSync(staged.generated).sort() : []);
    if (!sameMap(beforeOwn, ownHashes(root))) throw new SyncError('fault', 'OWN skills changed during apply');
    return { report, applied: true };
  } catch (error) {
    restoreState(root, backup);
    throw error;
  } finally {
    rm(backup);
    cleanup(staged);
  }
}

function runGh(args, { output } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    let settled = false;
    const fail = (error) => { if (!settled) { settled = true; reject(error); } };
    const ok = (value) => { if (!settled) { settled = true; resolve(value); } };
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => fail(new SyncError('offline', error.message)));
    if (output) {
      child.stdout.pipe(output);
      child.on('close', (code) => {
        output.end(() => {
          if (code !== 0) fail(new SyncError('offline', stderr.trim() || `gh exit ${code}`));
          else ok('');
        });
      });
    } else {
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.on('close', (code) => {
        if (code !== 0) fail(new SyncError('offline', stderr.trim() || `gh exit ${code}`));
        else ok(stdout);
      });
    }
  });
}

export const ghProvider = {
  async head() {
    const stdout = await runGh(['api', 'repos/mattpocock/skills/commits/main', '--jq', '.sha']);
    return stdout.trim();
  },
  async fetch(sha) {
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new SyncError('unsafe', 'refusing to fetch a non-sha');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mattpo-src-'));
    const tarPath = path.join(dir, 'src.tgz');
    const output = fs.createWriteStream(tarPath);
    await runGh(['api', `repos/mattpocock/skills/tarball/${sha}`], { output });
    const repo = path.join(dir, 'repo');
    await runFile('python3', ['-I', EXTRACT, tarPath, repo], { timeout: 60000 });
    return repo;
  },
};

export function exitCode({ error, report, apply }) {
  if (error) return 2;
  if (report?.refused) return 1;
  if (!apply && report?.newer) return 1;
  return 0;
}

function print(report, applied) {
  if (report.refused) console.log(`REFUSED: ${report.refused}`);
  else if (report.newer) console.log(`update ${report.prev ? `${report.prev.slice(0, 12)} -> ` : ''}${report.sha}`);
  else console.log(`up to date ${report.sha}`);
  if (report.diff) {
    console.log(`files: +${report.diff.added.length} added, ~${report.diff.changed.length} changed, -${report.diff.removed.length} removed${applied ? ' (applied)' : ''}`);
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  try {
    const result = await sync({ apply });
    print(result.report, result.applied);
    process.exit(exitCode({ report: result.report, apply }));
  } catch (error) {
    console.error(`mattpo-sync failed: ${error.message}`);
    process.exit(exitCode({ error }));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
