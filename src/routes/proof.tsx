import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { OFFICIAL_SOURCES, projectConfig, isContractAvailable } from "@/config/projectConfig";
import { CyberCard, DataPanel, ExternalButton, MetricCard, NetworkBadge, SectionTitle, StatusIndicator } from "@/components/kit/primitives";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/proof")({
  head: () => ({
    meta: [
      { title: "Proof & References — ArcPay Agent" },
      {
        name: "description",
        content:
          "ArcPay Agent is an independent project concept inspired by publicly documented agentic payment infrastructure from Circle. Five official public sources anchor the thesis.",
      },
      { property: "og:title", content: "Proof & References — ArcPay Agent" },
      {
        property: "og:description",
        content:
          "Five official Circle publications anchor the agentic-payment thesis. Every link opens the primary public source in a new tab. No invented partnerships.",
      },
      { property: "og:url", content: "/proof" },
    ],
    links: [{ rel: "canonical", href: "/proof" }],
  }),
  component: ProofPage,
});

/* ── Types ─────────────────────────────────────────────────────────────── */

type PillarBullet = { label: string; detail?: string };
type FlowStep = { idx: string; label: string; accent?: boolean; note?: string };

type ProofRef = {
  index: "01" | "02" | "03" | "04" | "05";
  eyebrow: string;
  title: string;
  headline: string;
  body: string;
  bullets: PillarBullet[];
  flow?: FlowStep[];
  href: string;
  source: string;
  cta: string;
  accent: "accent" | "cyan" | "success" | "warning" | "primary";
  icon: string;
};

/* ── Data — 5 official proof cards ────────────────────────────────────── */

