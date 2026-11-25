#!/usr/bin/env node
// tastestack sync: copies files from three upstream repos into vendor/, regenerates skills/.
// It only copies files. It never runs, imports or installs anything that comes from an upstream.
// Flags: --check (default, report only, exit 1 if updates), --apply, --daily (hook mode: once a day, quiet, always exit 0).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Our own skills: never regenerated, never deleted. shortcut: fixed list, add a name here when a new own skill is added.
export const OWN = ['tastestack', 'tastestack-mode', 'tastestack-help', 'tastestack-sync'];

// track: paths whose latest commit decides "newer". copy: [upstream path, vendor path]. licenseFiles: vendor paths hash-guarded.
export const UPSTREAMS = [
  { name: 'impeccable', repo: 'pbakaus/impeccable', ref: 'main', licence: 'Apache-2.0',
    track: ['.agent/skills/impeccable', 'LICENSE', 'NOTICE.md'],
    copy: [['.agent/skills/impeccable', ''], ['LICENSE', 'LICENSE'], ['NOTICE.md', 'NOTICE.md']],
    licenseFiles: ['LICENSE'] },
  { name: 'tastemaker', repo: 'Harrypatria/tastemaker', ref: 'main', licence: 'MIT',
    track: ['skills', 'commands', 'agents', 'hooks/hooks.json', 'adapters/core-prompt.md', 'LICENSE'],
    copy: [['skills', 'skills'], ['commands', 'commands'], ['agents', 'agents'], ['hooks/hooks.json', 'hooks/hooks.json'],
      ['adapters/core-prompt.md', 'adapters/core-prompt.md'], ['LICENSE', 'LICENSE']],
    licenseFiles: ['LICENSE'] },
  { name: 'stageshow', repo: 'benjitaylor/skills', ref: 'main', licence: 'MIT',
    track: ['stageshow'], copy: [['stageshow', '']], licenseFiles: ['LICENSE'] },
];

// How vendor/<name> becomes skills/<dir>: one skill at the vendor root, or one per vendor/skills/* folder.
const skillDirs = (u, vendorDir) => {
  if (u.name !== 'tastemaker') return [{ src: vendorDir, dir: u.name }];
  const base = path.join(vendorDir, 'skills');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(base, d.name, 'SKILL.md')))
    // taste-brief -> tastemaker-brief; the upstream's own "tastemaker" skill keeps its name
    .map(d => ({ src: path.join(base, d.name), dir: d.name.replace(/^taste-/, 'tastemaker-') }));
};

const sha256 = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rm = p => fs.rmSync(p, { recursive: true, force: true });

function copyTree(src, dst) {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) return;
  if (st.isFile()) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); return; }
  for (const e of fs.readdirSync(src)) if (e !== '.git' && e !== 'node_modules') copyTree(path.join(src, e), path.join(dst, e));
}

function hashTree(dir) {
  const out = {};
  const walk = (d, rel) => { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(path.join(d, e.name), r); else if (e.isFile()) out[r] = sha256(path.join(d, e.name));
  } };
  walk(dir, '');
  return out;
}

function diffTrees(a, b) {
  const added = Object.keys(b).filter(k => !(k in a)), removed = Object.keys(a).filter(k => !(k in b));
  const changed = Object.keys(b).filter(k => k in a && a[k] !== b[k]);
  return { added, changed, removed };
}

const readFrontName = file => /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, 'utf8'))?.[1].match(/^name:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1];

// Real providers: gh api for the newest commit over the tracked paths, shallow git clone for the files.
export const ghProvider = {
  async head(u) {
    const rows = await Promise.all(u.track.map(async p => {
      const { stdout } = await run('gh', ['api', `repos/${u.repo}/commits?sha=${u.ref}&path=${encodeURIComponent(p)}&per_page=1`,
        '--jq', '.[0] | .sha + " " + .commit.committer.date'], { timeout: 15000, windowsHide: true });
      const [sha, date] = stdout.trim().split(' ');
      if (!sha || sha === 'null') throw new Error(`${u.name}: no commit found for ${p}`);
      return { sha, date };
    }));
    return rows.sort((a, b) => b.date.localeCompare(a.date))[0].sha;
  },
  async fetch(u, dir) {
    const dst = path.join(dir, 'src');
    await run('git', ['-c', 'core.symlinks=false', 'clone', '--depth', '1', '--branch', u.ref, `https://github.com/${u.repo}.git`, dst],
      { timeout: 120000, windowsHide: true });
    return dst;
  },
};

