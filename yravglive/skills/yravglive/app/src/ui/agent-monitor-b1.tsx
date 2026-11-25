// Agent Monitor, template 1: affectUI's Agent Monitor (clean style), ported one to one.
// One live card for a single agent run: its current step, the clock, the bill so far, a proportional time strip,
// the finished steps with an expandable info card per step, and controls to pause, resume, cancel, allow/decline, or fold away.
import { isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

export type AgentMonitorStatus = "idle" | "running" | "waiting" | "paused" | "finished" | "failed" | "cancelled";
export type AgentStepKind = "read" | "search" | "edit" | "run" | "think" | "web";

export type AgentRunStep = {
  id: string;
  label: string;
  kind?: AgentStepKind;
  icon?: ReactNode;
  tool?: string;
  detail?: string;
  output?: string;
  state: "queued" | "running" | "done" | "failed";
  since?: number;
  took?: number;
};

export type AgentMonitorProps = {
  state?: AgentMonitorStatus;
  agent?: { name: string; role?: string; mark?: ReactNode };
  steps?: AgentRunStep[];
  current?: { label: string; kind?: AgentStepKind; icon?: ReactNode };
  since?: number;
  until?: number;
  pausedFor?: number;
  cost?: number;
  ask?: { title: string; command?: string; icon?: ReactNode };
  outcome?: { added?: number; removed?: number; files?: number; note?: string };
  error?: string;
  defaultFolded?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onAllow?: () => void;
  onDecline?: () => void;
  onRetry?: () => void;
  onOpenLog?: () => void;
  className?: string;
};

const glyph = (children: ReactNode, size = 14) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const KIND_ICON: Record<AgentStepKind, ReactNode> = {
  read: glyph(
    <>
      <path d="M4 1.75h5.25L12 4.5v9.75H4z" />
      <path d="M9 1.75V4.75h3M6.25 8h3.5M6.25 10.5h3.5" />
    </>,
    12,
  ),
  search: glyph(
    <>
      <circle cx="7.25" cy="7.25" r="4.25" />
      <path d="m10.5 10.5 3.25 3.25" />
    </>,
    12,
  ),
  edit: glyph(
    <>
      <path d="M10.75 2.75 13.25 5.25 6 12.5H3.5V10z" />
      <path d="m9.25 4.25 2.5 2.5" />
    </>,
    12,
  ),
  run: glyph(
    <>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="2" />
      <path d="m4.75 6.25 2 1.75-2 1.75M8.5 10h2.75" />
    </>,
    12,
  ),
  think: glyph(<path d="M8 1.75c.4 3.1 1.6 4.4 4.75 4.75-3.15.35-4.35 1.65-4.75 4.75-.4-3.1-1.6-4.4-4.75-4.75C6.4 6.15 7.6 4.85 8 1.75z" />, 12),
  web: glyph(
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c1.75 1.9 2.6 4 2.6 6.25S9.75 12.35 8 14.25C6.25 12.35 5.4 10.25 5.4 8S6.25 3.65 8 1.75z" />
    </>,
    12,
  ),
};

const KIND_NAME: Record<AgentStepKind, string> = {
  read: "Read",
  search: "Search",
  edit: "Edit",
  run: "Terminal",
  think: "Thinking",
  web: "Web",
};

const FoldIcon = () => glyph(<path d="m5 3 3 3 3-3M5 13l3-3 3 3" />, 12);
const PauseIcon = () => glyph(<path d="M6 4v8M10 4v8" />, 11);
const PlayIcon = () => glyph(<path d="M5.5 3.75v8.5L12 8z" />, 11);
const CloseIcon = () => glyph(<path d="m5 5 6 6M11 5l-6 6" />, 11);
const CheckIcon = () => glyph(<path d="m3.75 8.25 2.75 2.75 5.75-6" />, 11);
const WarnIcon = () =>
  glyph(
    <>
      <path d="M7.13 2.5a1 1 0 0 1 1.74 0l5.5 9.75a1 1 0 0 1-.87 1.5H2.5a1 1 0 0 1-.87-1.5z" />
      <path d="M8 6.25v3M8 11.5v.25" />
    </>,
    11,
  );
const LogIcon = () => glyph(<path d="M5.5 10.5 10.75 5.25M6 5h4.75v4.75" />, 12);
const RetryIcon = () => glyph(<path d="M3.25 8a4.75 4.75 0 1 0 1.4-3.35M3.25 2.75v2.5h2.5" />, 12);

const formatClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1e3));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};
const formatShort = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1e3));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const formatStepTook = (ms: number) => (ms < 1e4 ? `${(Math.max(0, ms) / 1e3).toFixed(1)}s` : formatShort(ms));
const formatCost = (usd: number) => (usd > 0 && usd < 0.001 ? "<$0.001" : usd < 1 ? `$${usd.toFixed(3)}` : `$${usd.toFixed(2)}`);
const NUM = new Intl.NumberFormat("en-US");
const STATUS_LABEL: Record<AgentMonitorStatus, string> = {
  idle: "Idle",
  running: "Running",
  waiting: "Needs you",
  paused: "Paused",
  finished: "Finished",
  failed: "Failed",
  cancelled: "Cancelled",
};

