// yravglive page: the live view of headless agent workers, drawn with the yravg UI library
// (uiux.yraveragehub.io: Agent Tree and Agent Monitor, ported from affectUI, MIT). Polls /live.json every 5 s.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/yravg-ui.css';
import './live.css';
import { AgentTree } from './ui/agent-tree-b1';
import { AgentMonitor } from './ui/agent-monitor-b1';
// @ts-expect-error plain JSX module from Clausarium's /live/ page
import { ParityHeatmap } from './ParityHeatmap';

type Job = { name: string; result: string };
type Pr = { number: number; title: string; url: string; state: string; jobs: Job[]; tone: 'green' | 'red' | 'pending' };
type Monitor = {
  id: string;
  state: 'idle' | 'running' | 'finished' | 'failed';
  agent: { name: string; role?: string };
  current?: { label: string };
  steps: { id: string; label: string; kind?: 'read' | 'search' | 'edit' | 'run'; state: 'done' | 'running' | 'failed' }[];
  stepCount: number;
  since?: number;
  until?: number;
  error?: string;
  outcome?: { note?: string };
  model: string;
  cards: string;
  worktree: string;
  branch: string;
  ahead: string[];
  changed: number;
  logAt?: number;
  tail: string[];
  prs: Pr[];
};
type Feed = { title: string; updated: number; tree: any; monitors: Monitor[]; parity?: boolean };

const POLL_MS = 5000;

function useFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch('/live.json?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (alive) { setFeed(j); setErr(''); }
      } catch (e) {
        if (alive) setErr(String((e as Error).message || e));
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return [feed, err] as const;
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return now;
}

const ago = (now: number, at?: number) => (at ? `${Math.max(0, Math.round((now - at) / 1000))}s ago` : 'never');

function Facts({ m, now }: { m: Monitor; now: number }) {
  return (
    <div className="lv-facts">
      <dl>
        <dt>Model</dt><dd>{m.model}</dd>
        <dt>Branch</dt><dd><code>{m.branch}</code></dd>
        <dt>Work</dt><dd>{m.ahead.length} commit(s) ahead of main · {m.changed} changed file(s) · {m.stepCount} tool steps</dd>
        <dt>Log</dt><dd>last write {ago(now, m.logAt)} · <code>{m.worktree}</code></dd>
      </dl>
      {m.ahead.length > 0 && (
        <ul className="lv-commits">{m.ahead.slice(0, 5).map((c) => <li key={c}><code>{c}</code></li>)}</ul>
      )}
      {m.prs.length ? m.prs.map((p) => (
        <p className="lv-pr" key={p.number}>
          <a href={p.url} target="_blank" rel="noreferrer">#{p.number} {p.title}</a>{' '}
          <span className={`lv-pill lv-pill--${p.state === 'merged' ? 'merged' : p.tone}`}>{p.state === 'merged' ? 'merged' : p.state}</span>
          <span className="lv-jobs">
            {p.jobs.length ? p.jobs.map((j) => (
              <span key={j.name} className={`lv-job lv-job--${j.result === 'success' ? 'ok' : j.result === 'failure' || j.result === 'cancelled' ? 'bad' : 'wait'}`}>{j.name}: {j.result}</span>
            )) : <span className="lv-job lv-job--wait">no checks yet</span>}
          </span>
        </p>
      )) : <p className="lv-muted">No pull request yet.</p>}
      <details>
        <summary>Last log lines</summary>
        <pre>{m.tail.join('\n') || 'waiting for output'}</pre>
      </details>
    </div>
  );
}

const MONITOR_STATE = { idle: 'idle', running: 'running', finished: 'finished', failed: 'failed' } as const;

function Live() {
  const [d, err] = useFeed();
  const now = useNow();
  if (!d) return <main className="lv"><p className="lv-muted">{err ? 'Waiting for live data: ' + err : 'Loading…'}</p></main>;
  const age = Math.round((now - d.updated) / 1000);
  const running = d.monitors.filter((m) => m.state === 'running');
  const rest = d.monitors.filter((m) => m.state !== 'running');
  const block = (m: Monitor, folded: boolean) => (
    <section key={m.id} className="lv-card">
      <AgentMonitor
        state={MONITOR_STATE[m.state]}
        agent={m.agent}
        steps={m.steps}
        current={m.current}
        since={m.since}
        until={m.until}
        error={m.error}
        outcome={m.outcome}
        defaultFolded={folded}
      />
      <Facts m={m} now={now} />
    </section>
  );
  return (
    <main className="lv">
      <header className="lv-head">
        <h1>{d.title}</h1>
        <span className={age > 30 ? 'lv-stale' : 'lv-muted'}>
          Feed {age}s old{age > 30 ? ' (the feed server may have stopped)' : ''} · refresh every 5 s{err ? ' · last poll failed: ' + err : ''}
        </span>
      </header>
      {d.parity && <ParityHeatmap />}
      <section className="lv-tree">
        <AgentTree root={d.tree} now={now} title="Agents" formatCost={() => ''} />
      </section>
      {running.length > 0 && <h2>Working now ({running.length})</h2>}
      <div className="lv-grid">{running.map((m) => block(m, false))}</div>
      {rest.length > 0 && <h2>Stopped or finished ({rest.length})</h2>}
      <div className="lv-grid">{rest.map((m) => block(m, true))}</div>
    </main>
  );
}

createRoot(document.getElementById('live')!).render(<Live />);
