// captureall-match: store a state-timeline sampler in this origin's localStorage (survives navigation).
// After pasting once: await eval(localStorage.__tl_fn)(selector, durationMs)
// Returns "ms=hash:words ..." at every change of the element's innerText, timed from the moment text first
// appears, sampled every 50 ms. Run it in a tab that is in front (hidden tabs freeze clocks). Reads only.
localStorage.__tl_fn = String.raw`(async (sel, dur = 14000) => {
  const hash = t => { let x = 2166136261; for (const c of t) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
  const begin = performance.now();
  let t0 = null, last = "";
  const out = [];
  while (performance.now() - begin < dur + 6000) {
    const t = document.querySelector(sel)?.innerText || "";
    if (t0 == null && t.trim()) t0 = performance.now();
    if (t0 != null) {
      const k = hash(t) + ":" + (t.match(/\S+/g) || []).length;
      if (k !== last) { out.push(Math.round(performance.now() - t0) + "=" + k); last = k; }
      if (performance.now() - t0 > dur) break;
    }
    await new Promise(r => setTimeout(r, 50));
  }
  return out.join(" ");
})`;
"timeline ready";
