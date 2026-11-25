#!/usr/bin/env node
// Screenshots real screens at 1600x900 and stores their text.
//   node capture.mjs screens.json out_dir
// Run from the app folder, or set PLAYWRIGHT_MODULE to the file URL of playwright's index.mjs.
// screens.json: { "url": "http://localhost:3000/", "stub": ["**/api/auth/me"], "waitFor": "main",
//   "screens": [ { "key": "alerts", "path": "/alerts", "click": ["[data-testid=open-alerts]"], "eval": "window.app.open('F76')" } ] }
// stub = routes answered 404 in this test browser, the way the repo's own UI tests skip sign-in. Local URLs only.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [cfgFile, out] = process.argv.slice(2);
if (!cfgFile || !out) { console.error('usage: capture.mjs screens.json out_dir'); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
if (cfg.stub?.length && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(cfg.url)) { console.error('stub is for local URLs only'); process.exit(2); }
const local = pathToFileURL(path.resolve('node_modules/playwright/index.mjs')).href;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || local);
fs.mkdirSync(out, { recursive: true });

const b = await chromium.launch();
const log = {};
let failed = 0;
for (const s of cfg.screens) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  for (const r of cfg.stub || []) await p.route(r, x => x.fulfill({ status: 404, body: '' }));
  try {
    await p.goto(new URL(s.path || '/', cfg.url).href);
    if (cfg.waitFor) await p.waitForSelector(cfg.waitFor, { timeout: 30000 });
    for (const c of s.click || []) await p.click(c);
    if (s.eval) await p.evaluate(s.eval);
    await p.waitForTimeout(s.wait ?? 1500);
    await p.screenshot({ path: path.join(out, s.key + '.png') });
    log[s.key] = { errors, text: (await p.evaluate(() => document.body.innerText)).slice(0, 2000) };
  } catch (e) { errors.push(e.message); log[s.key] = { errors }; }
  if (errors.length) failed++;
  console.log(s.key, errors.length ? 'ERROR ' + errors[0] : 'ok');
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(log, null, 1));
process.exit(failed ? 1 : 0);
