import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { AGENTS } from "@/lib/demoData";
import { CyberCard, DataPanel, LinkButton, MetricCard, StatusIndicator } from "@/components/kit/primitives";
import { TerminalWindow, LogLine } from "@/components/kit/TerminalWindow";
import { LineChartPanel } from "@/components/kit/ChartPanel";
import { AgentStatus } from "@/components/kit/cards";

export const Route = createFileRoute("/agents/$id")({
  loader: ({ params }) => {
    const agent = AGENTS.find((a) => a.id === params.id);
    if (!agent) throw notFound();
    return { agent };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Agent unavailable — ArcPay Agent" }, { name: "robots", content: "noindex" }] };
    }
    const a = loaderData.agent;
    return {
      meta: [
        { title: `${a.name} — Agent Profile | ArcPay Agent` },
        { name: "description", content: `${a.purpose} Spending policy, task history and settlement logs for ${a.name}.` },
        { property: "og:title", content: `${a.name} — ArcPay Agent` },
        { property: "og:description", content: a.purpose },
        { property: "og:url", content: `/agents/${params.id}` },
      ],
      links: [{ rel: "canonical", href: `/agents/${params.id}` }],
    };
  },
  component: AgentDetail,
});

function AgentDetail() {
  const { agent } = Route.useLoaderData();
  const p = agent.policy;

  return (
    <PageShell
      eyebrow={`APA://AGENTS/${agent.id.toUpperCase()}`}
      title={agent.name}
      description={agent.purpose}
      wide
      actions={
        <>
          <LinkButton to="/agents" size="sm">← ALL AGENTS</LinkButton>
          <LinkButton to="/payments" size="sm" variant="primary">SIMULATE PAYMENT</LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="STATUS" value={agent.status} sub={agent.type} tone="accent" />
        <MetricCard label="BALANCE" value={`${agent.balance.toFixed(2)} USDC`} sub="AGENT WALLET" tone="cyan" />
        <MetricCard label="PER-TASK CEILING" value={`${agent.spendingPerTask} USDC`} sub="POLICY LIMIT" />
        <MetricCard label="TASKS COMPLETED" value={agent.tasksCompleted.toLocaleString()} sub="LIFETIME · DEMO" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <TerminalWindow title={`APA://AGENTS/${agent.id}/LOGS`} mode="DEMO">
            <div className="max-h-[280px] overflow-y-auto">
              {agent.logs.length === 0 ? (
                <p className="text-muted-foreground">NO LOG ENTRIES.</p>
              ) : (
                agent.logs.map((l, i) => <LogLine key={i} at={l.at} channel={l.channel} message={l.message} />)
              )}
            </div>
          </TerminalWindow>

          <DataPanel title="TASK QUEUE">
            {agent.tasks.length === 0 ? (
              <p className="font-mono text-[12px] text-muted-foreground">QUEUE EMPTY.</p>
            ) : (
              <ul className="divide-y divide-border">
                {agent.tasks.map((t) => (
                  <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px] text-silver">{t.name}</div>
                      <div className="label-mono mt-1">
                        {t.id} · {t.at}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[11px] text-cyan">{t.cost.toFixed(4)} USDC</div>
                      <div className="label-mono mt-1">{t.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>

          <DataPanel title="PAYMENT HISTORY">
            {agent.payments.length === 0 ? (
              <p className="font-mono text-[12px] text-muted-foreground">NO PAYMENTS RECORDED.</p>
            ) : (
              <ul className="divide-y divide-border">
                {agent.payments.map((pm) => (
                  <li key={pm.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px] text-silver">→ {pm.to}</div>
                      <div className="label-mono mt-1">
                        {pm.id} · {pm.at}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[11px] text-accent">{pm.amount.toFixed(4)} USDC</div>
                      <div className="label-mono mt-1 text-success">{pm.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>
        </div>

        <div className="grid content-start gap-6">
          <CyberCard className="hud-corners p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="label-mono text-accent">IDENTITY</div>
                <div className="mt-2 truncate font-mono text-[12px] text-silver">{agent.wallet}</div>
              </div>
              <AgentStatus status={agent.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {agent.capabilities.map((c) => (
                <span
                  key={c}
                  className="border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-cyan"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-4 font-mono text-[11px] leading-5 text-muted-foreground">
              LAST ACTION: <span className="text-silver">{agent.lastAction}</span>
            </p>
          </CyberCard>

          <DataPanel title="SPENDING POLICY" right={<StatusIndicator tone="idle" label={p.riskMode} />}>
            <dl className="space-y-2 font-mono text-[11px]">
              <Row k="MAX DAILY SPEND" v={`${p.maxDailySpend} USDC`} />
              <Row k="MAX PER TX" v={`${p.maxPerTransaction} USDC`} />
              <Row k="NETWORK" v={p.network} />
              <Row k="ASSET" v={p.asset} />
              <Row k="SESSION" v={`${p.sessionMinutes} MIN`} />
              <Row k="UNKNOWN RECIPIENT" v={p.confirmUnknownRecipient ? "CONFIRM" : "AUTO"} />
              <Row k="CONTRACT CALLS" v={p.confirmContractInteraction ? "CONFIRM" : "AUTO"} />
              <Row k="ABOVE LIMIT" v={p.confirmAboveLimit ? "CONFIRM" : "AUTO"} />
            </dl>
            <div className="mt-4">
              <div className="label-mono">ALLOWED SERVICES</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.allowedServices.map((s) => (
                  <span key={s} className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </DataPanel>

          <LineChartPanel title="AGENT THROUGHPUT" data={[4, 7, 6, 11, 9, 14, 12, 18, 16, 21, 19, 24]} />
        </div>
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/50 pb-1.5">
      <dt className="label-mono">{k}</dt>
      <dd className="shrink-0 text-silver">{v}</dd>
    </div>
  );
}
