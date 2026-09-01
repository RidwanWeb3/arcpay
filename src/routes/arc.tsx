import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { CyberCard, DataPanel, ExternalButton, MetricCard, SectionTitle } from "@/components/kit/primitives";
import { TerminalWindow } from "@/components/kit/TerminalWindow";
import { OFFICIAL_SOURCES } from "@/config/projectConfig";

export const Route = createFileRoute("/arc")({
  head: () => ({
    meta: [
      { title: "ARC Network Architecture — ArcPay Agent" },
      {
        name: "description",
        content:
          "How ArcPay Agent is designed around ARC: settlement layer, agent runtime, policy engine and priced service discovery with USDC.",
      },
      { property: "og:title", content: "ARC Network Architecture — ArcPay Agent" },
      { property: "og:description", content: "The layered architecture behind agent-native settlement on ARC." },
      { property: "og:url", content: "/arc" },
    ],
    links: [{ rel: "canonical", href: "/arc" }],
  }),
  component: ArcPage,
});

const LAYERS = [
  { n: "L4", t: "AGENT RUNTIME", d: "Autonomous processes with a mandate, a wallet and an audit trail." },
  { n: "L3", t: "POLICY ENGINE", d: "Ceilings, allow-lists and session limits evaluated before any authorization." },
  { n: "L2", t: "PAYMENT ROUTER", d: "Handles 402 challenges, authorization, verification and receipts." },
  { n: "L1", t: "ARC SETTLEMENT", d: "Stable-value USDC settlement designed for high-frequency machine traffic." },
];

function ArcPage() {
  return (
    <PageShell
      eyebrow="APA://ARC"
      title="Network Architecture"
      description="ARCPAY AGENT is structured as four layers. Each one has a single responsibility, so a failure in agent logic can never become an unbounded financial event."
      wide
      actions={
        <ExternalButton href={OFFICIAL_SOURCES.arc} size="sm" variant="primary">
          ARC.NETWORK ↗
        </ExternalButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SETTLEMENT LAYER" value="ARC" sub="TARGET NETWORK" tone="accent" />
        <MetricCard label="SETTLEMENT ASSET" value="USDC" sub="STABLE VALUE" tone="cyan" />
        <MetricCard label="PAYMENT CLASS" value="SUB-CENT" sub="NANOPAYMENTS" />
        <MetricCard label="AUTHORIZATION" value="POLICY-BOUND" sub="NO HUMAN IN LOOP" />
      </div>

      <section className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <SectionTitle index="01 / STACK" title="Layered responsibility" />
          <div className="mt-6 grid gap-3">
            {LAYERS.map((l) => (
              <CyberCard key={l.n} interactive className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-accent/50 bg-accent/10 font-mono text-[11px] text-accent">
                  {l.n}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] tracking-[0.16em] text-silver">{l.t}</span>
                  <span className="mt-2 block text-[13px] leading-relaxed text-muted-foreground">{l.d}</span>
                </span>
              </CyberCard>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-6">
          <TerminalWindow title="APA://ARC/FLOW" mode="DIAGRAM">
            <pre className="overflow-auto whitespace-pre text-[11px] leading-6 text-silver/85">{`  [ AGENT ]
      │  task requires external capability
      ▼
  [ DISCOVERY ] ── queries priced service registry
      │
      ▼
  [ SERVICE ] ── HTTP 402 PAYMENT REQUIRED (price)
      │
      ▼
  [ POLICY ] ── ceiling? allow-list? session?
      │ pass
      ▼
  [ ROUTER ] ── authorize → verify
      │
      ▼
  [ ARC / USDC ] ── settle (simulated here)
      │
      ▼
  [ RESOURCE ] ── payload released, task complete`}</pre>
          </TerminalWindow>

          <DataPanel title="DESIGN CONSTRAINTS">
            <ul className="space-y-2 font-mono text-[11px] leading-6 text-muted-foreground">
              <li>→ An agent can never spend beyond its own isolated balance.</li>
              <li>→ Policy is evaluated before authorization, never after.</li>
              <li>→ Every settlement produces a receipt an operator can audit.</li>
              <li>→ Pricing stays in a stable unit so agents can compare offers.</li>
            </ul>
          </DataPanel>
        </div>
      </section>
    </PageShell>
  );
}
