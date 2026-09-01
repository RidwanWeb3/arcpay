import { cn } from "@/lib/utils";
import { AGENT_STATES, type AgentState, type RuntimeSnapshot } from "@/lib/runtime/types";
import { CyberCard, StatusIndicator } from "./primitives";

const stateTone: Record<AgentState, string> = {
  IDLE: "text-muted-foreground",
  DISCOVERING: "text-cyan",
  ANALYZING: "text-cyan",
  AUTHORIZING: "text-warning",
  PAYING: "text-primary",
  SETTLING: "text-primary",
  EXECUTING: "text-accent",
  VERIFYING: "text-accent",
  COMPLETED: "text-success",
  FAILED: "text-destructive",
};

export function StateTrack({ state, running }: { state: AgentState; running: boolean }) {
  const active = AGENT_STATES.indexOf(state);
  return (
    <div className="flex flex-wrap gap-1.5">
      {AGENT_STATES.map((s, i) => {
        const isActive = s === state;
        const done = state === "COMPLETED" ? i < active : i < active && state !== "FAILED";
        return (
          <span
            key={s}
            className={cn(
              "border px-2 py-1 font-mono text-[9px] tracking-[0.16em] transition-colors",
              isActive && "border-accent bg-accent/15 text-accent",
              isActive && running && "animate-status",
              done && !isActive && "border-success/40 bg-success/10 text-success",
              !isActive && !done && "border-border text-muted-foreground/60",
            )}
          >
            {s}
          </span>
        );
      })}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] items-baseline gap-3 border-b border-border/50 py-1.5 last:border-0">
      <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 truncate font-mono text-[12px] text-silver", tone)}>{value}</dd>
    </div>
  );
}

export function AgentRuntimePanel({
  snap,
  summary,
  backendLabel,
}: {
  snap: RuntimeSnapshot;
  summary: Record<string, string>;
  backendLabel: string;
}) {
  return (
    <CyberCard className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/40 px-3 py-2">
        <span className="label-mono text-silver/80">AGENT RUNTIME</span>
        <span className="inline-flex items-center gap-1.5 border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.18em] text-warning">
          <span className="inline-block h-[5px] w-[5px] rounded-full bg-warning animate-status" aria-hidden />
          {backendLabel}
        </span>
      </div>

      <div className="border-b border-border px-3 py-3">
        <StateTrack state={snap.state} running={snap.running} />
      </div>

      <dl className="px-3 py-2">
        <Row
          label="STATUS"
          value={snap.paused ? `${snap.state} (PAUSED)` : snap.state}
          tone={stateTone[snap.state]}
        />
        <Row label="TASK" value={summary["task"] ?? "—"} />
        <Row label="SERVICE" value={summary["service"] ?? "—"} />
        <Row label="PRICE" value={summary["price"] ?? "—"} tone="text-cyan" />
        <Row label="NETWORK" value={summary["network"] ?? "ARC"} />
        <Row
          label="POLICY"
          value={summary["policy"] ?? "—"}
          tone={summary["policy"] === "APPROVED" ? "text-success" : summary["policy"] === "PENDING" ? "" : "text-destructive"}
        />
        <Row
          label="PAYMENT"
          value={summary["payment"] ?? "—"}
          tone={summary["payment"] === "VERIFIED" ? "text-success" : "text-primary"}
        />
        <Row
          label="RESULT"
          value={summary["result"] ?? "—"}
          tone={
            summary["result"] === "SUCCESS"
              ? "text-success"
              : summary["result"] === "FAILED"
                ? "text-destructive"
                : "text-accent"
          }
        />
        <Row label="TX HASH" value={snap.receipt ? `${snap.receipt.txHash.slice(0, 22)}…` : "—"} />
        <Row label="BALANCE" value={`${snap.balance.toFixed(4)} ${snap.policy.asset}`} />
        <Row
          label="SPENT/DAY"
          value={`${snap.spentToday.toFixed(4)} / ${snap.policy.maxDailySpend} ${snap.policy.asset}`}
        />
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-3 py-2">
        <StatusIndicator
          tone={snap.running ? (snap.paused ? "idle" : "busy") : snap.state === "FAILED" ? "offline" : "online"}
          label={snap.running ? (snap.paused ? "PAUSED" : "RUNNING") : "STANDBY"}
        />
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
          {snap.startedAt && snap.finishedAt ? `${snap.finishedAt - snap.startedAt}ms` : "—"}
        </span>
      </div>
    </CyberCard>
  );
}
