import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAgents, useServices, usePayments } from "@/lib/live/adapters";
import { CyberCard, DataPanel, MetricCard, LinkButton, ExternalButton } from "@/components/kit/primitives";
import { cn } from "@/lib/utils";
import { targetArcChain } from "@/lib/arc/chains";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — ArcPay Agent" },
      {
        name: "description",
        content:
          "Live payment receipts and transaction history on ARC, settled in USDC native gas.",
      },
      { property: "og:title", content: "Payments — ArcPay Agent" },
      { property: "og:description", content: "Programmable machine payments, bounded by policy, settled in USDC." },
      { property: "og:url", content: "/payments" },
    ],
    links: [{ rel: "canonical", href: "/payments" }],
  }),
  component: PaymentsPage,
});

function statusTone(s: string): "accent" | "cyan" | "warning" | "success" | "muted" | "destructive" {
  switch (s) {
    case "REQUESTED":
      return "muted";
    case "AUTHORIZED":
      return "accent";
    case "BROADCAST":
      return "warning";
    case "SETTLED":
      return "success";
    case "FAILED":
      return "destructive";
    case "EXPIRED":
      return "muted";
    default:
      return "muted";
  }
}

function toneClasses(tone: "accent" | "cyan" | "warning" | "success" | "muted" | "destructive") {
  switch (tone) {
    case "accent":
      return "border-accent/40 bg-accent/10 text-accent";
    case "cyan":
      return "border-cyan/40 bg-cyan/10 text-cyan";
    case "warning":
      return "border-warning/40 bg-warning/10 text-warning animate-pulse";
    case "success":
      return "border-success/40 bg-success/10 text-success";
    case "muted":
      return "border-border bg-card text-muted-foreground";
    case "destructive":
      return "border-destructive/40 bg-destructive/10 text-destructive";
  }
}

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

