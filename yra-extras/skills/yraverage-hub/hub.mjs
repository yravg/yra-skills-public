#!/usr/bin/env node
// yraverage Hub link: connects a project folder to the Hub over its MCP endpoint (/api/mcp).
// Node standard library only, so it runs from any project without an install step.
// Spec: docs/superpowers/specs/2026-09-24-project-link-and-templates-design.md in the Hub repo.

import { execFileSync, spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir, hostname } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(import.meta.url);
const HOME_DIR = join(homedir(), '.yraverage');
const CONFIG = join(HOME_DIR, 'hub.json');
const DEFAULT_HUB = 'http://localhost:49099';
const LOGIN_PORT = 47821;
const MARK_START = '<!-- yraverage-hub:start -->';
const MARK_END = '<!-- yraverage-hub:end -->';

// Mirrors the Hub's workspace scan (apps/hub/src/workspace/scan.ts) so a pushed folder looks the same as a scanned one.
const MAX_DEPTH = 4;
const MAX_DOC_BYTES = 256 * 1024;
const MAX_FILES = 400;
const MAX_CHARS = 3.5 * 1024 * 1024;
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', 'vendor', 'venv', 'env', '__pycache__', 'site-packages', 'target', 'worktrees', 'bower_components', 'graft']);
const ignoredDir = (name) => IGNORED_DIRS.has(name.toLowerCase()) || (name.startsWith('.') && name !== '.claude');
const isDoc = (name) => /\.(md|mdx|markdown)$/i.test(name) || /^tasks\.json$/i.test(name);
const MANIFEST_NAME = /^(package\.json|requirements\.txt|pyproject\.toml|(start(_.*)?|open .*)\.(bat|cmd))$/i;
const NAME_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

// ---------- small helpers ----------

const b64url = (buf) => buf.toString('base64url');
const readJson = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};
function writeJson(path, value, mode) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, mode ? { mode } : undefined);
  renameSync(tmp, path);
}
const git = (cwd, args, timeout = 5000) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};
function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) pos.push(a);
    else {
      const v = i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      // A repeated flag (--route / --route /x) collects its values in order.
      flags[a.slice(2)] = a.slice(2) in flags ? [].concat(flags[a.slice(2)], v) : v;
    }
  }
  return { pos, flags };
}

// ---------- project folder ----------

/** The folder a command acts on: the git top level of `dir`, or `dir` itself. Junctions resolved. */
export function projectRoot(dir = process.cwd()) {
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  return realpathSync.native(top ? resolve(top) : resolve(dir));
}

const projectFile = (root) => join(root, '.yraverage', 'project.json');

/** The main checkout a git worktree (an Orca workspace, say) belongs to; null for the main checkout itself or no git. */
export function mainCheckout(root) {
  const common = git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  if (!common || basename(common) !== '.git') return null;
  let main;
  try {
    main = realpathSync.native(dirname(resolve(common)));
  } catch {
    return null;
  }
  return main.toLowerCase() === root.toLowerCase() ? null : main;
}

/**
 * The folder whose link a command uses. The link file is gitignored, so a worktree has none of its own: it reports
 * under its main checkout's project, and that project page shows whichever copy committed last.
 */
export function linkRoot(root) {
  if (!root || existsSync(projectFile(root))) return root;
  const main = mainCheckout(root);
  return main && existsSync(projectFile(main)) ? main : root;
}

/** Hub URL for a command: --hub, then YRAVERAGE_HUB, then the project's link, then the login default. */
function hubUrl(flags, root) {
  const raw = (typeof flags.hub === 'string' && flags.hub) || process.env.YRAVERAGE_HUB || (root && readJson(projectFile(linkRoot(root)), {}).hub) || readJson(CONFIG, {}).default || DEFAULT_HUB;
  return new URL(raw).origin;
}

/** What the Hub needs to file the folder: git facts, top-level names, manifests and documents. Never source code. */
export function collect(dir) {
  const folder = realpathSync.native(dir);
  const top = readdirSync(folder, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
  const manifests = {};
  for (const name of top.filter((n) => MANIFEST_NAME.test(n))) {
    try {
      manifests[name] = readFileSync(join(folder, name), 'utf8').slice(0, MAX_DOC_BYTES);
    } catch {
      // unreadable manifest: the Hub simply gets no starter from it
    }
  }
  const files = [];
  let chars = 0;
  // Level by level, so the caps cut the deepest folders: a generated tree of notes cannot crowd out README.md or docs/.
  const queue = [[folder, 0]];
  const visit = (dir, depth) => {
    let list;
    try {
      list = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of list.sort((a, b) => a.name.localeCompare(b.name))) {
      if (files.length >= MAX_FILES || chars >= MAX_CHARS) return;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth < MAX_DEPTH && !ignoredDir(entry.name)) queue.push([path, depth + 1]);
        continue;
      }
      if (!entry.isFile() || !isDoc(entry.name)) continue;
      let text;
      try {
        // An oversized document is sent just past the cap, so the Hub lists it as too large without the whole file.
        text = statSync(path).size > MAX_DOC_BYTES ? readFileSync(path, 'utf8').slice(0, MAX_DOC_BYTES + 1) : readFileSync(path, 'utf8');
      } catch {
        continue;
      }
      files.push({ path: relative(folder, path).split('\\').join('/'), text });
      chars += text.length;
    }
  };
  while (queue.length > 0) visit(...queue.shift());
  return { folder, git: gitState(folder), top, manifests, files };
}

