import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAgents, useServices, usePayments } from "@/lib/live/adapters";
import { CyberButton, CyberCard, DataPanel, MetricCard, LinkButton } from "@/components/kit/primitives";
import { PaymentFlow, PAYMENT_STAGES } from "@/components/kit/PaymentFlow";
import { TerminalWindow, LogLine } from "@/components/kit/TerminalWindow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payment Terminal — ArcPay Agent" },
      {
        name: "description",
        content:
          "Simulate an agent-to-service payment: request, authorization, verification, settlement and confirmation in USDC on ARC.",
      },
      { property: "og:title", content: "Payment Terminal — ArcPay Agent" },
      { property: "og:description", content: "Programmable machine payments, bounded by policy, settled in USDC." },
      { property: "og:url", content: "/payments" },
    ],
    links: [{ rel: "canonical", href: "/payments" }],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: AGENTS } = useAgents();
  const { data: SERVICES } = useServices();
  const { data: PAYMENTS } = usePayments();
  const [agentId, setAgentId] = useState(AGENTS[0]!.id);
  const [serviceId, setServiceId] = useState(SERVICES[0]!.id);
  const [stage, setStage] = useState(-1);
  const [logs, setLogs] = useState<{ channel: string; message: string; at: string }[]>([]);
  const [receipts, setReceipts] = useState<{ id: string; amount: number; to: string; at: string }[]>([]);

  const agent = AGENTS.find((a) => a.id === agentId)!;
  const service = SERVICES.find((s) => s.id === serviceId)!;
  const withinPolicy = service.price <= agent.policy.maxPerTransaction;
  void PAYMENTS;

  useEffect(() => {
    if (stage < 0 || stage >= PAYMENT_STAGES.length) return;
    const msgs = [
      { channel: "SERVICE", message: `402 PAYMENT REQUIRED — ${service.price} USDC for ${service.name}` },
      {
        channel: "POLICY",
        message: withinPolicy
          ? `Authorized: ${service.price} USDC ≤ ${agent.policy.maxPerTransaction} USDC ceiling`
          : "REJECTED: amount exceeds per-transaction ceiling",
      },
      { channel: "NETWORK", message: "Verifying intent and recipient on ARC (simulated)" },
      { channel: "PAYMENT", message: `${service.price} USDC → ${service.provider}` },
      { channel: "SETTLEMENT", message: "Confirmed — receipt issued (simulated)" },
    ];
    const t = setTimeout(() => {
      setLogs((l) => [...l, { ...msgs[stage]!, at: new Date().toTimeString().slice(0, 8) }]);
      if (stage === 1 && !withinPolicy) {
        setStage(-2);
        return;
      }
      if (stage === PAYMENT_STAGES.length - 1) {
        setReceipts((r) => [
          {
            id: `PAY-${Math.floor(1000 + Math.random() * 8999)}`,
            amount: service.price,
            to: service.name,
            at: new Date().toTimeString().slice(0, 8),
          },
          ...r,
        ]);
        setStage(PAYMENT_STAGES.length);
        return;
      }
      setStage((s) => s + 1);
    }, 750);
    return () => clearTimeout(t);
  }, [stage, service, agent, withinPolicy]);

  const run = () => {
    setLogs([]);
    setStage(0);
  };

  const rejected = stage === -2;
  const done = stage === PAYMENT_STAGES.length;

  return (
    <PageShell
      eyebrow="APA://PAYMENTS"
      title="Payment Terminal"
      description="Pair an agent with a priced service and watch the full settlement lifecycle. Policy is evaluated before any value moves — the ceiling is the safety mechanism."
      wide
      actions={
        <>
          <CyberButton size="sm" variant="primary" onClick={run}>
            EXECUTE PAYMENT (SIMULATED)
          </CyberButton>
          <LinkButton to="/activity" size="sm">ACTIVITY MONITOR</LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="PAYER" value={agent.name} sub={agent.wallet} tone="accent" />
        <MetricCard label="AMOUNT" value={`${service.price} USDC`} sub={`PER ${service.unit.toUpperCase()}`} tone="cyan" />
        <MetricCard label="TX CEILING" value={`${agent.policy.maxPerTransaction} USDC`} sub={agent.policy.riskMode} />
        <MetricCard label="NETWORK" value="ARC" sub="STABLE SETTLEMENT" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <DataPanel title="SETTLEMENT LIFECYCLE">
            <PaymentFlow stageIndex={rejected ? 1 : Math.min(stage, PAYMENT_STAGES.length - 1)} />
            {rejected ? (
              <p className="mt-3 border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
                PAYMENT REJECTED BY POLICY — the agent's per-transaction ceiling is lower than the requested amount.
              </p>
            ) : done ? (
              <p className="mt-3 border border-success/40 bg-success/10 px-3 py-2 font-mono text-[11px] text-success">
                SETTLEMENT CONFIRMED — SIMULATED TRANSACTION. No funds moved.
              </p>
            ) : (
              <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-warning">
                SIMULATED ENVIRONMENT — illustrative amounts only.
              </p>
            )}
          </DataPanel>

          <TerminalWindow title="APA://PAYMENTS/TRACE" mode="SIMULATION">
            <div className="h-[240px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Awaiting execution. Select an agent and a service, then execute.</p>
              ) : (
                logs.map((l, i) => <LogLine key={i} at={l.at} channel={l.channel} message={l.message} />)
              )}
            </div>
          </TerminalWindow>

          <DataPanel title="RECEIPTS">
            {receipts.length === 0 ? (
              <p className="font-mono text-[12px] text-muted-foreground">NO RECEIPTS IN THIS SESSION.</p>
            ) : (
              <ul className="divide-y divide-border">
                {receipts.map((r) => (
                  <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px] text-silver">→ {r.to}</div>
                      <div className="label-mono mt-1">{r.id} · {r.at}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-success">{r.amount.toFixed(4)} USDC</span>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>
        </div>

        <div className="grid content-start gap-6">
          <CyberCard className="p-5">
            <div className="label-mono text-accent">SELECT AGENT</div>
            <div className="mt-3 grid gap-2">
              {AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgentId(a.id)}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2.5 text-left transition-colors",
                    agentId === a.id ? "border-accent/60 bg-accent/5" : "border-border hover:border-accent/30",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11px] text-silver">{a.name}</span>
                    <span className="label-mono">{a.type}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-cyan">{a.balance.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </CyberCard>

          <CyberCard className="p-5">
            <div className="label-mono text-accent">SELECT SERVICE</div>
            <div className="mt-3 grid gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2.5 text-left transition-colors",
                    serviceId === s.id ? "border-accent/60 bg-accent/5" : "border-border hover:border-accent/30",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11px] text-silver">{s.name}</span>
                    <span className="label-mono">{s.category}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-cyan">{s.price} USDC</span>
                </button>
              ))}
            </div>
          </CyberCard>
        </div>
      </div>
    </PageShell>
  );
}
