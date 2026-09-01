import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAgents } from "@/lib/live/adapters";
import { AgentCard } from "@/components/kit/cards";
import { CyberButton, LinkButton, MetricCard } from "@/components/kit/primitives";

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "Agent Control Center — ArcPay Agent" },
      {
        name: "description",
        content:
          "Browse ArcPay Agent's agent registry: wallets, spending policies, task history and settlement activity on ARC.",
      },
      { property: "og:title", content: "Agent Control Center — ArcPay Agent" },
      { property: "og:description", content: "Every agent carries its own wallet, budget ceiling and audit log." },
      { property: "og:url", content: "/agents" },
    ],
    links: [{ rel: "canonical", href: "/agents" }],
  }),
  component: AgentsPage,
});

const FILTERS = ["ALL", "ONLINE", "IDLE", "BUSY", "OFFLINE"] as const;

function AgentsPage() {
  const { data: AGENTS, isFetching, refetch } = useAgents();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      AGENTS.filter((a) => (filter === "ALL" ? true : a.status === filter)).filter((a) =>
        (a.name + a.type + a.purpose).toLowerCase().includes(q.toLowerCase()),
      ),
    [AGENTS, filter, q],
  );

  const online = AGENTS.filter((a) => a.status === "ONLINE").length;
  const tasks = AGENTS.reduce((s, a) => s + a.tasksCompleted, 0);
  const budget = AGENTS.reduce((s, a) => s + a.balance, 0);

  return (
    <PageShell
      eyebrow="APA://AGENTS"
      title="Agent Control Center"
      description="A registry of autonomous agents operating inside the ArcPay demo environment. Each one holds an isolated wallet and a spending policy that bounds what it may buy."
      wide
      actions={
        <>
          <LinkButton to="/agents/create" variant="primary" size="sm">
            + CREATE AGENT
          </LinkButton>
          <LinkButton to="/activity" size="sm">
            ACTIVITY MONITOR
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="AGENTS" value={String(AGENTS.length)} sub="REGISTERED" tone="accent" />
        <MetricCard label="ONLINE" value={String(online)} sub="ACTIVE RUNTIMES" />
        <MetricCard label="TASKS COMPLETED" value={tasks.toLocaleString()} sub="LIFETIME · DEMO" tone="cyan" />
        <MetricCard label="ALLOCATED BUDGET" value={`${budget.toFixed(2)} USDC`} sub="ACROSS ALL AGENTS" />
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH AGENTS..."
          aria-label="Search agents"
          className="min-w-0 border border-border bg-surface/40 px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-silver outline-none placeholder:text-muted-foreground/60 focus:border-accent"
        />
        <div className="hidden shrink-0 gap-1 sm:flex">
          {FILTERS.map((f) => (
            <CyberButton
              key={f}
              size="sm"
              variant={filter === f ? "primary" : "ghost"}
              onClick={() => setFilter(f)}
            >
              {f}
            </CyberButton>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 border border-border bg-surface/30 p-6 text-center font-mono text-[12px] text-muted-foreground">
          NO AGENTS MATCH THIS QUERY.
        </p>
      ) : null}
    </PageShell>
  );
}