export async function sync({ root = ROOT, upstreams = UPSTREAMS, provider = ghProvider, apply = false } = {}) {
  const lockFile = path.join(root, 'upstream.lock.json');
  const lock = fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, 'utf8')) : { upstreams: {} };
  const report = [];
  for (const u of upstreams) {
    const prev = lock.upstreams[u.name];
    const sha = await provider.head(u);
    report.push({ name: u.name, sha, prev: prev?.sha, newer: prev?.sha !== sha, refused: null, diff: null });
  }
  const todo = report.filter(r => r.newer);
  if (!apply || !todo.length) return { report, applied: false };

  const tmp = path.join(root, '.tmp-sync');
  rm(tmp); fs.mkdirSync(tmp, { recursive: true });
  try {
    const staged = {}; // name -> staged vendor dir
    for (const r of todo) {
      const u = upstreams.find(x => x.name === r.name), prev = lock.upstreams[u.name];
      const src = await provider.fetch(u, path.join(tmp, 'dl-' + u.name));
      const stage = path.join(tmp, 'vendor', u.name);
      for (const [from, to] of u.copy) {
        const s = path.join(src, from);
        if (fs.existsSync(s)) copyTree(s, path.join(stage, to));
      }
      const lic = {};
      for (const f of u.licenseFiles) {
        const p = path.join(stage, f);
        if (!fs.existsSync(p)) { r.refused = `licence file ${f} is missing upstream`; break; }
        lic[f] = sha256(p);
        if (prev?.license_sha256 && prev.license_sha256[f] !== lic[f]) { r.refused = `licence file ${f} changed upstream; read it, then update the lock by hand`; break; }
      }
      if (r.refused) continue;
      r.diff = diffTrees(hashTree(path.join(root, 'vendor', u.name)), hashTree(stage));
      r.license_sha256 = lic;
      staged[u.name] = stage;
    }
    const okNames = Object.keys(staged);
    if (!okNames.length) return { report, applied: false };

    // Build skills from the new vendor dirs (live ones for upstreams not updated) and check names before touching anything.
    const outSkills = path.join(tmp, 'skills'), renames = [];
    const seen = new Set();
    for (const u of upstreams) {
      const vdir = staged[u.name] ?? path.join(root, 'vendor', u.name);
      for (const s of skillDirs(u, vdir)) {
        if (seen.has(s.dir)) throw new Error(`two skills map to "${s.dir}"`);
        seen.add(s.dir);
        const dst = path.join(outSkills, s.dir);
        copyTree(s.src, dst);
        const file = path.join(dst, 'SKILL.md'), orig = readFrontName(file);
        if (orig && orig !== s.dir) {
          fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^(---\r?\n[\s\S]*?^name:\s*).*$/m, `$1${s.dir}`));
          renames.push({ upstream: u.name, from: orig, to: s.dir });
        }
      }
    }
    const names = new Map();
    const ownFiles = OWN.map(d => path.join(root, 'skills', d, 'SKILL.md')).filter(f => fs.existsSync(f));
    const all = fs.readdirSync(outSkills).map(d => path.join(outSkills, d, 'SKILL.md')).concat(ownFiles);
    for (const f of all) {
      const n = readFrontName(f);
      if (!n) throw new Error(`skill without a name: ${f}`);
      if (names.has(n)) throw new Error(`duplicate skill name "${n}": ${names.get(n)} and ${f}`);
      names.set(n, f);
    }

    // Swap in.
    for (const n of okNames) { rm(path.join(root, 'vendor', n)); fs.mkdirSync(path.join(root, 'vendor'), { recursive: true }); fs.renameSync(staged[n], path.join(root, 'vendor', n)); }
    const skillsRoot = path.join(root, 'skills'); fs.mkdirSync(skillsRoot, { recursive: true });
    for (const d of fs.readdirSync(skillsRoot)) if (!OWN.includes(d)) rm(path.join(skillsRoot, d));
    for (const d of fs.readdirSync(outSkills)) fs.renameSync(path.join(outSkills, d), path.join(skillsRoot, d));

    const now = new Date().toISOString();
    for (const r of todo.filter(x => !x.refused)) {
      const u = upstreams.find(x => x.name === r.name);
      lock.upstreams[u.name] = { repo: u.repo, path: u.track.join(', '), ref: u.ref, sha: r.sha, synced_at: now, licence: u.licence, license_sha256: r.license_sha256 };
    }
    fs.writeFileSync(lockFile, JSON.stringify(lock, null, 2) + '\n');
    writeUpstreamMd(root, lock, [...names.keys()].sort(), upstreams, renames);
    return { report, applied: true };
  } finally { rm(tmp); }
}

