// crawl-live: records every control a LIVE web app shows, read-only: per surface (shell, screen, sub-screen, tab state, popup, panel) the buttons,
// fields, selects, headings, table columns and test ids. Written for Solvarium (walks its header groups, screens, sub-strip, rail, popups, Gantt
// panels) and degrades to the landing page plus its tabs and openers on any other app.
// Run:  node crawl-live.mjs [--url http://localhost:33033] [--out <dir>]      Output: <out>/live-features.json
// Needs: the app served, and Playwright from the nearest package (cwd, cwd/app, or the git root /app).
// Client data policy: file names are never written (labels that look like files are replaced, lib-file-* is dropped).
// Safety: a tab-like control is clicked only when its label / test id has no mutating word (MUTATING); the skipped ones are listed.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const URL0 = arg('url', process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:33033');
const OUT = arg('out', process.cwd());
const QUICK = process.argv.includes('--quick'); // screens and sub-screens only; skips the popups, rail, status bar and the Gantt panels (about 4 min instead of 13)
const top = (() => { try { return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return process.cwd(); } })();
const { chromium } = (() => {
  for (const base of [process.cwd(), join(process.cwd(), 'app'), top, join(top, 'app')]) { try { return createRequire(join(base, 'package.json'))('playwright'); } catch {} }
  throw new Error('Playwright not found in cwd, cwd/app or the git root /app. Run from the repo, or: cd app && npm install');
})();const MUTATING = /save|delete|remove|disconnect|clear|reset|apply|accept|reject|import|export|download|upload|share|publish|level|optimi|\brun\b|start|stop|test|send|\bask\b|create|\bnew\b|\badd\b|copy|paste|\bcut\b|undo|redo|commit|restore|replace|generate|rebuild|connect|sign|logout|invite|purge|wipe|\bdrop\b|open now|play|simulate|crash|accelerate|calculate|recalc|fork|clone|duplicate|rename|move|link|unlink|assign|release/i;
const FILEISH = /\.(xer|xlsx?|json|sm|sprj|csv|mpp|xml)\b/i;