const PROOF_REFS: ProofRef[] = [
  {
    index: "01",
    eyebrow: "FOUNDATION · BLOG POST",
    title: "Circle Agent Stack",
    headline: "Financial infrastructure purpose-built for the agentic economy.",
    body: "Circle describes the Agent Stack as a coordinated set of primitives that enable autonomous agents to hold funds, discover priced services, and settle transactions programmatically — without a human in the loop for every micro-decision.",
    bullets: [
      { label: "Agent wallets" },
      { label: "Programmable USDC settlement" },
      { label: "Service discovery layer" },
      { label: "Machine-native commerce rails" },
    ],
    href: OFFICIAL_SOURCES.circleAgentStackBlog,
    source: "circle.com/blog · Introducing Circle Agent Stack",
    cta: "READ THE ANNOUNCEMENT ↗",
    accent: "primary",
    icon: "◈",
  },
  {
    index: "02",
    eyebrow: "REFERENCE IMPLEMENTATION · BLOG POST",
    title: "High-Frequency Sub-Cent Transactions",
    headline: "A published reference stack combining Arc Testnet, USDC, x402, nanopayments and Circle Gateway.",
    body: "Circle published a concrete agentic-system walkthrough in which an AI payment agent consumes sub-cent priced HTTP endpoints over ARC testnet using USDC. The post explicitly names the components that form this project's technical north-star.",
    bullets: [
      { label: "Arc Testnet" },
      { label: "USDC native gas settlement" },
      { label: "x402 payment-required HTTP semantics" },
      { label: "Circle Gateway + AI payment agent" },
      { label: "Nanopayments < $0.01" },
    ],
    href: OFFICIAL_SOURCES.circleSubCent,
    source: "circle.com/blog · Build agentic systems for high-frequency sub-cent transactions",
    cta: "OPEN REFERENCE IMPLEMENTATION ↗",
    accent: "accent",
    icon: "⟡",
  },
  {
    index: "03",
    eyebrow: "PROVIDER FLOW · BLOG POST",
    title: "Turn Your API into a Storefront for Agents",
    headline: "The canonical five-step agent–provider handshake: DISCOVER → REQUEST → 402 → PAY → ACCESS.",
    body: "Circle's published model for agent-facing API storefronts mirrors the PAY & EXECUTE flow wired into ArcPay. An agent discovers a priced resource, requests it, receives an HTTP 402 response with a price quote, pays with USDC, and consumes the payload.",
    flow: [
      { idx: "→", label: "DISCOVER", note: "Service marketplace index" },
      { idx: "→", label: "REQUEST", note: "Agent calls endpoint" },
      { idx: "→", label: "402", accent: true, note: "Payment required — quote returned" },
      { idx: "→", label: "PAY", accent: true, note: "USDC settles on ARC" },
      { idx: "→", label: "RESOURCE", note: "Provider releases payload" },
    ],
    bullets: [
      { label: "HTTP 402 as the price quote envelope" },
      { label: "Agents pay; not a human form-submit" },
      { label: "Usage-based pricing per API call" },
    ],
    href: OFFICIAL_SOURCES.circleStorefront,
    source: "circle.com/blog · Turn your API into a storefront for agents",
    cta: "READ THE FLOW DIAGRAM ↗",
    accent: "cyan",
    icon: "◇",
  },
  {
    index: "04",
    eyebrow: "PAYMENT RAIL · PRODUCT PAGE",
    title: "Circle Nanopayments",
    headline: "Machine-scale USDC pricing with granularity below the minimum unit of human payment interfaces.",
    body: "Nanopayments is the official Circle product category for per-call, per-token, per-invocation billing priced in fractions of a cent. It is the settlement primitive class that ArcPay Agent runtime models in its PAY & EXECUTE surface.",
    bullets: [
      { label: "Sub-cent USDC pricing" },
      { label: "Usage-based, per-resource billing" },
      { label: "Machine-to-machine scale throughput" },
      { label: "Stable-value settlement, no fiat FX friction" },
    ],
    href: OFFICIAL_SOURCES.circleNanopayments,
    source: "circle.com/nanopayments · Product page",
    cta: "VISIT NANOPAYMENTS PAGE ↗",
    accent: "success",
    icon: "◎",
  },
  {
    index: "05",
    eyebrow: "PRIMITIVE SUITE · PRODUCT PAGE",
    title: "Circle Agent Stack Product Surface",
    headline: "Agent Wallets, a Marketplace, CLI, Nanopayments and the Skills layer that agents plug into.",
    body: "The Circle Agent Stack product page enumerates the five building-blocks that an agentic-payments interface must compose. ArcPay Agent draws its information architecture from this publicly documented taxonomy.",
    bullets: [
      { label: "Agent Wallets" },
      { label: "Agent Marketplace" },
      { label: "Circle CLI" },
      { label: "Nanopayments rail" },
      { label: "Circle Skills" },
    ],
    href: OFFICIAL_SOURCES.circleAgentStack,
    source: "circle.com/agent-stack · Product page",
    cta: "OPEN AGENT STACK OVERVIEW ↗",
    accent: "warning",
    icon: "⌬",
  },
];

/* ── Small UI helpers ─────────────────────────────────────────────────── */

const accentText: Record<ProofRef["accent"], string> = {
  primary: "text-primary",
  accent: "text-accent",
  cyan: "text-cyan",
  success: "text-success",
  warning: "text-warning",
};

const accentBg: Record<ProofRef["accent"], string> = {
  primary: "bg-primary/10 text-primary border-primary/30",
  accent: "bg-accent/10 text-accent border-accent/30",
  cyan: "bg-cyan/10 text-cyan border-cyan/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
};

const accentGlow: Record<ProofRef["accent"], string> = {
  primary: "hover:shadow-[0_0_40px_-12px_var(--color-primary)]",
  accent: "hover:shadow-[0_0_40px_-12px_var(--color-accent)]",
  cyan: "hover:shadow-[0_0_40px_-12px_var(--color-cyan)]",
  success: "hover:shadow-[0_0_40px_-12px_var(--color-success)]",
  warning: "hover:shadow-[0_0_40px_-12px_var(--color-warning)]",
};

const accentBar: Record<ProofRef["accent"], string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  cyan: "bg-cyan",
  success: "bg-success",
  warning: "bg-warning",
};

