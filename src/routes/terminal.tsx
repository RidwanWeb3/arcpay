import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  useAgents,
  useServices,
  usePayments,
  useActivityFeed,
} from "@/lib/live/adapters";
import { useWallet } from "@/hooks/useWallet";
import { projectConfig } from "@/config/projectConfig";
import { BrandLogo } from "@/components/kit/cards";
import { StatusIndicator } from "@/components/kit/primitives";
import { cn } from "@/lib/utils";
import type { Agent, Service, AgentStatusValue } from "@/types";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Command Center — ArcPay Agent Terminal" },
      {
        name: "description",
        content:
          "ArcPay Agent command center: full-screen cyberpunk terminal. Run help, status, agents, services, payments, balance, discover, execute, network, clear with animated typing.",
      },
      { property: "og:title", content: "Command Center — ArcPay Agent Terminal" },
      { property: "og:description", content: "APA://TERMINAL · cyberpunk command interface." },
      { property: "og:url", content: "/terminal" },
    ],
    links: [{ rel: "canonical", href: "/terminal" }],
  }),
  component: CommandCenter,
});

/* ──────────────────────────────────────────────────────────────────────── */
/* TYPES & SHARED HELPERS                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

type OutputKind =
  | "prompt"
  | "echo"
  | "system"
  | "text"
  | "success"
  | "warn"
  | "error"
  | "accent"
  | "primary"
  | "cyan"
  | "muted"
  | "divider";

type TermLine =
  | { kind: OutputKind; text: string; ts: number }
  | { kind: "blank"; ts: number };

function line(kind: OutputKind, text: string): TermLine {
  return { kind, text, ts: Date.now() + Math.random() };
}
const blank = (): TermLine => ({ kind: "blank", ts: Date.now() + Math.random() });

const now = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ──────────────────────────────────────────────────────────────────────── */
/* STYLES                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

const styleLineClass: Record<TermLine["kind"], string> = {
  prompt: "text-cyan",
  echo: "text-cyan font-semibold",
  system: "text-muted-foreground",
  text: "text-slate-200",
  success: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
  accent: "text-primary",
  cyan: "text-cyan",
  muted: "text-slate-400",
  divider: "text-cyan/50",
  blank: "text-transparent",
} as Record<string, string>;

const GRID =
  "grid grid-cols-[minmax(180px,1fr)_minmax(0,3fr)_minmax(220px,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] min-h-[100dvh] w-full bg-black text-[12px] leading-[1.55] font-mono";
const PANEL =
  "relative overflow-hidden border border-cyan-800/60 bg-black/80 backdrop-blur-sm";
const PANEL_HEAD =
  "flex items-center justify-between gap-2 border-b border-cyan-800/60 bg-cyan-900/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan/80";

/* ──────────────────────────────────────────────────────────────────────── */
/* ANIMATED TYPING HOOK                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function useTypewriter(
  lines: TermLine[],
  setLines: (updater: (prev: TermLine[]) => TermLine[]) => void,
) {
  const queueRef = useRef<Array<{ charDelay: number; group: TermLine[] }>>([]);
  const busyRef = useRef(false);

  const pushTyped = (blocks: Array<{ lines: TermLine[]; charDelay?: number; groupDelay?: number }>) => {
    blocks.forEach((b, i) => {
      queueRef.current.push({
        charDelay: b.charDelay ?? 12,
        group: b.lines,
      });
      // add synthetic blank delay between groups only if not the last one
      if (i < blocks.length - 1 && b.groupDelay && b.groupDelay > 0) {
        queueRef.current.push({ charDelay: -b.groupDelay, group: [] });
      }
    });
    drainNext();
  };

  const drainNext = () => {
    if (busyRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    if (next.charDelay < 0) {
      // pause marker
      busyRef.current = true;
      window.setTimeout(() => {
        busyRef.current = false;
        drainNext();
      }, Math.abs(next.charDelay));
      return;
    }
    busyRef.current = true;
    const { charDelay, group } = next;
    let lineIdx = 0;
    let charIdx = 0;
    const tick = () => {
      const l = group[lineIdx];
      if (!l) {
        busyRef.current = false;
        window.setTimeout(drainNext, 40);
        return;
      }
      if (l.kind === "blank") {
        setLines((prev) => [...prev, l]);
        lineIdx++;
        charIdx = 0;
        window.setTimeout(tick, 20);
        return;
      }
      if (charIdx === 0) {
        // insert empty placeholder line to be filled char-by-char
        setLines((prev) => [...prev, { ...l, text: "" }]);
        charIdx = 1;
        window.setTimeout(tick, charDelay);
        return;
      }
      // append up to 3 chars at once for speed, but divider lines render instantly
      setLines((prev) => {
        const copy = prev.slice();
        const tail = copy[copy.length - 1];
        if (!tail || tail.kind === "blank") return prev;
        const target = l.text;
        const chunk = l.kind === "divider" ? target.length : Math.min(3, target.length - charIdx + 1);
        const newText = target.slice(0, charIdx - 1 + chunk);
        copy[copy.length - 1] = { ...tail, text: newText };
        return copy;
      });
      charIdx += l.kind === "divider" ? l.text.length : 3;
      if (charIdx > l.text.length) {
        lineIdx++;
        charIdx = 0;
        window.setTimeout(tick, 25);
      } else {
        window.setTimeout(tick, charDelay);
      }
    };
    tick();
  };

  return { pushTyped };
}

/* ──────────────────────────────────────────────────────────────────────── */
/* COMMAND STATE                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

type ExecFlow = {
  serviceId: string;
  step: "requested" | "authorized" | "confirmed";
  amount: number;
};

/* ──────────────────────────────────────────────────────────────────────── */
/* UI: TOP BAR                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function TopBar({
  agentStatus,
  address,
  balance,
  mode,
}: {
  agentStatus: AgentStatusValue;
  address: string | null;
  balance: number;
  mode: string;
}) {
  return (
    <header
      className={cn(
        "col-span-full relative z-10 flex items-center justify-between gap-3 border-b border-cyan-800/70 bg-gradient-to-r from-black via-cyan-950/30 to-black px-3 py-2",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(34,211,238,0.18) 0, rgba(34,211,238,0.18) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden />
      <div className="relative flex min-w-0 items-center gap-3">
        <div className="hud-corners flex items-center gap-2 border border-cyan-700/50 bg-black/60 px-2 py-1">
          <BrandLogo size={22} />
          <span className="text-[12px] font-semibold tracking-[0.25em] text-cyan shadow-[0_0_12px_rgba(34,211,238,0.35)]">
            APA://TERMINAL
          </span>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 text-[10px] tracking-[0.18em]">
        <Chip label="NETWORK" value={projectConfig.NETWORK} tone="cyan" pulse />
        <Chip label="ASSET" value={projectConfig.PAYMENT_ASSET} tone="primary" />
        <Chip label="AGENT" value={agentStatus} tone={agentTone(agentStatus)} pulse />
        <Chip
          label="WALLET"
          value={address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "DISCONNECTED"}
          tone={address ? "success" : "warn"}
        />
        <Chip label="BALANCE" value={`${balance.toFixed(4)} ${projectConfig.PAYMENT_ASSET}`} tone="accent" />
        <Chip label="MODE" value={mode} tone="muted" />
      </div>
    </header>
  );
}

function agentTone(s: AgentStatusValue): "success" | "warn" | "accent" | "muted" {
  switch (s) {
    case "ONLINE":
      return "success";
    case "BUSY":
      return "accent";
    case "IDLE":
      return "warn";
    case "OFFLINE":
    default:
      return "muted";
  }
}

function Chip({
  label,
  value,
  tone = "cyan",
  pulse,
}: {
  label: string;
  value: string;
  tone?: "cyan" | "primary" | "success" | "warn" | "accent" | "muted";
  pulse?: boolean;
}) {
  const toneCls: Record<string, string> = {
    cyan: "text-cyan shadow-[0_0_10px_-2px_rgba(34,211,238,0.5)]",
    primary: "text-primary shadow-[0_0_10px_-2px_rgba(168,85,247,0.5)]",
    success: "text-emerald-400 shadow-[0_0_10px_-2px_rgba(52,211,153,0.45)]",
    warn: "text-amber-400 shadow-[0_0_10px_-2px_rgba(251,191,36,0.45)]",
    accent: "text-accent shadow-[0_0_10px_-2px_rgba(56,189,248,0.45)]",
    muted: "text-slate-400",
  };
  return (
    <div className="flex items-center gap-2 border border-cyan-800/60 bg-black/70 px-2 py-1 hud-corners">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5">
        {pulse ? <StatusIndicator tone={toneToIndicator(tone)} pulse={false} /> : null}
        <span className={cn("font-semibold", toneCls[tone])}>{value}</span>
      </div>
    </div>
  );
}
function toneToIndicator(tone: string): "online" | "info" | "busy" | "idle" | "offline" {
  switch (tone) {
    case "success":
      return "online";
    case "cyan":
    case "primary":
      return "info";
    case "accent":
      return "busy";
    case "warn":
      return "idle";
    default:
      return "offline";
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/* UI: LEFT — AGENT LIST                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

function AgentListPanel({
  agents,
  selected,
  onSelect,
}: {
  agents: Agent[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className={cn(PANEL, "row-span-1")}>
      <div className={PANEL_HEAD}>
        <span>// AGENT LIST</span>
        <span className="text-cyan/60">{String(agents.length).padStart(2, "0")}</span>
      </div>
      <ul className="relative h-full max-h-[calc(100dvh-190px)] overflow-y-auto pr-1">
        {agents.length === 0 ? (
          <li className="px-3 py-8 text-center text-[11px] tracking-[0.18em] text-slate-500">
            NO AGENTS REGISTERED
          </li>
        ) : (
          agents.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => onSelect(a.id)}
                className={cn(
                  "group grid w-full gap-1 border-b border-cyan-900/50 px-3 py-3 text-left transition-colors",
                  selected === a.id
                    ? "bg-cyan-500/10 border-l-2 border-l-cyan-400"
                    : "hover:bg-cyan-950/40 border-l-2 border-l-transparent",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold tracking-[0.16em] text-cyan">
                    {a.name.toUpperCase()}
                  </span>
                  <StatusIndicator
                    tone={agentTone(a.status) === "success" ? "online" : agentTone(a.status) === "warn" ? "idle" : agentTone(a.status) === "accent" ? "busy" : "offline"}
                  />
                </div>
                <div className="truncate font-mono text-[10px] text-slate-500">{a.id}</div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>{a.capabilities.slice(0, 2).join(" · ") || "—"}</span>
                  <span className="tabular-nums text-emerald-400/90">{a.balance.toFixed(2)}</span>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* UI: RIGHT — AGENT STATE                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function AgentStatePanel({
  agent,
  exec,
}: {
  agent: Agent | null;
  exec: ExecFlow | null;
}) {
  return (
    <aside className={cn(PANEL, "row-span-1")}>
      <div className={PANEL_HEAD}>
        <span>// AGENT STATE</span>
        <span className="text-cyan/60">{agent ? "ACTIVE" : "IDLE"}</span>
      </div>
      <div className="relative h-full max-h-[calc(100dvh-190px)] space-y-4 overflow-y-auto px-3 py-3">
        {!agent ? (
          <div className="space-y-2 text-[11px] tracking-[0.18em] text-slate-500">
            <div>SELECT AN AGENT.</div>
            <div className="text-slate-600">OR RUN `agents` IN TERMINAL.</div>
          </div>
        ) : (
          <>
            <Kv label="ID" value={agent.id} tone="cyan" />
            <Kv label="STATUS" value={agent.status} tone={agentTone(agent.status)} />
            <Kv label="TYPE" value={agent.type} tone="muted" />
            <Kv label="WALLET" value={agent.wallet ? `${agent.wallet.slice(0, 8)}…${agent.wallet.slice(-6)}` : "UNSET"} tone="primary" />
            <Kv label="BALANCE" value={`${agent.balance.toFixed(4)} ${projectConfig.PAYMENT_ASSET}`} tone="success" />
            <Kv label="SPENT TODAY" value={`${agent.payments.reduce((s, p) => s + (p.status === "SETTLED" ? p.amount : 0), 0).toFixed(4)}`} tone="warn" />
            <Kv
              label="DAILY LIMIT"
              value={`${agent.policy.maxDailySpend.toFixed(2)}`}
              tone="muted"
            />
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">// CAPABILITIES</div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.length === 0 ? (
                  <span className="text-[10px] text-slate-600">—</span>
                ) : (
                  agent.capabilities.slice(0, 6).map((c) => (
                    <span
                      key={c}
                      className="border border-cyan-700/60 bg-cyan-950/20 px-1.5 py-0.5 text-[10px] text-cyan/90"
                    >
                      {c}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">// PURPOSE</div>
              <p className="text-[11px] leading-5 text-slate-400">{agent.purpose}</p>
            </div>
          </>
        )}

        {exec ? (
          <div className="border-t border-cyan-800/60 pt-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-primary">
              // PENDING EXECUTION
            </div>
            <Kv label="SERVICE" value={exec.serviceId} tone="accent" />
            <Kv label="AMOUNT" value={`${exec.amount.toFixed(4)} ${projectConfig.PAYMENT_ASSET}`} tone="warn" />
            <Kv
              label="STEP"
              value={
                exec.step === "requested"
                  ? "402 WAITING AUTH"
                  : exec.step === "authorized"
                  ? "AUTHORIZED WAIT CONFIRM"
                  : "COMPLETE"
              }
              tone={exec.step === "confirmed" ? "success" : "cyan"}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Kv({ label, value, tone = "muted" }: { label: string; value: string; tone?: "cyan" | "primary" | "success" | "warn" | "accent" | "muted" }) {
  const toneCls: Record<string, string> = {
    cyan: "text-cyan",
    primary: "text-primary",
    success: "text-emerald-400",
    warn: "text-amber-400",
    accent: "text-accent",
    muted: "text-slate-300",
  };
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] items-start gap-2 border-b border-cyan-900/40 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">// {label}</div>
      <div className={cn("truncate font-semibold tabular-nums", toneCls[tone] ?? toneCls["muted"])}>{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* UI: BOTTOM — PAYMENT STREAM                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function PaymentStreamPanel({ payments }: { payments: Array<{ id: string; amount: number; status: string; requestedAt?: string; asset: string; payer?: string; payee?: string }> }) {
  const recent = useMemo(() => payments.slice(-8).reverse(), [payments]);
  return (
    <section className={cn(PANEL, "col-span-full")}>
      <div className={PANEL_HEAD}>
        <span>// PAYMENT STREAM</span>
        <span className="text-cyan/60">{String(payments.length).padStart(3, "0")} RECORDS</span>
      </div>
      <div className="relative max-h-[180px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(34,211,238,0.18) 0, rgba(34,211,238,0.18) 1px, transparent 1px, transparent 8px)",
          }}
          aria-hidden />
        {recent.length === 0 ? (
          <div className="relative px-3 py-6 text-center text-[11px] tracking-[0.22em] text-slate-500">
            — NO PAYMENTS RECORDED —
          </div>
        ) : (
          <div className="relative grid grid-cols-[110px_minmax(0,1.1fr)_minmax(0,1.1fr)_120px_110px] gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 border-b border-cyan-900/50">
            <span>TIME</span>
            <span>PAYER</span>
            <span>PAYEE</span>
            <span className="text-right">AMOUNT</span>
            <span className="text-right">STATUS</span>
          </div>
        )}
        <ul className="relative">
          {recent.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "grid grid-cols-[110px_minmax(0,1.1fr)_minmax(0,1.1fr)_120px_110px] gap-3 items-center border-b border-cyan-900/30 px-3 py-2",
                i === 0 ? "bg-cyan-500/[0.04]" : "",
              )}
            >
              <span className="text-slate-500 tabular-nums text-[11px]">
                {p.requestedAt ?? now()}
              </span>
              <span className="truncate font-mono text-[11px] text-slate-300">
                {p.payer ? `${p.payer.slice(0, 8)}…${p.payer.slice(-6)}` : "0x0000…AGENT"}
              </span>
              <span className="truncate font-mono text-[11px] text-slate-300">
                {p.payee ? `${p.payee.slice(0, 8)}…${p.payee.slice(-6)}` : "SERVICE_WALLET"}
              </span>
              <span className="text-right tabular-nums text-[11px] text-cyan">
                {p.amount.toFixed(4)} <span className="text-slate-500">{p.asset}</span>
              </span>
              <span className={cn("text-right text-[10px] tracking-[0.16em]",
                p.status === "SETTLED"
                  ? "text-emerald-400"
                  : p.status === "AUTHORIZED"
                  ? "text-amber-400"
                  : p.status === "BROADCAST"
                  ? "text-primary"
                  : "text-slate-500",
              )}>
                {p.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* MAIN COMMAND CENTER                                                      */
