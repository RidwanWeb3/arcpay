import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { TerminalWindow } from "@/components/kit/TerminalWindow";
import { AgentRuntimePanel } from "@/components/kit/AgentRuntimePanel";
import { CyberButton, CyberCard, DataPanel } from "@/components/kit/primitives";
import { PaymentFlow } from "@/components/kit/PaymentFlow";
import { TASK_PRESETS, useAgentRuntime } from "@/hooks/useAgentRuntime";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runtime")({
  head: () => ({
    meta: [
      { title: "Agent Runtime — ArcPay Agent" },
      {
        name: "description",
        content:
          "A working simulated agent operating system: service discovery, spending policy checks, USDC payment authorization, settlement and service execution on ARC.",
      },
      { property: "og:title", content: "Agent Runtime — ArcPay Agent" },
      {
        property: "og:description",
        content: "Run, pause, stop and replay a full agent task lifecycle in the simulated ArcPay runtime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/runtime" }],
  }),
  component: RuntimePage,
});

const levelClass = {
  info: "text-silver/80",
  success: "text-success",
  warn: "text-warning",
  error: "text-destructive",
} as const;

const channelClass: Record<string, string> = {
  AGENT: "text-accent",
  SERVICE: "text-cyan",
  POLICY: "text-warning",
  PAYMENT: "text-primary",
  NETWORK: "text-violet",
  SETTLEMENT: "text-success",
  RESOURCE: "text-silver",
  SYSTEM: "text-muted-foreground",
  ERROR: "text-destructive",
};

function paymentStageIndex(state: string) {
  switch (state) {
    case "AUTHORIZING":
      return 1;
    case "PAYING":
      return 2;
    case "SETTLING":
      return 3;
    case "VERIFYING":
      return 4;
    case "EXECUTING":
    case "COMPLETED":
      return 5;
    case "DISCOVERING":
    case "ANALYZING":
      return 0;
    default:
      return -1;
  }
}

