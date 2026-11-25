// captureall-match: store a text-fingerprint function in this origin's localStorage (survives navigation).
// After pasting once: eval(localStorage.__fp_fn)(selector) -> "words:bitset", also saved in localStorage.__fp[path].
// words = unique lower-case words in the element's innerText; bitset = 256-bit FNV-1a hash set of those words.
// "none" = selector not found. Reads only.
localStorage.__fp_fn = String.raw`(sel => {
  const t = document.querySelector(sel)?.innerText;
  const w = [...new Set((t || "").toLowerCase().match(/[a-z0-9€$%]+/g) || [])];
  const b = new Uint32Array(8);
  for (const x of w) {
    let h = 2166136261;
    for (const c of x) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    h >>>= 0;
    b[(h >>> 5) & 7] |= 1 << (h & 31);
  }
  const v = t == null ? "none" : w.length + ":" + [...b].map(n => (n >>> 0).toString(16).padStart(8, "0")).join("");
  const o = JSON.parse(localStorage.__fp || "{}");
  o[location.pathname.replace(/^\//, "")] = v;
  localStorage.__fp = JSON.stringify(o);
  return v;
})`;
localStorage.__fp = "{}";
"fingerprint ready";
