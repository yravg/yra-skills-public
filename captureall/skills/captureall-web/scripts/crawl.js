#!/usr/bin/env node
/* captureall site crawler (Robo Capture crawler upgraded; engine CC BY 4.0, Jay / RoboLabs). Usage: node crawl.js config.json
 * Needs Playwright in this folder: npm i -D playwright && npx playwright install chromium
 * config: { out, sections:[{name, index, linkPrefix}], pages?:[url], selector:"div.stage", fallbackSelector:"main",
 *   captureIndex:true, variants:[{name, localStorage:{k:v}, colorScheme?:"dark", reducedMotion?:"reduce"}], settleMs:4500, frameTimes:[ms...],
 *   code:{tab:"Code", block:"pre"} | null, concurrency:5, viewport:{width,height},
 *   viewports?:[{name:"360", width:360, height:780}],   every variant runs at every viewport; variant name becomes <variant>_<viewport>
 *   states?:[{name:"hover", action:"hover"|"focus"|"press"|"click"|"key", target:"button", key?:"Escape"}],   applied inside the selector after the main capture
 *   pageData?:true   tokens, fonts, a11y, css states, ia, meta, assets per capture } */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ENGINE = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const OUT = cfg.out; fs.mkdirSync(OUT + '/frames', { recursive: true });
const BASE_VARS = cfg.variants && cfg.variants.length ? cfg.variants : [{ name: 'default', localStorage: {} }];
const VARS = cfg.viewports && cfg.viewports.length
  ? BASE_VARS.flatMap(v => cfg.viewports.map(vp => ({ ...v, name: `${v.name}_${vp.name}`, viewport: { width: vp.width, height: vp.height } })))
  : BASE_VARS;
