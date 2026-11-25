// yravglive parity heatmap, from Clausarium's /live/ page.
// Parity heatmap on /live/ (owner 17-Nov-2026: "have feature / parity heatmap ... so that we can avoid missing a single thing").
// Reads /parity.json every 15 s. The feed server runs the team file's "parity.command" (a repo exporter) to make it.
// Kinds come from the data (d.kinds, else every cell kind seen), so each repo picks its own: board, feature, req, route...
// One cell per required item (every legacy route, call, control, label, job and every canvas board state).
// check.py is the only judge of "proven"; the independent audit (docs/audit/*cursor-verify.json) adds name-only/missing.
import React, { useEffect, useMemo, useState } from 'react';

export const STATES = [
  { s: 'missing', label: 'Missing', hint: 'claimed done, not built' },
  { s: 'nameonly', label: 'Name only', hint: 'claimed done, no test exercises it' },
  { s: 'unmapped', label: 'Unmapped', hint: 'no feature claims it' },
  { s: 'open', label: 'Open', hint: 'not started' },
  { s: 'partial', label: 'Partial', hint: 'being built' },
  { s: 'renders', label: 'Renders', hint: 'partial, seen rendering in the smoke test' },
  { s: 'proven', label: 'Proven', hint: 'a test exercises it' },
  { s: 'dropped', label: 'Dropped', hint: 'owner decision' },
];
const DEFAULT_KINDS = ['board', 'state', 'feature', 'req', 'route', 'call', 'job', 'control', 'label'];
const KINDS = (d) => {
  if (Array.isArray(d.kinds) && d.kinds.length) return d.kinds;
  const seen = new Set(); for (const f of d.features || []) for (const c of f.cells || []) seen.add(c.kind);
  return [...DEFAULT_KINDS.filter(k => seen.has(k)), ...[...seen].filter(k => !DEFAULT_KINDS.includes(k))];
};
const RANK = Object.fromEntries(STATES.map((x, i) => [x.s, i]));
const STORE = 'yravglive_parity_view:' + location.port;

export const PH_CSS = `
.ph{--ph-missing:#C2410C;--ph-nameonly:#D97706;--ph-unmapped:#9333EA;--ph-open:#A3A3A3;--ph-partial:#60A5FA;--ph-renders:#86C79A;--ph-proven:#15803D;--ph-dropped:#E5E5E5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ph{--ph-missing:#F97350;--ph-nameonly:#F5B041;--ph-unmapped:#C084FC;--ph-open:#5C5C60;--ph-partial:#3B82F6;--ph-renders:#3F8F5A;--ph-proven:#4ADE80;--ph-dropped:#2A2A2D}}
.ph{display:flex;flex-direction:column;gap:12px}
.ph-card{border:1px solid var(--line,#E5E5E5);border-radius:var(--r-card,14px);background:var(--surface,#FFF);padding:16px}
.ph-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px}
.ph-score{font-size:28px;font-weight:650;font-variant-numeric:tabular-nums}
.ph-sub{font-size:12px;color:var(--ink-dim,#737373)}
.ph-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:12px 0 10px;background:var(--track,#F2F2F2)}
.ph-bar i{display:block;height:100%}
.ph-legend{display:flex;flex-wrap:wrap;gap:6px}
.ph-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line,#E5E5E5);background:transparent;color:var(--ink,#0A0A0A);border-radius:999px;padding:3px 10px 3px 6px;font-size:12px;cursor:pointer}
.ph-chip[aria-pressed="false"]{opacity:.45}
.ph-chip b{font-variant-numeric:tabular-nums}
.ph-sw{width:10px;height:10px;border-radius:3px;flex:none}
.ph-matrix{width:100%;border-collapse:separate;border-spacing:3px;font-size:12px;margin-top:4px}
.ph-matrix th{font-weight:500;color:var(--ink-dim,#737373);text-align:left;padding:2px 4px;white-space:nowrap}
.ph-matrix td{text-align:center;border-radius:4px;padding:5px 2px;font-variant-numeric:tabular-nums;min-width:34px}
.ph-wrap{overflow-x:auto}
.ph-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ph-tools input{flex:1 1 180px;min-width:0;border:1px solid var(--line-strong,#D4D4D4);border-radius:6px;padding:5px 8px;background:var(--surface,#FFF);color:var(--ink,#0A0A0A);font:inherit;font-size:12px}
.ph-rows{display:flex;flex-direction:column}
.ph-row{display:grid;grid-template-columns:minmax(120px,260px) 52px minmax(0,1fr);gap:10px;align-items:start;padding:6px 4px;border-top:1px solid var(--line,#E5E5E5);cursor:pointer;background:none;border-left:0;border-right:0;border-bottom:0;color:inherit;font:inherit;text-align:left;width:100%}
.ph-row:hover{background:var(--track,#F7F7F7)}
.ph-name{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-fid{font-variant-numeric:tabular-nums;color:var(--ink-dim);font-weight:600}
.ph-name small{display:block;color:var(--ink-dim,#737373);font-size:11px}
.ph-frac{font-size:12px;font-variant-numeric:tabular-nums;color:var(--ink-dim,#737373);text-align:right}
.ph-cells{display:flex;flex-wrap:wrap;gap:2px}
.ph-cell{width:11px;height:11px;border-radius:2px}
.ph-items{grid-column:1/-1;margin:4px 0 6px;font-size:12px;display:grid;gap:3px}
.ph-item{display:grid;grid-template-columns:12px 92px minmax(0,1fr);gap:8px;align-items:start}
.ph-item code{font-size:11.5px;word-break:break-word}
.ph-item span{color:var(--ink-dim,#737373);word-break:break-word}
@media (max-width:640px){.ph-row{grid-template-columns:minmax(0,1fr) 44px}.ph-cells{grid-column:1/-1}.ph-item{grid-template-columns:12px minmax(0,1fr)}.ph-item>em{display:none}}
`;