const b = await chromium.launch(), page = await b.newPage({ viewport: { width: 1700, height: 1000 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(URL0); await page.waitForTimeout(2500);

// ---- what is on screen now ----
const grab = () => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const SEL = 'button,a[href],input,select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=switch],[role=checkbox],[role=option],[role=link],[contenteditable=true],h1,h2,h3,h4,th,label,[data-testid]';
  const out = [];
  for (const e of document.querySelectorAll(SEL)) {
    if (!vis(e)) continue;
    const tag = e.tagName.toLowerCase(), role = e.getAttribute('role') || '', tid = e.getAttribute('data-testid') || '';
    const text = (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    const interactive = /^(button|a|input|select|textarea|summary)$/.test(tag) || /^(button|tab|menuitem|switch|checkbox|option|link)$/.test(role) || e.isContentEditable;
    let kind = /^h[1-4]$/.test(tag) ? 'heading' : tag === 'th' ? 'column' : tag === 'label' ? 'field-label' : tag === 'input' ? 'input:' + (e.type || 'text') : tag === 'select' ? 'select' : tag === 'textarea' ? 'textarea' : tag === 'a' ? 'link' : role === 'tab' ? 'tab' : interactive ? 'button' : 'region';
    if (kind === 'region' && !tid) continue;
    let label = e.getAttribute('aria-label') || '';
    if (!label && kind.startsWith('input')) label = e.placeholder || (e.labels && e.labels[0] && e.labels[0].innerText.trim()) || e.name || '';
    if (!label && (kind === 'select' || kind === 'textarea')) label = (e.labels && e.labels[0] && e.labels[0].innerText.trim()) || e.name || e.getAttribute('title') || '';
    if (!label) label = kind === 'region' ? '' : text;
    if (!label) label = e.getAttribute('title') || '';
    const par = e.parentElement && e.parentElement.closest('[data-testid]');
    const rec = { kind, label: label.replace(/\s+/g, ' ').trim().slice(0, 90), testid: tid, region: par ? par.getAttribute('data-testid') : '', tip: e.getAttribute('title') || '', disabled: !!e.disabled || e.getAttribute('aria-disabled') === 'true' };
    if (kind === 'select') rec.options = [...e.options].slice(0, 40).map(o => o.text.trim());
    if (/checkbox|radio/.test(kind) || role === 'switch') rec.checked = !!e.checked;
    if (kind.startsWith('input') && e.value && /number|text|date|range/.test(e.type || 'text') && e.value.length < 30) rec.value = e.value;
    out.push(rec);
  }
  return out;
});

const surfaces = {};
const keyOf = (r) => r.kind + '|' + (r.testid || r.label) + '|' + (r.testid ? '' : r.region);
async function collect(surface) {
  const S = surfaces[surface] = surfaces[surface] || { items: new Map(), skipped: [] };
  for (const r of await grab()) {
    if (/^lib-file-/.test(r.testid)) continue;
    if (FILEISH.test(r.label)) r.label = '<file name>';
    if (FILEISH.test(r.tip)) r.tip = '<file name>';
    if (/^lib-file-/.test(r.region) || FILEISH.test(r.region)) r.region = 'lib-file-*';
    const k = keyOf(r); if (!S.items.has(k)) S.items.set(k, r);
  }
  return S;
}
const settle = (ms = 500) => page.waitForTimeout(ms);
const esc = async () => { await page.keyboard.press('Escape'); await settle(150); };
const tryClick = async (sel, opts = {}) => { try { await page.locator(sel).first().click({ timeout: 1500, ...opts }); await settle(); return true; } catch { return false; } };

// ---- second level: tab-like controls inside the current screen (never in the chrome), clicked unless they look mutating ----
const CHROME = '[data-testid="ribbon"],[data-testid^="hdr-"],[data-testid="ws-rail"],[data-testid="wq-strip"],[data-testid="ws-status"],[data-testid="analysis-strip"],[data-testid="switcher"],[data-testid="onboarding"]';
async function tabs(surface) {
  const cands = await page.evaluate((CHROME) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const list = [...document.querySelectorAll('[role=tab],[aria-selected],[aria-pressed],.seg > button,.pill,[class*="tab"] > button,button[data-testid*="tab"],button[data-testid*="-view-"],button[data-testid*="mode"]')]
      .filter(e => e.tagName === 'BUTTON' || e.getAttribute('role') === 'tab').filter(e => vis(e) && e.closest('.ws-host') && !e.closest(CHROME) && !e.disabled);
    return list.slice(0, 40).map((e, i) => { e.setAttribute('data-crawl', String(i)); return { i, label: (e.getAttribute('aria-label') || e.innerText || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 60), tid: e.getAttribute('data-testid') || '' }; });
  }, CHROME);
  const S = surfaces[surface];
  for (const c of cands) {
    if (MUTATING.test(c.label + ' ' + c.tid)) { S.skipped.push(c.label || c.tid); continue; }
    if (!(await tryClick(`[data-crawl="${c.i}"]`))) continue;
    await collect(surface + ' > ' + (c.label || c.tid)); await esc();
  }
  return cands.length;
}

// ---- openers: popup / menu / panel buttons inside the screen (aria-haspopup, aria-expanded, *-open / *-menu / *-settings / *-cols test ids) ----
async function openers(surface) {
  const cands = await page.evaluate((CHROME) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const list = [...document.querySelectorAll('button[aria-haspopup],button[aria-expanded],button[data-testid$="-open"],button[data-testid$="-menu"],button[data-testid$="-settings"],button[data-testid$="-cols"],button[data-testid$="-toggle"]')]
      .filter(e => vis(e) && e.closest('.ws-host') && !e.closest(CHROME) && !e.disabled);
    return list.slice(0, 30).map((e, i) => { e.setAttribute('data-crawlo', String(i)); return { i, label: (e.getAttribute('aria-label') || e.innerText || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 60), tid: e.getAttribute('data-testid') || '' }; });
  }, CHROME);
  const S = surfaces[surface];
  for (const c of cands) {
    if (MUTATING.test(c.label + ' ' + c.tid)) { S.skipped.push(c.label || c.tid); continue; }
    if (!(await tryClick(`[data-crawlo="${c.i}"]`))) continue;
    await collect(surface + ' @ ' + (c.tid || c.label)); await esc();
    const still = await page.evaluate((i) => { const e = document.querySelector(`[data-crawlo="${i}"]`); return !!e && e.getAttribute('aria-expanded') === 'true'; }, c.i);
    if (still) await tryClick(`[data-crawlo="${c.i}"]`);
  }
}
const fresh = async () => { await page.goto(URL0); await page.waitForTimeout(2000); await tryClick('[data-testid="hdr-group-schedule"]'); };
const failed = [];