function writeUpstreamMd(root, lock, names, upstreams, renames) {
  const f = path.join(root, 'UPSTREAM.md');
  const allRenames = renames; // built from every upstream's vendor dir on each run
  const rows = upstreams.map(u => { const l = lock.upstreams[u.name]; return l ? `| ${u.name} | https://github.com/${l.repo} | ${l.path} | ${l.ref} | \`${l.sha.slice(0, 12)}\` | ${l.licence} | ${l.synced_at.slice(0, 10)} |` : `| ${u.name} | https://github.com/${u.repo} | not synced | | | ${u.licence} | |`; });
  fs.writeFileSync(f, `# Upstreams\n\nGenerated by \`scripts/sync.mjs\`; do not edit. \`vendor/\` holds verbatim copies, \`skills/\` the generated Claude Code skills.\n\n| Upstream | Repo | Tracked paths | Ref | Synced commit | Licence | Synced |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Skills exposed\n\n${names.map(n => `- ${n}`).join('\n')}\n\n## Renamed skills (only the copy under \`skills/\`; \`vendor/\` stays verbatim)\n\n| | Upstream | Original name | Exposed as |\n|---|---|---|---|\n${allRenames.length ? allRenames.map(r => `| rename | ${r.upstream} | \`${r.from}\` | \`${r.to}\` |`).join('\n') : '| none | | | |'}\n\nText inside the vendored skills that names another upstream skill (for example \`taste-brief\`) is verbatim; read it as the \`tastemaker-*\` name above.\n`);
}

function print({ report, applied }) {
  for (const r of report) {
    const s = r.refused ? `REFUSED: ${r.refused}` : r.newer ? `${r.prev ? 'update' : 'new'} ${r.prev?.slice(0, 7) ?? ''}${r.prev ? ' -> ' : ''}${r.sha.slice(0, 7)}` : 'up to date';
    console.log(`${r.name.padEnd(11)} ${s}`);
    if (r.diff) console.log(`            files: +${r.diff.added.length} added, ~${r.diff.changed.length} changed, -${r.diff.removed.length} removed${applied ? ' (applied)' : ''}`);
  }
}

async function main() {
  const args = process.argv.slice(2), daily = args.includes('--daily');
  if (daily) { // hook mode: never fail, never block, quiet unless updates exist
    const dataDir = process.env.CLAUDE_PLUGIN_DATA || ROOT, stamp = path.join(dataDir, '.last-check');
    try {
      if (Date.now() - fs.statSync(stamp).mtimeMs < 864e5) return;
    } catch { /* no stamp yet */ }
    try {
      const { report } = await sync();
      const n = report.filter(r => r.newer).map(r => r.name);
      if (n.length) console.log(`tastestack: upstream updates for ${n.join(', ')}. Run /taste-sync.`);
    } catch { /* offline or gh missing: stay silent */ }
    try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(stamp, new Date().toISOString()); } catch { /* read-only plugin dir */ }
    return;
  }
  const apply = args.includes('--apply');
  let res;
  try { res = await sync({ apply }); } catch (e) { console.error(`taste-sync failed: ${e.message}`); process.exit(2); }
  print(res);
  const refused = res.report.some(r => r.refused);
  if (apply) { if (refused) process.exit(1); return; }
  if (res.report.some(r => r.newer)) { console.log('Updates exist. Run with --apply to take them.'); process.exit(1); }
  console.log('All up to date.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main().catch(e => { console.error(e.message); process.exit(process.argv.includes('--daily') ? 0 : 2); });