const TIMES = cfg.frameTimes || [100, 400, 900, 1600, 2600, 4200];
const slugOf = u => new URL(u).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home';
async function discover(b) {
  const p = await b.newPage(); const pages = [];
  for (const s of cfg.sections || []) {
    await p.goto(s.index, { waitUntil: 'networkidle', timeout: 90000 }); await p.waitForTimeout(1500);
    const links = await p.evaluate(pre => [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href.split('#')[0].split('?')[0]).filter(h => new URL(h).pathname.startsWith(pre)))].map(h => ({ href: h, text: (document.querySelector(`a[href$="${new URL(h).pathname}"]`)?.innerText || '').trim().split('\n')[0] })), s.linkPrefix);
    if (cfg.captureIndex) pages.push({ href: s.index, text: s.name + ' (index)', section: s.name, isIndex: true });
    links.forEach(l => pages.push({ ...l, section: s.name }));
  }
  (cfg.pages || []).forEach(u => pages.push({ href: u, text: '', section: 'pages' }));
  await p.close(); const seen = new Set(); return pages.filter(x => !seen.has(x.href) && seen.add(x.href));
}
async function one(b, pg, v) {
  const ctx = await b.newContext({ viewport: v.viewport || cfg.viewport || { width: 1600, height: 900 }, colorScheme: v.colorScheme || 'light', reducedMotion: v.reducedMotion || 'no-preference' });
  await ctx.addInitScript(ls => { try { for (const k in ls) localStorage.setItem(k, ls[k]); } catch (e) {} }, v.localStorage || {});
  const p = await ctx.newPage();
  const consoleErrors = [];
  p.on('pageerror', e => consoleErrors.push(String(e).slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
  try {
    await p.goto(pg.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    let sel = pg.isIndex ? (cfg.fallbackSelector || 'main') : cfg.selector;
    try { await p.waitForSelector(sel, { timeout: 25000 }); } catch (e) { sel = cfg.fallbackSelector || 'body'; await p.waitForSelector(sel, { timeout: 20000 }); }
    await p.addScriptTag({ content: ENGINE });
    const t0 = Date.now(), slug = slugOf(pg.href), timeline = [], frames = [];
    fs.mkdirSync(`${OUT}/frames/${slug}`, { recursive: true });
    for (const t of TIMES) { const w = t - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w);
      const snap = await p.evaluate(s => { const e = document.querySelector(s); return e ? window.__robo.animSnapshot(e) : []; }, sel);
      timeline.push({ t_ms: Date.now() - t0, running: snap.filter(a => a.playState === 'running').length, animations: snap });
      const f = `frames/${slug}/${v.name}_${String(t).padStart(4, '0')}ms.jpg`;
      try { await p.locator(sel).first().screenshot({ path: `${OUT}/${f}`, type: 'jpeg', quality: 55, animations: 'allow', timeout: 15000 }); frames.push(f); } catch (e) {} }
    await p.waitForTimeout(Math.max(0, (cfg.settleMs || 4500) - (Date.now() - t0)));
    const cap = await p.evaluate(s => window.__robo.capture(s, { animations: true }), sel);
    delete cap.animations.running; cap.animations.timeline = timeline; cap.animations.frames = frames;
    const meta = await p.evaluate(s => { const el = document.querySelector(s); const all = [el, ...el.querySelectorAll('*')]; const q = x => el.querySelectorAll(x).length;
      const h1 = document.querySelector('h1'); const ps = h1 && h1.parentElement ? [...h1.parentElement.querySelectorAll('p')].map(x => x.innerText.trim()).filter(Boolean) : [];
      const root = el.querySelector('[class^="ui-"],[class*=" ui-"]'); const cls = new Set(); all.forEach(n => n.classList.forEach(c => cls.add(c)));
      return { pageHeading: h1 ? h1.innerText.trim() : '', description: ps.join('\n\n'), rootClass: root ? [...root.classList].find(c => c.startsWith('ui-')) || '' : '', phase: el.querySelector('[data-phase]')?.dataset.phase || '',
        elementCount: all.length, uniqueClasses: cls.size, buttons: q('button'), inputs: q('input,textarea,select,[contenteditable="true"]'), links: q('a'), svgs: q('svg'), canvases: q('canvas'), images: q('img'),
        roles: [...new Set([...el.querySelectorAll('[role]')].map(n => n.getAttribute('role')))].join(', '), ariaLabels: q('[aria-label]'), ariaLive: q('[aria-live]'), htmlBytes: el.outerHTML.length, textChars: (el.innerText || '').length,
        proLocked: /is part of Pro/i.test(document.body.innerText) && !!document.querySelector('a[href*="pricing"]') }; }, sel);
    const page = cfg.pageData === false ? null : await p.evaluate(s => { const r = window.__robo;
      return { tokens: r.tokens(), fonts: r.fonts(), a11y: r.a11y(s), cssStates: r.states(s), ia: r.ia(), meta: r.meta(), assets: r.assets() }; }, sel);
    // Real interaction states: act on the first matching element inside the capture root, then record its computed style and a frame.
    const states = [];
    for (const st of (pg.isIndex ? [] : cfg.states || [])) { try {
      const loc = p.locator(sel).locator(st.target).first();
      if (st.action === 'hover') await loc.hover({ timeout: 4000 });
      else if (st.action === 'focus') await loc.focus({ timeout: 4000 });
      else if (st.action === 'click') await loc.click({ timeout: 4000 });
      else if (st.action === 'press') { await loc.hover({ timeout: 4000 }); await p.mouse.down(); }
      else if (st.action === 'key') await p.keyboard.press(st.key);
      await p.waitForTimeout(450);
      const f = `frames/${slug}/${v.name}_state-${st.name}.jpg`;
      try { await p.locator(sel).first().screenshot({ path: `${OUT}/${f}`, type: 'jpeg', quality: 55, timeout: 15000 }); } catch (e) {}
      const styles = await loc.evaluate(el => window.__robo.capture(el).computedStyles).catch(() => null);
      states.push({ name: st.name, action: st.action, target: st.target, computedStyles: styles, frame: f });
      if (st.action === 'press') await p.mouse.up();
      await p.mouse.move(0, 0); await p.keyboard.press('Escape');
    } catch (e) { states.push({ name: st.name, action: st.action, target: st.target, error: String(e).slice(0, 200) }); } }
    let code = null;
    if (cfg.code && !pg.isIndex) { try {
      await p.getByRole('button', { name: cfg.code.tab, exact: true }).or(p.getByRole('tab', { name: cfg.code.tab, exact: true })).first().click({ timeout: 5000 });
      await p.waitForTimeout(1500);
      const blocks = await p.evaluate(bs => [...document.querySelectorAll(bs)].map(pre => { let h = '', n = pre; for (let i = 0; i < 6 && n && !h; i++) { let s = n.previousElementSibling; while (s && !h) { if (/^H[1-6]$/.test(s.tagName) || s.querySelector?.('h2,h3,h4')) h = s.innerText.trim().split('\n')[0]; s = s.previousElementSibling; } n = n.parentElement; }
        return { heading: h, language: (pre.querySelector('code')?.className.match(/language-(\w+)/) || [])[1] || '', text: pre.innerText }; }), cfg.code.block);
      code = { available: blocks.length > 0, blocks, note: blocks.length ? '' : 'No code shown in Code tab (Pro-gated or none)' };
    } catch (e) { code = { available: false, blocks: [], note: 'Code tab not found' }; } }
    return { ...cap, variant: { name: v.name, ...v.localStorage }, code, page, states, consoleErrors, _meta: { name: pg.text, section: pg.section, slug, isIndex: !!pg.isIndex, ...meta } };
  } finally { await ctx.close(); }
}
(async () => {
  const b = await chromium.launch(); const pages = await discover(b);
  fs.writeFileSync(`${OUT}/pages.json`, JSON.stringify(pages, null, 1)); console.log('pages', pages.length);
  const tasks = []; pages.forEach(pg => VARS.forEach(v => tasks.push([pg, v])));
  const res = [], errs = []; let i = 0, done = 0;
  await Promise.all([...Array(cfg.concurrency || 5)].map(async () => { while (i < tasks.length) { const [pg, v] = tasks[i++];
    for (let t = 0; t < 2; t++) { try { res.push(await one(b, pg, v)); break; } catch (e) { if (t) errs.push({ url: pg.href, variant: v.name, err: String(e).slice(0, 300) }); } }
    if (++done % 25 === 0) console.log(done, '/', tasks.length); } }));
  const po = pages.map(p => p.href), vo = VARS.map(v => v.name);
  res.sort((a, b) => po.indexOf(a.url) - po.indexOf(b.url) || vo.indexOf(a.variant.name) - vo.indexOf(b.variant.name));
  fs.writeFileSync(`${OUT}/captures.json`, JSON.stringify(res)); fs.writeFileSync(`${OUT}/errors.json`, JSON.stringify(errs, null, 1));
  console.log('done', res.length, 'ok', errs.length, 'errors'); await b.close();
})();
