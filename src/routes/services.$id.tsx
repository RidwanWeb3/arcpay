import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SERVICES } from "@/lib/demoData";
import { CyberButton, CyberCard, DataPanel, LinkButton, MetricCard } from "@/components/kit/primitives";
import { TerminalWindow, LogLine } from "@/components/kit/TerminalWindow";
import { PaymentFlow, PAYMENT_STAGES } from "@/components/kit/PaymentFlow";

export const Route = createFileRoute("/services/$id")({
  loader: ({ params }) => {
    const service = SERVICES.find((s) => s.id === params.id);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service unavailable — ArcPay Agent" }, { name: "robots", content: "noindex" }] };
    }
    const s = loaderData.service;
    return {
      meta: [
        { title: `${s.name} — ${s.price} USDC / ${s.unit} | ArcPay Agent` },
        { name: "description", content: s.description },
        { property: "og:title", content: `${s.name} — ArcPay Agent Service` },
        { property: "og:description", content: s.description },
        { property: "og:url", content: `/services/${params.id}` },
      ],
      links: [{ rel: "canonical", href: `/services/${params.id}` }],
    };
  },
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const [stage, setStage] = useState(-1);
  const [logs, setLogs] = useState<{ channel: string; message: string; at: string }[]>([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setStage(-1);
    setLogs([]);
    setUnlocked(false);
  }, [service.id]);

  useEffect(() => {
    if (stage < 0 || stage >= PAYMENT_STAGES.length) return;
    const messages: Record<number, { channel: string; message: string }> = {
      0: { channel: "SERVICE", message: `HTTP 402 PAYMENT REQUIRED — ${service.price} USDC / ${service.unit}` },
      1: { channel: "POLICY", message: "Amount within per-transaction ceiling — authorization granted" },
      2: { channel: "NETWORK", message: "Verifying payment intent on ARC (simulated)" },
      3: { channel: "PAYMENT", message: `${service.price} USDC transferred to ${service.provider}` },
      4: { channel: "RESOURCE", message: "Payload released — resource unlocked" },
    };
    const t = setTimeout(() => {
      const m = messages[stage]!;
      setLogs((l) => [...l, { ...m, at: new Date().toTimeString().slice(0, 8) }]);
      if (stage === PAYMENT_STAGES.length - 1) setUnlocked(true);
      else setStage((s) => s + 1);
    }, 700);
    return () => clearTimeout(t);
  }, [stage, service]);

  const start = () => {
    setLogs([]);
    setUnlocked(false);
    setStage(0);
  };

  return (
    <PageShell
      eyebrow={`APA://SERVICES/${service.id.toUpperCase()}`}
      title={service.name}
      description={service.description}
      wide
      actions={
        <>
          <LinkButton to="/services" size="sm">← MARKETPLACE</LinkButton>
          <CyberButton size="sm" variant="primary" onClick={start}>
            REQUEST RESOURCE
          </CyberButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="PRICE" value={`${service.price} USDC`} sub={`PER ${service.unit.toUpperCase()}`} tone="accent" />
        <MetricCard label="STATUS" value={service.status} sub={service.provider} />
        <MetricCard label="RESPONSE" value={`${service.responseTimeMs} ms`} sub="AVG · DEMO" tone="cyan" />
        <MetricCard label="NETWORK" value={service.network} sub={`SETTLED IN ${service.method}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <DataPanel title="402 PAYMENT FLOW">
            <PaymentFlow stageIndex={stage} />
            <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-warning">
              SIMULATED TRANSACTION — no funds move and no network call is made.
            </p>
          </DataPanel>

          <TerminalWindow title={`APA://SERVICES/${service.id}/SESSION`} mode="SIMULATION">
            <div className="h-[220px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">
                  Press <span className="text-accent">REQUEST RESOURCE</span> to issue an agent request against this
                  endpoint.
                </p>
              ) : (
                logs.map((l, i) => <LogLine key={i} at={l.at} channel={l.channel} message={l.message} />)
              )}
            </div>
          </TerminalWindow>

          <DataPanel title="RESPONSE PAYLOAD">
            {unlocked ? (
              <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px] text-success">
                {service.sampleResponse}
              </pre>
            ) : (
              <div className="grid place-items-center border border-dashed border-border py-10 text-center">
                <div>
                  <div className="font-mono text-[12px] tracking-[0.2em] text-destructive">402 PAYMENT REQUIRED</div>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    Payload locked until a {service.price} USDC payment is authorized.
                  </p>
                </div>
              </div>
            )}
          </DataPanel>
        </div>

        <div className="grid content-start gap-6">
          <CyberCard className="hud-corners p-5">
            <div className="label-mono text-accent">ENDPOINT</div>
            <code className="mt-2 block break-all font-mono text-[11px] text-silver">{service.endpoint}</code>
            <div className="mt-5 label-mono">CAPABILITIES</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {service.capabilities.map((c) => (
                <span key={c} className="border border-border px-2 py-0.5 font-mono text-[10px] text-cyan">
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-5 label-mono">COMPATIBLE AGENTS</div>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
              {service.compatibility.map((c) => (
                <li key={c}>→ {c}</li>
              ))}
            </ul>
          </CyberCard>

          <DataPanel title="INTEGRATION SKETCH">
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-[11px] text-silver/85">{`agent.request({
  endpoint: "${service.endpoint}",
  budget: { max: ${service.price}, asset: "USDC" },
  network: "${service.network}"
})
// → 402 PAYMENT REQUIRED
// → authorize() → settle() → payload`}</pre>
          </DataPanel>
        </div>
      </div>
    </PageShell>
  );
}