function FlowRail({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background/40 p-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-9 min-w-0 items-center gap-2 rounded-sm border px-3 font-mono text-[11px] tracking-[0.12em]",
              s.accent ? "border-accent bg-accent/10 text-accent shadow-[0_0_18px_-8px_var(--color-accent)]" : "border-border bg-surface/50 text-silver",
            )}
          >
            <span className="font-semibold">{s.label}</span>
            {s.note ? (
              <span className="hidden text-[9px] text-muted-foreground sm:inline">· {s.note}</span>
            ) : null}
          </span>
          {i < steps.length - 1 ? (
            <span className="font-mono text-[10px] text-muted-foreground">{s.idx}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ThesisPillar({
  idx,
  title,
  body,
  children,
}: {
  idx: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <CyberCard className="p-5 panel-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-mono text-accent">PILLAR {idx}</div>
          <h3 className="mt-1.5 text-base font-semibold text-silver">{title}</h3>
        </div>
        <span className="label-mono inline-flex items-center gap-1.5 rounded-sm border border-success/30 bg-success/10 px-2 py-1 text-[9px] text-success">
          <StatusIndicator tone="online" pulse={false} /> PUBLIC · VERIFIABLE
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{body}</p>
      {children}
    </CyberCard>
  );
}

function NumberedProofCard({ ref }: { ref: ProofRef }) {
  return (
    <CyberCard
      interactive
      corners
      className={cn(
        "group relative flex flex-col overflow-hidden p-5 transition-shadow duration-300",
        accentGlow[ref.accent],
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-[2px]", accentBar[ref.accent])} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border text-xl font-semibold",
              accentBg[ref.accent],
            )}
            aria-hidden
          >
            {ref.icon}
          </span>
          <div className="min-w-0">
            <div className="label-mono text-[9px] text-muted-foreground">CARD {ref.index} · {ref.eyebrow}</div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-silver">{ref.title}</h3>
          </div>
        </div>
        <span className={cn("font-mono text-3xl font-semibold leading-none", accentText[ref.accent])}>
          {ref.index}
        </span>
      </div>

      <p className="mt-4 text-[13px] font-medium leading-6 text-silver/90">{ref.headline}</p>
      <p className="mt-2 text-[12.5px] leading-6 text-muted-foreground">{ref.body}</p>

      {ref.flow ? <FlowRail steps={ref.flow} /> : null}

      <ul className="mt-4 grid gap-1.5">
        {ref.bullets.map((b, i) => (
          <li
            key={i}
            className="flex items-start gap-2 border-l-2 border-border/60 pl-3 py-0.5 text-[12px] text-slate-300"
          >
            <span className={cn("mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full", accentBar[ref.accent])} />
            <span className="leading-5">
              {b.label}
              {b.detail ? <span className="text-muted-foreground"> — {b.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border/70 pt-4">
        <div className="min-w-0">
          <div className="label-mono text-[9px] text-muted-foreground">SOURCE</div>
          <div className="mt-0.5 break-all font-mono text-[10px] leading-5 text-accent/80">{ref.source}</div>
        </div>
        <ExternalButton href={ref.href} variant="primary" size="sm" className="shrink-0">
          {ref.cta}
        </ExternalButton>
      </div>
    </CyberCard>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

function ProofPage() {
  return (
    <PageShell
      eyebrow="APA://PROOF"
      title="Proof & Verifiable References"
      description='ArcPay Agent is an independent project concept inspired by publicly documented agentic payment infrastructure. Five official Circle publications anchor the thesis. Every link below opens the primary public source in a new tab.'
      wide
    >
      {/* ── Independent statement banner ──────────────────────── */}
      <CyberCard className="relative overflow-hidden border-primary/40 bg-primary/[0.03] p-6">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="label-mono flex items-center gap-2 text-[10px] text-warning">
              <StatusIndicator tone="info" pulse={false} /> PROJECT STATUS DISCLOSURE
            </div>
            <p className="mt-2 text-[14px] font-semibold leading-7 text-silver">
              ArcPay Agent is an independent project concept inspired by publicly documented agentic payment
              infrastructure.
            </p>
            <p className="mt-2 text-[12.5px] leading-6 text-muted-foreground">
              ArcPay Agent is <span className="underline decoration-dotted underline-offset-4 text-silver">not</span>{" "}
              officially partnered with Circle. ArcPay Agent is{" "}
              <span className="underline decoration-dotted underline-offset-4 text-silver">not</span> endorsed by
              Circle. ArcPay Agent is{" "}
              <span className="underline decoration-dotted underline-offset-4 text-silver">not</span> invested in by
              Circle. All claims on this page are anchored to public, first-party Circle materials you can verify
              yourself at the links below.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <NetworkBadge network={projectConfig.NETWORK} asset={projectConfig.PAYMENT_ASSET} />
            <span className="inline-flex items-center justify-center gap-2 border border-border bg-surface/60 px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-cyan">
              <StatusIndicator tone="online" pulse={false} /> 5 OFFICIAL SOURCES
            </span>
          </div>
        </div>
      </CyberCard>

      {/* ── Status metrics strip ──────────────────────────────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="PROJECT"
          value={projectConfig.PROJECT_NAME}
          sub={projectConfig.SHORT_NAME}
          tone="accent"
        />
        <MetricCard label="TICKER" value={projectConfig.TICKER} sub="SYMBOL" />
        <MetricCard
          label="SETTLEMENT NET"
          value={projectConfig.NETWORK}
          sub={`${projectConfig.PAYMENT_ASSET} NATIVE GAS`}
          tone="cyan"
        />
        <MetricCard
          label="CONTRACT"
          value={isContractAvailable ? "DEPLOYED" : "NOT DEPLOYED"}
          sub={isContractAvailable ? projectConfig.CONTRACT_ADDRESS : "NO FICTITIOUS ADDRESS SHOWN"}
          tone={isContractAvailable ? "accent" : "default"}
        />
      </div>

      {/* ── THE AGENTIC PAYMENT THESIS ────────────────────────── */}
      <section className="mt-16">
        <SectionTitle
          index="01 · THESIS"
          title="THE AGENTIC PAYMENT THESIS"
          subtitle="Four interconnected pillars, each anchored to a public Circle publication, describe why the next decade of API commerce is settled by agents — not humans clicking checkout."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ThesisPillar
            idx="A"
            title="Agents hold their own funds."
            body="Once an agent controls a stable-denominated wallet — programmatically, custodially or self-custodially — it can price every action against a budget without waiting for a human signer. Circle's published Agent Stack positions agent wallets as the lowest primitive in the stack, because nothing else composes without one."
          />
          <ThesisPillar
            idx="B"
            title="APIs quote a price; agents decide to pay."
            body="The provider-side loop is reversed: instead of a human reading Stripe checkout and typing a card, an endpoint returns a price via HTTP 402 semantics and the agent decides autonomously. Circle's 'storefront for agents' post formalises this five-step handshake: DISCOVER → REQUEST → 402 → PAY → ACCESS RESOURCE."
          />
          <ThesisPillar
            idx="C"
            title="Granularity goes below one cent."
            body="Model inference, search queries and API lookups are routinely priced at $0.0001 — well below what any card or invoicing rail can clear. Nanopayments on USDC-native settlement networks (such as ARC, explicitly named in Circle's sub-cent reference build) are the only class of rail that matches the pricing unit."
          />
          <ThesisPillar
            idx="D"
            title="The stack composes of five primitives."
            body="Wallets hold funds, a marketplace indexes priced services, a CLI automates them, the nanopayments rail settles, and a Skills layer lets agents plug capability on demand. Circle's public product page for the Agent Stack enumerates these five blocks — the same blocks ArcPay Agent's information architecture is drawn from."
          />
        </div>
      </section>

      {/* ── 5 OFFICIAL PROOF CARDS ───────────────────────────── */}
      <section className="mt-16">
        <SectionTitle
          index="02 · PROOF CARDS"
          title="FIVE OFFICIAL PROOF CARDS"
          subtitle="Each card links directly to the public Circle source page. Open every link, read the primary material, and compare with what ArcPay Agent implements — the correspondences are deliberate and documented."
          right={
            <span className="label-mono inline-flex items-center gap-2 text-[10px] text-success">
              <StatusIndicator tone="online" pulse={false} /> 5 / 5 SOURCES LIVE
            </span>
          }
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {PROOF_REFS.map((r) => (
            <NumberedProofCard key={r.index} ref={r} />
          ))}
        </div>
      </section>

      {/* ── What is NOT being claimed ────────────────────────── */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <DataPanel
          title="WHAT IS NOT CLAIMED"
          right={<span className="label-mono text-[9px] text-warning">NON-AFFILIATION NOTICE</span>}
        >
          <ul className="space-y-2 font-mono text-[11px] leading-6 text-muted-foreground">
            <li>→ No live on-chain transactions are executed by this demo interface.</li>
            <li>→ No partnership, integration, or endorsement by Circle is stated or implied.</li>
            <li>→ No sponsorship, investment, or affiliation with Circle.</li>
            <li>→ No yield, return, or price expectation is offered for {projectConfig.TICKER}.</li>
            <li>→ No contract address is rendered until one is actually deployed.</li>
            <li>→ The word "inspired" refers to public docs, not to confidential material.</li>
          </ul>
        </DataPanel>

        <DataPanel title="VERIFY FOR YOURSELF" right={<span className="label-mono text-[9px] text-cyan">DIY AUDIT</span>}>
          <p className="text-[13px] leading-6 text-muted-foreground">
            Every numbered card above contains a direct first-party link. For the strongest verification:
          </p>
          <ol className="mt-3 space-y-1.5 font-mono text-[11px] leading-6 text-slate-300">
            <li>1. Open each link in an isolated browser window (not just a preview).</li>
            <li>2. Search the source page for the phrases quoted in the headline and bullets.</li>
            <li>3. Confirm the Arc Testnet · USDC · x402 triad in Card 02's source.</li>
            <li>4. Confirm the DISCOVER → REQUEST → 402 → PAY → ACCESS flow in Card 03's source.</li>
            <li>5. Cross-check the five enumerated primitives (Card 05) against the thesis pillars.</li>
          </ol>
        </DataPanel>
      </section>

      {/* ── Footer disclaimer ────────────────────────────────── */}
      <footer className="mt-16 border-t border-border/70 pt-8">
        <CyberCard corners className="border-warning/30 bg-warning/[0.03] p-6">
          <div className="label-mono flex items-center gap-2 text-[10px] text-warning">
            <StatusIndicator tone="idle" pulse={false} /> DISCLAIMER · SOURCE ATTRIBUTION
          </div>
          <p className="mt-3 text-[12.5px] leading-7 text-muted-foreground">
            References above link to publicly available Circle materials. ArcPay Agent is an independent project and
            does not imply endorsement, partnership, sponsorship, or affiliation with Circle unless explicitly stated.
            All product names, brand names, and logos used on this page — including "Circle", "USDC", the Circle Agent
            Stack product lines, and "Nanopayments" — are the property of their respective owners and are used here
            solely for reference and identification purposes in accordance with their publicly available documentation.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ExternalButton href={OFFICIAL_SOURCES.circleAgentStack} size="sm">
              CIRCLE AGENT STACK ↗
            </ExternalButton>
            <ExternalButton href={OFFICIAL_SOURCES.circleNanopayments} size="sm">
              NANOPAYMENTS ↗
            </ExternalButton>
            <ExternalButton href={OFFICIAL_SOURCES.arc} size="sm">
              ARC.NETWORK ↗
            </ExternalButton>
          </div>
        </CyberCard>
      </footer>
    </PageShell>
  );
}