function gitState(folder) {
  if (!existsSync(join(folder, '.git'))) return null;
  const log = git(folder, ['log', '-1', '--format=%H%x1f%s%x1f%ct']);
  const [sha, subject, ct] = log ? log.split('\x1f') : [];
  const counts = git(folder, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
  const [ahead, behind] = counts ? counts.split(/\s+/).map(Number) : [];
  const status = git(folder, ['status', '--porcelain']);
  return {
    remote: git(folder, ['remote', 'get-url', 'origin']),
    branch: git(folder, ['rev-parse', '--abbrev-ref', 'HEAD']),
    commit: sha && ct ? { sha, subject: subject ?? '', at: Number(ct) * 1000 } : null,
    uncommitted: status ? status.split('\n').filter(Boolean).length : 0,
    ahead: Number.isFinite(ahead) ? ahead : null,
    behind: Number.isFinite(behind) ? behind : null,
  };
}

// ---------- sign-in ----------

const loadConfig = () => readJson(CONFIG, { default: null, hubs: {} });
const saveConfig = (config) => writeJson(CONFIG, config, 0o600);

function openBrowser(url) {
  if (process.env.YRAVERAGE_NO_BROWSER) return;
  const [cmd, args] =
    process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // the URL is printed as well
  }
}

async function post(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers, body });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON; reported below
  }
  return { status: res.status, json, text };
}

/** OAuth with PKCE in the browser: the Hub's consent page names the agent; tokens land in ~/.yraverage/hub.json. */
export async function login(hub, { log = console.log } = {}) {
  const config = loadConfig();
  const redirectUri = `http://127.0.0.1:${LOGIN_PORT}/callback`;
  let entry = config.hubs[hub] ?? {};
  if (!entry.clientId || entry.redirectUri !== redirectUri) {
    const reg = await post(`${hub}/oauth/register`, JSON.stringify({ client_name: 'yraverage-hub skill', redirect_uris: [redirectUri] }), { 'content-type': 'application/json' });
    if (reg.status !== 201 || !reg.json?.client_id) throw new Error(`The Hub refused the client registration (${reg.status}): ${reg.json?.error_description ?? reg.text.slice(0, 200)}`);
    entry = { clientId: reg.json.client_id, redirectUri };
  }
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const state = b64url(randomBytes(16));
  const authorize = new URL(`${hub}/oauth/authorize`);
  // The consent page fills this in, so one machine keeps one board name across sign-ins.
  const agentName = `hub-cli-${hostname().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`.slice(0, 60);
  for (const [k, v] of Object.entries({ response_type: 'code', client_id: entry.clientId, redirect_uri: redirectUri, code_challenge: challenge, code_challenge_method: 'S256', state, agent_name: agentName }))
    authorize.searchParams.set(k, v);

  const code = await new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', redirectUri);
      if (url.pathname !== '/callback') return res.writeHead(404).end();
      const ok = url.searchParams.get('state') === state && url.searchParams.get('code');
      res.writeHead(ok ? 200 : 400, { 'content-type': 'text/plain; charset=utf-8' }).end(ok ? 'Signed in to the yraverage Hub. You can close this tab.' : 'Sign-in was refused or did not match. Run login again.');
      clearTimeout(timer);
      server.close();
      if (ok) resolveCode(url.searchParams.get('code'));
      else reject(new Error(`Sign-in did not finish: ${url.searchParams.get('error') ?? 'state mismatch'}`));
    });
    const timer = setTimeout(() => (server.close(), reject(new Error('Sign-in timed out after 5 minutes.'))), 5 * 60_000);
    server.on('error', (e) => reject(new Error(`Cannot listen on 127.0.0.1:${LOGIN_PORT} for the sign-in callback: ${e.message}`)));
    server.listen(LOGIN_PORT, '127.0.0.1', () => {
      log(`Opening the Hub to approve this agent. If no browser opens, visit:\n${authorize}`);
      openBrowser(authorize.toString());
    });
  });

  const form = new URLSearchParams({ grant_type: 'authorization_code', client_id: entry.clientId, code, code_verifier: verifier, redirect_uri: redirectUri });
  const tok = await post(`${hub}/oauth/token`, form.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  if (!tok.json?.access_token) throw new Error(`Token exchange failed (${tok.status}): ${tok.json?.error_description ?? tok.text.slice(0, 200)}`);
  const fresh = loadConfig();
  fresh.hubs[hub] = { ...entry, access: tok.json.access_token, refresh: tok.json.refresh_token, expiresAt: Date.now() + tok.json.expires_in * 1000 };
  fresh.default = hub;
  saveConfig(fresh);
  log(`Signed in to ${hub}.`);
}

