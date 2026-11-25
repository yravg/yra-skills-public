#!/usr/bin/env node
// Renders Claude Design boards locally and fails on console errors, broken images or horizontal overflow.
//   node render_boards.mjs <project_dir> <dc-runtime.js> <shots_dir> [assets.json]
// Run from the app folder, or set PLAYWRIGHT_MODULE to the file URL of playwright's index.mjs.
// assets.json maps a /_blob/ id to a local image: { "<id>": "./assets/top.png" }. Writes sizes.json into shots_dir.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const [dir, runtime, shots, assetsFile] = process.argv.slice(2);
if (!dir || !runtime || !shots) { console.error('usage: render_boards.mjs project_dir dc-runtime.js shots_dir [assets.json]'); process.exit(2); }
const assets = assetsFile ? JSON.parse(fs.readFileSync(assetsFile, 'utf8')) : {};
const local = pathToFileURL(path.resolve('node_modules/playwright/index.mjs')).href;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || local);
const TYPES = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.html': 'text/html' };
fs.mkdirSync(shots, { recursive: true });

const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = u.startsWith('/_blob/') ? assets[u.slice(7)] : u.endsWith('support.js') ? runtime : path.join(dir, path.normalize(u));
  fs.readFile(f || '', (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'text/plain' }); r.end(d); });
});
await new Promise(ok => srv.listen(0, ok));
const port = srv.address().port;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_NAME|ERR_INTERNET/.test(m.text())) errs.push(m.text()); });
const sizes = {};
let bad = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.dc.html'))) {
  errs.length = 0;
  await pg.goto(`http://localhost:${port}/${f}`);
  await pg.waitForLoadState('networkidle');
  const m = await pg.evaluate(() => ({ h: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, broken: [...document.images].filter(i => !i.naturalWidth).length }));
  sizes[f] = m.h;
  await pg.screenshot({ path: path.join(shots, f.replace('.dc.html', '.png')), fullPage: true });
  const fail = m.over > 0 || m.broken || errs.length;
  if (fail) bad++;
  console.log(f, m.h, fail ? `FAIL overflow ${m.over}, broken ${m.broken}, errors ${errs.slice(0, 2).join(' | ')}` : 'ok');
}
fs.writeFileSync(path.join(shots, 'sizes.json'), JSON.stringify(sizes, null, 1));
await b.close();
srv.close();
process.exit(bad ? 1 : 0);
