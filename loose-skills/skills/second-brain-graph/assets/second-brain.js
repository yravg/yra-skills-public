/* Second Brain — themed network graph view (full-workspace map).
 *
 * Zero dependencies. Extracted from a notes app (frontend/second-brain.js)
 * and made project-agnostic: kinds, layers, brand text, storage keys and the
 * "semantic colour" themes are all options.
 *
 *   const sb = SecondBrain.mount(hostEl, {
 *     onOpen(node) {},              // node clicked (no drag)
 *     onLayer(layerId) {},          // Dataset chip clicked -> caller reloads data
 *     onHubs(on) {},                // hub checkbox toggled -> caller reloads data
 *   }, {
 *     storageKey: "myapp.sb",       // localStorage prefix (theme + prefs)
 *     brand: "second brain", tagline: "your workspace as a living map",
 *     kinds: { cop: "COPs", letter: "Letters", wi: "WIs", contract: "Contract", note: "Notes" },
 *     layers: [{ id: "project", label: "Project" }, { id: "vault", label: "Vault" }],
 *     hubsLabel: "Contract Article / Exhibit hubs",   // null hides the checkbox
 *     hubsHiddenOnLayers: ["vault"],
 *     views: { departments: "Departments", folders: "Folders" },
 *     semanticThemes: ["Canopy"],   // themes whose prefix means "use node.color"
 *     defaultTheme: "Canopy",
 *   });
 *   sb.setData({ nodes, edges, layer, projectLabel, hint, hubs });
 *   sb.start(); sb.stop();
 *
 * Node shape:  { id, label, title?, kind?, group?, degree?, r?, color? }
 * Edge shape:  { source, target }   (or { s:{id}, t:{id} })
 */