const NOT_CONNECTED = (hub) => `Not connected to ${hub}. On the Hub's Command Center press "Copy agent prompt" and paste it into your agent.`;

/**
 * A bearer for the Hub: YRAVERAGE_HUB_KEY (an agent key), else the key of the agent this machine enrolled through
 * a copied prompt, else the stored browser sign-in, refreshed when near expiry.
 */
async function bearer(hub, force = false) {
  if (process.env.YRAVERAGE_HUB_KEY) return process.env.YRAVERAGE_HUB_KEY;
  const entry = loadConfig().hubs[hub];
  const enrolled = entry?.agent && join(HOME_DIR, 'agents', `${entry.agent}.key`);
  if (!entry?.refresh && enrolled && existsSync(enrolled)) return readFileSync(enrolled, 'utf8').trim();
  if (!entry?.refresh) throw new Error(NOT_CONNECTED(hub));
  if (!force && entry.access && entry.expiresAt - 60_000 > Date.now()) return entry.access;
  const form = new URLSearchParams({ grant_type: 'refresh_token', client_id: entry.clientId, refresh_token: entry.refresh });
  const tok = await post(`${hub}/oauth/token`, form.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  const config = loadConfig();
  if (!tok.json?.access_token) {
    // Another sync may have rotated the refresh token a moment ago; use what it stored.
    const now = config.hubs[hub];
    if (now?.refresh !== entry.refresh && now?.access && now.expiresAt - 60_000 > Date.now()) return now.access;
    throw new Error(`The Hub refused the stored sign-in (${tok.json?.error ?? tok.status}). Run: node hub.mjs login --hub ${hub}`);
  }
  config.hubs[hub] = { ...entry, access: tok.json.access_token, refresh: tok.json.refresh_token, expiresAt: Date.now() + tok.json.expires_in * 1000 };
  saveConfig(config);
  return tok.json.access_token;
}

/** One MCP tool call. Returns the tool's JSON reply; throws with the Hub's refusal message. */
export async function call(hub, tool, args = {}) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args } });
  let res;
  for (const force of [false, true]) {
    res = await post(`${hub}/api/mcp`, body, { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: `Bearer ${await bearer(hub, force)}` });
    if (res.status !== 401 || process.env.YRAVERAGE_HUB_KEY) break;
  }
  if (res.status === 401) throw new Error(`The Hub refused the credentials. ${NOT_CONNECTED(hub)}`);
  if (res.json?.error) throw new Error(`MCP error: ${res.json.error.message}`);
  const text = res.json?.result?.content?.[0]?.text;
  if (typeof text !== 'string') throw new Error(`Unexpected reply from the Hub (${res.status}): ${res.text.slice(0, 200)}`);
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    value = { ok: !res.json.result.isError, text };
  }
  if (res.json.result.isError) throw Object.assign(new Error(value?.refusal?.message ?? value?.text ?? text), { refusal: value?.refusal });
  return value;
}

// ---------- link ----------

function upsertBlock(file, block, comment = (s) => s) {
  const start = comment(MARK_START);
  const end = comment(MARK_END);
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const wrapped = `${start}\n${block}\n${end}`;
  const at = text.indexOf(start);
  const stop = text.indexOf(end);
  const next = at >= 0 && stop > at ? text.slice(0, at) + wrapped + text.slice(stop + end.length) : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${text ? '\n' : ''}${wrapped}\n`;
  if (next !== text) writeFileSync(file, next);
}

/** The installed script if there is one, so hooks keep working when this copy moves. */
const stableScript = () => (existsSync(join(HOME_DIR, 'hub.mjs')) ? join(HOME_DIR, 'hub.mjs') : HERE);

/** post-commit hook that syncs in the background; never blocks or fails a commit. Honours core.hooksPath. */
export function installHook(root, script = stableScript()) {
  const rel = git(root, ['rev-parse', '--git-path', 'hooks']);
  if (!rel) return null;
  const dir = isAbsolute(rel) ? rel : resolve(root, rel);
  mkdirSync(dir, { recursive: true });
  const hook = join(dir, 'post-commit');
  if (!existsSync(hook)) writeFileSync(hook, '#!/bin/sh\n');
  const node = process.execPath.split('\\').join('/');
  upsertBlock(hook, `("${node}" "${script.split('\\').join('/')}" sync --quiet >/dev/null 2>&1 &)`, (m) => `# ${m.slice(5, -4)}`);
  try {
    execFileSync('chmod', ['+x', hook], { stdio: 'ignore' });
  } catch {
    // Git for Windows runs hooks without the executable bit
  }
  return hook;
}