function load() { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } }
function save(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* storage blocked */ } }
const col = (s) => `var(--ph-${s})`;

export function useParity() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    const pull = () => fetch('/parity.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(j => { if (live) { setD(j); setErr(''); } })
      .catch(e => { if (live) setErr(String(e.message || e)); });
    pull();
    const t = setInterval(pull, 15000);
    return () => { live = false; clearInterval(t); };
  }, []);
  return [d, err];
}

export function ParityHeatmap() {
  const [d, err] = useParity();
  const init = load() || {};
  const [off, setOff] = useState(init.off || ['proven', 'dropped']);
  const [kind, setKind] = useState(init.kind || 'all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const [all, setAll] = useState(false);
  useEffect(() => save({ off, kind }), [off, kind]);

  const view = useMemo(() => {
    if (!d) return null;
    const rows = [];
    for (const f of d.features) {
      const cells = f.cells.filter(c => (kind === 'all' || c.kind === kind));
      if (!cells.length) continue;
      const shown = cells.filter(c => !off.includes(c.s));
      const hit = !q || ((f.fid || '') + ' ' + f.title + ' ' + f.id + ' ' + cells.map(c => c.k).join(' ')).toLowerCase().includes(q.toLowerCase());
      if (!shown.length || !hit) continue;
      const proven = cells.filter(c => c.s === 'proven').length;
      const gap = cells.filter(c => c.s !== 'proven' && c.s !== 'dropped').reduce((a, c) => a + c.w, 0);
      rows.push({ f, cells: [...cells].sort((a, b) => RANK[a.s] - RANK[b.s]), proven, gap, worst: Math.min(...cells.map(c => RANK[c.s])) });
    }
    rows.sort((a, b) => a.worst - b.worst || b.gap - a.gap);
    const matrix = {};
    for (const f of d.features) for (const c of f.cells) { const m = (matrix[c.kind] ||= {}); m[c.s] = (m[c.s] || 0) + 1; }
    return { rows, matrix };
  }, [d, off, kind, q]);

  if (!d) return <section className="ph" aria-label="Feature parity"><h2>Feature parity</h2><div className="lv-note">{err ? 'Waiting for parity data: ' + err : 'Loading…'}</div></section>;
  const total = Object.values(d.counts).reduce((a, b) => a + b, 0);
  const age = Math.round((Date.now() - d.updated) / 60000);
  const maxIn = Math.max(1, ...Object.values(view.matrix).flatMap(m => Object.values(m)));
  const toggle = (s) => setOff(o => (o.includes(s) ? o.filter(x => x !== s) : [...o, s]));

  return (
    <section className="ph" aria-label="Feature parity" data-testid="parity-heatmap">
      <style>{PH_CSS}</style>
      <h2>{d.title || 'Feature parity'}</h2>
      <div className="ph-card">
        <div className="ph-top">
          <span className="ph-score">{d.score}%</span>
          <span className="ph-sub">proven, weighted · {d.counts.proven || 0} of {total} items proven · commit {d.commit} · {age <= 0 ? 'just now' : age + ' min ago'}{age > 10 ? ' (feed may have stopped)' : ''}</span>
        </div>
        <div className="ph-bar" role="img" aria-label={STATES.map(x => x.label + ' ' + (d.counts[x.s] || 0)).join(', ')}>
          {STATES.map(x => d.counts[x.s] ? <i key={x.s} style={{ width: (100 * d.counts[x.s] / total) + '%', background: col(x.s) }} title={x.label + ': ' + d.counts[x.s]} /> : null)}
        </div>
        <div className="ph-legend">
          {STATES.map(x => (
            <button type="button" key={x.s} className="ph-chip" aria-pressed={!off.includes(x.s)} title={x.hint + ' (click to show or hide)'} onClick={() => toggle(x.s)}>
              <span className="ph-sw" style={{ background: col(x.s) }} />{x.label} <b>{d.counts[x.s] || 0}</b>
            </button>
          ))}
        </div>
        {d.invalid?.length ? <div className="lv-note" style={{ color: 'var(--ph-missing)', marginTop: 8 }}>{d.invalid.length} invalid done claim(s): {d.invalid.slice(0, 3).join(' · ')}</div> : null}
      </div>

      <div className="ph-card ph-wrap">
        <table className="ph-matrix" aria-label="Items by kind and state">
          <thead><tr><th>Kind</th>{STATES.map(x => <th key={x.s} title={x.hint}>{x.label}</th>)}<th>Total</th></tr></thead>
          <tbody>{KINDS(d).filter(k => view.matrix[k]).map(k => {
            const m = view.matrix[k]; const t = Object.values(m).reduce((a, b) => a + b, 0);
            return (
              <tr key={k}>
                <th><button type="button" className={'lv-tree-btn' + (kind === k ? ' lv-tree-btn--active' : '')} onClick={() => setKind(kind === k ? 'all' : k)}>{k}</button></th>
                {STATES.map(x => { const n = m[x.s] || 0; const a = n ? 0.18 + 0.82 * Math.sqrt(n / maxIn) : 0;
                  return <td key={x.s} title={k + ' · ' + x.label + ': ' + n} style={{ background: n ? `color-mix(in srgb, ${col(x.s)} ${Math.round(a * 100)}%, transparent)` : 'var(--track,#F5F5F5)', color: n && a > 0.6 ? '#fff' : 'inherit' }}>{n || ''}</td>; })}
                <td>{t}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      <div className="ph-card">
        <div className="ph-tools">
          <div className="lv-tree-toggle" role="group" aria-label="Item kind">
            {['all', ...KINDS(d)].map(k => <button type="button" key={k} className={'lv-tree-btn' + (kind === k ? ' lv-tree-btn--active' : '')} onClick={() => setKind(k)}>{k}</button>)}
          </div>
          <input type="search" placeholder={d.search || "Find a feature, state or requirement"} value={q} onChange={e => setQ(e.target.value)} aria-label="Find" />
          <span className="ph-sub">{view.rows.length} features · worst first · click a row for every item</span>
        </div>
        <div className="ph-rows">
          {(all ? view.rows : view.rows.slice(0, 40)).map(({ f, cells, proven }) => (
            <React.Fragment key={f.id}>
              <button type="button" className="ph-row" aria-expanded={!!open[f.id]} onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}>
                <span className="ph-name" title={(f.fid ? f.fid + ' ' : '') + f.title + ' (' + f.id + ', ' + f.status + ')'}>{f.fid ? <b className="ph-fid">{f.fid}</b> : null}{f.fid ? ' ' : ''}{f.title}<small>{f.id} · {f.status}</small></span>
                <span className="ph-frac">{proven}/{cells.length}</span>
                <span className="ph-cells">{cells.map(c => <i key={c.k} className="ph-cell" style={{ background: col(c.s), opacity: off.includes(c.s) ? 0.25 : 1 }} title={c.k + ' · ' + c.s + (c.why ? ' · ' + c.why : '')} />)}</span>
              </button>
              {open[f.id] ? (
                <div className="ph-items">
                  {f.note ? <div className="ph-sub">{f.note}</div> : null}
                  {cells.map(c => (
                    <div className="ph-item" key={c.k}>
                      <span className="ph-sw" style={{ background: col(c.s), marginTop: 3 }} />
                      <em className="ph-sub" style={{ fontStyle: 'normal' }}>{STATES.find(x => x.s === c.s)?.label}</em>
                      <div><code>{c.k}</code>{c.why ? <span> · {c.why}</span> : null}{c.ev?.length ? <span> · {c.ev.join(', ')}</span> : null}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </React.Fragment>
          ))}
          {!all && view.rows.length > 40 ? <button type="button" className="lv-anim-btn" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={() => setAll(true)}>Show all {view.rows.length} features</button> : null}
          {view.rows.length === 0 ? <div className="lv-note">Nothing matches. Turn a state back on in the legend.</div> : null}
        </div>
      </div>
    </section>
  );
}
