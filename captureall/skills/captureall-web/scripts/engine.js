/* captureall engine v3 (Robo Capture engine v2 upgraded) — port of the Robo Capture Chrome extension (CC BY 4.0, Jay / RoboLabs, robonuggets.com)
 * Same <web-capture> schema as the extension + optional animation data.
 * v3 adds page-level helpers: tokens(), fonts(), a11y(root), states(el), ia(), assets(), meta().
 * Use: inject this file into a page, then call window.__robo.capture(el|selector, {animations:true}).
 * Works in Claude in Chrome (javascript_tool) and in Playwright (page.addScriptTag). */
(() => {
  if (window.__robo) return;
  const PROPS = ['display','position','top','right','bottom','left','width','height','margin','padding','border','border-radius','box-sizing','box-shadow','background','color','opacity','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-transform','white-space','flex','flex-direction','flex-wrap','justify-content','align-items','align-self','gap','grid-template-columns','grid-template-rows','grid-column','grid-row','overflow','z-index','transform','transition','cursor','object-fit'];
  const DEFAULTS = {'display':'inline','position':'static','top':'auto','right':'auto','bottom':'auto','left':'auto','width':'auto','height':'auto','margin':'0px','padding':'0px','border':'0px none rgb(0, 0, 0)','border-radius':'0px','box-sizing':'content-box','box-shadow':'none','color':'rgb(0, 0, 0)','opacity':'1','font-style':'normal','font-weight':'400','letter-spacing':'normal','text-align':'start','text-decoration':'none solid rgb(0, 0, 0)','text-transform':'none','white-space':'normal','flex':'0 1 auto','flex-direction':'row','flex-wrap':'nowrap','justify-content':'normal','align-items':'normal','align-self':'auto','gap':'normal','grid-template-columns':'none','grid-template-rows':'none','grid-column':'auto','grid-row':'auto','overflow':'visible','z-index':'auto','transform':'none','transition':'all 0s ease 0s','cursor':'auto','object-fit':'fill'};
  const SKIP = new Set(['none','normal','rgba(0, 0, 0, 0)']);
  const KF = {};
  function walk(rules, target, acc, media) {
    for (const r of rules) { try {
      if (r.type === 7) { KF[r.name] = r.cssText; continue; }
      if (r.selectorText && target.matches(r.selectorText)) { const e = { selector: r.selectorText, css: r.style.cssText }; if (media) e.media = media; acc.push(e); }
      if (r.styleSheet) walk(r.styleSheet.cssRules, target, acc, (r.media && r.media.mediaText) || media);
      else if (r.cssRules) walk(r.cssRules, target, acc, r.conditionText || (r.media && r.media.mediaText) || media);
    } catch (e) {} }
  }
  function getRules(t) { const acc = []; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } walk(rs, t, acc, (sh.media && sh.media.mediaText) || undefined); } return acc; }
  function getComputed(t) { const cs = getComputedStyle(t), m = {}; for (const p of PROPS) { const v = cs.getPropertyValue(p); if (!v || DEFAULTS[p] === v || (!(p in DEFAULTS) && SKIP.has(v))) continue; m[p] = v; } return m; }
  const selApprox = t => { const tag = t.tagName.toLowerCase(); if (t.id) return tag + '#' + t.id; const c = (t.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)[0]; return c ? tag + '.' + c : tag; };
  const mkLabel = t => { const x = (t.innerText || '').trim().replace(/\s+/g, ' '); return x ? (x.length > 40 ? x.slice(0, 40) + '…' : x) : selApprox(t); };
  const uid = () => 'cap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const tname = n => n.tagName.toLowerCase() + [...n.classList].slice(0, 2).map(c => '.' + c).join('');
  function animSnapshot(root) {
    return document.getAnimations().filter(a => a.effect && a.effect.target && root.contains(a.effect.target)).map(a => { const t = a.effect.getTiming(), c = a.effect.getComputedTiming();
      return { type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', target: tname(a.effect.target), duration: t.duration, delay: t.delay, iterations: t.iterations, direction: t.direction, fill: t.fill, easing: t.easing, playState: a.playState, currentTime: a.currentTime == null ? null : Math.round(a.currentTime), progress: c.progress == null ? null : +c.progress.toFixed(3) }; });
  }
  function animations(root) {
    getRules(root); // fills KF
    const used = new Set(), css = {}, tr = {};
    [root, ...root.querySelectorAll('*')].forEach(n => { const c = getComputedStyle(n);
      c.animationName.split(',').map(s => s.trim()).filter(s => s && s !== 'none').forEach(nm => { used.add(nm); const k = tname(n) + '|' + nm;
        (css[k] = css[k] || { target: tname(n), name: nm, duration: c.animationDuration, delay: n.style.animationDelay || c.animationDelay, timing: c.animationTimingFunction, iterations: c.animationIterationCount, direction: c.animationDirection, fill: c.animationFillMode, count: 0 }).count++; });
      if (c.transitionDuration.split(',').some(d => parseFloat(d) > 0)) { const k = tname(n); (tr[k] = tr[k] || { target: k, property: c.transitionProperty, duration: c.transitionDuration, timing: c.transitionTimingFunction, delay: c.transitionDelay, count: 0 }).count++; } });
    const keyframes = {}; used.forEach(n => { if (KF[n]) keyframes[n] = KF[n]; });
    return { keyframes, cssAnimations: Object.values(css), transitions: Object.values(tr), running: animSnapshot(root) };
  }
  function capture(target, opts = {}) {
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target) return null;
    const r = target.getBoundingClientRect();
    const cap = { id: uid(), selector: selApprox(target), label: mkLabel(target), tag: target.tagName.toLowerCase(), url: location.href, title: document.title, timestamp: new Date().toISOString(),
      innerText: target.innerText || '', outerHTML: target.outerHTML, rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      computedStyles: getComputed(target), cssRules: getRules(target) };
    if (opts.animations) cap.animations = animations(target);
    return cap;
  }

  // v3: design tokens = custom properties declared on :root / html / body / [data-theme|skin|mode|style] rules, plus their values now.
  function tokens() {
    const declared = {}, rootSel = /^(:root|html|body)\b|\[data-(theme|skin|mode|style)/;
    const visit = (rules, media) => { for (const r of rules) { try {
      if (r.selectorText && rootSel.test(r.selectorText)) for (const p of r.style) if (p.startsWith('--')) (declared[r.selectorText + (media ? ' @' + media : '')] ||= {})[p] = r.style.getPropertyValue(p).trim();
      if (r.cssRules) visit(r.cssRules, r.conditionText || (r.media && r.media.mediaText) || media);
    } catch (e) {} } };
    for (const sh of document.styleSheets) { try { visit(sh.cssRules); } catch (e) {} }
    const cs = getComputedStyle(document.documentElement), resolved = {};
    Object.values(declared).forEach(o => Object.keys(o).forEach(k => { resolved[k] = cs.getPropertyValue(k).trim(); }));
    return { attrs: Object.fromEntries([...document.documentElement.attributes].map(a => [a.name, a.value])), declared, resolved };
  }
  // v3: @font-face rules and the families the page really uses.
  function fonts() {
    const faces = [];
    for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { faces.push({ blockedSheet: sh.href }); continue; }
      for (const r of rs) if (r.type === 5) faces.push({ family: r.style.getPropertyValue('font-family'), weight: r.style.getPropertyValue('font-weight'), style: r.style.getPropertyValue('font-style'), src: r.style.getPropertyValue('src').slice(0, 400) }); }
    const used = new Set(); document.querySelectorAll('body, body *').forEach(n => used.add(getComputedStyle(n).fontFamily));
    const loaded = document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight) : [];
    return { faces, used: [...used], loaded: [...new Set(loaded)] };
  }
  // v3: accessibility snapshot: role, name and state per focusable or labelled node, tab order, reduced-motion rules.
  function a11y(root = document.body) {
    if (typeof root === 'string') root = document.querySelector(root);
    const name = n => (n.getAttribute('aria-label') || (n.getAttribute('aria-labelledby') || '').split(' ').map(id => (document.getElementById(id) || {}).innerText || '').join(' ').trim() || n.getAttribute('alt') || n.getAttribute('title') || (n.labels && n.labels[0] && n.labels[0].innerText) || n.innerText || n.value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const focusable = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';
    const rows = [...root.querySelectorAll(focusable + ',[role],[aria-label],[aria-live],h1,h2,h3,img')].map(n => ({ tag: n.tagName.toLowerCase(), role: n.getAttribute('role') || '', name: name(n), tabindex: n.tabIndex,
      focusable: n.matches(focusable) && !n.disabled && n.tabIndex >= 0,
      state: ['aria-expanded', 'aria-pressed', 'aria-checked', 'aria-selected', 'aria-current', 'aria-disabled', 'aria-hidden', 'aria-live'].filter(a => n.hasAttribute(a)).map(a => a + '=' + n.getAttribute(a)).join(' ') }));
    // tab order: positive tabindex first (ascending), then DOM order (sort is stable)
    const order = rows.filter(r => r.focusable).sort((a, b) => (a.tabindex > 0 ? a.tabindex : 1e9) - (b.tabindex > 0 ? b.tabindex : 1e9));
    const reduced = [];
    for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) reduced.push(r.cssText.slice(0, 600)); } catch (e) {} }
    return { nodes: rows, tabOrder: order.map(r => (r.role || r.tag) + ': ' + r.name), unnamedFocusable: order.filter(r => !r.name).length, reducedMotionRules: reduced };
  }
  // v3: CSS written for :hover / :focus / :active / aria-state selectors that apply to el or its children. Real pointer states: crawl.js "states".
  function states(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    const out = [], pseudo = /:(hover|focus-visible|focus-within|focus|active|checked|disabled)\b|\[aria-(expanded|pressed|checked|selected|current)/;
    const strip = x => x.replace(/:(hover|focus-visible|focus-within|focus|active|checked|disabled)\b/g, '').replace(/\[aria-[\w-]+(="[^"]*")?\]/g, '').trim() || '*';
    const hits = b => { try { return el.matches(b) || !!el.querySelector(b); } catch (e) { return false; } };
    const visit = rules => { for (const r of rules) { try {
      if (r.selectorText && pseudo.test(r.selectorText) && r.selectorText.split(',').map(strip).some(hits)) out.push({ selector: r.selectorText, css: r.style.cssText });
      if (r.cssRules) visit(r.cssRules);
    } catch (e) {} } };
    for (const sh of document.styleSheets) { try { visit(sh.cssRules); } catch (e) {} }
    return out;
  }
  // v3: information architecture: nav landmarks, link groups with item counts, every same-site route on the page.
  function ia() {
    const navs = [...document.querySelectorAll('nav, aside, [role="navigation"], header')].map(n => ({ tag: n.tagName.toLowerCase(), label: n.getAttribute('aria-label') || '',
      groups: [...n.querySelectorAll('details, section, ul, [role="group"]')].filter(g => g.querySelector('a[href]')).slice(0, 80).map(g => ({
        heading: ((g.querySelector('summary, h2, h3, h4') || {}).innerText || '').trim().split('\n')[0].slice(0, 60), count: g.querySelectorAll('a[href]').length,
        items: [...g.querySelectorAll('a[href]')].map(a => (a.innerText || '').trim().split('\n')[0].slice(0, 60)) })) }));
    const routes = [...new Set([...document.querySelectorAll('a[href]')].map(a => { try { const u = new URL(a.href); return u.origin === location.origin ? u.pathname : null; } catch (e) { return null; } }).filter(Boolean))].sort();
    return { navs, routes };
  }
  // v3: what the page loads: resources, images, inline svg / canvas / video counts.
  function assets() {
    return { resources: performance.getEntriesByType('resource').map(r => ({ url: r.name, type: r.initiatorType, kb: Math.round((r.transferSize || 0) / 1024) })),
      images: [...document.images].map(i => ({ src: i.currentSrc, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight })),
      inlineSvgs: document.querySelectorAll('svg').length, canvases: document.querySelectorAll('canvas').length, videos: [...document.querySelectorAll('video')].map(v => v.currentSrc) };
  }
  // v3: heading and the FULL description (every paragraph beside the h1, never truncated), meta tags, ?v= asset versions (stale-cache check).
  function meta() {
    const h1 = document.querySelector('h1'), ps = h1 && h1.parentElement ? [...h1.parentElement.querySelectorAll('p')].map(x => x.innerText.trim()).filter(Boolean) : [];
    const m = n => (document.querySelector(`meta[name="${n}"],meta[property="${n}"]`) || {}).content || '';
    return { title: document.title, heading: h1 ? h1.innerText.trim() : '', description: ps.join('\n\n'), metaDescription: m('description'), ogImage: m('og:image'), lang: document.documentElement.lang,
      assetVersions: [...document.querySelectorAll('link[rel=stylesheet][href],script[src]')].map(n => n.href || n.src).filter(u => /[?&]v=/.test(u)) };
  }
  const wrap = caps => '<web-capture>' + JSON.stringify(caps) + '</web-capture>';
  window.__robo = { capture, captureAll: (sel, o) => [...document.querySelectorAll(sel)].map(e => capture(e, o)), animSnapshot, animations, tokens, fonts, a11y, states, ia, assets, meta, wrap, version: '3.0.0' };
})();