/** Seconds between two edit-time syncs; turn ends and commits always sync. */
const EDIT_SYNC_SECONDS = 20;
const isOurHook = (h) => typeof h?.command === 'string' && /hub\.mjs"? sync\b/.test(h.command);

/**
 * Claude Code hooks in the committed .claude/settings.json, so the Hub follows a session while it works, in this
 * checkout and in every worktree made from it: a sync after file edits (at most one per EDIT_SYNC_SECONDS) and one
 * when the agent or a subagent finishes its turn. Other hooks in the file are kept; re-linking replaces only ours.
 */
export function installAgentHooks(root, script = stableScript()) {
  const file = join(root, '.claude', 'settings.json');
  const settings = readJson(file, {});
  // Plain `node` from PATH: the file is committed and runs on whichever machine or tool opens the repo.
  const run = (extra) => `(node "${script.split('\\').join('/')}" sync --quiet --linked-only${extra} >/dev/null 2>&1 &)`;
  const ours = {
    PostToolUse: { matcher: 'Write|Edit|MultiEdit|NotebookEdit', hooks: [{ type: 'command', command: run(` --throttle ${EDIT_SYNC_SECONDS}`) }] },
    Stop: { hooks: [{ type: 'command', command: run('') }] },
    SubagentStop: { hooks: [{ type: 'command', command: run('') }] },
  };
  const hooks = { ...settings.hooks };
  for (const [event, entry] of Object.entries(ours)) {
    const kept = (Array.isArray(hooks[event]) ? hooks[event] : [])
      .map((e) => ({ ...e, hooks: (e.hooks ?? []).filter((h) => !isOurHook(h)) }))
      .filter((e) => e.hooks.length > 0);
    hooks[event] = [...kept, entry];
  }
  writeJson(file, { ...settings, hooks });
  return file;
}

/** True when an edit-time sync ran less than `seconds` ago; otherwise stamps now and returns false. */
function throttled(home, seconds) {
  const stamp = join(home, '.yraverage', 'last-edit-sync');
  const last = Number(existsSync(stamp) ? readFileSync(stamp, 'utf8') : 0);
  if (Date.now() - last < seconds * 1000) return true;
  mkdirSync(dirname(stamp), { recursive: true });
  writeFileSync(stamp, String(Date.now()));
  return false;
}

function writeLinkFiles(root, hub, reply) {
  writeJson(projectFile(root), { hub, projectId: reply.projectId, url: reply.url, syncedAt: new Date().toISOString() });
  const ignore = join(root, '.yraverage', '.gitignore');
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n');
}

export async function link(root, hub, { log = console.log, work = false } = {}) {
  const reply = await sync(root, hub, { work });
  const mcpFile = join(root, '.mcp.json');
  const mcp = readJson(mcpFile, {});
  mcp.mcpServers = { ...mcp.mcpServers, 'yraverage-hub': { type: 'http', url: `${hub}/api/mcp` } };
  writeJson(mcpFile, mcp);
  upsertBlock(
    join(root, 'AGENTS.md'),
    [
      '## yraverage Hub',
      '',
      `This folder is linked to the yraverage Hub project \`${reply.projectId}\`: ${reply.url}`,
      '',
      '- Every commit syncs the documents (PRD, plans, design, architecture, README, AGENTS.md, CLAUDE.md, tasks.json) to the Hub in the background, and so do Claude Code edits and turn ends (hooks in `.claude/settings.json`). Source code is never sent.',
      '- After changing documents without committing, run `node ~/.yraverage/hub.mjs sync` so the Hub shows them.',
      '- `node ~/.yraverage/hub.mjs status` shows where the project stands on the Hub: cards by status and open questions.',
      '- The `yraverage-hub` server in `.mcp.json` gives agents the board tools (claim a card, report progress, attach sessions) and the QA tools (qa_status, qa_report, qa_defect).',
    ].join('\n'),
  );
  const hook = installHook(root);
  const agentHooks = installAgentHooks(root);
  log(`Linked ${root} to ${reply.url}${hook ? `\nSync on commit: ${hook}` : '\nNot a git repository: run sync after changes.'}\nSync while Claude Code works: ${agentHooks} (commit it so worktrees get it too)`);
  return reply;
}

export async function sync(root, hub, { work } = {}) {
  // A worktree sends its own branch, commit and documents under the main checkout's folder, so the Hub files them on
  // that project instead of starting a new one named after the worktree.
  const home = linkRoot(root);
  const snapshot = { ...collect(root), folder: home };
  const reply = await call(hub, 'project_sync', { snapshot, ...(work !== undefined ? { work } : {}) });
  writeLinkFiles(home, hub, reply);
  return reply;
}