function Roll({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const prev = useRef({ id, node: children });
  const [leaving, setLeaving] = useState<{ id: string; node: ReactNode } | null>(null);
  if (prev.current.id !== id && leaving?.id !== prev.current.id) setLeaving(prev.current);
  useLayoutEffect(() => {
    prev.current = { id, node: children };
  });
  return (
    <span className={["ui-agmc__roll", className].filter(Boolean).join(" ")}>
      {leaving && (
        <span
          key={`out-${leaving.id}`}
          className="ui-agmc__roll-layer"
          data-leaving=""
          aria-hidden="true"
          onAnimationEnd={(e) => e.target === e.currentTarget && setLeaving(null)}
        >
          {leaving.node}
        </span>
      )}
      <span key={id} className="ui-agmc__roll-layer" data-coming={leaving ? "" : undefined}>
        {children}
      </span>
    </span>
  );
}

function Morph({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const prev = useRef({ id, node: children });
  const [leaving, setLeaving] = useState<{ id: string; node: ReactNode } | null>(null);
  if (prev.current.id !== id && leaving?.id !== prev.current.id) setLeaving(prev.current);
  useLayoutEffect(() => {
    prev.current = { id, node: children };
  });
  const liveRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number>();
  useLayoutEffect(() => {
    const w = liveRef.current?.offsetWidth;
    if (w != null && w !== width) setWidth(w);
  });
  return (
    <span className={["ui-agmc__morph", className].filter(Boolean).join(" ")} style={{ width }}>
      {leaving && (
        <span
          key={`out-${leaving.id}`}
          className="ui-agmc__morph-layer"
          data-leaving=""
          aria-hidden="true"
          inert
          onAnimationEnd={(e) => e.target === e.currentTarget && setLeaving(null)}
        >
          {leaving.node}
        </span>
      )}
      <span key={id} ref={liveRef} className="ui-agmc__morph-layer" data-coming={leaving ? "" : undefined}>
        {children}
      </span>
    </span>
  );
}

export function AgentMonitor({
  state = "idle",
  agent = { name: "Agent" },
  steps = [],
  current,
  since,
  until,
  pausedFor = 0,
  cost,
  ask,
  outcome,
  error,
  defaultFolded = false,
  onPause,
  onResume,
  onCancel,
  onAllow,
  onDecline,
  onRetry,
  onOpenLog,
  className,
}: AgentMonitorProps) {
  const panelId = useId();
  const [folded, setFolded] = useState(defaultFolded);
  const iconBtnRef = useRef<HTMLButtonElement>(null);
  const foldBtnRef = useRef<HTMLButtonElement>(null);
  const userToggled = useRef(false);
  useEffect(() => {
    if (userToggled.current) {
      userToggled.current = false;
      (folded ? iconBtnRef : foldBtnRef).current?.focus();
    }
  }, [folded]);
  const toggleFolded = (next: boolean) => {
    userToggled.current = true;
    setFolded(next);
  };

  const [hovered, setHovered] = useState<string | null>(null);
  const [opened, setOpened] = useState<{ id: string; from: "row" | "bar" } | null>(null);
  const hotId = hovered ?? opened?.id ?? null;
  const cardRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const toggleStepInfo = (id: string, from: "row" | "bar") => setOpened((cur) => (cur?.id === id ? null : { id, from }));
  const closeStepInfo = (restoreFocus: boolean) => {
    const id = opened?.id;
    setOpened(null);
    if (restoreFocus && id) {
      cardRef.current?.querySelector<HTMLElement>(`[data-id="${globalThis.CSS.escape(id)}"] .ui-agmc__step-hit`)?.focus();
    }
  };

  useEffect(() => {
    if (!opened) return;
    infoRef.current?.querySelector<HTMLElement>(".ui-agmc__info-close")?.focus({ preventScroll: true });
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!infoRef.current?.contains(target) && !target?.closest?.(".ui-agmc__step, .ui-agmc__strip .ui-agmc__seg")) {
        setOpened(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [opened?.id]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const info = infoRef.current;
    if (!opened || !card || !info) return;
    const anchor =
      opened.from === "row"
        ? card.querySelector<HTMLElement>(`[data-id="${globalThis.CSS.escape(opened.id)}"]`)
        : card.querySelector<HTMLElement>(".ui-agmc__strip-wrap");
    if (anchor) {
      info.style.top = `${anchor.getBoundingClientRect().bottom - card.getBoundingClientRect().top + 6}px`;
    }
  });

  const listRef = useRef<HTMLOListElement>(null);
  const leaveTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const hoverHandlers = (id: string, fromStrip = false) => ({
    onPointerEnter: () => {
      window.clearTimeout(leaveTimer.current);
      setHovered(id);
      const list = listRef.current;
      const row = fromStrip ? list?.querySelector<HTMLElement>(`[data-id="${globalThis.CSS.escape(id)}"]`) : null;
      if (list && row && (row.offsetTop < list.scrollTop || row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)) {
        list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2, behavior: "smooth" });
      }
    },
    onPointerLeave: () => {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => setHovered((cur) => (cur === id ? null : cur)), 70);
    },
  });

  const [fade, setFade] = useState({ top: false, bottom: false });
  const updateFade = () => {
    const el = listRef.current;
    if (!el) return;
    const next = { top: el.scrollTop > 2, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2 };
    setFade((cur) => (cur.top === next.top && cur.bottom === next.bottom ? cur : next));
  };

  const isLive = state === "running" || state === "waiting";
  const [tickNow, setTickNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLive) return;
    const timer = window.setInterval(() => setTickNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [isLive]);
  const frozenNow = useRef(tickNow);
  if (isLive) frozenNow.current = tickNow;
  const now = isLive ? tickNow : frozenNow.current;
  const elapsed = since ? Math.max(0, (until ?? now) - since - pausedFor) : 0;

  const onCardKeyDown = (e: ReactKeyboardEvent) => {
    if (state === "waiting" && e.target === e.currentTarget) {
      if (e.key === "Enter" && onAllow) {
        e.preventDefault();
        onAllow();
      } else if (e.key === "Escape" && onDecline) {
        e.preventDefault();
        onDecline();
      }
    }
  };

  const runningStep = steps.find((s) => s.state === "running");
  const activeCount = Math.min(steps.length, steps.filter((s) => s.state !== "queued").length);
  const activeTask = current ?? (runningStep ? { label: runningStep.label, kind: runningStep.kind, icon: runningStep.icon } : undefined);
  const iconFor = (s?: { icon?: ReactNode; kind?: AgentStepKind }) => s?.icon ?? KIND_ICON[s?.kind ?? "think"];
  const stepTook = (s: AgentRunStep) => (s.state === "running" ? (s.since ? Math.max(0, now - s.since) : 0) : (s.took ?? 0));
  const hasDiff = outcome && (outcome.added != null || outcome.removed != null);
  const regionLabel = `${agent.name}: ${STATUS_LABEL[state]}${state === "running" && activeTask ? ` – ${activeTask.label}` : ""}${state === "waiting" && ask ? ` – ${ask.title}` : ""}`;

  const startedSteps = steps.filter((s) => s.state !== "queued");
  const totalTook = startedSteps.reduce((sum, s) => sum + Math.max(stepTook(s), 1), 0);
  const finishedSteps = startedSteps.filter((s) => s.state !== "running").reverse();
  const openedStep = opened ? startedSteps.find((s) => s.id === opened.id) : undefined;
  const openedOffset = openedStep
    ? openedStep.since != null && since != null
      ? Math.max(0, openedStep.since - since)
      : startedSteps.slice(0, startedSteps.indexOf(openedStep)).reduce((sum, s) => sum + stepTook(s), 0)
    : 0;

  useEffect(() => {
    if (opened && !openedStep) setOpened(null);
  }, [opened, openedStep]);
  useEffect(updateFade, [finishedSteps.length, folded]);

  const toolStack: { id: string; icon: ReactNode; live?: string; tip: { title: string; sub?: string } }[] = [];
  const toolIndex = new Map< unknown, number>();
  const pushTool = (id: string, item: { icon?: ReactNode; kind?: AgentStepKind }, tip: { title: string; sub?: string }, live?: string) => {
    const key = isValidElement(item.icon) ? item.icon.type : (item.icon ?? `kind-${item.kind ?? "think"}`);
    const idx = toolIndex.get(key);
    if (idx != null) {
      toolStack[idx] = { ...toolStack[idx], live: live ?? toolStack[idx].live, tip };
      return;
    }
    toolIndex.set(key, toolStack.length);
    toolStack.push({ id, icon: iconFor(item), live, tip });
  };
  startedSteps.forEach((s) =>
    pushTool(
      s.id,
      s,
      { title: s.label, sub: [s.tool ?? KIND_NAME[s.kind ?? "think"], s.state === "failed" ? "Failed" : formatStepTook(stepTook(s))].join(" · ") },
      s.state === "running" && state === "running" ? "run" : undefined,
    ),
  );
  if (state === "waiting" && ask?.icon) {
    pushTool("ask", { icon: ask.icon }, { title: ask.title, sub: "Waiting on you" }, "ask");
  }
  const shownTools = toolStack.slice(-4);

  const renderStrip = (cls: string, interactive: boolean) => (
    <span className={cls} aria-hidden="true">
      {startedSteps.map((s) => (
        <span
          key={s.id}
          className="ui-agmc__seg"
          data-state={s.state}
          data-hot={interactive && hotId === s.id ? "" : undefined}
          style={{ flexGrow: Math.max(stepTook(s), 1) / totalTook }}
          title={interactive ? `${s.label} · ${formatStepTook(stepTook(s))}` : undefined}
          {...(interactive ? { ...hoverHandlers(s.id, true), onClick: () => toggleStepInfo(s.id, "bar") } : {})}
        />
      ))}
      {state === "waiting" && <span className="ui-agmc__seg" data-state="waiting" />}
    </span>
  );

  const wellContent =
    state === "running" && activeTask
      ? {
          id: `r-${activeTask.label}`,
          node: (
            <>
              <span className="ui-agmc__tile">{iconFor(activeTask)}</span>
              <span className="ui-agmc__task ui-agmc__shine">{activeTask.label}</span>
            </>
          ),
        }
      : state === "waiting"
        ? {
            id: `w-${ask?.title ?? ""}-${ask?.command ?? ""}`,
            node: (
              <>
                {ask?.icon && <span className="ui-agmc__tile">{ask.icon}</span>}
                <span className="ui-agmc__task">{ask?.title ?? "Waiting on you"}</span>
                {ask?.command && (
                  <code className="ui-agmc__code" title={ask.command}>
                    {ask.command}
                  </code>
                )}
              </>
            ),
          }
        : state === "paused"
          ? {
              id: "p",
              node: (
                <span className="ui-agmc__task ui-agmc__task--quiet">
                  {"Paused"}
                  {activeTask ? ` · ${activeTask.label}` : ""}
                </span>
              ),
            }
          : state === "finished"
            ? {
                id: "f",
                node: (
                  <>
                    <span className="ui-agmc__task">
                      {"Finished in "}
                      {formatShort(elapsed)}
                    </span>
                    {hasDiff && (
                      <span className="ui-agmc__diff">
                        <span className="ui-agmc__add">
                          {"+"}
                          {NUM.format(outcome.added ?? 0)}
                        </span>
                        <span className="ui-agmc__del">
                          {"−"}
                          {NUM.format(outcome.removed ?? 0)}
                        </span>
                      </span>
                    )}
                    {outcome?.files != null && <span className="ui-agmc__note">{outcome.files === 1 ? "1 file" : `${outcome.files} files`}</span>}
                    {outcome?.note && <span className="ui-agmc__note">{outcome.note}</span>}
                  </>
                ),
              }
            : state === "failed"
              ? {
                  id: `x-${error ?? ""}`,
                  node: (
                    <>
                      <span className="ui-agmc__flag" aria-hidden="true" />
                      <span className="ui-agmc__task">{error ?? "Something went wrong"}</span>
                    </>
                  ),
                }
              : state === "cancelled"
                ? {
                    id: "c",
                    node: (
                      <span className="ui-agmc__task ui-agmc__task--quiet">
                        {"Cancelled after "}
                        {formatShort(elapsed)}
                      </span>
                    ),
                  }
                : {
                    id: "i",
                    node: <span className="ui-agmc__task ui-agmc__task--quiet">No task yet</span>,
                  };

  const agentMark = agent.mark ?? agent.name.trim().slice(0, 1).toUpperCase();
  const showClock = since != null && (state === "running" || state === "paused" || state === "waiting" || state === "failed");

  return (
    <div
      className={["ui-agmc", className].filter(Boolean).join(" ")}
      data-status={state}
      data-folded={folded ? "" : undefined}
      data-pointing={hotId ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && opened) {
          e.stopPropagation();
          closeStepInfo(true);
        }
      }}
    >
      <style href="ui-agent-monitor-clean" precedence="default">{STYLE_CSS}</style>
      {folded ? (
        <button
          ref={iconBtnRef}
          type="button"
          className="ui-agmc__icon"
          title={regionLabel}
          aria-label={`${regionLabel} – open`}
          aria-expanded={false}
          aria-controls={panelId}
          onClick={() => toggleFolded(false)}
        >
          <span className="ui-agmc__face" aria-hidden="true">
            {agentMark}
          </span>
          <span className="ui-agmc__icon-name">{agent.name}</span>
          {shownTools.length > 0 && (
            <span className="ui-agmc__tools" aria-hidden="true">
              {toolStack.length > shownTools.length && (
                <span className="ui-agmc__tools-more">
                  {"+"}
                  {toolStack.length - shownTools.length}
                </span>
              )}
              {shownTools.map((t) => (
                <span key={t.id} className="ui-agmc__tool" data-live={t.live}>
                  {t.icon}
                  <span className="ui-agmc__tip">
                    <span className="ui-agmc__tip-title">{t.tip.title}</span>
                    {t.tip.sub && <span className="ui-agmc__tip-sub">{t.tip.sub}</span>}
                  </span>
                </span>
              ))}
            </span>
          )}
          <Morph id={state === "running" || state === "paused" ? "clock" : state} className="ui-agmc__icon-end">
            {state === "finished" ? (
              <span className="ui-agmc__done-tag" data-tone="done">
                <CheckIcon />
                {formatShort(elapsed)}
              </span>
            ) : state === "waiting" ? (
              <span className="ui-agmc__done-tag" data-tone="ask">
                <WarnIcon />
                {STATUS_LABEL[state]}
              </span>
            ) : state === "failed" ? (
              <span className="ui-agmc__done-tag" data-tone="fail">
                <CloseIcon />
                {STATUS_LABEL[state]}
              </span>
            ) : (
              <span className={["ui-agmc__icon-meta", state === "running" ? "ui-agmc__shine" : ""].filter(Boolean).join(" ")} data-status={state}>
                {state === "running" || state === "paused" ? formatClock(elapsed) : STATUS_LABEL[state]}
              </span>
            )}
          </Morph>
        </button>
      ) : (
        <section ref={cardRef} id={panelId} className="ui-agmc__card" aria-label={regionLabel} tabIndex={state === "waiting" ? 0 : undefined} onKeyDown={onCardKeyDown}>
          <div className="ui-agmc__top">
            <span className="ui-agmc__face" aria-hidden="true">
              {agentMark}
            </span>
            <span className="ui-agmc__who">
              <span className="ui-agmc__name">{agent.name}</span>
              {agent.role && <span className="ui-agmc__role">{agent.role}</span>}
            </span>
            {cost != null && state !== "idle" && (
              <span className="ui-agmc__cost" data-live={isLive ? "" : undefined} aria-label={`Cost so far ${formatCost(cost)}`}>
                {formatCost(cost)}
              </span>
            )}
            <span className="ui-agmc__state" data-status={state}>
              <span className="ui-agmc__dot" />
              <Roll id={state}>{STATUS_LABEL[state]}</Roll>
            </span>
            <button
              ref={foldBtnRef}
              type="button"
              className="ui-agmc__fold"
              aria-label="Fold away"
              title="Fold away"
              aria-expanded={true}
              aria-controls={panelId}
              onClick={() => toggleFolded(true)}
            >
              <FoldIcon />
            </button>
          </div>
          <div className="ui-agmc__well" data-status={state}>
            <Roll id={wellContent.id} className="ui-agmc__well-line">
              {wellContent.node}
            </Roll>
            {showClock && (
              <span className="ui-agmc__clock" aria-label={`Running for ${formatShort(elapsed)}`}>
                {formatClock(elapsed)}
              </span>
            )}
          </div>
          {startedSteps.length > 0 && (
            <div className="ui-agmc__strip-wrap" role="img" aria-label={startedSteps.map((s) => `${s.label}, ${formatStepTook(stepTook(s))}`).join("; ")}>
              {renderStrip("ui-agmc__strip", true)}
            </div>
          )}
          {finishedSteps.length > 0 && (
            <ol
              ref={listRef}
              className="ui-agmc__steps"
              style={{ "--ui-agmc-shown": Math.min(finishedSteps.length, 3) } as CSSProperties}
              data-fade-top={fade.top ? "" : undefined}
              data-fade-bottom={fade.bottom ? "" : undefined}
              tabIndex={finishedSteps.length > 3 ? 0 : undefined}
              aria-label={finishedSteps.length > 3 ? "Finished steps" : undefined}
              onScroll={updateFade}
            >
              {finishedSteps.map((s) => (
                <li
                  key={s.id}
                  className="ui-agmc__step"
                  data-id={s.id}
                  data-state={s.state}
                  data-hot={hotId === s.id ? "" : undefined}
                  {...hoverHandlers(s.id)}
                >
                  <button
                    type="button"
                    className="ui-agmc__step-hit"
                    aria-label={`${s.label} – details`}
                    aria-expanded={opened?.id === s.id}
                    onClick={() => toggleStepInfo(s.id, "row")}
                  />
                  <span className="ui-agmc__step-icon">{iconFor(s)}</span>
                  <span className="ui-agmc__step-label" title={s.label}>
                    {s.label}
                  </span>
                  <span className="ui-agmc__step-time">{s.state === "failed" ? "Failed" : formatStepTook(stepTook(s))}</span>
                </li>
              ))}
            </ol>
          )}
          {openedStep && (
            <div key={openedStep.id} ref={infoRef} className="ui-agmc__info" role="dialog" aria-label={openedStep.label} data-state={openedStep.state}>
              <div className="ui-agmc__info-head">
                <span className="ui-agmc__tile">{iconFor(openedStep)}</span>
                <span className="ui-agmc__info-title">
                  <span className="ui-agmc__info-label">{openedStep.label}</span>
                  <span className="ui-agmc__info-sub">{openedStep.tool ?? KIND_NAME[openedStep.kind ?? "think"]}</span>
                </span>
                <button type="button" className="ui-agmc__info-close" aria-label="Close" onClick={() => closeStepInfo(true)}>
                  <CloseIcon />
                </button>
              </div>
              <dl className="ui-agmc__info-facts">
                <div>
                  <dt>Started</dt>
                  <dd>
                    {"+"}
                    {formatClock(openedOffset)}
                  </dd>
                </div>
                <div>
                  <dt>Took</dt>
                  <dd>{formatStepTook(stepTook(openedStep))}</dd>
                </div>
                <div>
                  <dt>Share</dt>
                  <dd>
                    {Math.max(1, Math.round((Math.max(stepTook(openedStep), 1) / totalTook) * 100))}
                    {"%"}
                  </dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd data-state={openedStep.state}>{openedStep.state === "running" ? "Running" : openedStep.state === "failed" ? "Failed" : "Done"}</dd>
                </div>
              </dl>
              {openedStep.detail && <p className="ui-agmc__info-detail">{openedStep.detail}</p>}
              {openedStep.output && (
                <code className="ui-agmc__info-output" title={openedStep.output}>
                  {openedStep.output}
                </code>
              )}
            </div>
          )}
          <div className="ui-agmc__foot">
            <Morph
              id={state === "waiting" ? "answer" : state === "failed" && onRetry ? "retry" : state === "running" || state === "paused" ? "steer" : "none"}
              className="ui-agmc__controls"
            >
              {state === "waiting" ? (
                <>
                  {onDecline && (
                    <button type="button" className="ui-agmc__btn" onClick={onDecline}>
                      {"Decline "}
                      <kbd>Esc</kbd>
                    </button>
                  )}
                  {onAllow && (
                    <button type="button" className="ui-agmc__btn ui-agmc__btn--go" onClick={onAllow}>
                      {"Allow "}
                      <kbd>⏎</kbd>
                    </button>
                  )}
                </>
              ) : state === "failed" && onRetry ? (
                <button type="button" className="ui-agmc__btn ui-agmc__btn--go" onClick={onRetry}>
                  <RetryIcon />
                  {" Try again"}
                </button>
              ) : (
                (state === "running" || state === "paused") &&
                (onPause || onResume || onCancel) && (
                  <span className="ui-agmc__group">
                    {(state === "running" ? onPause : onResume) && (
                      <button type="button" className="ui-agmc__seg-btn" onClick={state === "running" ? onPause : onResume}>
                        <Morph id={state} className="ui-agmc__seg-label">
                          {state === "running" ? <PauseIcon /> : <PlayIcon />}
                          {state === "running" ? "Pause" : "Resume"}
                        </Morph>
                      </button>
                    )}
                    {onCancel && (
                      <button type="button" className="ui-agmc__seg-btn" onClick={onCancel}>
                        <CloseIcon />
                        {" Cancel"}
                      </button>
                    )}
                  </span>
                )
              )}
            </Morph>
            <span className="ui-agmc__where">{steps.length > 0 && state !== "idle" ? `${activeCount}/${steps.length}` : ""}</span>
            {onOpenLog && (
              <button type="button" className="ui-agmc__btn ui-agmc__btn--quiet" onClick={onOpenLog}>
                {"Log "}
                <LogIcon />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

const STYLE_CSS = `
.ui-agmc{--ui-agmc-card: #ffffff;--ui-agmc-strong: #000000;--ui-agmc-ink: rgba(0, 0, 0, 0.88);--ui-agmc-text: rgba(0, 0, 0, 0.61);--ui-agmc-muted: rgba(0, 0, 0, 0.45);--ui-agmc-faint: rgba(0, 0, 0, 0.27);--ui-agmc-line: rgba(0, 0, 0, 0.06);--ui-agmc-edge: #efeeee;--ui-agmc-lane: #f4f4f5;--ui-agmc-well: rgba(0, 0, 0, 0.025);--ui-agmc-fill: rgba(0, 0, 0, 0.05);--ui-agmc-accent: #0060e2;--ui-agmc-accent-bg: rgba(0, 96, 226, 0.08);--ui-agmc-green: #108a4a;--ui-agmc-green-bg: rgba(16, 138, 74, 0.09);--ui-agmc-red: #d72400;--ui-agmc-red-bg: rgba(215, 36, 0, 0.07);--ui-agmc-amber: #b45309;--ui-agmc-amber-bg: rgba(245, 158, 11, 0.13);--ui-agmc-shine: rgba(0, 0, 0, 0.22);--ui-agmc-focus: #a1a1a6;--ui-agmc-seg: rgba(0, 0, 0, 0.08);--ui-agmc-live: 0, 96, 226;--ui-agmc-hot: rgba(0, 0, 0, 0.3);--ui-agmc-lift: 0 10px 6px rgba(0, 0, 0, 0.02), 0 5px 5px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.04);--ui-agmc-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06), 0 1px 1px -1px rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05);--ui-agmc-ease: cubic-bezier(0.32, 0.72, 0.24, 1);position: relative;display: inline-block;max-width: 100%;font-family: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;font-size: 13px;line-height: 20px;color: var(--ui-agmc-text);-webkit-font-smoothing: antialiased}
.ui-agmc *, .ui-agmc *::before, .ui-agmc *::after{box-sizing: border-box}
:where(.ui-agmc) button{margin: 0;padding: 0;border: 0;background: none;font: inherit;color: inherit;cursor: pointer}
.ui-agmc :is(button, .ui-agmc__card, .ui-agmc__steps):focus-visible{outline: 2px solid var(--ui-agmc-focus);outline-offset: 2px}
.ui-agmc :is(ol, ul){margin: 0;padding: 0;list-style: none}
.ui-agmc__card{position: relative;display: grid;gap: 10px;width: 340px;max-width: 100%;padding: 14px 14px 10px;border-radius: 14px;background: var(--ui-agmc-card);box-shadow: 0 0 0 1px var(--ui-agmc-edge), var(--ui-agmc-lift);transform-origin: 22px 22px;animation: ui-agmc-open 340ms var(--ui-agmc-ease) both;transition: box-shadow 300ms ease}
.ui-agmc__top{display: flex;align-items: center;gap: 8px;min-width: 0}
.ui-agmc__face{display: grid;flex: none;place-items: center;width: 26px;height: 26px;border-radius: 7px;background: var(--ui-agmc-card);box-shadow: var(--ui-agmc-shadow);font-size: 11px;font-weight: 500;color: var(--ui-agmc-ink)}
.ui-agmc__face > svg{width: 14px;height: 14px}
.ui-agmc__face > img{display: block;width: 100%;height: 100%;object-fit: cover;border-radius: inherit}
.ui-agmc__who{display: grid;flex: 1;min-width: 3em}
.ui-agmc__name{overflow: hidden;font-weight: 500;line-height: 16px;color: var(--ui-agmc-strong);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__role{overflow: hidden;font-size: 11px;line-height: 14px;color: var(--ui-agmc-muted);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__cost{animation: ui-agmc-morph-in 380ms var(--ui-agmc-ease) both;flex: none;font-size: 11px;line-height: 14px;font-variant-numeric: tabular-nums;color: var(--ui-agmc-muted)}
.ui-agmc__cost[data-live]{background: linear-gradient(90deg, var(--ui-agmc-ink) 0%, var(--ui-agmc-ink) 38%, var(--ui-agmc-shine) 50%, var(--ui-agmc-ink) 62%, var(--ui-agmc-ink) 100%) 0 0 / 300% 100%;-webkit-background-clip: text;background-clip: text;color: transparent;animation: ui-agmc-shine 1500ms linear infinite}
.ui-agmc__state{display: inline-flex;flex: none;align-items: center;gap: 5px;height: 18px;padding: 0 6px;overflow: hidden;border-radius: 4px;background: var(--ui-agmc-well);font-size: 11px;font-weight: 500;line-height: 18px;color: var(--ui-agmc-muted);transition: background-color 300ms ease, color 300ms ease}
.ui-agmc__dot{flex: none;width: 6px;height: 6px;border-radius: 2px;background: currentColor;opacity: 0.55}
.ui-agmc__state:is([data-status="running"], [data-status="waiting"]) .ui-agmc__dot{opacity: 1;animation: ui-agmc-breathe 1400ms ease-in-out infinite}
.ui-agmc__state .ui-agmc__roll{flex: none;height: 18px}
.ui-agmc__state[data-status="running"]{background: var(--ui-agmc-accent-bg);color: var(--ui-agmc-accent)}
.ui-agmc__state[data-status="waiting"]{background: var(--ui-agmc-amber-bg);color: var(--ui-agmc-amber)}
.ui-agmc__state[data-status="finished"]{background: var(--ui-agmc-green-bg);color: var(--ui-agmc-green)}
.ui-agmc__state[data-status="failed"]{background: var(--ui-agmc-red-bg);color: var(--ui-agmc-red)}
.ui-agmc__fold{display: grid;flex: none;place-items: center;width: 22px;height: 22px;margin: -2px -4px -2px -2px;border-radius: 6px;color: var(--ui-agmc-faint);transition: background-color 150ms ease, color 150ms ease}
.ui-agmc__fold:hover{background: var(--ui-agmc-fill);color: var(--ui-agmc-ink)}
.ui-agmc__well{display: flex;align-items: center;gap: 8px;min-width: 0;height: 36px;padding: 0 10px 0 6px;border-radius: 8px;background: var(--ui-agmc-lane);font-size: 12px;transition: background-color 300ms ease}
.ui-agmc__well[data-status="waiting"]{background: var(--ui-agmc-amber-bg)}
.ui-agmc__well:not([data-status="running"]):not(:has(.ui-agmc__tile)){padding-left: 10px}
.ui-agmc__roll{display: inline-grid;flex: 1;grid-template-columns: minmax(0, 1fr);align-items: center;min-width: 0;height: 36px;overflow: hidden}
.ui-agmc__roll-layer{grid-area: 1 / 1;display: flex;align-items: center;gap: 7px;min-width: 0}
.ui-agmc__roll-layer[data-leaving]{animation: ui-agmc-out 380ms var(--ui-agmc-ease) both;pointer-events: none}
.ui-agmc__roll-layer[data-coming]{animation: ui-agmc-in 380ms var(--ui-agmc-ease) both}
.ui-agmc__tile{display: grid;flex: none;place-items: center;width: 24px;height: 24px;border-radius: 6px;background: var(--ui-agmc-card);box-shadow: var(--ui-agmc-shadow);color: var(--ui-agmc-text)}
.ui-agmc__tile > svg{width: 14px;height: 14px}
.ui-agmc__task{min-width: 0;overflow: hidden;font-weight: 500;color: var(--ui-agmc-ink);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__well[data-status="waiting"] .ui-agmc__task{flex: none}
.ui-agmc__task--quiet{font-weight: 400;color: var(--ui-agmc-faint)}
.ui-agmc__flag{flex: none;width: 6px;height: 6px;border-radius: 2px;background: var(--ui-agmc-red)}
.ui-agmc__shine{background: linear-gradient(90deg, var(--ui-agmc-ink) 0%, var(--ui-agmc-ink) 38%, var(--ui-agmc-shine) 50%, var(--ui-agmc-ink) 62%, var(--ui-agmc-ink) 100%) 0 0 / 300% 100%;-webkit-background-clip: text;background-clip: text;color: transparent;animation: ui-agmc-shine 1500ms linear infinite}
.ui-agmc__code{flex: 0 1 auto;min-width: 0;overflow: hidden;padding: 0 6px;border-radius: 5px;background: var(--ui-agmc-card);box-shadow: var(--ui-agmc-shadow);font-family: ui-monospace, "SF Mono", Menlo, monospace;font-size: 11px;line-height: 20px;color: var(--ui-agmc-ink);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__diff{display: inline-flex;flex: none;gap: 5px;font-weight: 500;font-variant-numeric: tabular-nums}
.ui-agmc__add{color: var(--ui-agmc-green)}
.ui-agmc__del{color: var(--ui-agmc-red)}
.ui-agmc__note{flex: none;color: var(--ui-agmc-muted)}
.ui-agmc__clock{animation: ui-agmc-morph-in 380ms var(--ui-agmc-ease) both;flex: none;font-variant-numeric: tabular-nums;color: var(--ui-agmc-muted)}
.ui-agmc__strip-wrap{margin: 2px 0}
.ui-agmc__strip{display: flex;gap: 2px;height: 6px}
.ui-agmc__seg{position: relative;min-width: 3px;border-radius: 3px;background: var(--ui-agmc-seg);transition: flex-grow 300ms linear, background-color 400ms ease, opacity 200ms ease;animation: ui-agmc-grow 420ms var(--ui-agmc-ease) backwards}
.ui-agmc__strip .ui-agmc__seg::after{content: "";position: absolute;inset: -7px -1px}
.ui-agmc__seg[data-state="running"]{background: rgba(var(--ui-agmc-live), 0.28)}
.ui-agmc__seg[data-state="running"]::before{content: "";position: absolute;inset: 0;border-radius: inherit;background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.75) 50%, transparent 100%) 0 0 / 50% 100% no-repeat;animation: ui-agmc-sheen 1600ms ease-in-out infinite}
.ui-agmc__seg[data-state="failed"]{background: repeating-linear-gradient(-45deg, var(--ui-agmc-red-bg) 0 2px, transparent 2px 4px), var(--ui-agmc-seg)}
.ui-agmc__seg[data-state="waiting"]{flex: 0 0 12px;background: var(--ui-agmc-amber);opacity: 0.6;animation: ui-agmc-grow 420ms var(--ui-agmc-ease) backwards, ui-agmc-breathe 1600ms ease-in-out infinite}
.ui-agmc:not([data-status="running"]) .ui-agmc__seg[data-state="running"]::before{animation: none;opacity: 0}
.ui-agmc[data-status="finished"] .ui-agmc__seg:not([data-state="failed"]){background: var(--ui-agmc-green-bg)}
.ui-agmc[data-status="paused"] .ui-agmc__seg[data-state="running"]{opacity: 0.45}
.ui-agmc[data-pointing] .ui-agmc__strip .ui-agmc__seg:not([data-hot]), .ui-agmc[data-pointing] .ui-agmc__step:not([data-hot]){opacity: 0.35}
.ui-agmc__strip .ui-agmc__seg[data-hot]:not([data-state="running"]){background: var(--ui-agmc-hot)}
.ui-agmc__steps::-webkit-scrollbar{display: none}
.ui-agmc__steps[data-fade-top]{--ui-agmc-fade-top: transparent}
.ui-agmc__steps[data-fade-bottom]{--ui-agmc-fade-bottom: transparent}
.ui-agmc__steps{position: relative;display: grid;align-content: start;height: calc(var(--ui-agmc-shown, 0) * 26px);overflow-y: auto;overscroll-behavior: contain;scrollbar-width: none;margin: -2px -6px 0;--ui-agmc-fade-top: #000;--ui-agmc-fade-bottom: #000;-webkit-mask-image: linear-gradient(to bottom, var(--ui-agmc-fade-top), #000 14px, #000 calc(100% - 14px), var(--ui-agmc-fade-bottom));mask-image: linear-gradient(to bottom, var(--ui-agmc-fade-top), #000 14px, #000 calc(100% - 14px), var(--ui-agmc-fade-bottom));transition: height 420ms var(--ui-agmc-ease)}
.ui-agmc__step{display: flex;align-items: center;gap: 8px;height: 26px;padding: 0 8px;border-radius: 7px;font-size: 12px;cursor: default;transition: opacity 200ms ease, background-color 200ms ease;animation: ui-agmc-drop 460ms var(--ui-agmc-ease) backwards}
.ui-agmc__step[data-hot]{background: var(--ui-agmc-lane)}
.ui-agmc__step{position: relative;cursor: pointer}
.ui-agmc__strip .ui-agmc__seg{cursor: pointer}
.ui-agmc__step-hit{position: absolute;inset: 0;border-radius: inherit}
.ui-agmc .ui-agmc__step-hit:focus-visible{outline-offset: -2px}
.ui-agmc__step > :not(.ui-agmc__step-hit){position: relative;pointer-events: none}
.ui-agmc__info{position: absolute;z-index: 2;right: 10px;left: 10px;display: grid;gap: 10px;padding: 12px;border-radius: 12px;background: var(--ui-agmc-card);box-shadow: 0 0 0 1px var(--ui-agmc-edge), 0 12px 24px -8px rgba(0, 0, 0, 0.14), 0 4px 8px -4px rgba(0, 0, 0, 0.06);transform-origin: 50% 0;animation: ui-agmc-pop 260ms var(--ui-agmc-ease) both}
.ui-agmc__info-head{display: flex;align-items: center;gap: 10px;min-width: 0}
.ui-agmc__info-title{display: grid;flex: 1;min-width: 0}
.ui-agmc__info-label{overflow: hidden;font-size: 13px;font-weight: 500;line-height: 18px;color: var(--ui-agmc-strong);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__info-sub{font-size: 11px;line-height: 14px;color: var(--ui-agmc-muted)}
.ui-agmc__info-close{display: grid;flex: none;place-items: center;width: 22px;height: 22px;margin: -2px -4px 0 0;border-radius: 6px;color: var(--ui-agmc-faint);transition: background-color 150ms ease, color 150ms ease}
.ui-agmc__info-close:hover{background: var(--ui-agmc-fill);color: var(--ui-agmc-ink)}
.ui-agmc__info-facts{display: grid;grid-template-columns: repeat(4, minmax(0, 1fr));gap: 1px;margin: 0;overflow: hidden;border-radius: 8px;background: var(--ui-agmc-line);box-shadow: 0 0 0 1px var(--ui-agmc-line)}
.ui-agmc__info-facts > div{display: grid;gap: 1px;padding: 6px 8px;background: var(--ui-agmc-card)}
.ui-agmc__info-facts dt{font-size: 10.5px;line-height: 14px;color: var(--ui-agmc-muted)}
.ui-agmc__info-facts dd{margin: 0;font-size: 12px;font-weight: 500;line-height: 16px;font-variant-numeric: tabular-nums;color: var(--ui-agmc-ink)}
.ui-agmc__info-facts dd[data-state="failed"]{color: var(--ui-agmc-red)}
.ui-agmc__info-facts dd[data-state="running"]{color: var(--ui-agmc-accent)}
.ui-agmc__info-detail{margin: 0;font-size: 12px;line-height: 18px;color: var(--ui-agmc-text)}
.ui-agmc__info-output{display: block;overflow: hidden;padding: 5px 8px;border-radius: 6px;background: var(--ui-agmc-lane);font-family: ui-monospace, "SF Mono", Menlo, monospace;font-size: 11px;line-height: 16px;color: var(--ui-agmc-ink);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__step-icon{display: grid;flex: none;place-items: center;width: 18px;height: 18px;border-radius: 5px;background: var(--ui-agmc-card);box-shadow: var(--ui-agmc-shadow);color: var(--ui-agmc-muted)}
.ui-agmc__step-icon > svg{width: 11px;height: 11px}
.ui-agmc__step-label{flex: 1;min-width: 0;overflow: hidden;color: var(--ui-agmc-text);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__step-time{flex: none;font-variant-numeric: tabular-nums;color: var(--ui-agmc-faint)}
.ui-agmc__step[data-state="failed"] .ui-agmc__step-time{color: var(--ui-agmc-red)}
.ui-agmc__foot{display: flex;align-items: center;gap: 4px;min-height: 28px;margin: 0 -4px}
.ui-agmc__where{flex: 1;padding-right: 4px;font-size: 11px;font-variant-numeric: tabular-nums;color: var(--ui-agmc-faint);text-align: right}
.ui-agmc__morph{display: inline-grid;flex: none;align-items: center;transition: width 380ms var(--ui-agmc-ease)}
.ui-agmc__morph-layer{grid-area: 1 / 1;justify-self: start;display: inline-flex;align-items: center;gap: 4px;white-space: nowrap}
.ui-agmc__morph-layer[data-leaving]{animation: ui-agmc-morph-out 240ms ease both;pointer-events: none}
.ui-agmc__morph-layer[data-coming]{animation: ui-agmc-morph-in 380ms var(--ui-agmc-ease) both}
.ui-agmc__icon-end{overflow: hidden}
.ui-agmc__icon-meta.ui-agmc__shine{color: transparent}
.ui-agmc__seg-label .ui-agmc__morph-layer > svg{color: var(--ui-agmc-muted)}
.ui-agmc__icon-end .ui-agmc__morph-layer{transform-origin: 0 50%}
.ui-agmc__controls .ui-agmc__morph-layer{transform-origin: 0 50%}
.ui-agmc__group{display: inline-flex;gap: 4px;margin-left: 4px}
.ui-agmc__seg-btn{display: inline-flex;align-items: center;gap: 4px;height: 24px;padding: 0 9px 0 7px;border-radius: 7px;background: var(--ui-agmc-lane);font-size: 11.5px;font-weight: 500;color: var(--ui-agmc-text);white-space: nowrap;transition: background-color 150ms ease, box-shadow 150ms ease, color 150ms ease, transform 150ms ease}
.ui-agmc__seg-btn > svg{color: var(--ui-agmc-muted)}
.ui-agmc__seg-btn:hover{background: var(--ui-agmc-seg);color: var(--ui-agmc-ink)}
.ui-agmc__seg-btn:active{transform: scale(0.96)}
.ui-agmc__btn{display: inline-flex;align-items: center;gap: 5px;height: 26px;padding: 0 8px;border-radius: 7px;font-size: 12px;font-weight: 500;color: var(--ui-agmc-text);white-space: nowrap;transition: background-color 150ms ease, color 150ms ease, transform 150ms ease}
.ui-agmc__btn:hover{background: var(--ui-agmc-fill);color: var(--ui-agmc-ink)}
.ui-agmc__btn:active{transform: scale(0.97)}
.ui-agmc__btn--go{padding: 0 10px;background: var(--ui-agmc-strong);color: var(--ui-agmc-card)}
.ui-agmc__btn--go:hover{background: var(--ui-agmc-strong);color: var(--ui-agmc-card);opacity: 0.86}
.ui-agmc__btn--quiet{color: var(--ui-agmc-muted)}
.ui-agmc__btn kbd{padding: 0 4px;border-radius: 4px;background: var(--ui-agmc-fill);font-family: inherit;font-size: 10px;line-height: 15px;color: var(--ui-agmc-muted)}
.ui-agmc__btn--go kbd{background: rgba(255, 255, 255, 0.18);color: rgba(255, 255, 255, 0.8)}
.ui-agmc__icon{position: relative;display: inline-flex;align-items: center;gap: 12px;height: 44px;padding: 0 12px 0 9px;border-radius: 13px;background: var(--ui-agmc-card);box-shadow: 0 0 0 1px var(--ui-agmc-edge), var(--ui-agmc-lift);text-align: left;transform-origin: 22px 50%;animation: ui-agmc-open 300ms var(--ui-agmc-ease) both}
.ui-agmc__icon-name{max-width: 140px;margin-left: -4px;overflow: hidden;font-size: 12.5px;font-weight: 500;color: var(--ui-agmc-strong);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__tools{display: flex;align-items: center}
.ui-agmc__tool{position: relative;display: grid;flex: none;place-items: center;width: 24px;height: 24px;border-radius: 7px;background: var(--ui-agmc-card);box-shadow: inset 0 0 0 1px var(--ui-agmc-edge), 0 0 0 2px var(--ui-agmc-card), 0 1px 3px 1px rgba(0, 0, 0, 0.06);color: var(--ui-agmc-muted);animation: ui-agmc-join 480ms var(--ui-agmc-ease) backwards;transition: transform 220ms var(--ui-agmc-ease)}
.ui-agmc__tool + .ui-agmc__tool{margin-left: -6px}
.ui-agmc__tool > svg{width: 12px;height: 12px;opacity: 0.4;filter: grayscale(1);transition: opacity 300ms ease, filter 300ms ease}
.ui-agmc__tool[data-live]{z-index: 1}
.ui-agmc__tool:hover{z-index: 3;transform: translateY(-4px);box-shadow: inset 0 0 0 1px var(--ui-agmc-edge), 0 0 0 2px var(--ui-agmc-card), 0 6px 12px -2px rgba(0, 0, 0, 0.14)}
.ui-agmc__tool:hover > svg{opacity: 1;filter: none}
.ui-agmc__tool > svg{pointer-events: none}
.ui-agmc__tip{position: absolute;bottom: calc(100% + 10px);left: 50%;display: grid;gap: 1px;width: max-content;max-width: 220px;padding: 7px 10px;border-radius: 9px;background: var(--ui-agmc-card);box-shadow: 0 0 0 1px var(--ui-agmc-edge), 0 12px 24px -8px rgba(0, 0, 0, 0.16), 0 4px 8px -4px rgba(0, 0, 0, 0.06);font-weight: 400;text-align: left;white-space: normal;opacity: 0;transform: translate(-50%, 4px) scale(0.97);transform-origin: 50% 100%;pointer-events: none;transition: opacity 160ms ease, transform 220ms var(--ui-agmc-ease)}
.ui-agmc__tool:hover .ui-agmc__tip{opacity: 1;transform: translate(-50%, 0)}
.ui-agmc__tip-title{overflow: hidden;font-size: 12px;font-weight: 500;line-height: 16px;color: var(--ui-agmc-strong);white-space: nowrap;text-overflow: ellipsis}
.ui-agmc__tip-sub{font-size: 11px;line-height: 14px;font-variant-numeric: tabular-nums;color: var(--ui-agmc-muted)}
.ui-agmc__tool[data-live] > svg, .ui-agmc[data-status="finished"] .ui-agmc__tool > svg{opacity: 1;filter: none}
.ui-agmc__tool[data-live="ask"]{background: linear-gradient(var(--ui-agmc-amber-bg), var(--ui-agmc-amber-bg)), var(--ui-agmc-card)}
.ui-agmc__tools-more{flex: none;margin-right: 4px;font-size: 10px;font-weight: 500;color: var(--ui-agmc-faint)}
.ui-agmc__icon-meta{flex: none;min-width: 34px;font-size: 12px;font-weight: 500;font-variant-numeric: tabular-nums;color: var(--ui-agmc-ink);white-space: nowrap}
.ui-agmc__done-tag{display: inline-flex;flex: none;align-items: center;gap: 4px;height: 22px;padding: 0 8px 0 6px;border-radius: 6px;background: var(--ui-agmc-green-bg);font-size: 12px;font-weight: 500;font-variant-numeric: tabular-nums;color: var(--ui-agmc-green);white-space: nowrap}
.ui-agmc__done-tag > svg{stroke-width: 1.8}
.ui-agmc__done-tag[data-tone="ask"]{background: var(--ui-agmc-amber-bg);color: var(--ui-agmc-amber)}
.ui-agmc__done-tag[data-tone="ask"] > svg{stroke-width: 1.5}
.ui-agmc__done-tag[data-tone="fail"]{background: var(--ui-agmc-red-bg);color: var(--ui-agmc-red)}
.ui-agmc__icon-meta:is([data-status="idle"], [data-status="paused"], [data-status="cancelled"]){color: var(--ui-agmc-muted)}
@keyframes ui-agmc-breathe{50%{opacity: 0.35}}
@keyframes ui-agmc-pop{from{opacity: 0;transform: translateY(-4px) scale(0.97)}}
@keyframes ui-agmc-morph-in{from{opacity: 0;transform: scale(0.88);filter: blur(3px)}}
@keyframes ui-agmc-morph-out{to{opacity: 0;transform: scale(0.88);filter: blur(3px)}}
@keyframes ui-agmc-join{from{width: 0;margin-left: 0;opacity: 0;transform: scale(0.5)}40%{opacity: 0}}
@keyframes ui-agmc-drop{from{margin-top: -26px;opacity: 0;filter: blur(2px)}}
@keyframes ui-agmc-open{from{opacity: 0;transform: scale(0.92)}}
@keyframes ui-agmc-in{from{opacity: 0;transform: translateY(70%);filter: blur(2px)}}
@keyframes ui-agmc-out{to{opacity: 0;transform: translateY(-70%);filter: blur(2px)}}
@keyframes ui-agmc-shine{from{background-position: 100% 0}to{background-position: 0 0}}
@keyframes ui-agmc-grow{from{clip-path: inset(0 100% 0 0 round 3px)}to{clip-path: inset(0 0 0 0 round 3px)}}
@keyframes ui-agmc-sheen{from{background-position: -100% 0}to{background-position: 200% 0}}
@media (prefers-reduced-motion: reduce){.ui-agmc *, .ui-agmc *::before, .ui-agmc *::after{animation-duration: 1ms !important;animation-iteration-count: 1 !important;transition-duration: 1ms !important}}
:where([data-reduce="1"]) .ui-agmc *, :where([data-reduce="1"]) .ui-agmc *::before, :where([data-reduce="1"]) .ui-agmc *::after{animation-duration: 1ms !important;animation-iteration-count: 1 !important;transition-duration: 1ms !important}
:where(.dark, [data-theme="dark"]) .ui-agmc{--ui-agmc-card: #1c1c1f;--ui-agmc-strong: #ffffff;--ui-agmc-ink: rgba(255, 255, 255, 0.9);--ui-agmc-text: rgba(255, 255, 255, 0.62);--ui-agmc-muted: rgba(255, 255, 255, 0.45);--ui-agmc-faint: rgba(255, 255, 255, 0.28);--ui-agmc-line: rgba(255, 255, 255, 0.08);--ui-agmc-edge: rgba(255, 255, 255, 0.08);--ui-agmc-lane: #161618;--ui-agmc-well: rgba(255, 255, 255, 0.04);--ui-agmc-fill: rgba(255, 255, 255, 0.07);--ui-agmc-accent: #5b9aff;--ui-agmc-accent-bg: rgba(91, 154, 255, 0.16);--ui-agmc-green: #55d68c;--ui-agmc-green-bg: rgba(85, 214, 140, 0.14);--ui-agmc-red: #ff6b4a;--ui-agmc-red-bg: rgba(255, 107, 74, 0.12);--ui-agmc-amber: #fbbf24;--ui-agmc-amber-bg: rgba(251, 191, 36, 0.14);--ui-agmc-shine: rgba(255, 255, 255, 0.95);--ui-agmc-focus: #6b6b70;--ui-agmc-seg: rgba(255, 255, 255, 0.09);--ui-agmc-live: 91, 154, 255;--ui-agmc-hot: rgba(255, 255, 255, 0.4);--ui-agmc-lift: 0 10px 16px -6px rgba(0, 0, 0, 0.5);--ui-agmc-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.4)}
:where(.dark, [data-theme="dark"]) .ui-agmc__btn--go{color: #111113}
:where(.dark, [data-theme="dark"]) .ui-agmc__btn--go kbd{background: rgba(0, 0, 0, 0.1);color: rgba(0, 0, 0, 0.6)}
:where(.dark, [data-theme="dark"]) .ui-agmc__seg[data-state="running"]::before{background-image: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 50%, transparent 100%)}
`;

const ClaudeLogo = () => (
  <svg viewBox="0 0 1200 1200" aria-hidden="true">
    <path
      fill="#D97757"
      d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147644 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z"
    />
  </svg>
);

const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: "var(--ui-agmc-strong, #000)" }}>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const NotionLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: "var(--ui-agmc-strong, #000)" }}>
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
  </svg>
);

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: "var(--ui-agmc-strong, #181717)" }}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 49.883 49.877" fill="none" aria-hidden="true">
    <g transform="translate(0 0)">
      <path d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z" fill="#36C5F0" />
      <path d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z" fill="#36C5F0" />
    </g>
    <g transform="translate(26.28 0)">
      <path d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z" fill="#2EB67D" />
      <path d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z" fill="#2EB67D" />
    </g>
    <g transform="translate(0 26.28)">
      <path d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z" fill="#E01E5A" />
      <path d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z" fill="#E01E5A" />
    </g>
    <g transform="translate(26.28 26.28)">
      <path d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z" fill="#ECB22E" />
      <path d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z" fill="#ECB22E" />
    </g>
  </svg>
);

