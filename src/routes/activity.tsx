import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { makeActivityEvent } from "@/lib/demoData";
import type { ActivityEvent } from "@/types";
import { CyberButton, DataPanel, MetricCard, StatusIndicator } from "@/components/kit/primitives";
import { TerminalWindow } from "@/components/kit/TerminalWindow";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Monitor — ArcPay Agent" },
      {
        name: "description",
        content:
          "Live-style event stream of agent discovery, authorization and USDC settlement activity across the ArcPay demo network.",
      },
      { property: "og:title", content: "Activity Monitor — ArcPay Agent" },
      { property: "og:description", content: "Watch agent-driven payment events stream in real time." },
      { property: "og:url", content: "/activity" },
    ],
    links: [{ rel: "canonical", href: "/activity" }],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setEvents((e) => [makeActivityEvent(), ...e].slice(0, 60));
    }, 1600);
    return () => clearInterval(t);
  }, [running]);

  const volume = events.reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <PageShell
      eyebrow="APA://ACTIVITY"
      title="Network Activity Monitor"
      description="A synthetic stream illustrating how agent traffic looks when discovery, authorization and settlement happen continuously and without human intervention."
      wide
      actions={
        <>
          <CyberButton size="sm" variant={running ? "danger" : "primary"} onClick={() => setRunning((r) => !r)}>
            {running ? "PAUSE STREAM" : "RESUME STREAM"}
          </CyberButton>
          <CyberButton size="sm" variant="ghost" onClick={() => setEvents([])}>
            CLEAR BUFFER
          </CyberButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="EVENTS BUFFERED" value={String(events.length)} sub="ROLLING WINDOW" tone="accent" />
        <MetricCard label="SESSION VOLUME" value={`${volume.toFixed(4)} USDC`} sub="SIMULATED" tone="cyan" />
        <MetricCard label="STREAM" value={running ? "LIVE" : "PAUSED"} sub="DEMO FEED" />
        <MetricCard label="NETWORK" value="ARC" sub="SETTLEMENT LAYER" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <TerminalWindow
          title="APA://ACTIVITY/STREAM"
          mode="DEMO"
          footer={<StatusIndicator tone={running ? "online" : "idle"} label={running ? "STREAMING" : "HALTED"} />}
        >
          <div className="h-[480px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground">BUFFER EMPTY — waiting for events...</p>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/40 py-1.5"
                >
                  <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground/70">{e.time}</span>
                  <span className="min-w-0 break-words text-silver/85">
                    <span className="text-accent">{e.actor}</span> {e.action}{" "}
                    <span className="text-cyan">{e.target}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-success">
                    {e.amount ? `${e.amount.toFixed(4)} USDC` : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </TerminalWindow>

        <div className="grid content-start gap-6">
          <DataPanel title="EVENT LEGEND">
            <ul className="space-y-2.5 font-mono text-[11px] text-muted-foreground">
              <li><span className="text-accent">ACTOR</span> — the agent initiating the action</li>
              <li><span className="text-cyan">TARGET</span> — the service or counterparty</li>
              <li><span className="text-success">AMOUNT</span> — simulated USDC value settled on ARC</li>
            </ul>
          </DataPanel>
          <DataPanel title="WHY THIS MATTERS">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Human payment rails assume a person clicks approve. Agent traffic is bursty, sub-cent and continuous.
              ArcPay models that pattern: policy-bounded authorization at machine frequency, with a stable settlement
              asset so pricing stays legible.
            </p>
          </DataPanel>
        </div>
      </div>
    </PageShell>
  );
}
