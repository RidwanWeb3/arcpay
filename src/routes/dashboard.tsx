import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { AGENTS, SERVICES, DASHBOARD_SERIES } from "@/lib/demoData";
import { DataPanel, LinkButton, MetricCard } from "@/components/kit/primitives";
import { BarChartPanel, LineChartPanel, HistogramPanel } from "@/components/kit/ChartPanel";
import { AgentStatus } from "@/components/kit/cards";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "System Dashboard — ArcPay Agent" },
      {
        name: "description",
        content:
          "Aggregated telemetry for the ArcPay Agent demo network: agent activity, payment volume, service usage and transaction frequency.",
      },
      { property: "og:title", content: "System Dashboard — ArcPay Agent" },
      { property: "og:description", content: "Command-center view of agent-driven payment flow on ARC." },
      { property: "og:url", content: "/dashboard" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const tasks = AGENTS.reduce((s, a) => s + a.tasksCompleted, 0);
  const volume = AGENTS.flatMap((a) => a.payments).reduce((s, p) => s + p.amount, 0);

  return (
    <PageShell
      eyebrow="APA://DASHBOARD"
      title="System Dashboard"
      description="Command-center telemetry for the demo network. Every figure below is generated from local fixtures to illustrate the shape of agent-driven commerce."
      wide
      actions={
        <>
          <LinkButton to="/activity" size="sm" variant="primary">LIVE ACTIVITY</LinkButton>
          <LinkButton to="/agents" size="sm">AGENT REGISTRY</LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="ACTIVE AGENTS" value={String(AGENTS.filter((a) => a.status !== "OFFLINE").length)} sub={`OF ${AGENTS.length} REGISTERED`} tone="accent" />
        <MetricCard label="TASKS COMPLETED" value={tasks.toLocaleString()} sub="LIFETIME · DEMO" />
        <MetricCard label="SETTLED VOLUME" value={`${volume.toFixed(4)} USDC`} sub="SIMULATED" tone="cyan" />
        <MetricCard label="SERVICES ONLINE" value={String(SERVICES.filter((s) => s.status === "AVAILABLE").length)} sub="PRICED ENDPOINTS" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <LineChartPanel title="AGENT ACTIVITY" data={DASHBOARD_SERIES.agentActivity} />
        <LineChartPanel title="PAYMENT VOLUME" data={DASHBOARD_SERIES.paymentVolume} unit=" USDC" />
        <BarChartPanel title="SERVICE USAGE" data={DASHBOARD_SERIES.serviceUsage} />
        <HistogramPanel title="TRANSACTION FREQUENCY" data={DASHBOARD_SERIES.txFrequency} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <DataPanel title="AGENT FLEET">
          <ul className="divide-y divide-border">
            {AGENTS.map((a) => (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-[12px] text-silver">{a.name}</div>
                  <div className="label-mono mt-1 truncate">{a.lastAction}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-cyan">{a.balance.toFixed(2)} USDC</span>
                  <AgentStatus status={a.status} />
                </div>
              </li>
            ))}
          </ul>
        </DataPanel>

        <DataPanel title="SERVICE LOAD">
          <ul className="divide-y divide-border">
            {SERVICES.map((s) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-[12px] text-silver">{s.name}</div>
                  <div className="label-mono mt-1">{s.category} · {s.responseTimeMs} ms</div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-accent">{s.price} USDC</span>
              </li>
            ))}
          </ul>
        </DataPanel>
      </div>
    </PageShell>
  );
}