const LinearLogo = () => (
  <svg viewBox="0 0 24 24" fill="#5E6AD2" aria-hidden="true">
    <path d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z" />
  </svg>
);

const DriveLogo = () => (
  <svg viewBox="0 0 24 24" fill="#1FA463" aria-hidden="true">
    <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
  </svg>
);

type Phase =
  | { id: string; ask: { title: string; command?: string; icon?: ReactNode } }
  | {
      id: string;
      kind: AgentStepKind;
      logo?: ReactNode;
      tool?: string;
      doing: string;
      did: string;
      ms: number;
      detail?: string;
      output?: string;
      fails?: { error: string; label: string; detail: string };
    };

const SCENARIOS: Record<
  "release" | "support",
  {
    agent: { name: string; role: string; mark: ReactNode };
    rate: number;
    phases: Phase[];
    outcome: { note: string };
  }
> = {
  release: {
    agent: { name: "Claude Opus 5.5", role: "Release agent · web-app v3.2", mark: <ClaudeLogo /> },
    rate: 0.0058,
    phases: [
      { id: "issues", kind: "read", logo: <LinearLogo />, tool: "Linear", doing: "Collecting the v3.2 issues", did: "Collected 14 issues", ms: 1700, detail: "Everything closed in the v3.2 cycle – 9 features and 5 fixes, 2 left for v3.3.", output: "cycle:v3.2 status:done" },
      { id: "diff", kind: "search", logo: <GitHubLogo />, tool: "GitHub", doing: "Comparing v3.1…main", did: "Compared 38 commits", ms: 2300, detail: "38 commits from 6 people since the v3.1 tag, each matched to one of the issues.", output: "git log v3.1..main --oneline" },
      { id: "notes", kind: "edit", logo: <NotionLogo />, tool: "Notion", doing: "Drafting the release notes", did: "Drafted the release notes", ms: 2800, detail: "Grouped by area and written for people who skim – the two breaking changes up top.", output: "Releases / v3.2" },
      { id: "build", kind: "run", tool: "Terminal", doing: "Building the preview", did: "Built the preview in 41s", ms: 2600, detail: "Built without warnings and checked the three busiest routes on the preview.", output: "npm run build && npm run smoke" },
      { id: "ask", ask: { title: "Ready to ship", command: "gh release create v3.2.0 --latest", icon: <GitHubLogo /> } },
      { id: "tag", kind: "run", logo: <GitHubLogo />, tool: "GitHub", doing: "Publishing v3.2.0", did: "Published v3.2.0", ms: 1600, detail: "Tagged main and published the release with the notes attached.", output: "gh release create v3.2.0 --latest" },
      { id: "post", kind: "web", logo: <SlackLogo />, tool: "Slack", doing: "Announcing in #releases", did: "Announced in #releases", ms: 1300, detail: "Posted the highlights and a link to the notes, and pinned it.", output: "#releases" },
    ],
    outcome: { note: "v3.2.0 is live · 14 changes" },
  },
  support: {
    agent: { name: "GPT-5", role: "Support agent · ticket #4821", mark: <OpenAILogo /> },
    rate: 0.0036,
    phases: [
      { id: "thread", kind: "read", logo: <SlackLogo />, tool: "Slack", doing: "Reading the customer thread", did: "Read the customer thread", ms: 1900, detail: "12 messages – the customer was charged twice for a single order.", output: "#support › Maria Lopez" },
      { id: "policy", kind: "search", logo: <NotionLogo />, tool: "Notion", doing: "Looking up the refund policy", did: "Found the refund policy", ms: 2000, detail: "Double charges are refunded in full, no approval needed.", output: "Policies / Refunds" },
      {
        id: "orders",
        kind: "read",
        logo: <DriveLogo />,
        tool: "Google Drive",
        doing: "Checking the orders sheet",
        did: "Matched order #20931",
        ms: 2100,
        detail: "Order #20931 shows two charges of $129 a minute apart.",
        output: "Orders 2026 › October",
        fails: {
          error: "The orders sheet is locked",
          label: "Orders sheet was locked",
          detail: "Someone else had the sheet open for editing – it tried again a few seconds later.",
        },
      },
      { id: "reply", kind: "edit", doing: "Writing the reply", did: "Wrote the reply", ms: 2700, detail: "A short apology, the refund of $129 and when it lands – 3 to 5 days." },
      { id: "close", kind: "web", logo: <LinearLogo />, tool: "Linear", doing: "Closing SUP-4821", did: "Closed SUP-4821", ms: 1200, detail: "Linked the refund to the ticket and closed it.", output: "SUP-4821" },
    ],
    outcome: { note: "Refund sent · ticket closed" },
  },
};