function RuntimePage() {
  const rt = useAgentRuntime();
  const { snap, summary } = rt;
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [snap.logs.length]);

  return (
    <PageShell
      eyebrow="APA://RUNTIME"
      title="Simulated Agent Runtime"
      description="A complete agent operating system running in your browser: the agent discovers services, reads prices from an HTTP 402 challenge, checks its spending policy, authorizes and settles a USDC payment on ARC, then executes the paid request and records the task. Every value is simulated — no wallet, no RPC, no funds."
      wide
      actions={
        <>
          {TASK_PRESETS.map((t) => (
            <CyberButton
              key={t.id}
              size="sm"
              variant="outline"
              disabled={snap.running}
              onClick={() => void rt.start(t)}
            >
              RUN · {t.label}
            </CyberButton>
          ))}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid content-start gap-4">
          <AgentRuntimePanel snap={snap} summary={summary} backendLabel={rt.backend.label} />

          <CyberCard className="p-3">
            <div className="label-mono mb-3 text-accent">RUNTIME CONTROL</div>
            <div className="flex flex-wrap gap-2">
              <CyberButton size="sm" variant="primary" disabled={snap.running} onClick={() => rt.replay()}>
                [ REPLAY TASK ]
              </CyberButton>
              <CyberButton size="sm" variant="outline" disabled={!snap.running} onClick={rt.pause}>
                [ {snap.paused ? "RESUME AGENT" : "PAUSE AGENT"} ]
              </CyberButton>
              <CyberButton size="sm" variant="danger" disabled={!snap.running} onClick={rt.stop}>
                [ STOP AGENT ]
              </CyberButton>
              <CyberButton size="sm" variant="ghost" onClick={rt.reset}>
                [ RESET ]
              </CyberButton>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">SPEED</span>
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => rt.setSpeed(s)}
                  className={cn(
                    "border px-2 py-1 font-mono text-[10px] tracking-[0.14em] transition-colors",
                    rt.speed === s
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-accent",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </CyberCard>

          <DataPanel title="SPENDING POLICY" right={<span className="label-mono text-cyan">{snap.policy.riskMode}</span>}>
            <div className="space-y-2 font-mono text-[11px]">
              {[
                ["MAX / TX", `${snap.policy.maxPerTransaction} ${snap.policy.asset}`],
                ["MAX / DAY", `${snap.policy.maxDailySpend} ${snap.policy.asset}`],
                ["NETWORK", snap.policy.network],
                ["ALLOW-LIST", `${snap.policy.allowedServices.length} services`],
                ["DECISION", snap.decision ? snap.decision.code : "PENDING"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="min-w-0 truncate text-silver">{v}</span>
                </div>
              ))}
              {snap.decision ? (
                <p className={cn("pt-1", snap.decision.approved ? "text-success" : "text-destructive")}>
                  {snap.decision.reason}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <CyberButton
                size="sm"
                variant="ghost"
                disabled={snap.running}
                onClick={() => rt.setPolicy({ maxPerTransaction: 0.0005 })}
              >
                TIGHTEN LIMIT
              </CyberButton>
              <CyberButton
                size="sm"
                variant="ghost"
                disabled={snap.running}
                onClick={() => rt.setPolicy({ maxPerTransaction: 0.05 })}
              >
                RESTORE LIMIT
              </CyberButton>
            </div>
          </DataPanel>
        </div>

        <div className="grid content-start gap-4">
          <PaymentFlow stageIndex={paymentStageIndex(snap.state)} />

          <TerminalWindow title="APA://RUNTIME/EXECUTION-LOG" mode="SIMULATED">
            <div ref={logRef} className="h-[360px] overflow-y-auto pr-1">
              {snap.logs.length === 0 ? (
                <p className="text-muted-foreground">
                  Runtime idle. Select a task above or press [ REPLAY TASK ] to execute the full lifecycle.
                </p>
              ) : (
                snap.logs.map((l) => (
                  <div key={l.id} className="grid grid-cols-[62px_88px_86px_minmax(0,1fr)] gap-x-3 py-0.5">
                    <span className="text-[11px] tabular-nums text-muted-foreground/70">{l.at}</span>
                    <span className={cn("text-[11px]", channelClass[l.channel] ?? "text-muted-foreground")}>
                      [{l.channel}]
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">{l.state}</span>
                    <span className={cn("min-w-0 break-words", levelClass[l.level])}>{l.message}</span>
                  </div>
                ))
              )}
            </div>
          </TerminalWindow>

          <div className="grid gap-4 lg:grid-cols-2">
            <DataPanel title="SERVICE RESPONSE" right={<span className="label-mono text-cyan">{snap.response ? `HTTP ${snap.response.httpStatus}` : "—"}</span>}>
              <pre className="max-h-[180px] overflow-auto font-mono text-[11px] text-silver/85">
                {snap.response?.body ?? "// awaiting paid execution"}
              </pre>
            </DataPanel>

            <DataPanel title="TASK RECORDS" right={<span className="label-mono">{snap.history.length}</span>}>
              <div className="max-h-[180px] space-y-2 overflow-auto font-mono text-[11px]">
                {snap.history.length === 0 ? (
                  <p className="text-muted-foreground">No tasks recorded in this session.</p>
                ) : (
                  snap.history.map((h, i) => (
                    <div key={`${h.id}-${i}`} className="border border-border/60 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-silver">{h.label}</span>
                        <span className={h.outcome === "SUCCESS" ? "text-success" : "text-destructive"}>
                          {h.outcome}
                        </span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {h.serviceName ?? "—"} · {h.amount.toFixed(4)} {h.asset} · {h.durationMs}ms
                      </div>
                      {h.txHash ? <div className="truncate text-cyan/80">{h.txHash}</div> : null}
                    </div>
                  ))
                )}
              </div>
            </DataPanel>
          </div>

          <DataPanel title="DISCOVERED SERVICES" right={<span className="label-mono">{snap.discovered.length}</span>}>
            <div className="grid gap-2 font-mono text-[11px] sm:grid-cols-2">
              {snap.discovered.length === 0 ? (
                <p className="text-muted-foreground">Discovery not yet run.</p>
              ) : (
                snap.discovered.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      "border p-2",
                      snap.service?.id === d.id ? "border-accent/60 bg-accent/5" : "border-border/60",
                    )}
                  >
                    <div className="truncate text-silver">{d.name}</div>
                    <div className="text-muted-foreground">
                      {d.price} {d.asset} / {d.unit} · {d.latencyMs}ms
                    </div>
                  </div>
                ))
              )}
            </div>
          </DataPanel>
        </div>
      </div>

      <CyberCard className="mt-6 p-5">
        <div className="label-mono text-warning">SIMULATED AGENT RUNTIME</div>
        <p className="mt-3 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">
          The runtime executes against clean interfaces — <span className="text-silver">ServiceDirectory</span>,{" "}
          <span className="text-silver">PolicyEngine</span>, <span className="text-silver">PaymentRail</span> and{" "}
          <span className="text-silver">ServiceClient</span>. Today they are fulfilled by an in-browser simulation. A
          real ARC / USDC / Circle backend can implement the same contracts and replace the simulation without changing
          the state machine or the interface.
        </p>
      </CyberCard>
    </PageShell>
  );
}
