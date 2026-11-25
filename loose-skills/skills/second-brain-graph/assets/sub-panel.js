/* Collapsible + resizable side panels for every tab (the 16px ◀ / ▶ strips).
 * Click = collapse/expand, drag = resize. Width persisted per panel id.
 *
 *   <section class="pane">
 *     <aside id="cop-sidebar" class="sub-panel sub-panel-left">…</aside>
 *     <button type="button" class="pane-toggle pane-toggle-left">◀</button>
 *     <article>…main…</article>
 *     <button type="button" class="pane-toggle pane-toggle-right">▶</button>
 *     <aside id="cop-graph-pane" class="local-graph-pane sub-panel sub-panel-right hidden" data-default-w="280">…</aside>
 *   </section>
 *   SubPanel.init({ storagePrefix: "myapp.panel.w." });   // once, after DOM ready
 */
(function (global) {
  "use strict";
  const MIN_W = 180, DRAG_PX = 4, BOUND = Symbol("subpanel-bound");
  let PREFIX = "panel.w.";

  function face(btn, collapsed, side) {
    const label = side === "right" ? "right panel" : "left panel";
    btn.textContent = side === "right" ? (collapsed ? "◀" : "▶") : (collapsed ? "▶" : "◀");
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btn.title = `Drag to resize · click to ${collapsed ? "expand" : "collapse"} ${label}`;
  }
  const key = p => PREFIX + (p.id || "panel");
  function defaultWidth(p) {
    const d = parseInt(p.dataset.defaultW, 10); if (Number.isFinite(d) && d > 0) return d;
    const css = parseInt(getComputedStyle(p).getPropertyValue("--sub-w"), 10); return Number.isFinite(css) && css > 0 ? css : 280;
  }
  function setWidth(p, w) { const px = Math.round(w) + "px"; p.style.setProperty("--sub-w", px); p.style.width = px; }
  function clamp(pane, w) { const n = Math.max(MIN_W, w), avail = pane.clientWidth; return (!avail || avail < 400) ? n : Math.min(n, Math.max(MIN_W, avail - 240)); }
  function panelFor(btn, side) {
    const sib = side === "right" ? btn.nextElementSibling : btn.previousElementSibling, cls = "sub-panel-" + side;
    return sib && sib.classList.contains(cls) ? sib : btn.closest(".pane")?.querySelector(`:scope > .${cls}`);
  }
  const collapsedClass = side => side === "right" ? "inspector-collapsed" : "sidebar-collapsed";

  function bind(pane, btn, side) {
    if (btn[BOUND]) return; btn[BOUND] = true;
    const panel = panelFor(btn, side);
    if (panel && !panel.dataset.defaultW) {
      panel.dataset.defaultW = String(defaultWidth(panel));
      let saved = null; try { const n = parseInt(localStorage.getItem(key(panel)), 10); if (Number.isFinite(n) && n >= MIN_W) saved = n; } catch { /* ignore */ }
      if (saved) setWidth(panel, clamp(pane, saved));
    }
    const faceAll = c => pane.querySelectorAll(".pane-toggle-" + side).forEach(el => face(el, c, side));
    const isCollapsed = () => pane.classList.contains(collapsedClass(side));
    const setCollapsed = on => { pane.classList.toggle(collapsedClass(side), on); faceAll(on); };
    let startX = 0, startW = 0, dragging = false, moved = false, pid = null;
    btn.addEventListener("pointerdown", e => {
      if ((e.button != null && e.button !== 0) || !panel) return;
      startX = e.clientX; startW = isCollapsed() ? 0 : (parseInt(getComputedStyle(panel).getPropertyValue("--sub-w"), 10) || panel.getBoundingClientRect().width);
      dragging = true; moved = false; pid = e.pointerId; try { btn.setPointerCapture(pid); } catch { /* ignore */ }
    });
    btn.addEventListener("pointermove", e => {
      if (!dragging || !panel) return;
      const dx = e.clientX - startX; if (!moved && Math.abs(dx) < DRAG_PX) return;
      if (!moved) { moved = true; pane.classList.add("panel-resizing"); document.body.classList.add("panel-resizing"); if (isCollapsed()) setCollapsed(false); }
      setWidth(panel, clamp(pane, side === "left" ? startW + dx : startW - dx));
    });
    function end() {
      if (!dragging) return; dragging = false;
      pane.classList.remove("panel-resizing"); document.body.classList.remove("panel-resizing");
      try { if (pid != null) btn.releasePointerCapture(pid); } catch { /* ignore */ } pid = null;
      if (moved && panel) { try { localStorage.setItem(key(panel), String(Math.round(panel.getBoundingClientRect().width))); } catch { /* ignore */ } }
    }
    btn.addEventListener("pointerup", end); btn.addEventListener("pointercancel", end);
    btn.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; return; } setCollapsed(!isCollapsed()); });
    faceAll(isCollapsed());
  }

  function init(opts = {}) {
    if (opts.storagePrefix) PREFIX = opts.storagePrefix;
    document.querySelectorAll(".pane").forEach(pane => {
      pane.querySelectorAll(":scope > .pane-toggle-left").forEach(b => bind(pane, b, "left"));
      pane.querySelectorAll(":scope > .pane-toggle-right").forEach(b => bind(pane, b, "right"));
    });
  }
  global.SubPanel = { init, bind };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SubPanel;
})(typeof window !== "undefined" ? window : globalThis);