type DemoRun = {
  state: AgentMonitorStatus;
  steps: AgentRunStep[];
  since?: number;
  until?: number;
  pausedFor: number;
  cost: number;
  ask?: { title: string; command?: string; icon?: ReactNode };
  error?: string;
};

const INITIAL_RUN: DemoRun = { state: "idle", steps: [], pausedFor: 0, cost: 0 };

function DemoBody() {
  const [scenario, setScenario] = useState<"release" | "support">("release");
  const [run, setRun] = useState<DemoRun>(INITIAL_RUN);
  const runRef = useRef<DemoRun>(INITIAL_RUN);
  const phaseIdx = useRef(0);
  const phaseStart = useRef(0);
  const pauseStart = useRef(0);
  const failedOnce = useRef(false);
  const waitUntil = useRef(0);
  const scenarioRef = useRef(scenario);

  const patch = (next: Partial<DemoRun>) => {
    runRef.current = { ...runRef.current, ...next };
    setRun(runRef.current);
  };
  const currentScenario = () => SCENARIOS[scenarioRef.current];

  const startPhase = (idx: number) => {
    const phase = currentScenario().phases[idx];
    phaseIdx.current = idx;
    phaseStart.current = Date.now();
    if (!phase) {
      patch({
        state: "finished",
        until: Date.now(),
        steps: runRef.current.steps.map((s) => (s.state === "running" ? { ...s, state: "done" } : s)),
      });
      waitUntil.current = Date.now() + 5200;
      return;
    }
    if ("ask" in phase) {
      patch({ state: "waiting", ask: phase.ask });
      waitUntil.current = Date.now() + 6500;
      return;
    }
    const queued = runRef.current.steps.filter((s) => s.state === "queued" && s.id !== phase.id);
    const completed = runRef.current.steps.filter((s) => s.state === "done" || s.state === "failed");
    patch({
      state: "running",
      ask: undefined,
      error: undefined,
      steps: [
        ...completed,
        {
          id: `${phase.id}-${Date.now()}`,
          kind: phase.kind,
          icon: phase.logo,
          tool: phase.tool,
          label: phase.doing,
          detail: phase.detail,
          output: phase.output,
          state: "running",
          since: Date.now(),
        },
        ...queued,
      ],
    });
  };

  const resetScenario = (key: "release" | "support") => {
    scenarioRef.current = key;
    failedOnce.current = false;
    const queued: AgentRunStep[] = SCENARIOS[key].phases
      .filter((p): p is Exclude<Phase, { ask: unknown }> => !("ask" in p))
      .map((p) => ({ id: p.id, kind: p.kind, icon: p.logo, label: p.doing, state: "queued" }));
    runRef.current = { ...INITIAL_RUN, state: "running", since: Date.now(), steps: queued };
    setRun(runRef.current);
    startPhase(0);
  };

  useEffect(() => {
    resetScenario(scenario);
  }, [scenario]);

  useEffect(() => {
    let last = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      const cur = runRef.current;
      if (cur.state === "running" || cur.state === "waiting") {
        patch({ cost: cur.cost + (currentScenario().rate * dt) / 1e3 * (cur.state === "running" ? 1 : 0.15) });
      }
      const phase = currentScenario().phases[phaseIdx.current];
      if (cur.state === "running" && phase && !("ask" in phase) && now - phaseStart.current >= phase.ms) {
        if (phase.fails && !failedOnce.current) {
          failedOnce.current = true;
          patch({
            state: "failed",
            error: phase.fails.error,
            steps: cur.steps.map((s) =>
              s.state === "running"
                ? { ...s, state: "failed", label: phase.fails!.label, detail: phase.fails!.detail, took: now - (s.since ?? now) }
                : s,
            ),
          });
          waitUntil.current = now + 4000;
          return;
        }
        patch({
          steps: cur.steps
            .map((s) => (s.state === "running" ? { ...s, state: "done", label: phase.did, took: now - (s.since ?? now) } : s))
            .filter((s) => s.state !== "queued" || s.id !== phase.id),
        });
        startPhase(phaseIdx.current + 1);
      } else if (cur.state === "waiting" && now > waitUntil.current) {
        allow();
      } else if (cur.state === "failed" && now > waitUntil.current) {
        retry();
      } else if ((cur.state === "finished" || cur.state === "cancelled") && now > waitUntil.current) {
        patch({ ...INITIAL_RUN });
        waitUntil.current = now + 2400;
      } else if (cur.state === "idle" && waitUntil.current && now > waitUntil.current) {
        waitUntil.current = 0;
        setScenario(scenarioRef.current === "release" ? "support" : "release");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  const allow = () => {
    if (runRef.current.state === "waiting") startPhase(phaseIdx.current + 1);
  };
  const decline = () => {
    if (runRef.current.state === "waiting") {
      patch({ state: "cancelled", until: Date.now(), ask: undefined });
      waitUntil.current = Date.now() + 4000;
    }
  };
  const retry = () => {
    if (runRef.current.state === "failed") startPhase(phaseIdx.current);
  };
  const pause = () => {
    if (runRef.current.state === "running") {
      pauseStart.current = Date.now();
      patch({ state: "paused" });
    }
  };
  const resume = () => {
    if (runRef.current.state !== "paused") return;
    const delta = Date.now() - pauseStart.current;
    phaseStart.current += delta;
    patch({
      state: "running",
      pausedFor: runRef.current.pausedFor + delta,
      steps: runRef.current.steps.map((s) => (s.state === "running" ? { ...s, since: (s.since ?? 0) + delta } : s)),
    });
  };
  const cancel = () => {
    if (!["running", "paused", "waiting"].includes(runRef.current.state)) return;
    const now = Date.now();
    patch({
      state: "cancelled",
      until: now,
      ask: undefined,
      steps: runRef.current.steps
        .filter((s) => s.state !== "queued")
        .map((s) => (s.state === "running" ? { ...s, state: "done", took: now - (s.since ?? now) } : s)),
    });
    waitUntil.current = now + 4000;
  };

  const sc = SCENARIOS[scenario];
  return (
    <div className="agmc-demo">
      <AgentMonitor
        key={scenario}
        state={run.state}
        agent={sc.agent}
        steps={run.steps}
        since={run.since}
        until={run.state === "finished" || run.state === "cancelled" ? run.until : undefined}
        pausedFor={run.pausedFor}
        cost={run.state === "idle" ? undefined : run.cost}
        ask={run.ask}
        outcome={sc.outcome}
        error={run.error}
        onPause={pause}
        onResume={resume}
        onCancel={cancel}
        onAllow={allow}
        onDecline={decline}
        onRetry={retry}
        onOpenLog={() => {}}
      />
    </div>
  );
}

const STAGE_CSS_SITE = `.agmc-demo{justify-items:center;width:100%;display:grid}html.stage body{align-items:start;min-height:600px;padding-top:110px}html.thumb .agmc-demo{zoom:.8}`;

export function Demo() {
  return (
    <>
      <style href="t1-stage-agent-monitor" precedence="default">{STAGE_CSS_SITE}</style>
      <DemoBody />
    </>
  );
}
export default Demo;