/* ──────────────────────────────────────────────────────────────────────── */

function CommandCenter() {
  /* DATA HOOKS */
  const { data: AGENTS } = useAgents();
  const { data: SERVICES } = useServices();
  const { data: PAYMENTS } = usePayments();
  const { data: ACTIVITY } = useActivityFeed();
  const wallet = useWallet();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(AGENTS[0]?.id ?? null);
  const selectedAgent = useMemo<Agent | null>(
    () => AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0] ?? null,
    [AGENTS, selectedAgentId],
  );
  useEffect(() => {
    if (!selectedAgentId && AGENTS[0]) setSelectedAgentId(AGENTS[0].id);
  }, [AGENTS, selectedAgentId]);

  const walletReallyConnected = wallet.connected && !wallet.simulated;
  const modeLabel = walletReallyConnected ? "LIVE" : projectConfig.DATA_MODE;
  const walletBalance = walletReallyConnected
    ? Number(wallet.usdcBalance)
    : selectedAgent?.balance ?? 0;
  const agentStatus: AgentStatusValue = selectedAgent?.status ?? "OFFLINE";

  /* TERMINAL LINES */
  const [lines, setLines] = useState<TermLine[]>(() => buildBanner(AGENTS.length, SERVICES.length, wallet.address));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number>(-1);
  const [exec, setExec] = useState<ExecFlow | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { pushTyped } = useTypewriter(lines, setLines);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  /* ──────────────── COMMAND HANDLERS ──────────────── */

  const commandHandler = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setHistory((h) => [trimmed, ...h].slice(0, 50));
    setHistIdx(-1);
    setValue("");

    const [cmdRaw, ...args] = trimmed.split(/\s+/);
    const cmd = cmdRaw!.toLowerCase();

    // echo the prompt first, instant
    setLines((prev) => [...prev, line("prompt", `APA://terminal`), line("echo", `> ${trimmed}`), blank()]);

    switch (cmd) {
      case "help":
        return helpCmd();
      case "status":
        return statusCmd(walletReallyConnected, AGENTS.length, SERVICES.length, PAYMENTS.length, modeLabel, selectedAgent);
      case "agents":
        return agentsCmd(AGENTS);
      case "services":
        return servicesCmd(SERVICES);
      case "payments":
        return paymentsCmd(PAYMENTS as Array<{id: string; amount: number; status: string; requestedAt?: string; asset: string; serviceId?: string; agentId?: string}>);
      case "balance":
        return balanceCmd(selectedAgent, wallet, walletBalance);
      case "discover":
        return discoverCmd(SERVICES);
      case "execute": {
        const id = args.join(" ").trim().toLowerCase() || "";
        return executeCmd(id, SERVICES, (flow) => setExec(flow));
      }
      case "authorize":
        return authorizeCmd(exec, (next) => setExec(next));
      case "confirm":
        return confirmCmd(exec, (next) => setExec(next), ACTIVITY.length);
      case "network":
        return networkCmd(wallet);
      case "clear":
        return clearCmd(() => setLines([]));
      case "about":
      case "banner":
        return bannerCmd(AGENTS.length, SERVICES.length, wallet.address);
      default:
        return unknownCmd(cmd);
    }
  };

  const helpCmd = () => {
    pushTyped([
      { lines: [line("cyan", "ARCPAY AGENT — COMMAND REFERENCE")], charDelay: 10 },
      { lines: [line("divider", "─────────────────────────────────────────────")], charDelay: 5, groupDelay: 120 },
      { lines: [
        line("text",  "help         Show this reference"),
        line("text",  "status       Runtime, network & settlement status"),
        line("text",  "agents       List registered autonomous agents"),
        line("text",  "services     List priced service endpoints"),
        line("text",  "payments     Recent USDC payment stream"),
        line("text",  "balance      Agent / wallet USDC balance"),
        line("text",  "discover     Run service discovery (402-compatible)"),
        line("text",  "execute <id> Request a service → triggers 402 flow"),
        line("text",  "  authorize  Approve payment policy (after 402)"),
        line("text",  "  confirm    Broadcast settlement & fetch payload"),
        line("text",  "network      ARC network & RPC details"),
        line("text",  "clear        Wipe the session buffer"),
      ], charDelay: 4, groupDelay: 80 },
      { lines: [blank(), line("muted", "Tip: arrow ↑/↓ cycles command history.")], charDelay: 8 },
    ]);
  };

  const statusCmd = (connected: boolean, nAgents: number, nSvc: number, nPay: number, mode: string, a: Agent | null) => {
    pushTyped([
      { lines: [line("primary", "SYSTEM")], charDelay: 20 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [
        kv("NETWORK",      projectConfig.NETWORK, "cyan"),
        kv("ASSET",        projectConfig.PAYMENT_ASSET, "primary"),
        kv("AGENT ENGINE", a?.status ?? "IDLE", (a?.status === "ONLINE" ? "success" : "warn") as any),
        kv("DISCOVERY",    nSvc > 0 ? "ONLINE" : "STANDBY", nSvc > 0 ? "success" : "muted"),
        kv("PAYMENT",      connected ? "LIVE WALLET" : "READY", connected ? "success" : "cyan"),
        kv("MODE",         mode, "muted"),
      ], charDelay: 10, groupDelay: 60 },
      { lines: [blank(), line("muted", `Registered: ${nAgents} agents · ${nSvc} services · ${nPay} payments`)], charDelay: 8 },
    ]);
  };

  const agentsCmd = (agents: Agent[]) => {
    const rows = agents.length === 0
      ? [line("warn", "NO AGENTS REGISTERED.")]
      : agents.map((a, i) =>
          line(
            "text",
            `${String(i + 1).padStart(2, "0")} ${a.status.padEnd(7, " ")} ${a.name.padEnd(18, " ").slice(0, 18)} ${a.balance.toFixed(4).padStart(10, " ")} ${projectConfig.PAYMENT_ASSET}  ${a.capabilities.slice(0, 2).join(",") || "—"}`,
          ),
        );
    pushTyped([
      { lines: [line("accent", "REGISTERED AGENTS")], charDelay: 18 },
      { lines: [line("divider", "────────────────────────────────────────────────────")], charDelay: 4 },
      { lines: [line("muted", "#  STATUS  NAME                  BALANCE        CAPS")], charDelay: 6, groupDelay: 100 },
      { lines: rows, charDelay: 5, groupDelay: 80 },
    ]);
  };

  const servicesCmd = (services: Service[]) => {
    const rows = services.length === 0
      ? [line("warn", "NO SERVICES LISTED.")]
      : services.map((s, i) => {
          const id = s.id.padEnd(18, " ").slice(0, 18);
          const cat = s.category.padEnd(12, " ").slice(0, 12);
          const price = `${s.price.toFixed(4)}`.padStart(8, " ");
          const status = s.status.padEnd(9, " ").slice(0, 9);
          return line(
            s.status === "AVAILABLE" ? "text" : "muted",
            `${String(i + 1).padStart(2, "0")} ${id} ${cat} ${price} ${status}  ${s.provider}`,
          );
        });
    pushTyped([
      { lines: [line("cyan", "PRICED SERVICE ENDPOINTS")], charDelay: 18 },
      { lines: [line("divider", "─────────────────────────────────────────────────────────────────")], charDelay: 4 },
      { lines: [line("muted", "#  ID                 CATEGORY     PRICE   STATUS   PROVIDER")], charDelay: 6, groupDelay: 100 },
      { lines: rows, charDelay: 5, groupDelay: 80 },
      { lines: [blank(), line("muted", `Run: execute <id>    e.g. execute ${services[0]?.id ?? "market-data"}`)], charDelay: 8 },
    ]);
  };

  const paymentsCmd = (payments: Array<{id: string; amount: number; status: string; requestedAt?: string; asset: string; serviceId?: string; agentId?: string}>) => {
    const rows = payments.length === 0
      ? [line("warn", "NO PAYMENTS LOGGED YET.")]
      : payments.slice(-8).reverse().map((p, i) => {
          const id = (p.id.slice(0, 8) + "…").padEnd(9, " ");
          const svc = (p.serviceId ?? p.agentId ?? "—").padEnd(16, " ").slice(0, 16);
          const amt = `${p.amount.toFixed(4)} ${p.asset ?? projectConfig.PAYMENT_ASSET}`.padStart(18, " ");
          return line("text", `${String(i + 1).padStart(2, "0")} ${id} ${svc}${amt}  ${p.status}`);
        });
    pushTyped([
      { lines: [line("success", "PAYMENT LOG")], charDelay: 18 },
      { lines: [line("divider", "────────────────────────────────────────────────────────")], charDelay: 4 },
      { lines: [line("muted", "#  TX        SERVICE         AMOUNT               STATUS")], charDelay: 6, groupDelay: 100 },
      { lines: rows, charDelay: 6, groupDelay: 80 },
    ]);
  };

  const balanceCmd = (agent: Agent | null, w: ReturnType<typeof useWallet>, wb: number) => {
    const reallyLive = w.connected && !w.simulated;
    const agentLine = agent
      ? kv("AGENT BALANCE", `${agent.balance.toFixed(6)} ${projectConfig.PAYMENT_ASSET}`, "cyan")
      : kv("AGENT BALANCE", "NO AGENT SELECTED", "warn");
    pushTyped([
      { lines: [line("primary", "BALANCE")], charDelay: 18 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [agentLine], charDelay: 10, groupDelay: 60 },
      { lines: [
        reallyLive
          ? kv("WALLET LIVE", `${wb.toFixed(6)} ${projectConfig.PAYMENT_ASSET}`, "success")
          : kv("WALLET LIVE", "DISCONNECTED — using agent simulated balance", "warn"),
        kv("WALLET ADDR", w.address ? `${w.address.slice(0,10)}…${w.address.slice(-8)}` : "—", "muted"),
        kv("NETWORK",     projectConfig.NETWORK, "cyan"),
      ], charDelay: 9, groupDelay: 60 },
    ]);
  };

  const discoverCmd = (services: Service[]) => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    pushTyped([
      { lines: [line("accent", "SEARCHING AGENT SERVICES...")], charDelay: 18 },
      { lines: [blank()], charDelay: 0, groupDelay: 260 },
      { lines: [line("success", `FOUND ${String(services.length).padStart(2, "0")} CATEGORIES / ${String(cats.length).padStart(2, "0")} CLASSES`)], charDelay: 12 },
      { lines: [line("divider", "────────────────────────────────────────")], charDelay: 4 },
      { lines: cats.slice(0, 8).map((c, i) => {
          const inCat = services.filter((s) => s.category === c);
          return line("text", `${String(i + 1).padStart(2, "0")} ${c.toUpperCase().padEnd(16, " ").slice(0, 16)} ${String(inCat.length).padStart(2, "0")} ENDPOINTS`);
        }), charDelay: 8, groupDelay: 80 },
      { lines: [blank(), line("muted", "Next: execute <service-id>  to trigger 402 PAYMENT REQUIRED flow")], charDelay: 9 },
    ]);
  };

  const executeCmd = (
    id: string,
    services: Service[],
    setExecCb: (f: ExecFlow | null) => void,
  ) => {
    if (!id) {
      pushTyped([
        { lines: [line("warn", "USAGE: execute <service-id>")], charDelay: 10 },
        { lines: [line("muted", `e.g. execute ${services[0]?.id ?? "gpt4o"} · run 'services' to list`)], charDelay: 8 },
      ]);
      return;
    }
    const match = services.find((s) => s.id.toLowerCase() === id.toLowerCase()) ??
      services.find((s) => s.id.toLowerCase().includes(id.toLowerCase()));
    if (!match) {
      pushTyped([{ lines: [
        line("error", `SERVICE '${id}' NOT FOUND.`),
        line("muted", "Run 'services' to list available service identifiers."),
      ], charDelay: 12 }]);
      return;
    }
    setExecCb({ serviceId: match.id, step: "requested", amount: match.price });
    pushTyped([
      { lines: [line("accent", `REQUESTING SERVICE <${match.id.toUpperCase()}>.`)], charDelay: 16 },
      { lines: [line("muted", `POST ${match.endpoint}`)], charDelay: 8, groupDelay: 320 },
      { lines: [blank(), line("warn", "402 PAYMENT REQUIRED")], charDelay: 25 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [
        kv("SERVICE", `${match.name}`, "cyan"),
        kv("CATEGORY", match.category, "primary"),
        kv("PROVIDER", match.provider, "muted"),
        kv("AMOUNT",   `${match.price.toFixed(6)} ${projectConfig.PAYMENT_ASSET}`, "warn"),
        kv("NETWORK",  projectConfig.NETWORK, "cyan"),
      ], charDelay: 12, groupDelay: 70 },
      { lines: [blank(), line("muted", "Run: authorize   → approve policy check")], charDelay: 8 },
      { lines: [line("muted", "     confirm     → settle & consume payload")], charDelay: 8 },
    ]);
  };

  const authorizeCmd = (cur: ExecFlow | null, setExecCb: (f: ExecFlow | null) => void) => {
    if (!cur) {
      pushTyped([{ lines: [line("warn", "NO PENDING EXECUTION."), line("muted", "Run: execute <service-id> first.")], charDelay: 12 }]);
      return;
    }
    if (cur.step !== "requested") {
      pushTyped([{ lines: [line("warn", `ALREADY ${cur.step.toUpperCase()}.`), line("muted", "Run: confirm to complete.")], charDelay: 10 }]);
      return;
    }
    setExecCb({ ...cur, step: "authorized" });
    pushTyped([
      { lines: [line("primary", "EVALUATING PAYMENT POLICY...")], charDelay: 18, groupDelay: 280 },
      { lines: [line("success", "PAYMENT POLICY: APPROVED")], charDelay: 20 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [
        kv("AMOUNT:", `${cur.amount.toFixed(6)} ${projectConfig.PAYMENT_ASSET}`, "primary"),
        kv("NETWORK:", projectConfig.NETWORK, "cyan"),
        kv("SPEND OK", "WITHIN DAILY LIMIT", "success"),
      ], charDelay: 12, groupDelay: 70 },
      { lines: [blank(), line("muted", "Run: confirm   to finalize settlement and receive payload.")], charDelay: 8 },
    ]);
  };

  const confirmCmd = (cur: ExecFlow | null, setExecCb: (f: ExecFlow | null) => void, nActivity: number) => {
    if (!cur) {
      pushTyped([{ lines: [line("warn", "NO PENDING EXECUTION."), line("muted", "Run: execute <service-id> first.")], charDelay: 12 }]);
      return;
    }
    if (cur.step === "requested") {
      pushTyped([{ lines: [line("error", "MUST AUTHORIZE FIRST."), line("muted", "Run: authorize   before  confirm.")], charDelay: 12 }]);
      return;
    }
    if (cur.step === "confirmed") {
      pushTyped([{ lines: [line("warn", "ALREADY CONFIRMED.")], charDelay: 10 }]);
      return;
    }
    setExecCb({ ...cur, step: "confirmed" });
    const nonce = `APA-${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, "0")}-${nActivity + 1}`;
    const txHash = `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}…`;
    pushTyped([
      { lines: [line("accent", "SIGNING PAYMENT AUTHORIZATION...")], charDelay: 18, groupDelay: 260 },
      { lines: [line("success", "PAYMENT VERIFIED")], charDelay: 20 },
      { lines: [line("muted", `NONCE ${nonce}`)], charDelay: 6, groupDelay: 140 },
      { lines: [line("primary", "BROADCASTING TO ARC SETTLEMENT LAYER...")], charDelay: 16, groupDelay: 320 },
      { lines: [line("cyan", `TX: ${txHash}`)], charDelay: 10, groupDelay: 180 },
      { lines: [blank(), line("success", "SERVICE RESPONSE RECEIVED")], charDelay: 22 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [
        line("text",    `SERVICE    :: ${cur.serviceId.toUpperCase()}`),
        line("text",    `STATUS     :: 200 OK`),
        line("text",    `LATENCY    :: 248ms`),
        line("muted",   `PAYLOAD    :: (opaque bytes — delivered to agent runtime)`),
        blank(),
        line("success", "TASK COMPLETE"),
      ], charDelay: 9, groupDelay: 70 },
    ]);
  };

  const networkCmd = (w: ReturnType<typeof useWallet>) => {
    const reallyLive = w.connected && !w.simulated;
    pushTyped([
      { lines: [line("cyan", "ARC NETWORK")], charDelay: 18 },
      { lines: [line("divider", "────────────────────────────────")], charDelay: 4 },
      { lines: [
        kv("MAINNET CHAIN",   "5042 (0x13B2)", "primary"),
        kv("MAINNET RPC",     reallyLive ? "CONNECTED" : "CACHED", reallyLive ? "success" : "cyan"),
        kv("TESTNET CHAIN",   "5042002", "muted"),
        kv("ASSET",           `${projectConfig.PAYMENT_ASSET} · 6 decimals`, "primary"),
        kv("GAS MODEL",       "USDC-NATIVE", "warn"),
        kv("EXPLORER",        "arc-scan.org", "cyan"),
      ], charDelay: 11, groupDelay: 70 },
      { lines: [blank(), line("muted", "Connect wallet for live RPC, balance, and signing capability.")], charDelay: 8 },
    ]);
  };

  const clearCmd = (wipe: () => void) => {
    wipe();
  };

  const unknownCmd = (cmd: string) => {
    pushTyped([
      { lines: [line("error", `COMMAND NOT FOUND: '${cmd}'`)], charDelay: 14 },
      { lines: [line("muted", "Run: help   to list valid commands.")], charDelay: 8 },
    ]);
  };

  const bannerCmd = (nA: number, nS: number, addr: string | null) => {
    setLines(buildBanner(nA, nS, addr));
  };

  /* ──────────────── FORM ──────────────── */

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commandHandler(value);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(histIdx + 1, history.length - 1);
      if (n >= 0) {
        setHistIdx(n);
        setValue(history[n] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = histIdx - 1;
      setHistIdx(n);
      setValue(n >= 0 ? history[n] ?? "" : "");
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setLines([]);
    }
  };

  /* ──────────────── RENDER ──────────────── */

  return (
    <div className="relative overflow-hidden bg-black text-slate-100">
      {/* CRT background texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 10%, rgba(34,211,238,0.25), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(168,85,247,0.22), transparent 55%)",
        }}
        aria-hidden />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(34,211,238,0.25) 0, rgba(34,211,238,0.25) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden />
      {/* subtle vignette */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
        }}
        aria-hidden />

      <div className={cn(GRID, "relative z-10")}>
        <TopBar
          agentStatus={agentStatus}
          address={walletReallyConnected ? wallet.address : null}
          balance={walletBalance}
          mode={modeLabel}
        />

        <AgentListPanel
          agents={AGENTS}
          selected={selectedAgent?.id ?? null}
          onSelect={setSelectedAgentId}
        />

        {/* CENTER — LIVE TERMINAL */}
        <section className={cn(PANEL, "flex flex-col")}>
          <div className={PANEL_HEAD}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex shrink-0 gap-1">
                <i className="block h-[6px] w-[6px] rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <i className="block h-[6px] w-[6px] rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.55)]" />
                <i className="block h-[6px] w-[6px] rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
              </span>
              <span className="truncate text-cyan/80">SESSION-01 · APA://TERMINAL · TTY</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-slate-500">{String(lines.length).padStart(4, "0")} LINES</span>
              <StatusIndicator tone={walletReallyConnected ? "online" : "info"} pulse={false} />
              <span className="text-cyan/80">{walletReallyConnected ? "WALLET LIVE" : "SIM"}</span>
            </div>
          </div>

          <div
            ref={bodyRef}
            onClick={() => inputRef.current?.focus()}
            className="relative flex-1 min-h-0 cursor-text overflow-y-auto px-3 py-3"
          >
            {/* animated scan */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-cyan-400/10 to-transparent animate-scan" />

            <div className="space-y-0.5">
              {lines.map((l, i) =>
                l.kind === "blank" ? (
                  <div key={i} className="h-3" />
                ) : (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      styleLineClass[l.kind],
                      l.kind === "echo" ? "pl-2 border-l border-cyan-700/60" : "",
                    )}
                  >
                    {l.text}
                    {i === lines.length - 1 ? null : null}
                  </div>
                ),
              )}
              {/* Blinking caret after last line */}
              <div className="text-cyan">
                <span className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-[2px] bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-caret" />
              </div>
            </div>
          </div>

          {/* Command input */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-cyan-800/70 bg-black/60 px-3 py-2"
          >
            <span className="shrink-0 font-mono text-[12px] font-semibold text-cyan tracking-wide">
              APA://terminal<span className="text-cyan/70">$</span>
            </span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="type 'help' or a command..."
              aria-label="Terminal command input"
              className="min-w-0 flex-1 border-0 bg-transparent px-2 py-1 font-mono text-[12px] text-slate-100 outline-none placeholder:text-slate-600 focus:ring-0"
              style={{ caretColor: "transparent" }}
            />
            <span className="text-cyan/70">⟩</span>
          </form>
        </section>

        <AgentStatePanel agent={selectedAgent} exec={exec} />

        <PaymentStreamPanel
          payments={PAYMENTS as Array<{id: string; amount: number; status: string; requestedAt?: string; asset: string; payer?: string; payee?: string}>}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* SHARED UTILS                                                             */
/* ──────────────────────────────────────────────────────────────────────── */

function kv(k: string, v: string, tone: "cyan" | "success" | "warn" | "primary" | "muted" = "muted"): TermLine {
  const toneCls: Record<string, OutputKind> = {
    cyan: "cyan",
    success: "success",
    warn: "warn",
    primary: "accent",
    muted: "text",
  };
  return {
    kind: "text",
    text: `${k.padEnd(14, " ")} ${v}`,
    ts: Date.now() + Math.random(),
  } as TermLine;
}

function buildBanner(nAgents: number, nSvc: number, addr: string | null): TermLine[] {
  const t = now();
  const rows: TermLine[] = [];
  rows.push(line("cyan",    "   _    ____    _    "));
  rows.push(line("cyan",    "  /_\\  |  _ \\  /_\\   "));
  rows.push(line("primary", " //_\\\\ | |_) |//_\\\\  "));
  rows.push(line("primary", "/  _  \\|  __//  _  \\ "));
  rows.push(line("accent",  "\\_/ \\_/|_|  \\_/ \\_/ "));
  rows.push(line("accent",  "    _    ____ _____ _   _ _____ "));
  rows.push(line("accent",  "   / \\  / ___| ____| \\ | |_   _|"));
  rows.push(line("primary", "  / _ \\| |  _|  _| |  \\| | | |  "));
  rows.push(line("primary", " / ___ \\ |_| | |___| |\\  | | |  "));
  rows.push(line("cyan",    "/_/   \\_\\____|_____|_| \\_| |_|  "));
  rows.push(blank());
  rows.push(line("accent",  "  APA AGENT :: ARCPAY AGENT COMMAND CENTER"));
  rows.push(line("muted",   `  SESSION ${t}  ·  AGENTS ${String(nAgents).padStart(2, "0")}  ·  SERVICES ${String(nSvc).padStart(2, "0")}  ·  WALLET ${addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "SIMULATION"}`));
  rows.push(line("divider", "────────────────────────────────────────────────────────────────────────"));
  rows.push(line("text",    '  "Agents transact. ArcPay settles."'));
  rows.push(blank());
  rows.push(line("muted",   "  Type  help  to list available commands."));
  rows.push(line("muted",   "  Quick sequence  →  status → discover → execute <id> → authorize → confirm"));
  rows.push(blank());
  return rows;
}