// ---------- templates ----------

/** A path from the Hub, checked before anything is written: relative, inside the folder, and never into .git (a hook there would run at the first commit). */
const safeRel = (p) => typeof p === 'string' && p && !p.startsWith('/') && !/^[a-zA-Z]:/.test(p) && p.split(/[\\/]/).every((s) => s && s !== '.' && s !== '..' && s.toLowerCase() !== '.git');

export function writeTemplate(dir, files) {
  if (existsSync(dir) && readdirSync(dir).length > 0) throw new Error(`${dir} is not empty. new only writes into an empty or missing folder.`);
  for (const f of files) if (!safeRel(f.path)) throw new Error(`The template holds an unsafe path: ${f.path}`);
  for (const f of files) {
    const out = join(dir, f.path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, f.text);
  }
}

async function create(templateId, dirArg, flags, hub, log) {
  const dir = resolve(dirArg);
  const name = typeof flags.name === 'string' ? flags.name : basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!NAME_RE.test(name)) throw new Error(`"${name}" is not a valid project name: use lowercase letters, digits and dashes (--name).`);
  const reply = await call(hub, 'template_get', { id: templateId, name, ...(typeof flags.title === 'string' ? { title: flags.title } : {}) });
  writeTemplate(dir, reply.files);
  log(`Wrote ${reply.files.length} files from ${templateId} to ${dir}`);
  if (git(dir, ['init', '-q']) !== null) {
    git(dir, ['add', '-A']);
    if (git(dir, ['commit', '-q', '-m', `chore: start from the ${templateId} template`]) === null) log('git commit failed (set user.name and user.email); the files are staged.');
  }
  await link(realpathSync.native(dir), hub, { log });
  log(`Next: cd "${dir}" && npm install && npm run check`);
}

/**
 * `create --local`, the download in a template's install prompt. The install token is the credential (no sign-in): the
 * Hub sends the template's files, and they land in `dir` when it is empty or missing, else in a subfolder named after
 * the template. Also writes `.yraverage/template.json` and makes the first git commit, with the machine's git identity
 * or, when it has none, a neutral one for that commit only.
 */
export async function createLocal({ template, token, apiUrl, dir = '.' }, { log = console.log } = {}) {
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(template ?? '')) throw new Error('--template takes a template id such as hub-web.');
  if (!token) throw new Error("--token takes the install token from the Hub's install prompt.");
  let hub;
  try {
    hub = new URL(apiUrl).origin;
  } catch {
    throw new Error('--api-url takes the Hub address, such as http://localhost:49099.');
  }
  let target = resolve(dir);
  const notEmpty = existsSync(target) && readdirSync(target).length > 0;
  if (notEmpty) target = join(target, template);
  const slug = basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

  let res;
  try {
    res = await fetch(`${hub}/api/templates/${template}/download?token=${encodeURIComponent(token)}&name=${NAME_RE.test(slug) ? slug : template}`, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    throw new Error(`Cannot reach the Hub at ${hub}: ${e.cause?.message ?? e.message}`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body?.files) || body.files.length === 0) throw new Error(`The Hub refused the download (${res.status}): ${body?.message ?? 'no reason given'}`);

  // `text` is a Buffer here, so binary files survive; writeTemplate refuses an unsafe path before it writes anything.
  writeTemplate(target, body.files.map((f) => ({ path: f.path, text: Buffer.from(String(f.content), 'base64') })));
  writeJson(join(target, '.yraverage', 'template.json'), { id: template, version: String(body.version) });
  log(`Wrote ${body.files.length + 1} files from ${template} ${body.version} to ${target}`);
  if (notEmpty) log(`The folder was not empty, so the template went into the subfolder ${target}. Work there: cd "${target}"`);

  let committed = false;
  if (git(target, ['init', '-q']) === null) log('git is not available, so there is no first commit.');
  else {
    git(target, ['add', '-A'], 60_000);
    const identity = ['name', 'email'].flatMap((k) => (git(target, ['config', `user.${k}`]) ? [] : ['-c', `user.${k}=yraverage-hub${k === 'email' ? '@localhost' : ''}`]));
    committed = git(target, [...identity, 'commit', '-q', '-m', `chore: start from the ${template} template`], 60_000) !== null;
    log(committed ? 'Made the first git commit.' : 'The first git commit failed; the files are staged.');
  }
  return { dir: target, version: String(body.version), committed };
}

// ---------- studio import ----------

const IMPORT_WIDTH = { web: 1440, app: 390 };
const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const MAX_IMAGE = 5 * 1024 * 1024;

