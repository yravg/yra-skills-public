#!/usr/bin/env node
// yravglive feed server: a live page for headless CLI agent workers (OpenCode `opencode run`, Antigravity `agy`,
// Codex, Cursor `agent`, ...), for any git repo. Serves the built page (../dist: yravg UI Agent Tree + Agent Monitor)
// and /live.json, rebuilt from the team file on every request:
//   tree      lead + one node per worker (AgentTree shape)
//   monitors  one per worker (AgentMonitor shape): steps parsed from the log, branch, commits, pull request and CI
// No dependencies beyond Node 18+, git and (optionally) gh.
//
// Run from the repo root:  node <skill>/scripts/live-workers.mjs <team.json> [--port 33207] [--repo <path>]
// Team file: {"title": "...", "lead": {"name": "...", "model": "...", "task": "..."},
//             "workers": [{"id": "A", "match": "--title Spekin A", "model": "opencode-go/hy4", "cards": "IMP-43",
//                          "worktree": "../Spekin-core", "log": "../worker-A.log", "branches": ["imp-43-..."]}]}
// Paths are relative to the repo. A worker is running while a process whose command line contains its `match`
// text is alive (default `--title <title> `, the opencode run convention).
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const flagValues = new Set(['--port', '--repo', '--host'].map((n) => flag(n)).filter(Boolean));
const repo = path.resolve(flag('--repo', process.cwd()));
const teamFile = path.resolve(args.find((a) => !a.startsWith('--') && !flagValues.has(a)) ?? path.join(repo, 'live-team.json'));
const port = Number(flag('--port', process.env.LIVE_PORT || 33207));
const host = flag('--host', process.env.LIVE_HOST || '127.0.0.1');

const run = (cmd, argv, cwd = repo) => {
  try {
    return execFileSync(cmd, argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000, maxBuffer: 8 << 20 }).trim();
  } catch {
    return '';
  }
};
const clean = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

// GitHub is slow and rate-limited: ask at most every 30 s.
let prCache = { at: 0, prs: [] };
function pullRequests() {
  if (Date.now() - prCache.at > 30_000) {
    const out = run('gh', ['pr', 'list', '--state', 'all', '--limit', '40', '--json',
      'number,title,headRefName,state,url,statusCheckRollup']);
    // A failed call (network drop, rate limit) prints nothing: keep the last good list and retry in 10 s,
    // never cache "no pull requests" (24 Nov 2026: merged workers showed "No pull request").
    let list = null;
    try { list = out ? JSON.parse(out) : null; } catch { /* keep the last good list */ }
    prCache = list ? { at: Date.now(), prs: list, ok: true } : { ...prCache, at: Date.now() - 20_000, ok: false };
  }
  return prCache.prs;
}

function ci(pr) {
  const checks = pr.statusCheckRollup ?? [];
  const jobs = checks.map((c) => ({ name: c.name || c.context, result: (c.conclusion || c.state || c.status || 'pending').toLowerCase() }));
  const done = checks.length > 0 && checks.every((c) => (c.status ?? 'COMPLETED') === 'COMPLETED');
  const green = done && checks.every((c) => (c.conclusion || c.state) === 'SUCCESS');
  return { jobs, tone: !checks.length ? 'pending' : green ? 'green' : done ? 'red' : 'pending' };
}

// One step per tool line the CLI prints. Logs carry no timestamps, so no durations are invented.
const KINDS = [
  [/^→\s*Read\s+(.*)/, 'read', 'Read'],
  [/^✱\s*(Grep|Glob)\s+(.*)/, 'search', null],
  [/^←\s*(Edit|Write)\s+(.*)/, 'edit', null],
  [/^\$\s+(.*)/, 'run', 'Run'],
  [/^✗\s+(.*)/, 'run', 'Failed'],
];
function steps(lines) {
  const out = [];
  lines.forEach((line, i) => {
    for (const [re, kind, verb] of KINDS) {
      const m = line.match(re);
      if (!m) continue;
      const label = verb ? `${verb} ${m[1]}` : `${m[1]} ${m[2]}`;
      out.push({ id: `s${i}`, kind, label: label.slice(0, 140), state: verb === 'Failed' ? 'failed' : 'done' });
      break;
    }
  });
  return out;
}

