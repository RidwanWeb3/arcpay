import { createFileRoute } from "@tanstack/react-router";
import { BANNER_SRC, projectConfig, isContractAvailable } from "@/config/projectConfig";
import {
  CyberCard,
  DataPanel,
  Divider,
  LinkButton,
  ExternalButton,
  MetricCard,
  NetworkBadge,
  ModeBadge,
  SectionTitle,
  StatusIndicator,
} from "@/components/kit/primitives";
import { AgentCard, ServiceCard } from "@/components/kit/cards";
import { SystemStatusBar } from "@/components/home/SystemStatusBar";
import { DemoTerminal } from "@/components/home/DemoTerminal";
import { useAgents, useServices, useDashboardSeries } from "@/lib/live/adapters";
import { LineChartPanel } from "@/components/kit/ChartPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArcPay Agent — The Payment Layer for Autonomous Agents" },
      {
        name: "description",
        content:
          "ArcPay Agent (APA) is an agent-native payment interface: autonomous agents discover services, authorize sub-cent USDC payments and settle on ARC.",
      },
      { property: "og:title", content: "ArcPay Agent — The Payment Layer for Autonomous Agents" },
      {
        property: "og:description",
        content: "Agents transact. ArcPay settles. An AI-agent payment infrastructure concept built on ARC with USDC.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const PILLARS = [
  {
    k: "01",
    t: "AGENT IDENTITY",
    d: "Every agent runs with its own wallet, spending policy and audit trail. Identity is the unit of accountability.",
  },
  {
    k: "02",
    t: "PROGRAMMABLE PAYMENTS",
    d: "Payments are triggered by machine intent, bounded by policy ceilings and executed without a human in the loop.",
  },
  {
    k: "03",
    t: "SERVICE DISCOVERY",
    d: "APIs advertise a price. Agents query, compare and select the cheapest capable provider before paying.",
  },
  {
    k: "04",
    t: "SETTLEMENT ON ARC",
    d: "Stable-value settlement in USDC on ARC — designed for high-frequency, sub-cent machine transactions.",
  },
];

const LOOP = [
  { s: "AGENT", d: "Agent receives a task it cannot complete alone." },
  { s: "DISCOVERY", d: "Agent queries the service layer for a capable provider." },
  { s: "402", d: "Provider answers with a payment challenge and a price." },
  { s: "POLICY", d: "Spending policy validates amount, recipient and session limits." },
  { s: "SETTLEMENT", d: "USDC moves on ARC. The receipt is the authorization." },
  { s: "RESOURCE", d: "Provider releases the payload. Task completes." },
];

type LabeledSeries = { label: string; value: number };
function seriesToNumbers(input: number[] | LabeledSeries[]): number[] {
  if (input.length === 0) return [];
  if (typeof input[0] === "number") return input as number[];
  return (input as LabeledSeries[]).map((i) => i.value);
}

