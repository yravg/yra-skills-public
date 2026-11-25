#!/usr/bin/env node
// spec-to-canvas memory: lessons that outlive a session and a plugin update.
//   node memory.mjs init                         copy the seed into the memory dir if files are missing
//   node memory.mjs show [project]               print lessons.md and projects/<project>.md
//   node memory.mjs add --lesson "<text>" --evidence "<where>" [--project <slug>]
//   node memory.mjs note --project <slug> --text "<line>"   append a line to the project file
//   node memory.mjs self-check
// Memory dir: $CANVAS_TO_APP_MEMORY or ~/.claude/canvas-to-app-memory (outside the plugin cache, so updates keep it).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.resolve(here, '../../../memory-seed');
const memDir = () => process.env.CANVAS_TO_APP_MEMORY || path.join(os.homedir(), '.claude', 'canvas-to-app-memory');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const today = () => new Date().toISOString().slice(0, 10);

function copyMissing(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) copyMissing(s, d);
    else if (!fs.existsSync(d)) { fs.copyFileSync(s, d); console.log('seeded', d); }
  }
}

function init() {
  if (!fs.existsSync(seedDir)) throw new Error(`seed not found: ${seedDir}`);
  copyMissing(seedDir, memDir());
}

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`bad argument: ${argv[i]}`);
    o[argv[i].slice(2)] = argv[i + 1];
  }
  return o;
}

function add({ lesson, evidence, project }) {
  if (!lesson || !evidence) throw new Error('add needs --lesson and --evidence');
  init();
  const file = path.join(memDir(), 'lessons.md');
  const text = fs.readFileSync(file, 'utf8');
  // same lesson text twice is noise
  if (text.toLowerCase().includes(lesson.trim().toLowerCase())) { console.log('already known'); return 'dup'; }
  const line = `- ${lesson.trim()} [${project ? slug(project) + ' ' : ''}${evidence.trim()}, ${today()}]\n`;
  fs.writeFileSync(file, text.endsWith('\n') ? text + line : text + '\n' + line);
  const inbox = text.split('## Inbox')[1] || '';
  const n = inbox.split('\n').filter((l) => l.startsWith('- ')).length + 1;
  console.log(`added (Inbox ${n}${n > 10 ? ': fold into the themed sections now' : ''})`);
  return 'ok';
}

function note({ project, text }) {
  if (!project || !text) throw new Error('note needs --project and --text');
  init();
  const file = path.join(memDir(), 'projects', `${slug(project)}.md`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, `# ${project} (project memory)\n\n## Change log of this file\n`);
  fs.appendFileSync(file, `- ${today()} ${text.trim()}\n`);
  console.log('noted', file);
}

function show(project) {
  init();
  const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');
  console.log(read(path.join(memDir(), 'lessons.md')));
  const pdir = path.join(memDir(), 'projects');
  if (project) console.log(read(path.join(pdir, `${slug(project)}.md`)) || `(no memory for ${project} yet)`);
  else console.log('Projects with memory:', fs.existsSync(pdir) ? fs.readdirSync(pdir).join(', ') : 'none');
}

function selfCheck() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c2a-mem-'));
  process.env.CANVAS_TO_APP_MEMORY = tmp;
  const log = console.log; console.log = () => {};
  try {
    init();
    const must = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
    must(fs.existsSync(path.join(tmp, 'lessons.md')), 'seed lessons');
    must(fs.existsSync(path.join(tmp, 'projects', 'solvarium.md')), 'seed solvarium');
    must(add({ lesson: 'Test lesson one', evidence: 'self-check', project: 'X Y' }) === 'ok', 'add');
    must(add({ lesson: 'test lesson ONE', evidence: 'self-check' }) === 'dup', 'dedupe');
    must(/\[x-y self-check, \d{4}-\d\d-\d\d\]/.test(fs.readFileSync(path.join(tmp, 'lessons.md'), 'utf8')), 'line format');
    note({ project: 'new app', text: 'hello' });
    must(fs.readFileSync(path.join(tmp, 'projects', 'new-app.md'), 'utf8').includes('hello'), 'note');
    let threw = false; try { add({ lesson: 'x' }); } catch { threw = true; }
    must(threw, 'validation');
  } finally { console.log = log; fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log('memory.mjs self-check OK');
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'init') init();
  else if (cmd === 'show') show(rest[0]);
  else if (cmd === 'add') add(args(rest));
  else if (cmd === 'note') note(args(rest));
  else if (cmd === 'self-check') selfCheck();
  else console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 8).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
} catch (e) { console.error(e.message); process.exit(1); }