function processes() {
  // Only command lines we may match; the full process list can pass 1 MB.
  return run('ps', ['-axww', '-o', 'pid=,command=']).split('\n').filter((l) => !l.includes('live-workers.mjs'));
}

function worker(w, procs, prs) {
  const wt = path.resolve(repo, w.worktree ?? '.');
  const match = w.match ?? `--title ${w.title} `;
  const proc = procs.find((l) => l.includes(match));
  const pid = proc ? proc.trim().split(/\s+/)[0] : null;
  const startedText = pid ? run('ps', ['-o', 'lstart=', '-p', pid]) : '';
  let since = startedText ? Date.parse(startedText) || undefined : undefined;
  const branch = run('git', ['branch', '--show-current'], wt) || '(detached)';
  const ahead = run('git', ['log', '--oneline', 'origin/main..HEAD'], wt).split('\n').filter(Boolean);
  const changed = run('git', ['status', '--short'], wt).split('\n').filter(Boolean).length;
  let lines = [];
  let logAt;
  let logBorn;
  try {
    const p = path.resolve(repo, w.log);
    lines = clean(fs.readFileSync(p, 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean);
    const st = fs.statSync(p);
    logAt = st.mtimeMs;
    logBorn = st.birthtimeMs || undefined;
  } catch { /* no log yet */ }
  // A finished worker has no process start time left: fall back to when its log was created.
  since ??= logBorn;
  const all = steps(lines);
  const recent = all.slice(-25);
  const tail = lines.slice(-12);
  const mine = prs.filter((p) => (w.branches ?? []).includes(p.headRefName) || p.headRefName === branch)
    .map((p) => ({ number: p.number, title: p.title, url: p.url, state: p.state.toLowerCase(), ...ci(p) }));
  // A merged pull request outranks an old error at the end of the log (the work landed another way).
  const failedLog = !pid && !mine.some((p) => p.state === 'merged') && tail.slice(-5).some((l) => /\berror\b|failed|usage limit/i.test(l));
  const state = pid ? 'running' : failedLog ? 'failed' : lines.length ? 'finished' : 'idle';
  const last = [...lines].reverse().find((l) => !/^> build/.test(l)) ?? '';
  if (state === 'running' && recent.length) recent[recent.length - 1] = { ...recent[recent.length - 1], state: 'running' };
  return {
    id: w.id,
    state,
    agent: { name: `Worker ${w.id} · ${w.cards}`, role: w.model },
    current: state === 'running' ? { label: last.slice(0, 140) } : undefined,
    steps: recent,
    stepCount: all.length,
    since,
    until: state === 'running' ? undefined : logAt,
    error: state === 'failed' ? tail.slice(-3).join(' · ') : undefined,
    outcome: state === 'finished' ? { note: mine.length ? mine.map((p) => `#${p.number} ${p.state}`).join(', ') : 'No pull request' } : undefined,
    model: w.model,
    cards: w.cards,
    worktree: w.worktree ?? '.',
    branch,
    ahead,
    changed,
    logAt,
    tail,
    prs: mine,
  };
}

// ---- Discovery (0.3.0). The team file is not the source of truth: a worker it does not list (a Claude subagent,
// a hand-made worktree, the lead in the main checkout) was invisible, and listed workers that finished hours ago
// looked current (24 Nov 2026). Every refresh now also reads the repo itself: each git worktree, its uncommitted
// files by modification time, its commits not on main, and the processes whose working folder is inside it.
const ACTIVE_MS = 3 * 60_000;
const agoText = (ms) => { const s = Math.round((Date.now() - ms) / 1000); return s < 90 ? `${s}s ago` : s < 5400 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };

function worktrees() {
  const out = [];
  let cur = null;
  for (const line of run('git', ['worktree', 'list', '--porcelain']).split('\n')) {
    if (line.startsWith('worktree ')) { cur = { path: line.slice(9), branch: '(detached)' }; out.push(cur); }
    else if (line.startsWith('branch ') && cur) cur.branch = line.slice(7).replace('refs/heads/', '');
    else if (line === 'prunable' && cur) cur.prunable = true;
  }
  return out.filter((w) => !w.prunable && fs.existsSync(w.path));
}

// pid -> working folder for every process (lsof is slow: at most every 10 s).
let cwdCache = { at: 0, map: new Map() };
function cwds() {
  if (Date.now() - cwdCache.at > 10_000) {
    const map = new Map();
    let pid = null;
    for (const l of run('lsof', ['-d', 'cwd', '-Fpn']).split('\n')) {
      if (l.startsWith('p')) pid = l.slice(1);
      else if (l.startsWith('n') && pid) map.set(pid, l.slice(1));
    }
    cwdCache = { at: Date.now(), map };
  }
  return cwdCache.map;
}

const SHELL = /^(-?zsh|-?bash|sh|login|tmux|ps|lsof|git|sleep)\b/;
function discovered(wt, procs, prs, isMain) {
  const short = wt.path.startsWith(path.dirname(repo)) ? path.relative(repo, wt.path) || '.' : wt.path;
  const status = run('git', ['status', '--porcelain'], wt.path).split('\n').filter(Boolean);
  const files = status.map((l) => {
    const rel = l.slice(3).replace(/^"|"$/g, '').split(' -> ').pop();
    let t = 0;
    try { t = fs.statSync(path.join(wt.path, rel)).mtimeMs; } catch { /* deleted */ }
    return { rel, code: l.slice(0, 2).trim(), t };
  }).sort((a, b) => b.t - a.t);
  const ahead = run('git', ['log', '--format=%h%x09%ct%x09%s', 'origin/main..HEAD'], wt.path).split('\n').filter(Boolean)
    .map((l) => { const [h, ct, s] = l.split('\t'); return { h, t: Number(ct) * 1000, s }; });
  const here = [];
  for (const [pid, dir] of cwds()) {
    if (dir !== wt.path && !dir.startsWith(wt.path + '/')) continue;
    const cmd = (procs.find((l) => l.trim().split(/\s+/)[0] === pid) ?? '').trim().split(/\s+/).slice(1).join(' ');
    if (cmd && !SHELL.test(path.basename(cmd.split(' ')[0])) && !cmd.includes('live-workers.mjs')) here.push({ pid, cmd });
  }
  const lastFile = files.find((f) => f.t)?.t ?? 0;
  const lastCommit = ahead[0]?.t ?? 0;
  const last = Math.max(lastFile, lastCommit);
  const busy = here.some((p) => /opencode|claude|codex|cursor|playwright|render\.mjs|build|cargo|vite|npm/.test(p.cmd));
  const state = Date.now() - last < ACTIVE_MS || (busy && !isMain) ? 'running' : ahead.length || files.length ? 'finished' : 'idle';
  const steps = [
    ...files.slice(0, 15).map((f, i) => ({ id: `f${i}`, kind: 'edit', label: `${f.code || 'M'} ${f.rel}${f.t ? ' · ' + agoText(f.t) : ''}`.slice(0, 140), state: 'done', t: f.t })),
    ...ahead.slice(0, 8).map((c, i) => ({ id: `c${i}`, kind: 'run', label: `Commit ${c.h} ${c.s} · ${agoText(c.t)}`.slice(0, 140), state: 'done', t: c.t })),
  ].sort((a, b) => a.t - b.t).map(({ t, ...s }) => s);
  if (state === 'running' && steps.length) steps[steps.length - 1].state = 'running';
  const mine = prs.filter((p) => p.headRefName === wt.branch)
    .map((p) => ({ number: p.number, title: p.title, url: p.url, state: p.state.toLowerCase(), ...ci(p) }));
  const firstT = Math.min(...[...files.map((f) => f.t).filter(Boolean), ...ahead.map((c) => c.t)].concat(Infinity));
  return {
    id: isMain ? 'main' : path.basename(wt.path),
    state,
    discovered: true,
    agent: { name: isMain ? `Main checkout · ${wt.branch}` : `Worktree ${path.basename(wt.path)} · ${wt.branch}`, role: here.length ? here.map((p) => p.cmd.split(' ')[0].split('/').pop()).join(', ') : 'no process in this folder' },
    current: state === 'running' ? { label: (steps.at(-1)?.label ?? here[0]?.cmd ?? '').slice(0, 140) } : undefined,
    steps,
    stepCount: steps.length,
    since: Number.isFinite(firstT) ? firstT : undefined,
    until: state === 'running' ? undefined : last || undefined,
    outcome: state === 'finished' ? { note: mine.length ? mine.map((p) => `#${p.number} ${p.state}`).join(', ') : `${ahead.length} commit(s), ${files.length} changed file(s), no pull request` } : undefined,
    model: here.length ? here.map((p) => p.cmd.slice(0, 60)).join(' | ') : '(no process)',
    cards: isMain ? 'lead checkout' : wt.branch,
    worktree: short,
    branch: wt.branch,
    ahead: ahead.map((c) => `${c.h} ${c.s}`),
    changed: files.length,
    logAt: last || undefined,
    tail: [
      ...here.map((p) => `[pid ${p.pid}] ${p.cmd}`.slice(0, 200)),
      ...files.slice(0, 8).map((f) => `${f.code || 'M'} ${f.rel}${f.t ? '  (' + agoText(f.t) + ')' : ''}`),
    ],
    prs: mine,
  };
}

// Recent merges to main and open pull requests: what the repo did lately, whoever did it.
function repoActivity(prs) {
  run('git', ['fetch', '-q', 'origin', 'main']);
  const commits = run('git', ['log', '--first-parent', '--format=%h%x09%ct%x09%s', '-12', 'origin/main']).split('\n').filter(Boolean)
    .map((l) => { const [h, ct, s] = l.split('\t'); return { h, t: Number(ct) * 1000, s }; });
  const open = prs.filter((p) => p.state === 'OPEN').map((p) => ({ number: p.number, title: p.title, url: p.url, state: 'open', ...ci(p) }));
  const last = commits[0]?.t;
  return {
    id: 'repo',
    state: open.some((p) => p.tone === 'pending') || (last && Date.now() - last < ACTIVE_MS) ? 'running' : 'finished',
    discovered: true,
    agent: { name: 'Repo · origin/main and open pull requests', role: `${open.length} open PR(s)` },
    current: open.length ? { label: open.map((p) => `#${p.number} ${p.tone}`).join(', ') } : undefined,
    steps: commits.slice().reverse().map((c, i) => ({ id: `m${i}`, kind: 'run', label: `${c.h} ${c.s} · ${agoText(c.t)}`.slice(0, 140), state: 'done' })),
    stepCount: commits.length,
    since: commits.at(-1)?.t,
    until: last,
    outcome: { note: `last change on main ${last ? agoText(last) : 'unknown'}` },
    model: 'git + gh',
    cards: 'main',
    worktree: '.',
    branch: 'main',
    ahead: [],
    changed: 0,
    logAt: last,
    tail: commits.map((c) => `${c.h}  ${agoText(c.t).padEnd(11)} ${c.s}`),
    prs: open,
  };
}
let activityCache = { at: 0, m: null };

// Parity: the team file's "parity": {"command": "<shell command printing parity JSON>", "every": 60}.
// The command runs in the repo, at most every `every` seconds, never twice at once; its last good answer is served.
let parity = { at: 0, busy: false, body: null, error: '' };
function refreshParity(cfg) {
  if (!cfg?.command || parity.busy || Date.now() - parity.at < (cfg.every ?? 60) * 1000) return;
  parity.busy = true;
  exec(cfg.command, { cwd: repo, timeout: 120_000, maxBuffer: 32 << 20 }, (err, stdout, stderr) => {
    parity.busy = false;
    parity.at = Date.now();
    if (err) { parity.error = String(stderr || err.message).slice(0, 400); return; }
    try { JSON.parse(stdout); parity.body = stdout; parity.error = ''; } catch (e) { parity.error = 'parity command did not print JSON: ' + e.message; }
  });
}

const TREE_STATUS = { running: 'running', finished: 'done', failed: 'failed', idle: 'queued' };

function feed() {
  const team = JSON.parse(fs.readFileSync(teamFile, 'utf8'));
  const procs = processes();
  const prs = pullRequests();
  const listed = (team.workers ?? []).map((w) => worker(w, procs, prs));
  // A listed worker that finished more than `stale_hours` (default 6) ago is history, not current work: drop it.
  const staleMs = (team.stale_hours ?? 6) * 3600_000;
  const fresh = listed.filter((m) => m.state === 'running' || !m.logAt || Date.now() - m.logAt < staleMs);
  const listedPaths = new Set((team.workers ?? []).map((w) => path.resolve(repo, w.worktree ?? '.')));
  const found = team.discover === false ? [] : worktrees()
    .filter((wt) => !listedPaths.has(wt.path) || wt.path === repo)
    .map((wt) => discovered(wt, procs, prs, wt.path === repo))
    .filter((m) => m.state !== 'idle' || m.id === 'main')
    .filter((m) => m.state === 'running' || !m.logAt || Date.now() - m.logAt < staleMs);
  if (Date.now() - activityCache.at > 30_000) activityCache = { at: Date.now(), m: repoActivity(prs) };
  const monitors = [...fresh, ...found, ...(team.discover === false ? [] : [activityCache.m])];
  refreshParity(team.parity);
  const lead = team.lead ?? { name: 'Lead', model: 'Claude Code' };
  const starts = monitors.map((m) => m.since).filter(Boolean);
  return {
    // The parity command reads the checkout on disk: say so when it is behind origin/main, or the numbers look current
    // while they describe old code (24 Nov 2026: parity showed commit 37b4781 three merges late).
    title: (team.title ?? path.basename(repo) + ' live') + (() => {
      const behind = Number(run('git', ['rev-list', '--count', 'HEAD..origin/main']) || 0);
      return behind ? ` · checkout ${behind} commit(s) behind origin/main: run git pull --ff-only` : '';
    })(),
    parity: Boolean(team.parity?.command),
    updated: Date.now(),
    tree: {
      id: 'lead',
      name: lead.name,
      model: lead.model,
      task: lead.task ?? 'Reviews each pull request; merges only on green CI',
      status: monitors.some((m) => m.state === 'running') ? 'running' : 'done',
      started: starts.length ? Math.min(...starts) : undefined,
      children: monitors.map((m) => ({
        id: m.id,
        name: m.discovered ? m.agent.name : `Worker ${m.id}`,
        model: m.model,
        task: m.cards,
        status: TREE_STATUS[m.state],
        started: m.since,
        ended: m.state === 'running' ? undefined : m.logAt,
        error: m.error,
      })),
    },
    monitors,
  };
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  // Every answer says which program sent it, so a check can prove the browser reached this page and not
  // another app on the same port (24 Nov 2026: Clausarium's API answered on 33107).
  res.setHeader('x-yravglive', '1');
  try {
    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ app: 'yravglive', repo, team: teamFile, port }));
      return;
    }
    if (url.pathname === '/parity.json') {
      if (!parity.body) {
        res.writeHead(503, { 'content-type': 'text/plain' });
        res.end(parity.error || 'parity not ready yet (or no "parity.command" in the team file)');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(parity.body);
      return;
    }
    if (url.pathname === '/live.json') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(feed()));
      return;
    }
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.resolve(dist, rel);
    if (!file.startsWith(dist + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end(fs.existsSync(path.join(dist, 'index.html')) ? 'not found' : 'Page not built: cd app && npm install && npm run build');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(file));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(e));
  }
});

// macOS lets 127.0.0.1:<port> and *:<port> be bound by two programs at once, and the browser then reaches either one
// (24 Nov 2026: Clausarium's API on *:33107 answered instead of this page). So first prove the port is free on every
// address, and refuse to start if anything else holds it.
const probe = net.createServer();
probe.once('error', (e) => {
  console.error(`yravglive: port ${port} is already in use by another program (${e.code}). Pick another with --port.`);
  process.exit(1);
});
probe.listen({ port, host: '0.0.0.0', exclusive: true }, () => {
  probe.close(() => server.listen(port, host, () => console.log(`yravglive: http://${host}:${port}/  (repo ${repo}, team ${teamFile})`)));
});
