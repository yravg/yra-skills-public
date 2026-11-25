#!/usr/bin/env node
// Runs the repo's own gate (typecheck, lint, test, build) and compares it with a baseline taken before the build.
//   node gate.mjs baseline [--dir <repo>] [--cmd "<command>"]...   record what passes today
//   node gate.mjs check    [--dir <repo>]                           exit 1 on any NEW failure since the baseline
//   node gate.mjs self-check
// Without --cmd, commands come from package.json scripts, run with the repo's package manager (lockfile decides).
// The baseline lives in <dir>/.canvas-to-app/gate.json; keep that folder out of git.
// shortcut: only JS repos are detected; other stacks (cargo, pytest, go) pass --cmd. A command that already failed
// at baseline counts as a new failure only when its error-line count grows; upgrade to per-test diffing if that misses one.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const GROUPS = [
  ['typecheck', 'type-check', 'check-types', 'types', 'tsc'],
  ['lint'],
  ['test:unit', 'test'],
  ['build'],
];

export function detect(dir) {
  const pkgFile = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgFile)) return [];
  const scripts = JSON.parse(fs.readFileSync(pkgFile, 'utf8')).scripts || {};
  const has = (f) => fs.existsSync(path.join(dir, f));
  const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lockb') || has('bun.lock') ? 'bun' : 'npm';
  const cmds = [];
  for (const group of GROUPS) {
    const name = group.find((n) => scripts[n] && !/no test specified/.test(scripts[n]));
    if (name) cmds.push(`${pm} run ${name}`);
    else if (group[0] === 'typecheck' && has('tsconfig.json')) cmds.push('npx --no-install tsc --noEmit');
  }
  return cmds;
}

export function run(dir, cmd) {
  const r = spawnSync(cmd, {
    cwd: dir, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000,
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' }, // CI=1 stops test runners from entering watch mode
  });
  const out = `${r.stdout || ''}${r.stderr || ''}${r.error ? `\n${r.error.message}` : ''}`;
  return {
    cmd,
    code: r.status ?? 1,
    errors: out.split('\n').filter((l) => /\berror\b/i.test(l)).length,
    tail: out.trim().split('\n').slice(-30).join('\n'),
  };
}

export function compare(base, now) {
  return now.map((n) => {
    const b = base.find((x) => x.cmd === n.cmd);
    if (!b) return { ...n, verdict: n.code === 0 ? 'pass (new command)' : 'NEW FAIL (new command)' };
    if (n.code === 0) return { ...n, verdict: b.code === 0 ? 'pass' : 'fixed' };
    if (b.code === 0) return { ...n, verdict: 'NEW FAIL' };
    return { ...n, verdict: n.errors > b.errors ? `NEW FAIL (errors ${b.errors} -> ${n.errors})` : `pre-existing fail (errors ${b.errors} -> ${n.errors})` };
  });
}

const store = (dir) => path.join(dir, '.canvas-to-app', 'gate.json');

function main(argv) {
  const [mode, ...rest] = argv;
  const opt = (k) => rest.flatMap((a, i) => (a === k ? [rest[i + 1]] : []));
  const dir = path.resolve(opt('--dir')[0] || '.');
  if (mode === 'baseline') {
    const cmds = opt('--cmd').length ? opt('--cmd') : detect(dir);
    if (!cmds.length) { console.error('no gate commands found: pass --cmd "<command>" (repeatable)'); return 2; }
    const results = cmds.map((c) => { console.log(`run  ${c}`); return run(dir, c); });
    fs.mkdirSync(path.dirname(store(dir)), { recursive: true });
    fs.writeFileSync(store(dir), JSON.stringify({ taken: new Date().toISOString(), results }, null, 2));
    results.forEach((r) => console.log(`${r.code === 0 ? 'pass' : 'FAIL'} ${r.cmd} (errors ${r.errors})`));
    console.log(`baseline -> ${store(dir)}. Pre-existing failures are allowed; new ones are not.`);
    return 0;
  }
  if (mode === 'check') {
    if (!fs.existsSync(store(dir))) { console.error(`no baseline at ${store(dir)}: run "gate.mjs baseline" before the first edit`); return 2; }
    const base = JSON.parse(fs.readFileSync(store(dir), 'utf8')).results;
    const rows = compare(base, base.map((b) => { console.log(`run  ${b.cmd}`); return run(dir, b.cmd); }));
    let bad = 0;
    for (const r of rows) {
      console.log(`${r.verdict.padEnd(34)} ${r.cmd}`);
      if (r.verdict.startsWith('NEW FAIL')) { bad++; console.log(r.tail.replace(/^/gm, '    ')); }
    }
    console.log(bad ? `${bad} new failure(s): fix the cause, never silence it` : 'gate: no new failures');
    return bad ? 1 : 0;
  }
  if (mode === 'self-check') return selfCheck();
  console.log('usage: node gate.mjs baseline|check [--dir <repo>] [--cmd "<command>"]... | self-check');
  return mode ? 2 : 0;
}

function selfCheck() {
  const assert = (c, m) => { if (!c) throw new Error(`self-check failed: ${m}`); };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  const pkg = (scripts) => fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts }));
  const ok = 'node -e "process.exit(0)"';
  const fail = (n) => `node -e "for(let i=0;i<${n};i++)console.log('error x');process.exit(1)"`;
  try {
    pkg({ lint: ok, test: fail(1) });
    const cmds = detect(dir);
    assert(cmds.join('|') === 'npm run lint|npm run test', `detect gave ${cmds}`);
    const base = cmds.map((c) => run(dir, c));
    assert(base[0].code === 0 && base[1].code !== 0 && base[1].errors >= 1, 'baseline run');
    const same = compare(base, cmds.map((c) => run(dir, c)));
    assert(!same.some((r) => r.verdict.startsWith('NEW FAIL')), 'pre-existing fail flagged as new');
    pkg({ lint: fail(1), test: fail(3) });
    const worse = compare(base, cmds.map((c) => run(dir, c)));
    assert(worse.filter((r) => r.verdict.startsWith('NEW FAIL')).length === 2, 'new lint fail or grown test errors missed');
    pkg({ lint: ok, test: ok });
    assert(compare(base, cmds.map((c) => run(dir, c)))[1].verdict === 'fixed', 'fixed not reported');
    pkg({ test: 'echo "Error: no test specified" && exit 1' });
    assert(detect(dir).length === 0, 'npm placeholder test script counted');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('gate.mjs self-check: ok');
  return 0;
}

process.exitCode = main(process.argv.slice(2));