function PaymentsPage() {
  const { data: AGENTS } = useAgents();
  const { data: SERVICES } = useServices();
  const { data: PAYMENTS, refetch: refetchPayments } = usePayments();
  const [expanded, setExpanded] = useState<string | null>(null);

  const explorer = targetArcChain.blockExplorers?.default?.url ?? "https://arc-scan.org";

  const paymentsLen = PAYMENTS.length;
  const totals = useMemo(() => {
    const settled = PAYMENTS.filter((p) => p.status === "SETTLED");
    const sum = settled.reduce((acc, p) => acc + (p.amount ?? 0), 0);
    return {
      count: paymentsLen,
      settled: settled.length,
      volume: sum,
      failed: PAYMENTS.filter((p) => p.status === "FAILED").length,
      pending: PAYMENTS.filter((p) => p.status === "BROADCAST").length,
    };
  }, [PAYMENTS, paymentsLen]);

  const sorted = useMemo(() => {
    return [...PAYMENTS].sort((a, b) => {
      const at = a.settled_at ?? a.broadcast_at ?? a.authorized_at ?? a.requested_at;
      const bt = b.settled_at ?? b.broadcast_at ?? b.authorized_at ?? b.requested_at;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
  }, [PAYMENTS]);

  return (
    <PageShell
      eyebrow="APA://PAYMENTS"
      title="Payment Receipts"
      description="All payment receipts recorded on ARC. Click any row to expand the full settlement trace, signature, and explorer link."
      wide
      actions={
        <>
          <LinkButton to="/activity" size="sm">ACTIVITY MONITOR</LinkButton>
          <button
            type="button"
            onClick={() => void refetchPayments()}
            className="inline-flex items-center border border-border bg-card px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            REFRESH
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="TOTAL" value={String(totals.count)} sub="RECEIPTS" tone="cyan" />
        <MetricCard label="SETTLED" value={String(totals.settled)} sub="PAYMENTS" tone="accent" />
        <MetricCard label="PENDING" value={String(totals.pending)} sub="BROADCAST" tone="accent" />
        <MetricCard label="FAILED" value={String(totals.failed)} sub="PAYMENTS" tone="default" />
        <MetricCard label="VOLUME" value={`${totals.volume.toFixed(4)} USDC`} sub="ARC SETTLED" tone="accent" />
      </div>

      <div className="mt-6">
        <DataPanel
          title="LIVE PAYMENTS"
          right={
            <span className="label-mono text-warning">
              {totals.pending > 0 ? `● ${totals.pending} BROADCAST · 15s POLL` : "● QUIESCENT"}
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">ID</th>
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">TIME</th>
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">SERVICE</th>
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">PAYER</th>
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">PAYEE</th>
                  <th className="py-2 px-3 text-right tracking-[0.16em] text-muted-foreground">AMOUNT</th>
                  <th className="py-2 px-3 text-center tracking-[0.16em] text-muted-foreground">STATUS</th>
                  <th className="py-2 px-3 text-left tracking-[0.16em] text-muted-foreground">TX HASH</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground">
                      NO PAYMENTS YET. Navigate to a service and click PAY &amp; EXECUTE to create a real receipt.
                    </td>
                  </tr>
                ) : (
                  sorted.map((p) => {
                    const svc = SERVICES.find((s) => s.id === p.service_id);
                    const tone = statusTone(p.status);
                    const isOpen = expanded === p.id;
                    const displayTime = p.settled_at ?? p.broadcast_at ?? p.authorized_at ?? p.requested_at;
                    const txLink = p.tx_hash ? `${explorer}/tx/${p.tx_hash}` : null;
                    return (
                      <>
                        <tr
                          key={p.id}
                          onClick={() => setExpanded(isOpen ? null : p.id)}
                          className={cn(
                            "border-b border-border/60 cursor-pointer transition-colors hover:bg-accent/5",
                            isOpen && "bg-accent/5",
                          )}
                        >
                          <td className="py-2.5 px-3 text-silver">{shortHash(p.id)}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {new Date(displayTime).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-foreground truncate max-w-[160px]">
                            {svc?.name ?? p.service_id ?? "-"}
                          </td>
                          <td className="py-2.5 px-3 text-silver">{shortAddr(p.payer)}</td>
                          <td className="py-2.5 px-3 text-silver">{shortAddr(p.payee)}</td>
                          <td className="py-2.5 px-3 text-right text-foreground">
                            {Number(p.amount).toFixed(4)} USDC
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] tracking-[0.16em]",
                                toneClasses(tone),
                              )}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-silver">
                            {txLink ? (
                              <ExternalButton href={txLink} size="sm" variant="outline">
                                {shortHash(p.tx_hash!)}
                              </ExternalButton>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr key={`${p.id}-exp`} className="border-b border-border/60 bg-card/50">
                            <td colSpan={8} className="p-4">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <ReceiptField label="PAYMENT ID" value={p.id} mono />
                                <ReceiptField label="SERVICE" value={svc?.name ?? p.service_id ?? "-"} mono={false} />
                                <ReceiptField label="AGENT" value={p.agent_id ?? "-"} mono />
                                <ReceiptField label="NETWORK" value={`${p.network} · chainId ${p.chain_id ?? targetArcChain.id}`} mono />
                                <ReceiptField label="AMOUNT" value={`${Number(p.amount).toFixed(6)} USDC`} mono />
                                <ReceiptField label="STATUS" value={p.status} mono>
                                  <span className={cn("ml-2 inline-block h-1.5 w-1.5", tone === "success" && "bg-success", tone === "warning" && "bg-warning animate-pulse", tone === "destructive" && "bg-destructive", tone === "muted" && "bg-muted-foreground", tone === "accent" && "bg-accent", tone === "cyan" && "bg-cyan")} />
                                </ReceiptField>
                                <ReceiptField label="PAYER" value={p.payer} mono link={p.payer.startsWith("0x") ? `${explorer}/address/${p.payer}` : undefined} />
                                <ReceiptField label="PAYEE" value={p.payee} mono link={p.payee.startsWith("0x") ? `${explorer}/address/${p.payee}` : undefined} />
                                <ReceiptField label="NONCE" value={p.nonce} mono />
                                <ReceiptField label="REQUESTED AT" value={p.requested_at} mono />
                                <ReceiptField label="AUTHORIZED AT" value={p.authorized_at ?? "-"} mono />
                                <ReceiptField label="BROADCAST AT" value={p.broadcast_at ?? "-"} mono />
                                <ReceiptField label="SETTLED AT" value={p.settled_at ?? "-"} mono />
                                <ReceiptField label="EXPIRED AT" value={p.expired_at ?? "-"} mono />
                                <ReceiptField label="FAILED AT" value={p.failed_at ?? "-"} mono />
                                <ReceiptField label="BLOCK NUMBER" value={p.block_number != null ? String(p.block_number) : "-"} mono />
                                <div className="sm:col-span-2">
                                  <ReceiptField label="TX HASH" value={p.tx_hash ?? "-"} mono link={txLink ?? undefined} />
                                </div>
                                <div className="sm:col-span-2">
                                  <ReceiptField label="AUTHORIZATION MESSAGE" value={p.authorization_message ?? "(not stored)"} mono small />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <ReceiptField label="SIGNATURE" value={p.signature} mono small />
                                </div>
                                {p.failure_reason ? (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <ReceiptField label="FAILURE REASON" value={p.failure_reason} small error />
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DataPanel>
      </div>
      <div className="mt-6 hidden">
        <AgentsAndServicesHidden AGENTS={AGENTS} SERVICES={SERVICES} />
      </div>
    </PageShell>
  );
}

function ReceiptField({
  label,
  value,
  mono,
  link,
  small,
  error,
  children,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: string | undefined;
  small?: boolean;
  error?: boolean;
  children?: React.ReactNode;
}) {
  const textCls = mono ? "font-mono" : "";
  const sizeCls = small ? "text-[10px]" : "text-[12px]";
  const hasLink = Boolean(link);
  return (
    <div className="border border-border/60 bg-background/40 p-3">
      <div className="label-mono text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 break-all",
          textCls,
          sizeCls,
          error ? "text-destructive" : "text-foreground",
        )}
      >
        {hasLink ? (
          <ExternalButton href={link!} size="sm" variant="outline">
            {value}
          </ExternalButton>
        ) : (
          value
        )}
        {children ?? null}
      </div>
    </div>
  );
}

function AgentsAndServicesHidden({
  AGENTS,
  SERVICES,
}: {
  AGENTS: ReturnType<typeof useAgents>["data"];
  SERVICES: ReturnType<typeof useServices>["data"];
}) {
  void AGENTS;
  void SERVICES;
  return null;
}