function Index() {
  const { data: AGENTS } = useAgents();
  const { data: SERVICES } = useServices();
  const { data: DASHBOARD_SERIES } = useDashboardSeries();
  const featured = AGENTS.slice(0, 3);
  const services = SERVICES.slice(0, 3);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="relative mx-auto max-w-[1600px] px-4 py-14 lg:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0 animate-rise">
              <div className="flex flex-wrap items-center gap-2">
                <NetworkBadge network="ARC" asset="USDC" />
                <ModeBadge />
              </div>
              <h1 className="mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-silver sm:text-5xl xl:text-6xl">
                THE PAYMENT LAYER FOR{" "}
                <span className="text-accent text-glow">AUTONOMOUS AGENTS</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                ARCPAY AGENT is an agent-native payment interface. Software agents discover priced services, receive a
                402 payment challenge, authorize sub-cent USDC transactions inside strict policy limits and settle on
                ARC — without a human approving each step.
              </p>
              <p className="mt-4 font-mono text-[12px] tracking-[0.18em] text-cyan">
                AUTOMATE. PARTICIPATE. EARN.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                <LinkButton to="/terminal" variant="primary" size="lg">
                  LAUNCH TERMINAL
                </LinkButton>
                <LinkButton to="/agents" size="lg">
                  VIEW AGENTS
                </LinkButton>
                <ExternalButton href={projectConfig.BUY_URL} size="lg" variant="ghost">
                  BUY {projectConfig.TICKER}
                </ExternalButton>
              </div>

              <dl className="mt-9 grid max-w-lg grid-cols-2 gap-px border border-border bg-border/60 sm:grid-cols-4">
                {[
                  ["TICKER", projectConfig.TICKER],
                  ["NETWORK", projectConfig.NETWORK],
                  ["ASSET", projectConfig.PAYMENT_ASSET],
                  ["CONTRACT", isContractAvailable ? "LIVE" : "SOON"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-background/80 px-3 py-2.5">
                    <dt className="label-mono">{k}</dt>
                    <dd className="mt-1 font-mono text-[12px] text-silver">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0">
              <CyberCard className="hud-corners overflow-hidden p-0">
                <img
                  src="/brand/apa-banner.png"
                  alt="ARCPAY AGENT — APA brand banner: automate, participate, earn"
                  className="w-full object-cover"
                  width={1200}
                  height={630}
                />
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-3">
                  <span className="min-w-0 truncate font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    INTELLIGENT AGENTS · REAL UTILITY · SUSTAINABLE VALUE
                  </span>
                  <StatusIndicator tone="online" label="LIVE UI" />
                </div>
              </CyberCard>
            </div>
          </div>

          <div className="mt-12">
            <SystemStatusBar />
          </div>
        </div>
      </section>

      {/* LOOP + TERMINAL */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
        <SectionTitle
          index="01 / AGENT ECONOMIC LOOP"
          title="Watch an agent pay for what it needs"
          subtitle="A complete machine-to-machine transaction: discovery, payment challenge, policy check, settlement, resource unlock."
          right={<ModeBadge mode="SIMULATION" />}
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <DemoTerminal />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {LOOP.map((l, i) => (
              <CyberCard key={l.s} interactive className="p-4">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-accent">STEP {String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-cyan">{l.s}</span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{l.d}</p>
              </CyberCard>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 lg:px-6">
        <Divider />
      </div>

      {/* PILLARS */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
        <SectionTitle
          index="02 / INFRASTRUCTURE"
          title="Built for machine-speed commerce"
          subtitle="Four primitives that make autonomous payments safe enough to run unattended."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((p) => (
            <CyberCard key={p.k} interactive className="hud-corners p-5">
              <div className="label-mono text-accent">{p.k}</div>
              <h3 className="mt-3 font-mono text-[13px] tracking-[0.16em] text-silver">{p.t}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{p.d}</p>
            </CyberCard>
          ))}
        </div>
      </section>

      {/* AGENTS */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
        <SectionTitle
          index="03 / AGENT CONTROL"
          title="Active agents"
          subtitle="Each agent carries its own wallet, budget ceiling and audit log."
          right={<LinkButton to="/agents" size="sm">ALL AGENTS</LinkButton>}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
        <SectionTitle
          index="04 / SERVICE MARKET"
          title="Priced APIs agents can buy"
          subtitle="Every endpoint advertises a price in USDC. Agents pay per request, not per subscription."
          right={<LinkButton to="/services" size="sm">MARKETPLACE</LinkButton>}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      {/* METRICS */}
      <section className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
        <SectionTitle
          index="05 / SYSTEM TELEMETRY"
          title="Network activity"
          subtitle="Demo telemetry illustrating the shape of agent-driven transaction flow."
          right={<LinkButton to="/dashboard" size="sm">FULL DASHBOARD</LinkButton>}
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <LineChartPanel title="AGENT ACTIVITY" data={seriesToNumbers(DASHBOARD_SERIES.agentActivity)} />
          <LineChartPanel title="PAYMENT VOLUME" data={seriesToNumbers(DASHBOARD_SERIES.paymentVolume)} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="AGENTS REGISTERED" value={String(AGENTS.length)} sub="DEMO REGISTRY" tone="accent" />
          <MetricCard label="SERVICES LISTED" value={String(SERVICES.length)} sub="PRICED ENDPOINTS" />
          <MetricCard label="SETTLEMENT ASSET" value="USDC" sub="STABLE VALUE" tone="cyan" />
          <MetricCard label="NETWORK" value="ARC" sub="AGENT SETTLEMENT LAYER" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1600px] px-4 pb-8 lg:px-6">
        <DataPanel title="APA://NEXT-STEP" right={<ModeBadge />}>
          <div className="grid gap-6 p-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-silver sm:text-2xl">
                {projectConfig.TAGLINE}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Explore the command terminal, inspect agent policies, or read the verifiable references behind the
                agentic payment thesis.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton to="/terminal" variant="primary">TERMINAL</LinkButton>
              <LinkButton to="/proof">PROOF</LinkButton>
              <LinkButton to="/about">ABOUT</LinkButton>
            </div>
          </div>
        </DataPanel>
      </section>
    </div>
  );
}