// ---- walk ----
await collect('home');
await tabs('home');
const groups = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="hdr-group-"]')].map(e => e.getAttribute('data-testid')));
const seenScreens = new Set();
for (const g of groups) {
  await tryClick(`[data-testid="${g}"]`);
  await collect('group:' + g.replace('hdr-group-', ''));
  for (const m of await page.evaluate(() => [...document.querySelectorAll('[data-testid^="rb-m-"]')].map(e => e.getAttribute('data-testid')))) {
    if (await tryClick(`[data-testid="${m}"]`)) { await collect('menu:' + m.replace('rb-m-', '')); await esc(); }
  }
  const scr = await page.evaluate(() => [...document.querySelectorAll('[data-testid="rb-cl-screens"] button[data-testid]')].map(e => ({ tid: e.getAttribute('data-testid'), label: e.innerText.replace(/\s+/g, ' ').trim() })));
  for (const s of scr) {
    if (seenScreens.has(s.tid)) continue; seenScreens.add(s.tid);
    await tryClick(`[data-testid="${g}"]`); if (!(await tryClick(`[data-testid="${s.tid}"]`))) continue;
    await settle(900);
    const name = 'screen:' + s.tid.replace(/^hdr-item-|^hdr-/, '');
    await collect(name); await tabs(name); await openers(name);
    const subs = await page.evaluate(() => [...document.querySelectorAll('[data-testid="analysis-strip"] [data-testid^="sub-"]')].map(e => e.getAttribute('data-testid')));
    for (const sb of subs) { if (await tryClick(`[data-testid="analysis-strip"] [data-testid="${sb}"]`)) { await settle(700); const n = name + ':' + sb.replace('sub-', ''); await collect(n); await tabs(n); await openers(n); } }
  }
}

// ---- the chrome: every popup the header, the rail and the status bar open ----
if (!QUICK) {
await fresh();
const TOGGLES = ['switcher', 'search-settings', 'share-toggle', 'export-toggle', 'more-toggle', 'settings-toggle', 'ws-pw-open', 'ws-view-toggle', 'ws-layout-chip', 'hdr-layout', 'calc-stamp', 'stages', 'hdr-undo-caret', 'rb-menus-btn', 'act-bell', 'model-readout', 'hdr-search', 'help-link', 'wq-history', 'ws-sb-calc', 'ws-sb-engine', 'ws-sb-dirty', 'ws-sb-auto', 'ws-sb-stamp', 'app-version', 'header-lang-toggle', 'rb-mode-icons', 'rb-collapse', 'wq-tip', 'wq-act-share', 'wq-act-changes', 'wq-act-clone', 'wq-act-ai', 'agent-fab', 'level-airl', 'optimize'];
const rails = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="ws-rail-cat-"]')].map(e => e.getAttribute('data-testid')));
for (const t of [...TOGGLES, ...rails, 'ws-rail-nav']) {
  if (/^(level-airl|optimize)$/.test(t)) continue; // runs a calculation: recorded as a button only
  await fresh();
  if (await tryClick(`[data-testid="${t}"]`)) { await collect('chrome:' + t); await tabs('chrome:' + t); await openers('chrome:' + t); } else failed.push(t);
}
// the Gantt with its bottom panel and inspector open and an activity selected
await fresh(); await tryClick('[data-testid="hdr-item-gantt"]'); await settle(1200);
await tryClick('[data-testid="gt-row-A1"]'); await page.keyboard.press('Control+j'); await settle(300); await page.keyboard.press('Alt+i'); await settle(600);
await tryClick('[data-testid="gt-row-A1"]'); await collect('gantt:panels'); await tabs('gantt:panels'); await openers('gantt:panels');
for (const g of ['gantt-mode-res', 'gantt-mode-tl', 'gantt-mode-mat']) { await tryClick(`[data-testid="${g}"]`); await settle(700); await collect('gantt:' + g); await tabs('gantt:' + g); await openers('gantt:' + g); }
}
const flat = {}; let total = 0;
for (const [k, v] of Object.entries(surfaces)) { flat[k] = { items: [...v.items.values()], skipped: v.skipped }; total += v.items.size; }
writeFileSync(join(OUT, 'live-features.json'), JSON.stringify({ url: URL0, at: new Date().toISOString(), errors: errs, failedClicks: failed, surfaces: flat }));
console.log('surfaces', Object.keys(flat).length, 'records (with repeats across surfaces)', total, 'errors', errs.length);
for (const [k, v] of Object.entries(flat)) console.log(String(v.items.length).padStart(5), k, v.skipped.length ? ' skipped:' + v.skipped.length : '');
await b.close();