(function (global) {
  "use strict";

  // name, bg, panel, ink, dim, accent, hub, node palette (6), font, radius, pattern, shape
  const THEMES = [
    ["Canopy", "#1d2a20", "#243128", "#e6ece4", "#9fb0a3", "#7fd1a6", "#f1c453", ["#7fd1a6", "#6fb3ff", "#f1c453", "#ff8a80", "#c8a4ff", "#8fd9e6"], "'Segoe UI', system-ui, sans-serif", 10, "dots", "circle"],
    ["Canopy paper", "#f3f0e6", "#fbf9f3", "#1f2a22", "#6c7a70", "#1f8a5a", "#c98a1c", ["#1f8a5a", "#2b6fd6", "#c98a1c", "#d1495b", "#7c5cd6", "#1b9aaa"], "'Segoe UI', system-ui, sans-serif", 10, "paper", "circle"],
    ["Terminal", "#050b06", "#0b140d", "#5cff7a", "#2f8f45", "#5cff7a", "#d6ff5c", ["#5cff7a", "#2fd4c4", "#d6ff5c", "#ff6b6b", "#8be9fd", "#9bff8a"], "Consolas, 'Cascadia Code', monospace", 2, "scanlines", "circle"],
    ["Amber CRT", "#0d0700", "#170d02", "#ffb347", "#a86b1f", "#ffb347", "#ffe08a", ["#ffb347", "#ff8c42", "#ffe08a", "#ff5d5d", "#f5c26b", "#ffd27f"], "Consolas, 'Cascadia Code', monospace", 2, "scanlines", "circle"],
    ["Pixel arcade", "#0b0f2a", "#141a3d", "#f8f8ff", "#8a90c8", "#ff4fa3", "#ffe94a", ["#ff4fa3", "#4fd1ff", "#ffe94a", "#7bff5a", "#ff8a4f", "#c96bff"], "'Courier New', monospace", 0, "grid", "square"],
    ["Game Boy", "#0f380f", "#1f4d1f", "#9bbc0f", "#5f8f2f", "#9bbc0f", "#e0f8a0", ["#9bbc0f", "#8bac0f", "#c8e07a", "#e0f8a0", "#6f9c1f", "#b7d55a"], "'Courier New', monospace", 0, "grid", "square"],
    ["Vaporwave", "#1a0b2e", "#26123f", "#ffe6ff", "#b48ad6", "#ff71ce", "#fffb96", ["#ff71ce", "#01cdfe", "#fffb96", "#05ffa1", "#b967ff", "#ff9de2"], "'Segoe UI', system-ui, sans-serif", 14, "grid", "circle"],
    ["Synthwave", "#160a2b", "#211040", "#f4ecff", "#9a86c4", "#ff3cac", "#ffd166", ["#ff3cac", "#2bd2ff", "#ffd166", "#7b61ff", "#2bff88", "#ff8f3c"], "'Segoe UI', system-ui, sans-serif", 14, "grid", "circle"],
    ["Brutalist", "#efefef", "#ffffff", "#000000", "#555555", "#000000", "#ff2e00", ["#000000", "#ff2e00", "#0033ff", "#ffcc00", "#555555", "#00a651"], "Arial, Helvetica, sans-serif", 0, "none", "square"],
    ["Swiss", "#ffffff", "#f6f6f6", "#111111", "#777777", "#e30613", "#111111", ["#e30613", "#111111", "#0057b8", "#f5a800", "#777777", "#00843d"], "Helvetica, Arial, sans-serif", 0, "none", "circle"],
    ["Mono ink", "#fbfbf8", "#ffffff", "#111111", "#7a7a7a", "#111111", "#111111", ["#111111", "#444444", "#777777", "#999999", "#2a2a2a", "#5c5c5c"], "Georgia, 'Times New Roman', serif", 6, "none", "circle"],
    ["Mono chalk", "#1b1b1b", "#242424", "#f2f2f2", "#9a9a9a", "#f2f2f2", "#f2f2f2", ["#f2f2f2", "#c9c9c9", "#a0a0a0", "#dcdcdc", "#8c8c8c", "#e6e6e6"], "Georgia, 'Times New Roman', serif", 6, "none", "circle"],
    ["Newsprint", "#f4efe3", "#fbf7ee", "#1c1a17", "#6d665c", "#8b0000", "#1c1a17", ["#1c1a17", "#8b0000", "#3a4a6b", "#6d665c", "#a0522d", "#2f5d50"], "Georgia, 'Times New Roman', serif", 2, "paper", "circle"],
    ["Blueprint", "#0b3d91", "#0f4aa8", "#e8f1ff", "#9db9e6", "#ffffff", "#ffd166", ["#ffffff", "#9dd6ff", "#ffd166", "#ff9e9e", "#c5b3ff", "#7ff5e0"], "'Segoe UI', system-ui, sans-serif", 2, "grid", "circle"],
    ["Solarized dark", "#002b36", "#073642", "#eee8d5", "#93a1a1", "#2aa198", "#b58900", ["#2aa198", "#268bd2", "#b58900", "#dc322f", "#6c71c4", "#859900"], "'Segoe UI', system-ui, sans-serif", 8, "none", "circle"],
    ["Solarized light", "#fdf6e3", "#eee8d5", "#073642", "#657b83", "#2aa198", "#b58900", ["#2aa198", "#268bd2", "#b58900", "#dc322f", "#6c71c4", "#859900"], "'Segoe UI', system-ui, sans-serif", 8, "none", "circle"],
    ["Nord", "#2e3440", "#3b4252", "#eceff4", "#a3b1c6", "#88c0d0", "#ebcb8b", ["#88c0d0", "#81a1c1", "#ebcb8b", "#bf616a", "#b48ead", "#a3be8c"], "'Segoe UI', system-ui, sans-serif", 10, "none", "circle"],
    ["Dracula", "#282a36", "#343746", "#f8f8f2", "#8b90a8", "#bd93f9", "#f1fa8c", ["#bd93f9", "#8be9fd", "#f1fa8c", "#ff5555", "#ff79c6", "#50fa7b"], "'Segoe UI', system-ui, sans-serif", 10, "none", "circle"],
    ["Gruvbox", "#282828", "#32302f", "#ebdbb2", "#a89984", "#fabd2f", "#fe8019", ["#fabd2f", "#83a598", "#fe8019", "#fb4934", "#d3869b", "#b8bb26"], "'Segoe UI', system-ui, sans-serif", 6, "none", "circle"],
    ["Tokyo night", "#1a1b26", "#24283b", "#c0caf5", "#7a80a8", "#7aa2f7", "#e0af68", ["#7aa2f7", "#7dcfff", "#e0af68", "#f7768e", "#bb9af7", "#9ece6a"], "'Segoe UI', system-ui, sans-serif", 10, "none", "circle"],
    ["Sakura", "#fff5f7", "#ffffff", "#4a2c36", "#9a7683", "#e8688a", "#f6a01a", ["#e8688a", "#7fb3e8", "#f6a01a", "#c94c6a", "#b28dd9", "#6fbf9f"], "'Segoe UI', system-ui, sans-serif", 14, "paper", "circle"],
    ["Forest", "#14231a", "#1c3024", "#e3efe6", "#8fa896", "#5fc48b", "#d9a441", ["#5fc48b", "#6aa7d6", "#d9a441", "#e26d5c", "#a58cd9", "#7fd4c9"], "'Segoe UI', system-ui, sans-serif", 10, "dots", "circle"],
    ["Deep ocean", "#061a2b", "#0b2a42", "#dff2ff", "#7fa5bf", "#3fc1ff", "#ffcc66", ["#3fc1ff", "#5ee0c8", "#ffcc66", "#ff7f8a", "#a58cff", "#8fe388"], "'Segoe UI', system-ui, sans-serif", 12, "dots", "circle"],
    ["Dusk", "#2b1d2f", "#3a2740", "#f6e9f3", "#b599b3", "#ff9f68", "#ffd27f", ["#ff9f68", "#78a6ff", "#ffd27f", "#ff6b8a", "#c79bff", "#7fd6c2"], "'Segoe UI', system-ui, sans-serif", 12, "none", "circle"],
    ["Lavender", "#f5f1ff", "#ffffff", "#2d2547", "#7f7599", "#7c5cd6", "#e0a72f", ["#7c5cd6", "#4f8fe6", "#e0a72f", "#e05c7a", "#a37cf0", "#4fbf9f"], "'Segoe UI', system-ui, sans-serif", 14, "none", "circle"],
    ["Manuscript", "#f1e7d0", "#f8f1e0", "#3a2a14", "#8a7350", "#7a2e1d", "#b8860b", ["#7a2e1d", "#2f4f6f", "#b8860b", "#8a3a3a", "#5a4a8a", "#3f6f4f"], "Georgia, 'Times New Roman', serif", 4, "paper", "circle"],
    ["Cyber yellow", "#0e0e0e", "#181818", "#f7f7f7", "#9a9a9a", "#ffe600", "#ffe600", ["#ffe600", "#00e5ff", "#ff2bd6", "#ff5c00", "#b3ff00", "#ffffff"], "Consolas, 'Cascadia Code', monospace", 0, "grid", "square"],
    ["Bauhaus", "#f2eee6", "#ffffff", "#1a1a1a", "#666666", "#d7263d", "#f4b400", ["#d7263d", "#1f5fbf", "#f4b400", "#1a1a1a", "#3aa655", "#f28c28"], "Helvetica, Arial, sans-serif", 0, "none", "square"],
    ["Neon noir", "#08080c", "#111119", "#f2f2ff", "#7c7c99", "#ff2079", "#00f0ff", ["#ff2079", "#00f0ff", "#ffe600", "#ff6f00", "#8a2be2", "#39ff14"], "'Segoe UI', system-ui, sans-serif", 12, "none", "circle"],
    ["Candy pop", "#fff8fb", "#ffffff", "#3a1f3d", "#9a7b9e", "#ff5fa2", "#ffb300", ["#ff5fa2", "#4fb3ff", "#ffb300", "#ff6b6b", "#b07bff", "#4fd6a7"], "'Segoe UI', system-ui, sans-serif", 16, "dots", "circle"],
  ].map(t => ({ name: t[0], bg: t[1], panel: t[2], ink: t[3], dim: t[4], accent: t[5], hub: t[6], palette: t[7], font: t[8], radius: t[9], pattern: t[10], shape: t[11] }));

  const DEFAULTS = {
    storageKey: "sb",
    brand: "second brain",
    tagline: "your workspace as a living map",
    kinds: { cop: "COPs", letter: "Letters", wi: "WIs", contract: "Contract", note: "Notes" },
    layers: [
      { id: "project", label: "Project COPs" },
      { id: "vault", label: "Contract vault" },
      { id: "letters", label: "Letters" },
      { id: "wis", label: "WIs" },
    ],
    hubsLabel: "Contract Article / Exhibit hubs",
    hubsHiddenOnLayers: ["vault"],
    views: { departments: "Departments", folders: "Folders" },
    semanticThemes: ["Canopy"],
    defaultTheme: "Canopy",
    tip: "Drag nodes · click to open · scroll to zoom · / to search",
  };

  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c])); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function loadJson(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch { return fallback; } }
  function saveJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } }
  function hexA(hex, a) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function mount(host, hooks, options) {
    hooks = hooks || {};
    const opt = Object.assign({}, DEFAULTS, options || {});
    const THEME_KEY = opt.storageKey + ".theme";
    const PREFS_KEY = opt.storageKey + ".prefs";
    const KIND_LABEL = opt.kinds;
    const KIND_ORDER = Object.keys(KIND_LABEL);
    const LAYERS = opt.layers;
    const isSemantic = t => opt.semanticThemes.some(p => t.name.startsWith(p));

    const prefs = Object.assign({
      layout: "force", view: "departments", kinds: {}, labels: false, legend: true,
      density: 1, linkOpacity: 0.35, springs: 0.02, spin: 0.15, menu: true,
      tpl: false, tplPos: null,
    }, loadJson(PREFS_KEY, {}));
    let themeName = (function () { try { return localStorage.getItem(THEME_KEY) || opt.defaultTheme; } catch { return opt.defaultTheme; } })();
    let theme = THEMES.find(t => t.name === themeName) || THEMES[0];

    // ---------- DOM ----------
    host.classList.add("sb-on");
    const root = document.createElement("div");
    root.className = "sb";
    root.innerHTML = `
      <div class="sb-top">
        <div class="sb-brand"><b class="sb-theme-name">${esc(theme.name.toLowerCase())}</b> <span class="sb-brand-sub">${esc(opt.brand)}</span><span class="sb-tagline">${esc(opt.tagline)}</span></div>
        <div class="sb-top-right">
          <span class="sb-status" aria-live="polite">loading index…</span>
          <button type="button" class="sb-btn sb-tpl-toggle" aria-expanded="${prefs.tpl ? "true" : "false"}">template</button>
          <button type="button" class="sb-btn sb-menu-toggle" aria-expanded="${prefs.menu ? "true" : "false"}">menu</button>
        </div>
      </div>
      <canvas class="sb-canvas" aria-label="Second brain network graph"></canvas>
      <aside class="sb-tpl-win" ${prefs.tpl ? "" : "hidden"} aria-label="Template">
        <div class="sb-win-bar">
          <span class="sb-win-title">Template · <span class="sb-theme-count">${THEMES.length}</span></span>
          <button type="button" class="sb-win-close" aria-label="Close templates">×</button>
        </div>
        <div class="sb-themes"></div>
      </aside>
      <aside class="sb-menu" ${prefs.menu ? "" : "hidden"}>
        <div class="sb-search"><input type="search" class="sb-search-input" placeholder="Search… ( / )" aria-label="Search nodes"></div>
        <div class="sb-sec"><div class="sb-sec-title">Layout</div><div class="sb-chips sb-layouts">
          ${["force", "circle", "hex", "rings"].map(l => `<button type="button" class="sb-chip" data-layout="${l}">${l[0].toUpperCase() + l.slice(1)}</button>`).join("")}
        </div></div>
        <div class="sb-sec"><div class="sb-sec-title">View</div><div class="sb-chips sb-views">
          <button type="button" class="sb-chip" data-view="departments">${esc(opt.views.departments)}</button>
          <button type="button" class="sb-chip" data-view="folders">${esc(opt.views.folders)}</button>
        </div></div>
        <div class="sb-sec"><div class="sb-sec-title">Kinds</div><div class="sb-chips sb-kinds"></div></div>
        ${LAYERS.length ? `<div class="sb-sec"><div class="sb-sec-title">Dataset</div><div class="sb-chips sb-layers">
          ${LAYERS.map(l => `<button type="button" class="sb-chip" data-layer="${esc(l.id)}">${esc(l.label)}</button>`).join("")}
        </div>${opt.hubsLabel ? `<label class="sb-check sb-hubs-row"><input type="checkbox" class="sb-hubs"> ${esc(opt.hubsLabel)}</label>` : ""}</div>` : ""}
        <div class="sb-sec sb-sliders">
          <label class="sb-range"><span>Density</span><input type="range" class="sb-density" min="0.5" max="2" step="0.05"><output></output></label>
          <label class="sb-range"><span>Link opacity</span><input type="range" class="sb-link" min="0.03" max="1" step="0.01"><output></output></label>
          <label class="sb-range"><span>Link springs</span><input type="range" class="sb-springs" min="0.002" max="0.06" step="0.002"><output></output></label>
          <label class="sb-range sb-spin-row"><span>Ring spin · rings layout</span><input type="range" class="sb-spin" min="0" max="1" step="0.05"><output></output></label>
          <label class="sb-check"><input type="checkbox" class="sb-labels"> File names</label>
        </div>
      </aside>
      <button type="button" class="sb-btn sb-legend-toggle" aria-expanded="${prefs.legend ? "true" : "false"}">✦ legend</button>
      <div class="sb-legend" ${prefs.legend ? "" : "hidden"}></div>
      <div class="sb-tip" aria-live="polite"></div>`;
    host.appendChild(root);

    const q = sel => root.querySelector(sel);
    const canvas = q(".sb-canvas");
    const ctx = canvas.getContext("2d");
    const menu = q(".sb-menu");
    const tplWin = q(".sb-tpl-win");
    const legendEl = q(".sb-legend");
    const tipEl = q(".sb-tip");
    const statusEl = q(".sb-status");
    const searchEl = q(".sb-search-input");

    // ---------- state ----------
    let nodes = [], edges = [], allNodes = [], allEdges = [];
    let layer = LAYERS[0]?.id || "", projectLabel = "", hint = "", hubs = false;
    let running = false, raf = null, W = 0, H = 0;
    const dpr = window.devicePixelRatio || 1;
    let zoom = 1, panX = 0, panY = 0, dragNode = null, panning = false, lastX = 0, lastY = 0, hover = null, moved = false;
    let query = "", spinAngle = 0, groupColors = {}, groupIndex = {};
    let ro = null;

    // ---------- theme ----------
    function applyTheme(t) {
      theme = t; themeName = t.name;
      try { localStorage.setItem(THEME_KEY, t.name); } catch { /* ignore */ }
      const s = root.style;
      s.setProperty("--sb-bg", t.bg); s.setProperty("--sb-panel", t.panel); s.setProperty("--sb-ink", t.ink);
      s.setProperty("--sb-dim", t.dim); s.setProperty("--sb-accent", t.accent); s.setProperty("--sb-hub", t.hub);
      s.setProperty("--sb-radius", t.radius + "px"); s.setProperty("--sb-font", t.font);
      s.setProperty("--sb-line", hexA(t.ink, 0.14)); s.setProperty("--sb-accent-soft", hexA(t.accent, 0.18));
      root.dataset.pattern = t.pattern; root.dataset.shape = t.shape;
      q(".sb-theme-name").textContent = t.name.toLowerCase();
      root.querySelectorAll(".sb-theme").forEach(b => b.classList.toggle("active", b.dataset.theme === t.name));
      recolor();
    }
    function renderThemes() {
      tplWin.querySelector(".sb-themes").innerHTML = THEMES.map(t =>
        `<button type="button" class="sb-theme${t.name === theme.name ? " active" : ""}" data-theme="${esc(t.name)}" title="${esc(t.name)}">
           <span class="sb-swatch" style="background:linear-gradient(135deg,${t.palette[0]},${t.palette[1]} 50%,${t.palette[2]});border-color:${hexA(t.ink, .25)}"></span>${esc(t.name)}</button>`).join("");
    }

    // ---------- data ----------
    function groupOf(n) { return prefs.view === "folders" ? (n.group || "root") : (KIND_LABEL[n.kind] || n.group || "root"); }
    function recolor() {
      const groups = [...new Set(allNodes.map(groupOf))];
      groups.sort();
      groupIndex = Object.fromEntries(groups.map((g, i) => [g, i]));
      groupColors = {};
      for (const g of groups) {
        const semantic = allNodes.find(n => groupOf(n) === g)?.color;
        groupColors[g] = isSemantic(theme) && semantic ? semantic : theme.palette[groupIndex[g] % theme.palette.length];
      }
      renderLegend();
    }
    function applyFilters() {
      const activeKinds = KIND_ORDER.filter(k => prefs.kinds[k] !== false);
      const qn = query.trim().toLowerCase();
      nodes = allNodes.filter(n => activeKinds.includes(n.kind || "note") || !KIND_LABEL[n.kind || "note"]);
      const ids = new Set(nodes.map(n => n.id));
      edges = allEdges.filter(e => ids.has(e.s.id) && ids.has(e.t.id));
      for (const n of nodes) n.match = !qn || String(n.label || n.id).toLowerCase().includes(qn) || String(n.title || "").toLowerCase().includes(qn);
      statusEl.textContent = `${nodes.length} nodes · ${edges.length} links${qn ? ` · ${nodes.filter(n => n.match).length} match` : ""}`;
      renderKinds(); renderLegend(); layoutNodes(false);
    }
    function setData(d) {
      allNodes = (d.nodes || []).map(n => ({ ...n, kind: n.kind || "note", vx: 0, vy: 0, match: true }));
      const byId = Object.fromEntries(allNodes.map(n => [n.id, n]));
      allEdges = (d.edges || []).map(e => ({ s: byId[e.s?.id ?? e.source], t: byId[e.t?.id ?? e.target] })).filter(e => e.s && e.t);
      layer = d.layer || layer; projectLabel = d.projectLabel || ""; hint = d.hint || ""; hubs = !!(d.hubs ?? d.contractHubs);
      root.querySelectorAll(".sb-layers .sb-chip").forEach(b => b.classList.toggle("active", b.dataset.layer === layer));
      const hr = q(".sb-hubs-row"); if (hr) { hr.hidden = opt.hubsHiddenOnLayers.includes(layer); q(".sb-hubs").checked = hubs; }
      q(".sb-tagline").textContent = projectLabel ? `${projectLabel} · ${opt.tagline}` : opt.tagline;
      zoom = 1; panX = 0; panY = 0; hover = null;
      recolor(); applyFilters(); layoutNodes(true);
      setTip("");
    }

    // ---------- layouts ----------
    function layoutNodes(fresh) {
      const N = nodes.length || 1;
      const spread = 260 * prefs.density * Math.sqrt(Math.max(1, N / 60));
      if (prefs.layout === "force") {
        if (fresh) nodes.forEach((n, i) => { n.x = Math.cos(i / N * 2 * Math.PI) * spread + (Math.random() - .5) * 60; n.y = Math.sin(i / N * 2 * Math.PI) * spread + (Math.random() - .5) * 60; n.vx = n.vy = 0; });
        return;
      }
      const sorted = [...nodes].sort((a, b) => (groupIndex[groupOf(a)] - groupIndex[groupOf(b)]) || ((b.degree || 0) - (a.degree || 0)));
      if (prefs.layout === "circle") {
        const R = spread * 1.15;
        sorted.forEach((n, i) => { const a = i / N * 2 * Math.PI - Math.PI / 2; n.tx = Math.cos(a) * R; n.ty = Math.sin(a) * R; });
      } else if (prefs.layout === "hex") {
        const cell = 34 * prefs.density; const cols = Math.ceil(Math.sqrt(N * 1.3));
        sorted.forEach((n, i) => { const r = Math.floor(i / cols), c = i % cols; n.tx = (c - cols / 2) * cell + (r % 2 ? cell / 2 : 0); n.ty = (r - Math.ceil(N / cols) / 2) * cell * 0.87; });
      } else if (prefs.layout === "rings") {
        const byDeg = [...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0));
        const hubsArr = byDeg.slice(0, Math.min(8, Math.ceil(N * 0.06)));
        const ring1 = byDeg.filter(n => !hubsArr.includes(n) && (n.degree || 0) >= 3);
        const ring2 = byDeg.filter(n => !hubsArr.includes(n) && !ring1.includes(n));
        [[hubsArr, spread * 0.22], [ring1, spread * 0.62], [ring2, spread * 1.05]].forEach(([arr, R]) => {
          arr.forEach((n, i) => { const a = i / (arr.length || 1) * 2 * Math.PI; n.ring = R; n.ringA = a; n.tx = Math.cos(a) * R; n.ty = Math.sin(a) * R; });
        });
      }
      if (fresh) nodes.forEach(n => { n.x = n.tx; n.y = n.ty; n.vx = n.vy = 0; });
    }

    function step() {
      if (prefs.layout === "force") {
        const rest = 120 * prefs.density, k = prefs.springs, rep = 2200 * prefs.density * prefs.density;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy; if (d2 < 25) d2 = 25;
          const d = Math.sqrt(d2); const f = Math.min(rep / d2, 2.5); dx /= d; dy /= d;
          a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        }
        for (const e of edges) {
          let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y; const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const f = (d - rest) * k; dx /= d; dy /= d;
          e.s.vx += dx * f; e.s.vy += dy * f; e.t.vx -= dx * f; e.t.vy -= dy * f;
        }
        for (const n of nodes) {
          n.vx += -n.x * .001; n.vy += -n.y * .001; n.vx *= .85; n.vy *= .85;
          n.vx = clamp(n.vx, -4, 4); n.vy = clamp(n.vy, -4, 4);
          if (n !== dragNode) { n.x += n.vx; n.y += n.vy; }
          if (!isFinite(n.x) || !isFinite(n.y)) { n.x = (Math.random() - .5) * 300; n.y = (Math.random() - .5) * 300; n.vx = n.vy = 0; }
        }
        return;
      }
      if (prefs.layout === "rings" && prefs.spin > 0) {
        spinAngle += prefs.spin * 0.004;
        for (const n of nodes) if (n.ring != null && n !== dragNode) { n.tx = Math.cos(n.ringA + spinAngle * (n.ring < 100 ? 1.6 : 1)) * n.ring; n.ty = Math.sin(n.ringA + spinAngle * (n.ring < 100 ? 1.6 : 1)) * n.ring; }
      }
      for (const n of nodes) if (n !== dragNode && n.tx != null) { n.x += (n.tx - n.x) * .12; n.y += (n.ty - n.y) * .12; }
    }

    // ---------- drawing ----------
    function drawPattern() {
      const p = theme.pattern; if (p === "none") return;
      ctx.save(); ctx.globalAlpha = 1;
      if (p === "dots" || p === "grid") {
        const g = 28; ctx.strokeStyle = hexA(theme.ink, p === "grid" ? .07 : .0); ctx.fillStyle = hexA(theme.ink, .12);
        const ox = ((panX % g) + g) % g, oy = ((panY % g) + g) % g;
        if (p === "grid") { ctx.lineWidth = 1; ctx.beginPath(); for (let x = ox; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = oy; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke(); }
        else for (let x = ox; x < W; x += g) for (let y = oy; y < H; y += g) { ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); }
      } else if (p === "scanlines") {
        ctx.fillStyle = hexA(theme.ink, .06); for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      } else if (p === "paper") {
        ctx.fillStyle = hexA(theme.ink, .035); for (let i = 0; i < 900; i++) ctx.fillRect((i * 7919) % W, (i * 104729) % H, 1, 1);
      }
      ctx.restore();
    }
    function nodeColor(n) { return groupColors[groupOf(n)] || theme.accent; }
    function drawNode(n, r, color, dim) {
      ctx.fillStyle = color; ctx.globalAlpha = dim ? .18 : 1;
      if (theme.shape === "square") ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
      else { ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H);
      drawPattern();
      ctx.save(); ctx.translate(W / 2 + panX, H / 2 + panY); ctx.scale(zoom, zoom);
      const qn = query.trim();
      const focus = hover || null;
      const neighbors = focus ? new Set(edges.flatMap(e => e.s === focus ? [e.t.id] : e.t === focus ? [e.s.id] : [])) : null;
      ctx.lineCap = "round";
      for (const e of edges) {
        const active = focus && (e.s === focus || e.t === focus);
        const dimmed = (qn && !(e.s.match && e.t.match)) || (focus && !active);
        ctx.strokeStyle = active ? theme.accent : theme.ink;
        ctx.globalAlpha = active ? .9 : dimmed ? prefs.linkOpacity * .25 : prefs.linkOpacity;
        ctx.lineWidth = active ? 1.8 / zoom + .6 : 1.1;
        ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const maxDeg = nodes.reduce((m, n) => Math.max(m, n.degree || 0), 1);
      for (const n of nodes) {
        const deg = n.degree || 0; const isHub = deg >= Math.max(4, maxDeg * .6);
        const r = (n.r || 5) * (isHub ? 1.15 : 1);
        const dim = (focus && n !== focus && !neighbors.has(n.id)) || (qn && !n.match);
        const color = isHub && !isSemantic(theme) ? theme.hub : nodeColor(n);
        if (isHub && !dim) { ctx.globalAlpha = .18; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, 7); ctx.fill(); }
        drawNode(n, r, color, dim);
        if (n === focus || (qn && n.match && !focus)) { ctx.globalAlpha = 1; ctx.strokeStyle = theme.ink; ctx.lineWidth = 1.4 / zoom; ctx.beginPath(); ctx.arc(n.x, n.y, r + 2, 0, 7); ctx.stroke(); }
        const showLabel = prefs.labels || zoom > .55 || n === focus || (neighbors && neighbors.has(n.id)) || (qn && n.match) || isHub;
        if (showLabel) {
          ctx.globalAlpha = dim ? .3 : 1; ctx.fillStyle = dim ? theme.dim : theme.ink;
          ctx.font = `${n === focus || isHub ? "600 " : ""}${11 / Math.max(zoom, .8)}px ${theme.font}`; ctx.textAlign = "center";
          ctx.fillText(n.label || n.id, n.x, n.y + r + 12 / Math.max(zoom, .8));
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
    function loop() { if (!running) return; step(); draw(); raf = requestAnimationFrame(loop); }
    function resize() {
      const rect = host.getBoundingClientRect(); W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---------- legend / chips ----------
    function renderLegend() {
      const counts = {}; for (const n of nodes.length ? nodes : allNodes) counts[groupOf(n)] = (counts[groupOf(n)] || 0) + 1;
      const groups = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      legendEl.innerHTML = `<div class="sb-legend-head">${esc(prefs.view === "folders" ? opt.views.folders : opt.views.departments)}${hint ? ` <span class="sb-legend-hint">· ${esc(hint)}</span>` : ""}</div>` +
        (groups.length ? groups.map(g => `<div class="sb-li"><span class="sb-dot" style="background:${groupColors[g] || theme.accent}"></span><span class="sb-li-name">${esc(g)}</span><span class="sb-li-n">${counts[g]}</span></div>`).join("")
          : `<div class="sb-li sb-li-empty">Nothing to map yet</div>`);
    }
    function renderKinds() {
      const present = KIND_ORDER.filter(k => allNodes.some(n => (n.kind || "note") === k));
      q(".sb-kinds").innerHTML = present.map(k => `<button type="button" class="sb-chip${prefs.kinds[k] === false ? "" : " active"}" data-kind="${k}" aria-pressed="${prefs.kinds[k] === false ? "false" : "true"}">${esc(KIND_LABEL[k])}</button>`).join("") || `<span class="sb-muted">—</span>`;
    }
    function syncChips() {
      root.querySelectorAll(".sb-layouts .sb-chip").forEach(b => b.classList.toggle("active", b.dataset.layout === prefs.layout));
      root.querySelectorAll(".sb-views .sb-chip").forEach(b => b.classList.toggle("active", b.dataset.view === prefs.view));
      q(".sb-spin-row").hidden = prefs.layout !== "rings";
      for (const [cls, key, fmt] of [[".sb-density", "density", v => v.toFixed(2)], [".sb-link", "linkOpacity", v => v.toFixed(2)], [".sb-springs", "springs", v => v.toFixed(3)], [".sb-spin", "spin", v => v.toFixed(2)]]) {
        const el = q(cls); el.value = prefs[key]; el.nextElementSibling.textContent = fmt(prefs[key]);
      }
      q(".sb-labels").checked = !!prefs.labels;
    }
    function savePrefs() { saveJson(PREFS_KEY, prefs); }

    function placeTplWin() {
      root.classList.toggle("menu-open", !!prefs.menu);
      const pos = prefs.tplPos;
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        // Dragged: pin by left/top, clamped so it can never leave the canvas.
        const r = host.getBoundingClientRect();
        const w = tplWin.offsetWidth || 260, h = tplWin.offsetHeight || 200;
        tplWin.style.left = clamp(pos.x, 8, Math.max(8, r.width - w - 8)) + "px";
        tplWin.style.top = clamp(pos.y, 52, Math.max(52, r.height - h - 8)) + "px";
        tplWin.style.right = "auto";
      } else {
        tplWin.style.left = ""; tplWin.style.top = ""; tplWin.style.right = "";
      }
    }
    function setTplOpen(on) {
      prefs.tpl = !!on;
      tplWin.hidden = !prefs.tpl;
      q(".sb-tpl-toggle").setAttribute("aria-expanded", String(prefs.tpl));
      if (prefs.tpl) placeTplWin();
      savePrefs();
    }
    // Drag the template window by its title bar.
    (function dragTplWin() {
      const bar = tplWin.querySelector(".sb-win-bar");
      let dx = 0, dy = 0, dragging = false;
      bar.addEventListener("mousedown", e => {
        if (e.target.closest(".sb-win-close")) return;
        const r = tplWin.getBoundingClientRect(), hr = host.getBoundingClientRect();
        dx = e.clientX - r.left; dy = e.clientY - r.top;
        prefs.tplPos = { x: r.left - hr.left, y: r.top - hr.top };
        dragging = true; bar.classList.add("dragging"); e.preventDefault();
      });
      window.addEventListener("mousemove", e => {
        if (!dragging) return;
        const hr = host.getBoundingClientRect();
        prefs.tplPos = { x: e.clientX - hr.left - dx, y: e.clientY - hr.top - dy };
        placeTplWin();
      });
      window.addEventListener("mouseup", () => { if (!dragging) return; dragging = false; bar.classList.remove("dragging"); savePrefs(); });
    })();
    function setTip(text) { tipEl.textContent = text || (hint ? `${hint} · ` : "") + opt.tip; }

    // ---------- interaction ----------
    function toWorld(mx, my) { return { x: (mx - W / 2 - panX) / zoom, y: (my - H / 2 - panY) / zoom }; }
    function pick(mx, my) { const p = toWorld(mx, my); return nodes.find(n => (n.x - p.x) ** 2 + (n.y - p.y) ** 2 < ((n.r || 5) + 6) ** 2) || null; }

    canvas.addEventListener("mousedown", e => { const n = pick(e.offsetX, e.offsetY); moved = false; if (n) dragNode = n; else { panning = true; lastX = e.offsetX; lastY = e.offsetY; } });
    canvas.addEventListener("mousemove", e => {
      if (dragNode) { const p = toWorld(e.offsetX, e.offsetY); dragNode.x = p.x; dragNode.y = p.y; dragNode.tx = p.x; dragNode.ty = p.y; moved = true; }
      else if (panning) { panX += e.offsetX - lastX; panY += e.offsetY - lastY; lastX = e.offsetX; lastY = e.offsetY; moved = true; }
      else { hover = pick(e.offsetX, e.offsetY); setTip(hover ? `${hover.label || hover.id}${hover.title && hover.title !== hover.label ? " — " + hover.title : ""}${hover.degree ? ` · ${hover.degree} links` : ""}` : ""); }
      canvas.style.cursor = hover || dragNode ? "pointer" : "grab";
    });
    window.addEventListener("mouseup", () => { if (dragNode && !moved && hooks.onOpen) hooks.onOpen(dragNode); dragNode = null; panning = false; });
    canvas.addEventListener("mouseleave", () => { hover = null; setTip(""); });
    canvas.addEventListener("wheel", e => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.12 : .89), .2, 3.5); }, { passive: false });
    canvas.addEventListener("dblclick", () => { zoom = 1; panX = 0; panY = 0; });

    root.addEventListener("click", e => {
      const t = e.target.closest("button, .sb-theme"); if (!t) return;
      if (t.classList.contains("sb-theme")) { applyTheme(THEMES.find(x => x.name === t.dataset.theme) || THEMES[0]); return; }
      if (t.dataset.layout) { prefs.layout = t.dataset.layout; savePrefs(); syncChips(); layoutNodes(true); return; }
      if (t.dataset.view) { prefs.view = t.dataset.view; savePrefs(); syncChips(); recolor(); applyFilters(); layoutNodes(prefs.layout !== "force"); return; }
      if (t.dataset.kind) { prefs.kinds[t.dataset.kind] = prefs.kinds[t.dataset.kind] === false; savePrefs(); applyFilters(); return; }
      if (t.dataset.layer) { if (hooks.onLayer) hooks.onLayer(t.dataset.layer); return; }
      if (t.classList.contains("sb-menu-toggle")) {
        prefs.menu = !prefs.menu; menu.hidden = !prefs.menu;
        t.setAttribute("aria-expanded", String(prefs.menu));
        placeTplWin(); savePrefs(); return;
      }
      if (t.classList.contains("sb-tpl-toggle")) { setTplOpen(!prefs.tpl); return; }
      if (t.classList.contains("sb-win-close")) { setTplOpen(false); return; }
      if (t.classList.contains("sb-legend-toggle")) { prefs.legend = !prefs.legend; legendEl.hidden = !prefs.legend; t.setAttribute("aria-expanded", String(prefs.legend)); savePrefs(); }
    });
    root.addEventListener("input", e => {
      const el = e.target;
      if (el.classList.contains("sb-search-input")) { query = el.value; applyFilters(); return; }
      const map = { "sb-density": "density", "sb-link": "linkOpacity", "sb-springs": "springs", "sb-spin": "spin" };
      for (const cls in map) if (el.classList.contains(cls)) { prefs[map[cls]] = parseFloat(el.value); el.nextElementSibling.textContent = (map[cls] === "springs" ? prefs[map[cls]].toFixed(3) : prefs[map[cls]].toFixed(2)); savePrefs(); if (cls === "sb-density") layoutNodes(prefs.layout !== "force"); return; }
    });
    root.addEventListener("change", e => {
      const el = e.target;
      if (el.classList.contains("sb-labels")) { prefs.labels = el.checked; savePrefs(); }
      if (el.classList.contains("sb-hubs") && (hooks.onHubs || hooks.onContractHubs)) (hooks.onHubs || hooks.onContractHubs)(el.checked);
    });
    document.addEventListener("keydown", e => {
      if (!running) return;
      if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "")) { e.preventDefault(); searchEl.focus(); }
      if (e.key === "Escape" && document.activeElement === searchEl) { searchEl.value = ""; query = ""; applyFilters(); searchEl.blur(); return; }
      if (e.key === "Escape" && prefs.tpl) setTplOpen(false);
    });

    renderThemes(); applyTheme(theme); syncChips(); setTip("");
    placeTplWin();

    return {
      setData,
      start() {
        running = true; resize(); loop();
        if (!ro && "ResizeObserver" in window) { ro = new ResizeObserver(() => { if (running) resize(); }); ro.observe(host); }
      },
      stop() { running = false; if (raf) cancelAnimationFrame(raf); },
      setTheme(name) { const t = THEMES.find(x => x.name === name); if (t) applyTheme(t); },
      get theme() { return theme.name; },
      themes: THEMES.map(t => t.name),
      get running() { return running; },
    };
  }

  global.SecondBrain = { mount, THEMES, DEFAULTS, hexA };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SecondBrain;
})(typeof window !== "undefined" ? window : globalThis);
