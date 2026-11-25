/* Local graph pane: star graph around one focus entity + grouped link list +
 * Float/Dock into a draggable window. Zero dependencies.
 *
 *   const lg = LocalGraph.create({
 *     root: "#wi-graph-block",            // element (or selector) holding the pane markup (see local-graph-pane.html)
 *     pane: "#wi-graph-pane",             // optional aside toggled .hidden by show()/hide()
 *     paneHide: true,                     // false = never toggle .hidden on pane
 *     isVisible: () => tabIsActive("wi"), // optional: docked engine only runs when this is true
 *     layer: "project",
 *     fetchGraph: (focus, layer) => fetch(`/api/graph?layer=${layer}&focus=${encodeURIComponent(focus)}`).then(r => r.json()),
 *     onOpen(node) {},                    // node or link row clicked (never the focus itself)
 *     groups: { note: "Links", cop: "COP", wi: "WI", letter: "Letter", contract: "Contract" },
 *     colors: { "10 Contract": "#6fb3ff" },   // group -> colour fallback when node.color missing
 *     defaultTip: "WI · COP · Letter · contract cites",
 *     emptyText: "No linked items",
 *     floatTitle: "Local graph",
 *   });
 *   lg.show("WI-014"); lg.hide(); lg.pause(); lg.resume();
 *
 * Graph payload: { focus, nodes:[{id,label,kind,group,degree,focus?,via?,color?,...}], edges:[{source,target}] }
 */