/** Playwright from the project in `dir`, so this script itself stays dependency-free. */
async function loadPlaywright(dir) {
  try {
    return createRequire(join(dir, 'package.json'))('playwright'); // CommonJS: an ESM import hides chromium under default
  } catch {
    throw new Error('Playwright is not installed in this folder. Run: npm i -D playwright && npx playwright install chromium. Or take the screenshot with your own browser tool and pass --file.');
  }
}

function waitForEnter(message) {
  console.log(message);
  return new Promise((done) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      done();
    });
  });
}

/**
 * Screenshots of the app's routes, full page up to 6,000 px tall, as the Hub's own capture takes them. Main-frame navigation to another
 * origin is aborted and a page that still lands elsewhere is skipped. `login` first opens a visible window with the profile and waits
 * while the person signs in; nothing here types a password. A route that fails is reported in its entry and the rest go on.
 */
export async function captureRoutes(pw, { url, routes, kind = 'web', profile, login = false, wait = waitForEnter }) {
  const origin = new URL(url).origin;
  const width = IMPORT_WIDTH[kind];
  if (login) {
    const win = await pw.chromium.launchPersistentContext(profile, { headless: false, viewport: null });
    const page = win.pages()[0] ?? (await win.newPage());
    await page.goto(url).catch(() => undefined);
    await wait('Sign in to the app in the browser window that opened. You type the sign-in yourself; this script never does. Press Enter here when you are signed in.');
    await win.close();
  }
  const viewport = { width, height: 900 };
  let ctx;
  let close;
  if (existsSync(profile)) {
    ctx = await pw.chromium.launchPersistentContext(profile, { viewport });
    close = () => ctx.close();
  } else {
    const browser = await pw.chromium.launch();
    ctx = await browser.newContext({ viewport });
    close = () => browser.close();
  }
  const shots = [];
  try {
    for (const route of routes) {
      const target = new URL(route, origin);
      if (!route.startsWith('/') || route.startsWith('//') || target.origin !== origin) {
        shots.push({ route, error: 'the route must start with / and stay on the app' });
        continue;
      }
      const page = await ctx.newPage();
      try {
        await page.route('**/*', (r) => {
          const q = r.request();
          return q.isNavigationRequest() && q.frame() === page.mainFrame() && new URL(q.url()).origin !== origin ? r.abort('blockedbyclient') : r.continue();
        });
        await page.goto(target.href, { waitUntil: 'load', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined); // apps that poll never go idle
        await page.waitForTimeout(500); // hash-routed apps draw the tab after load
        if (new URL(page.url()).origin !== origin) throw new Error(`the app sent the browser to ${new URL(page.url()).origin}`);
        const height = Math.max(1, Math.min(6_000, await page.evaluate(() => document.documentElement.scrollHeight)));
        const clip = { x: 0, y: 0, width, height };
        let bytes = await page.screenshot({ fullPage: true, clip });
        let mime = 'image/png';
        if (bytes.length > MAX_IMAGE) {
          bytes = await page.screenshot({ fullPage: true, clip, type: 'jpeg', quality: 80 });
          mime = 'image/jpeg';
        }
        shots.push({ route, mime, bytes });
      } catch (e) {
        shots.push({ route, error: e.message.split('\n')[0] });
      } finally {
        await page.close().catch(() => undefined);
      }
    }
  } finally {
    await close().catch(() => undefined);
  }
  return shots;
}

/** Uploads screens as Studio pages, one call each, carrying the revision forward; a lost race is read again and retried once. */
export async function importScreens(hub, shots, { kind = 'web', revision, log = console.log } = {}) {
  let rev = revision ?? (await call(hub, 'studio_list_pages')).revision;
  let failed = 0;
  for (const s of shots) {
    if (s.error) {
      failed++;
      log(`Failed ${s.route}: ${s.error}`);
      continue;
    }
    const args = { route: s.route, mime: s.mime, base64: Buffer.from(s.bytes).toString('base64'), kind, ...(s.name ? { name: s.name } : {}) };
    let reply;
    try {
      reply = await call(hub, 'studio_import_screen', { ...args, expectedRevision: rev });
    } catch (e) {
      if (e.refusal?.code !== 'revision_conflict') throw e;
      rev = (await call(hub, 'studio_list_pages')).revision;
      reply = await call(hub, 'studio_import_screen', { ...args, expectedRevision: rev });
    }
    rev = reply.revision;
    log(`Imported ${s.route} as page ${reply.page.id} (revision ${rev})`);
  }
  return { revision: rev, failed };
}

const IMPORT_USAGE = `Usage:
  node hub.mjs --agent NAME studio import --url http://localhost:3000 --route / [--route "/#tab=x" ...] [--kind web|app] [--login]
  node hub.mjs --agent NAME studio import --file shot.png --route /x [--name N] [--kind web|app]`;

async function studioImport(hub, flags, log) {
  const routes = [].concat(flags.route ?? []).filter((r) => typeof r === 'string');
  const kind = flags.kind === 'app' ? 'app' : 'web';
  const list = await call(hub, 'studio_list_pages');
  let shots;
  if (typeof flags.file === 'string') {
    if (routes.length !== 1) throw new Error('--file takes exactly one --route: the route this screenshot shows.');
    const mime = IMAGE_TYPES[flags.file.split('.').pop().toLowerCase()];
    if (!mime) throw new Error('--file takes a .png, .jpg or .webp image.');
    shots = [{ route: routes[0], mime, bytes: readFileSync(flags.file), ...(typeof flags.name === 'string' ? { name: flags.name } : {}) }];
  } else if (typeof flags.url === 'string' && routes.length > 0) {
    if (!/^(?!\.+$)[\w.-]+$/.test(list.projectId ?? '')) throw new Error('The Hub did not name this project; update the Hub.');
    const profile = join(HOME_DIR, 'browser', list.projectId);
    shots = await captureRoutes(await loadPlaywright(process.cwd()), { url: flags.url, routes, kind, profile, login: flags.login === true });
  } else throw new Error(IMPORT_USAGE);
  const { failed } = await importScreens(hub, shots, { kind, revision: list.revision, log });
  if (failed) throw new Error(`${failed} of ${shots.length} screen(s) failed.`);
}

// ---------- install ----------

function install(log) {
  const skillDir = join(homedir(), '.claude', 'skills', 'yraverage-hub');
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(HOME_DIR, { recursive: true });
  copyFileSync(join(dirname(HERE), 'SKILL.md'), join(skillDir, 'SKILL.md'));
  copyFileSync(HERE, join(skillDir, 'hub.mjs'));
  copyFileSync(HERE, join(HOME_DIR, 'hub.mjs'));
  // The /continue command for every linked project. It names the installed script by its full path, so it runs from any shell.
  const commandFile = join(homedir(), '.claude', 'commands', 'continue.md');
  mkdirSync(dirname(commandFile), { recursive: true });
  writeFileSync(commandFile, readFileSync(join(dirname(HERE), 'continue.md'), 'utf8').replaceAll('{{HUB_SCRIPT}}', join(HOME_DIR, 'hub.mjs').replaceAll('\\', '/')));
  log(`Installed the skill to ${skillDir}, the script to ${join(HOME_DIR, 'hub.mjs')} and the /continue command to ${commandFile}`);
}

/**
 * Trades an enrolment token from a copied agent prompt for a new agent. The key goes to ~/.yraverage/agents/<name>.key,
 * readable by its owner only, and is never printed: later calls pass --agent <name>.
 */
export async function enrol(hub, { token, name, provider, host }, { log = console.log } = {}) {
  if (!NAME_RE.test(name ?? '')) throw new Error('--name takes an agent name such as claude-risk-1: lowercase letters, digits and dashes.');
  const keyFile = join(HOME_DIR, 'agents', `${name}.key`);
  if (existsSync(keyFile)) throw new Error(`A key for ${name} already exists in ${keyFile}. Pick another --name, or work as ${name} with --agent ${name}.`);
  const res = await post(`${hub}/api/agents/enrol`, JSON.stringify({ token, name, provider, host }), { 'content-type': 'application/json' });
  if (res.status !== 201 || !res.json?.key) throw new Error(`The Hub refused the enrolment (${res.status}): ${res.json?.message ?? res.text.slice(0, 200)}`);
  mkdirSync(join(HOME_DIR, 'agents'), { recursive: true });
  writeFileSync(keyFile, res.json.key, { mode: 0o600 });
  // This machine now reaches the Hub as this agent for link, sync and status too, with no browser sign-in.
  const config = loadConfig();
  config.hubs[hub] = { ...config.hubs[hub], agent: res.json.agent.name };
  config.default ??= hub;
  saveConfig(config);
  log(`Enrolled as ${res.json.agent.name} for project ${res.json.projectId}. Work the board with: node hub.mjs --agent ${res.json.agent.name} call <tool> '<json>'`);
  return res.json;
}

// ---------- CLI ----------

const USAGE = `yraverage Hub link
  node hub.mjs enrol --token T --name N [--provider P] [--host H]   connect with the token from the Hub's "Copy agent prompt"
  node hub.mjs login [--hub URL]            sign in through the browser instead (OAuth)
  node hub.mjs link [--work]                link this folder to a Hub project; sync on every commit and while Claude Code edits
  node hub.mjs sync [--quiet]               push the folder's documents and git facts now
  node hub.mjs status                       where the project stands on the Hub
  node hub.mjs templates                    list codebase templates
  node hub.mjs new <template> <dir> [--name N] [--title T]   start a project from a template
  node hub.mjs create --local --template ID --token T --api-url URL [--dir FOLDER]   download a template with the install token from its prompt
  node hub.mjs call <tool> [json|@file]     call any Hub MCP tool; @file reads the JSON from a file (use it for a whole page of HTML)
  node hub.mjs studio import --url URL --route / [--route R ...] [--kind web|app] [--login]   screenshot a running app's screens into the Studio
  node hub.mjs studio import --file shot.png --route R [--name N]   send a screenshot you already took as a Studio page
  node hub.mjs install                      copy the skill to ~/.claude/skills and ~/.yraverage, and /continue to ~/.claude/commands
Flags: --hub URL, --agent NAME (use the key in ~/.yraverage/agents/NAME.key)
Env: YRAVERAGE_HUB (Hub URL), YRAVERAGE_HUB_KEY (agent key instead of sign-in).`;

export async function main(argv, log = console.log) {
  const { pos, flags } = parseArgs(argv);
  const [cmd, ...rest] = pos;
  // An agent the Hub launched (Orca) reads its key from a file only its owner can read, so it never sits in a prompt.
  if (typeof flags.agent === 'string') {
    if (!NAME_RE.test(flags.agent)) throw new Error('--agent takes an agent name such as claude-dev-1.');
    process.env.YRAVERAGE_HUB_KEY = readFileSync(join(HOME_DIR, 'agents', `${flags.agent}.key`), 'utf8').trim();
  }
  if (cmd === 'install') return install(log);
  if (!cmd || cmd === 'help' || flags.help) return log(USAGE);
  const needsRoot = ['link', 'sync', 'status'].includes(cmd);
  const root = needsRoot ? projectRoot() : null;
  const hub = hubUrl(flags, root);
  switch (cmd) {
    case 'login':
      return login(hub, { log });
    case 'link':
      return link(root, hub, { log, work: flags.work === true });
    case 'sync': {
      // Agent hooks pass --linked-only (never start a project from a folder nobody linked) and --throttle on edits.
      const home = linkRoot(root);
      if (flags['linked-only'] && !existsSync(projectFile(home))) return;
      if (typeof flags.throttle === 'string' && throttled(home, Number(flags.throttle) || 0)) return;
      if (!flags.quiet) {
        const r = await sync(root, hub);
        return log(`Synced ${r.projectId}${r.created ? ' (new project)' : ''}: ${r.documentsChanged} document(s) changed, ${r.cardsChanged ?? 0} card(s) moved. ${r.url}`);
      }
      try {
        await sync(root, hub);
      } catch (e) {
        mkdirSync(join(root, '.yraverage'), { recursive: true });
        appendFileSync(join(root, '.yraverage', 'last-sync.log'), `${new Date().toISOString()} ${e.message}\n`);
      }
      return;
    }
    case 'status': {
      const linked = readJson(projectFile(linkRoot(root)), null);
      if (!linked?.projectId) throw new Error('This folder is not linked yet. Run: node hub.mjs link');
      return log(JSON.stringify(await call(hub, 'project_status', { project: linked.projectId }), null, 2));
    }
    case 'templates': {
      const { templates } = await call(hub, 'template_list', {});
      return log(templates.map((t) => `${t.id}  ${t.name} (${t.version})\n    ${t.description}\n    ${t.stack.join(', ')}`).join('\n') || 'No templates on this Hub.');
    }
    case 'new':
      if (rest.length < 2) throw new Error('Usage: node hub.mjs new <template> <dir> [--name N] [--title T]');
      return create(rest[0], rest[1], flags, hub, log);
    case 'create': {
      if (flags.local !== true || ['template', 'token', 'api-url'].some((k) => typeof flags[k] !== 'string'))
        throw new Error('Usage: node hub.mjs create --local --template ID --token T --api-url URL [--dir FOLDER]');
      await createLocal({ template: flags.template, token: flags.token, apiUrl: flags['api-url'], dir: typeof flags.dir === 'string' ? flags.dir : '.' }, { log });
      return;
    }
    case 'enrol':
      if (typeof flags.token !== 'string') throw new Error('Usage: node hub.mjs enrol --token T --name N [--provider P] [--host H]');
      return enrol(hub, { token: flags.token, name: flags.name, provider: typeof flags.provider === 'string' ? flags.provider : 'other', host: typeof flags.host === 'string' ? flags.host : '' }, { log });
    case 'studio':
      if (rest[0] !== 'import') throw new Error(IMPORT_USAGE);
      return studioImport(hub, flags, log);
    case 'call':
      if (!rest[0]) throw new Error('Usage: node hub.mjs call <tool> [json]');
      return log(JSON.stringify(await call(hub, rest[0], rest[1] ? JSON.parse(rest[1].startsWith('@') ? readFileSync(rest[1].slice(1), 'utf8') : rest[1]) : {}), null, 2));
    default:
      throw new Error(`Unknown command ${cmd}.\n${USAGE}`);
  }
}

const invoked = process.argv[1] && (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(HERE);
  } catch {
    return false;
  }
})();
if (invoked) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
