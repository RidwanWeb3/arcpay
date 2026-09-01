import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { makeFallbackActivity, useActivityFeed, useWalletTransactions } from "@/lib/live/adapters";
import type { ActivityEvent } from "@/types";
import { CyberButton, DataPanel, MetricCard, StatusIndicator } from "@/components/kit/primitives";
import { TerminalWindow } from "@/components/kit/TerminalWindow";
import { ExternalButton } from "@/components/kit/primitives";
import { useWallet } from "@/hooks/useWallet";
import { targetArcChain } from "@/lib/arc/chains";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Monitor — ArcPay Agent" },
      {
        name: "description",
        content:
          "Event stream of agent discovery, authorization, and USDC settlement activity across ArcPay merged with on-chain wallet transactions from ARC.",
      },
      { property: "og:title", content: "Activity Monitor — ArcPay Agent" },
      { property: "og:description", content: "Watch agent-driven payment events + on-chain ARC transactions in one stream." },
      { property: "og:url", content: "/activity" },
    ],
    links: [{ rel: "canonical", href: "/activity" }],
  }),
  component: ActivityPage,
});

function shortAddr(a: string): string {
  if (!a) return "-";
  if (a.length <= 10) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

function shortHash(a: string): string {
  if (!a) return "-";
  if (a.length <= 14) return a;
  return `${a.slice(0, 10)}…${a.slice(-8)}`;
}

function ActivityPage() {
  const wallet = useWallet();
  const { data: LIVE, isFetching, refetch } = useActivityFeed();
  const { data: CHAIN_TXS } = useWalletTransactions(
    wallet.connected && !wallet.simulated ? (wallet.address as `0x${string}` | undefined) : undefined,
  );
  const [synth, setSynth] = useState<ActivityEvent[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSynth((e) => [makeFallbackActivity(), ...e].slice(0, LIVE.length < 5 ? 30 : 0));
    }, 1600);
    return () => clearInterval(t);
  }, [running, LIVE.length]);

  const explorer = targetArcChain.blockExplorers?.default?.url ?? "https://arc-scan.org";
  const chainEvents = useMemo<ActivityEvent[]>(() => {
    return CHAIN_TXS.map((t): ActivityEvent => {
      const inbound = wallet.address && t.to && t.to.toLowerCase() === wallet.address.toLowerCase();
      const outbound = wallet.address && t.from && t.from.toLowerCase() === wallet.address.toLowerCase();
      return {
        id: `chain-${t.hash}`,
        time: new Date().toTimeString().slice(0, 8),
        actor: outbound ? shortAddr(t.from) : shortAddr(t.to ?? "-"),
        action: inbound ? "received" : "sent",
        target: inbound ? shortAddr(t.from) : shortAddr(t.to ?? "0x0"),
        amount: t.usdcEquiv,
        network: "ARC",
        channel: "NETWORK",
        severity: "INFO",
        meta: {
          hash: t.hash,
          from: t.from,
          to: t.to,
          blockNumber: t.blockNumber ? String(t.blockNumber) : undefined,
        },
      };
    });
  }, [CHAIN_TXS, wallet.address]);

  const events = useMemo(() => {
    const all = [...LIVE, ...chainEvents, ...synth];
    all.sort((a, b) => {
      const parseT = (s: string) => {
        const now = new Date();
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}T${s}`;
        const ms = Date.parse(today);
        return Number.isFinite(ms) ? ms : 0;
      };
      return parseT(b.time) - parseT(a.time);
    });
    return all.slice(0, 60);
  }, [LIVE, chainEvents, synth]);

  void isFetching; void refetch;
  const volume = events.reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <PageShell
      eyebrow="APA://ACTIVITY"
      title="Network Activity Monitor"
      description="Event stream merged from the ArcPay activity table and the connected wallet's on-chain ARC transaction history."
      wide
      actions={
        <>
          <CyberButton size="sm" variant={running ? "danger" : "primary"} onClick={() => setRunning((r) => !r)}>
            {running ? "PAUSE STREAM" : "RESUME STREAM"}
          </CyberButton>
          <CyberButton size="sm" variant="ghost" onClick={() => setSynth([])}>
            CLEAR BUFFER
          </CyberButton>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex items-center border border-border bg-card px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            REFRESH
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="EVENTS BUFFERED" value={String(events.length)} sub="ROLLING WINDOW" tone="accent" />
        <MetricCard label="SESSION VOLUME" value={`${volume.toFixed(4)} USDC`} sub="MERGED FEED" tone="cyan" />
        <MetricCard label="STREAM" value={running ? "LIVE" : "PAUSED"} sub={wallet.connected && !wallet.simulated ? "ON-CHAIN MIX" : "DEMO FEED"} />
        <MetricCard label="NETWORK" value="ARC" sub="SETTLEMENT LAYER" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <TerminalWindow
          title="APA://ACTIVITY/STREAM"
          mode={wallet.connected && !wallet.simulated ? "LIVE" : "DEMO"}
          footer={<StatusIndicator tone={running ? "online" : "idle"} label={running ? "STREAMING" : "HALTED"} />}
        >
          <div className="h-[540px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-muted-foreground">BUFFER EMPTY — waiting for events...</p>
            ) : (
              events.map((e) => {
                const meta = e.meta ?? {};
                const hash = (meta as { hash?: string | undefined }).hash;
                const isChain = e.channel === "NETWORK";
                return (
                  <div
                    key={e.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/40 py-1.5"
                  >
                    <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground/70">{e.time}</span>
                    <span className="min-w-0 break-words text-silver/85">
                      <span
                        className={
                          isChain
                            ? "text-cyan"
                            : e.severity === "OK"
                              ? "text-success"
                              : e.severity === "ERROR"
                                ? "text-destructive"
                                : "text-accent"
                        }
                      >
                        {e.actor}
                      </span>{" "}
                      {e.action}{" "}
                      <span className="text-cyan">{e.target}</span>
                      {isChain && hash ? (
                        <>
                          {" "}
                          <ExternalButton href={`${explorer}/tx/${hash}`} size="sm" variant="outline">
                            {shortHash(hash)}
                          </ExternalButton>
                        </>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[11px] text-success">
                      {e.amount ? `${e.amount.toFixed(4)} USDC` : "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </TerminalWindow>

        <div className="grid content-start gap-6">
          <DataPanel title="EVENT LEGEND">
            <ul className="space-y-2.5 font-mono text-[11px] text-muted-foreground">
              <li><span className="text-accent">ACTOR</span> — the agent or wallet address initiating the action</li>
              <li><span className="text-cyan">TARGET</span> — the service or counterparty address</li>
              <li><span className="text-success">AMOUNT</span> — USDC value settled on ARC</li>
              <li><span className="text-warning">NETWORK</span> — merged from on-chain ARC transactions (connected wallet)</li>
            </ul>
          </DataPanel>
          <DataPanel title="FEED SOURCES">
            <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
              <li>● ACTIVITY TABLE — payment/settlement lifecycle events written by the adapter</li>
              <li>● ON-CHAIN TX — last 10 blocks of ARC scanned for wallet <span className="text-accent">{wallet.address ?? "(not connected)"}</span></li>
              <li>● SYNTHETIC — demo loop fills silence until the adapter sees real events</li>
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