(function (global) {
  "use strict";
  const $ = s => typeof s === "string" ? document.querySelector(s) : s;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
  const cssVar = (name, fb) => (getComputedStyle(document.documentElement).getPropertyValue(name) || "").trim() || fb;

  // ---------- floating windows (#float-layer) ----------
  const floats = (() => {
    let z = 600, offset = 0;
    function layerEl() {
      let l = document.getElementById("float-layer");
      if (!l) { l = document.createElement("div"); l.id = "float-layer"; document.body.appendChild(l); }
      return l;
    }
    function open(title, bodyNode, srcText, opts = {}) {
      const win = document.createElement("div"); win.className = "float-win" + (opts.className ? " " + opts.className : "");
      win.style.left = (90 + (offset % 8) * 34) + "px";
      win.style.top = (70 + (offset % 8) * 30) + "px";
      if (opts.width) win.style.width = opts.width;
      if (opts.height) win.style.height = opts.height;
      win.style.zIndex = ++z; offset++;
      const head = document.createElement("div"); head.className = "fw-head";
      const t = document.createElement("span"); t.className = "fw-title"; t.textContent = title;
      const close = document.createElement("button"); close.type = "button"; close.className = "fw-close"; close.textContent = "✕"; close.title = "Close";
      close.addEventListener("click", () => { win.remove(); if (opts.onClose) opts.onClose(); });
      head.appendChild(t); head.appendChild(close);
      const body = document.createElement("div"); body.className = "fw-body"; body.appendChild(bodyNode);
      win.appendChild(head); win.appendChild(body);
      if (srcText) { const s = document.createElement("div"); s.className = "fw-src"; s.textContent = srcText; win.appendChild(s); }
      win.addEventListener("mousedown", () => { win.style.zIndex = ++z; });
      head.addEventListener("mousedown", e => {
        if (e.target.closest("button")) return;
        const sx = e.clientX - win.offsetLeft, sy = e.clientY - win.offsetTop;
        const move = ev => {
          win.style.left = Math.max(0, Math.min(window.innerWidth - 120, ev.clientX - sx)) + "px";
          win.style.top = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - sy)) + "px";
        };
        const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
        window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
        e.preventDefault();
      });
      layerEl().appendChild(win);
      return win;
    }
    return { open };
  })();

  // ---------- force engine (star layout, focus pinned at centre) ----------
  function createForceGraph(cfg) {
    let nodes = [], edges = [], running = false, raf = null;
    let canvas, ctx, W = 0, H = 0, dpr = window.devicePixelRatio || 1;
    let zoom = 1, panX = 0, panY = 0, dragNode = null, panning = false, lastX = 0, lastY = 0, hover = null;
    let capturing = false, moved = false, ac = null, ro = null;
    const rest = cfg.restLength ?? 120, spread = cfg.spread ?? 260, repulsion = cfg.repulsion ?? 2200;
    const alwaysLabel = !!cfg.alwaysLabel, fontSize = cfg.fontSize ?? 11, pinFocus = cfg.pinFocus !== false;
    const shortLabels = !!cfg.shortLabels, colors = cfg.colors || {};
    const idleTip = cfg.defaultTip || "Drag · click to open · scroll to zoom";
    const stripRe = cfg.stripPrefix || /^(Table|Letter|Exhibit [A-Z])\s+[—-]\s+/;

    const canvasEl = () => typeof cfg.canvas === "function" ? cfg.canvas() : $(cfg.canvas);
    const boxEl = () => cfg.box ? (typeof cfg.box === "function" ? cfg.box() : $(cfg.box)) : canvasEl()?.parentElement;
    const setTip = t => { if (cfg.setTip) cfg.setTip(t); };
    function shortLabel(id) {
      if (!shortLabels) return id;
      const s = String(id).replace(stripRe, "");
      return s.length > 22 ? s.slice(0, 20) + "…" : s;
    }
    function applyData(rawNodes, rawEdges) {
      const others = rawNodes.filter(n => !n.focus);
      nodes = rawNodes.map((n, i) => {
        const isFocus = !!n.focus; let x = 0, y = 0;
        if (!isFocus && others.length) {
          const k = others.findIndex(o => o.id === n.id);
          const ang = (Math.max(k, 0) / others.length) * 2 * Math.PI - Math.PI / 2;
          const ring = n.via === "in" ? spread * 1.12 : spread;   // incoming-only refs sit on an outer ring
          x = Math.cos(ang) * ring; y = Math.sin(ang) * ring;
        } else if (!isFocus) {
          x = Math.cos(i / Math.max(rawNodes.length, 1) * 2 * Math.PI) * spread;
          y = Math.sin(i / Math.max(rawNodes.length, 1) * 2 * Math.PI) * spread;
        }
        return { ...n, label: shortLabel(n.label || n.id), x, y, vx: 0, vy: 0, pinned: pinFocus && isFocus,
          r: n.r || (isFocus ? 9 : n.via === "in" ? 4.5 : 5.5 + Math.min(5, (n.degree || 0) * .4)),
          color: n.color || colors[n.group] || "#9aa7bf" };
      });
      const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
      edges = (rawEdges || []).map(e => ({ s: byId[e.source], t: byId[e.target] })).filter(e => e.s && e.t);
      zoom = 1; panX = 0; panY = 0;
    }
    function resize() {
      canvas = canvasEl(); if (!canvas) return;
      ctx = canvas.getContext("2d");
      const rect = (boxEl() || canvas.parentElement).getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height); dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function step() {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy; if (d2 < 25) d2 = 25;
        const d = Math.sqrt(d2), f = Math.min(repulsion / d2, 2.5); dx /= d; dy /= d;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
      for (const e of edges) {
        let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - rest) * .01; dx /= d; dy /= d;
        e.s.vx += dx * f; e.s.vy += dy * f; e.t.vx -= dx * f; e.t.vy -= dy * f;
      }
      const VMAX = 4;
      for (const n of nodes) {
        if (n.pinned && n !== dragNode) { n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; continue; }
        n.vx += -n.x * .001; n.vy += -n.y * .001; n.vx *= .85; n.vy *= .85;
        n.vx = Math.max(-VMAX, Math.min(VMAX, n.vx)); n.vy = Math.max(-VMAX, Math.min(VMAX, n.vy));
        if (n !== dragNode) { n.x += n.vx; n.y += n.vy; }
        if (!isFinite(n.x) || !isFinite(n.y)) { n.x = (Math.random() - .5) * 200; n.y = (Math.random() - .5) * 200; n.vx = n.vy = 0; }
      }
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H); ctx.save();
      ctx.translate(W / 2 + panX, H / 2 + panY); ctx.scale(zoom, zoom);
      const neighbors = hover ? new Set(edges.flatMap(e => e.s === hover ? [e.t.id] : e.t === hover ? [e.s.id] : [])) : null;
      const accent = cssVar("--accent", "#17B88B"), edgeC = cssVar("--graph-edge", "#8a8a84");
      const label = cssVar("--text", "#171717"), labelDim = cssVar("--dim", "#6b6b6b");
      for (const e of edges) {
        const active = hover && (e.s === hover || e.t === hover);
        ctx.strokeStyle = active ? accent : edgeC; ctx.lineWidth = active ? 2 : 1.45; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y); ctx.stroke();
      }
      for (const n of nodes) {
        const dimHover = hover && n !== hover && !(neighbors && neighbors.has(n.id));
        const dimIn = n.via === "in" && n !== hover;
        ctx.globalAlpha = dimHover ? .22 : dimIn ? .42 : 1;
        ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill();
        if (n.focus) { ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke(); }
        else if (n === hover) { ctx.strokeStyle = label; ctx.lineWidth = 1.5; ctx.stroke(); }
        if (alwaysLabel || zoom > .55 || n === hover || n.focus || (neighbors && neighbors.has(n.id))) {
          ctx.fillStyle = (dimHover || dimIn) ? labelDim : label;
          ctx.font = `${n === hover || n.focus ? "600 " : ""}${fontSize / Math.max(zoom, .8)}px ${cfg.font || "Segoe UI, system-ui, sans-serif"}`;
          ctx.textAlign = "center"; ctx.fillText(n.label || n.id, n.x, n.y + n.r + 12 / Math.max(zoom, .8));
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    function loop() { if (!running) return; step(); draw(); raf = requestAnimationFrame(loop); }
    const toWorld = (mx, my) => ({ x: (mx - W / 2 - panX) / zoom, y: (my - H / 2 - panY) / zoom });
    function pick(mx, my) { const p = toWorld(mx, my); return nodes.find(n => (n.x - p.x) ** 2 + (n.y - p.y) ** 2 < (n.r + 6) ** 2) || null; }
    function bind() {
      canvas = canvasEl(); if (!canvas) return;
      if (ac) ac.abort(); if (ro) { ro.disconnect(); ro = null; }
      ac = new AbortController(); const sig = { signal: ac.signal };
      canvas.addEventListener("mousedown", e => { const n = pick(e.offsetX, e.offsetY); moved = false; capturing = true; if (n) dragNode = n; else { panning = true; lastX = e.offsetX; lastY = e.offsetY; } }, sig);
      canvas.addEventListener("mousemove", e => {
        if (dragNode) { const p = toWorld(e.offsetX, e.offsetY); dragNode.x = p.x; dragNode.y = p.y; moved = true; }
        else if (panning) { panX += e.offsetX - lastX; panY += e.offsetY - lastY; lastX = e.offsetX; lastY = e.offsetY; moved = true; }
        else { hover = pick(e.offsetX, e.offsetY); setTip(hover ? (hover.id || hover.label) : idleTip); }
        canvas.style.cursor = hover || dragNode ? "pointer" : "grab";
      }, sig);
      window.addEventListener("mouseup", () => { if (!capturing) return; if (dragNode && !moved && cfg.onOpen) cfg.onOpen(dragNode); dragNode = null; panning = false; capturing = false; }, sig);
      canvas.addEventListener("wheel", e => { e.preventDefault(); zoom = Math.min(3, Math.max(.25, zoom * (e.deltaY < 0 ? 1.12 : .89))); }, { passive: false, signal: ac.signal });
      window.addEventListener("resize", () => { if (running) resize(); }, sig);
      if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(() => { if (running) resize(); }); const b = boxEl(); if (b) ro.observe(b); }
    }
    return {
      setData(rawNodes, rawEdges) { applyData(rawNodes || [], rawEdges || []); },
      start() { canvas = canvasEl(); if (!canvas) return; ctx = canvas.getContext("2d"); bind(); resize(); if (running) return; running = true; loop(); },
      stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; },
      destroy() { this.stop(); if (ac) ac.abort(); ac = null; if (ro) { ro.disconnect(); ro = null; } },
      resize, get running() { return running; },
    };
  }

  // ---------- pane controller ----------
  const DEFAULT_GROUPS = { note: "Links", cop: "COP", wi: "WI", letter: "Letter", contract: "Contract" };
  function create(cfg) {
    let engine = null, seq = 0, lastFocus = null, lastGraph = null, floatWin = null, floatEngine = null, floated = false;
    const groups = cfg.groups || DEFAULT_GROUPS;
    const root = () => $(cfg.root);
    const q = sel => root()?.querySelector(sel);
    const pane = () => cfg.pane ? $(cfg.pane) : null;
    const dockedVisible = () => (cfg.isVisible ? cfg.isVisible() : true) && !pane()?.classList.contains("hidden") && !q(".note-graph-docked")?.hidden;

    function makeEngine(canvas, box, tipEl) {
      return createForceGraph({
        canvas, box, restLength: 64, spread: 68, repulsion: 700, alwaysLabel: true, fontSize: 10, pinFocus: true, shortLabels: true,
        colors: cfg.colors, font: cfg.font, stripPrefix: cfg.stripPrefix,
        defaultTip: cfg.defaultTip || "Drag · click to open · scroll to zoom",
        setTip(text) { if (tipEl) tipEl.textContent = text; },
        onOpen(n) { if (!n?.id || n.id === lastFocus || n.focus) return; cfg.onOpen && cfg.onOpen(n); },
      });
    }
    function fillLinks(el, graph) {
      if (!el) return;
      const focusId = graph?.focus; const buckets = {}; for (const k in groups) buckets[k] = [];
      for (const n of (graph?.nodes || [])) {
        if (!n || n.id === focusId || n.focus) continue;
        (buckets[n.kind && buckets[n.kind] ? n.kind : Object.keys(groups)[0]]).push(n);
      }
      const nonempty = Object.keys(groups).filter(k => buckets[k].length);
      if (!nonempty.length) { el.innerHTML = `<div class="ngl-empty">${esc(cfg.emptyText || "No linked items")}</div>`; return; }
      el.innerHTML = nonempty.map(k => `<div class="ngl-k">${esc(groups[k])}</div>` + buckets[k].map(n =>
        `<a data-id="${esc(n.id)}" data-kind="${esc(n.kind || "note")}" data-cop="${esc(n.cop_id || "")}" data-letter="${esc(n.letter_id || "")}" data-wi="${esc(n.wi_id || "")}" data-note="${esc(n.note || n.id)}">${esc(n.label || n.id)}</a>`).join("")).join("");
      el.querySelectorAll("a[data-id]").forEach(a => a.addEventListener("click", () => {
        const n = (graph.nodes || []).find(x => x.id === a.dataset.id) || { id: a.dataset.id, kind: a.dataset.kind, cop_id: a.dataset.cop, letter_id: a.dataset.letter, wi_id: a.dataset.wi, note: a.dataset.note };
        cfg.onOpen && cfg.onOpen(n);
      }));
    }
    function ensureDocked() {
      if (engine) return engine;
      const canvas = q(".note-graph-canvas"), wrap = q(".note-graph-canvas-wrap");
      engine = makeEngine(() => q(".note-graph-canvas") || canvas, () => q(".note-graph-canvas-wrap") || wrap, q(".note-graph-tip"));
      return engine;
    }
    function setFloatedUi(on) {
      floated = on;
      const d = q(".note-graph-docked"), bar = q(".note-graph-floated-bar"), fb = q(".note-graph-float");
      if (d) d.hidden = on; if (bar) bar.hidden = !on; if (fb) fb.hidden = on;
    }
    function applyGraph(g) {
      lastGraph = g;
      const meta = q(".note-graph-meta");
      if (meta) { const linked = Math.max(0, (g.nodes || []).length - 1); meta.textContent = linked ? `${linked} linked` : "isolated"; }
      fillLinks(q(".note-graph-links"), g);
      if (floated && floatEngine) {
        floatEngine.setData(g.nodes, g.edges); fillLinks(floatWin?.querySelector(".note-graph-float-links"), g);
        const t = floatWin?.querySelector(".fw-title"); if (t) t.textContent = (cfg.floatTitle || "Local graph") + " — " + (lastFocus || "");
        if (!floatEngine.running) floatEngine.start(); else floatEngine.resize();
        return;
      }
      const eng = ensureDocked(); eng.setData(g.nodes, g.edges); if (dockedVisible()) eng.start();
    }
    async function load(focus, layer) {
      lastFocus = focus;
      if (cfg.paneHide !== false) pane()?.classList.remove("hidden");
      const mine = ++seq;
      const g = await cfg.fetchGraph(focus, layer || cfg.layer);
      if (mine !== seq) return;   // a newer show() won the race
      applyGraph(g || { focus, nodes: [], edges: [] });
    }
    function dock() {
      if (floatEngine) { floatEngine.destroy(); floatEngine = null; }
      if (floatWin) { const w = floatWin; floatWin = null; if (w.parentNode) w.remove(); }
      setFloatedUi(false);
      if (lastGraph) { const eng = ensureDocked(); eng.setData(lastGraph.nodes, lastGraph.edges); if (dockedVisible()) eng.start(); }
    }
    function float() {
      if (floated && floatWin?.parentNode) { floatWin.style.zIndex = String(900 + Date.now() % 1000); return; }
      if (engine) engine.stop();
      const body = document.createElement("div"); body.style.cssText = "display:flex;flex-direction:column;height:100%";
      const wrap = document.createElement("div"); wrap.className = "note-graph-float-wrap";
      const canvas = document.createElement("canvas"); canvas.className = "note-graph-float-canvas"; wrap.appendChild(canvas);
      const links = document.createElement("div"); links.className = "note-graph-float-links";
      body.appendChild(wrap); body.appendChild(links);
      if (lastGraph) fillLinks(links, lastGraph);
      setFloatedUi(true);
      floatWin = floats.open((cfg.floatTitle || "Local graph") + " — " + (lastFocus || ""), body,
        "Drag header to move · resize corner · click a node to open it",
        { className: "float-graph", width: "480px", height: "440px", onClose() { if (floatWin) { floatWin = null; dock(); } } });
      floatEngine = makeEngine(() => canvas, () => wrap, null);
      if (lastGraph) floatEngine.setData(lastGraph.nodes, lastGraph.edges);
      requestAnimationFrame(() => floatEngine && floatEngine.start());
    }
    q(".note-graph-float")?.addEventListener("click", float);
    q(".note-graph-dock")?.addEventListener("click", dock);
    return {
      show(entity, layer) { return load((entity && (entity.name || entity.id)) || entity, layer); },
      hide() { lastFocus = null; lastGraph = null; seq += 1; if (floated) dock(); if (engine) engine.stop(); if (cfg.paneHide !== false) pane()?.classList.add("hidden"); },
      pause() { if (!floated && engine) engine.stop(); },
      resume() { if (floated) { if (floatEngine && !floatEngine.running) floatEngine.start(); return; } if (lastGraph && dockedVisible()) ensureDocked().start(); },
      get focus() { return lastFocus; },
    };
  }

  global.LocalGraph = { create, createForceGraph, floats };
  if (typeof module !== "undefined" && module.exports) module.exports = global.LocalGraph;
})(typeof window !== "undefined" ? window : globalThis);
