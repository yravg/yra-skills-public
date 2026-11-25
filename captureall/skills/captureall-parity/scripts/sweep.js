/* captureall parity sweep: load every preview of a clone in hidden same-origin iframes and report the bad ones.
 * Run in a browser tab on a plain page of the clone's own origin (for example a .txt or font licence file), so nothing
 * else on the page competes. Keep that tab in front: hidden tabs freeze animation clocks and timers.
 *
 * 1) javascript_tool: window.SWEEP_CFG = { list: ["components/a/preview.html", ...], themes: [{ name: "dark", localStorage: { "yr-theme": "dark" } }, ...],
 *      width: 360, height: 700, batch: 6, settleMs: 1500, rootSelector: "#root", restore: { "yr-theme": "dark" } };
 * 2) javascript_tool: the text of this file. It returns 'started'.
 * 3) Poll: JSON.stringify({ done: SW.done, total: SW.total, fin: SW.fin, bad: SW.bad.length }); when fin, read SW.bad in slices.
 * SW.bad rows: [theme, url, reason, detail]. Reasons: empty (root missing or has no children), error (uncaught error), img (broken image), overflow (page wider than width + 20 px). */
(() => {
  const C = Object.assign({ themes: [{ name: 'default', localStorage: {} }], width: 360, height: 700, batch: 6, settleMs: 1500, rootSelector: '#root', restore: {} }, window.SWEEP_CFG || {});
  if (!Array.isArray(C.list) || !C.list.length) return 'set window.SWEEP_CFG.list first';
  const SW = window.SW = { done: 0, total: C.list.length * C.themes.length, bad: [], fin: false };
  (async () => {
    for (const theme of C.themes) {
      for (const k in theme.localStorage) localStorage.setItem(k, theme.localStorage[k]);
      for (let i = 0; i < C.list.length; i += C.batch) {
        await Promise.all(C.list.slice(i, i + C.batch).map(async u => {
          const f = document.createElement('iframe'), errs = [];
          f.style.cssText = `position:fixed;left:0;top:0;width:${C.width}px;height:${C.height}px;opacity:0;pointer-events:none`;
          f.src = new URL(u, location.origin).href;
          document.body.appendChild(f);
          await new Promise(r => { f.onload = r; setTimeout(r, 8000); });
          // shortcut: listener attaches after load, so errors thrown during first render are missed; check the console of one failing page by hand.
          try { f.contentWindow.addEventListener('error', e => errs.push(e.message)); } catch (e) { errs.push('cross-origin frame'); }
          await new Promise(r => setTimeout(r, C.settleMs));
          try {
            const d = f.contentDocument, root = d.querySelector(C.rootSelector);
            const broken = [...d.images].filter(im => im.complete && !im.naturalWidth).length;
            if (!root || !root.children.length) SW.bad.push([theme.name, u, 'empty', '']);
            if (errs.length) SW.bad.push([theme.name, u, 'error', errs.join(' | ').slice(0, 300)]);
            if (broken) SW.bad.push([theme.name, u, 'img', broken]);
            if (d.documentElement.scrollWidth > C.width + 20) SW.bad.push([theme.name, u, 'overflow', d.documentElement.scrollWidth]);
          } catch (e) { SW.bad.push([theme.name, u, 'error', String(e).slice(0, 200)]); }
          f.remove(); SW.done++;
        }));
      }
    }
    for (const k in C.restore) localStorage.setItem(k, C.restore[k]);
    SW.fin = true;
  })();
  return 'started';
})();
