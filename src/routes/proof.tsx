import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { OFFICIAL_SOURCES, projectConfig, isContractAvailable } from "@/config/projectConfig";
import { ProofCard } from "@/components/kit/cards";
import { DataPanel, ExternalButton, SectionTitle } from "@/components/kit/primitives";

export const Route = createFileRoute("/proof")({
  head: () => ({
    meta: [
      { title: "Proof & References — ArcPay Agent" },
      {
        name: "description",
        content:
          "Verifiable public references behind the agentic payment thesis: Circle's agent stack, nanopayments research and the ARC network.",
      },
      { property: "og:title", content: "Proof & References — ArcPay Agent" },
      { property: "og:description", content: "Every claim links to a primary public source. No invented partnerships." },
      { property: "og:url", content: "/proof" },
    ],
    links: [{ rel: "canonical", href: "/proof" }],
  }),
  component: ProofPage,
});

const REFS = [
  {
    title: "Circle Agent Stack",
    source: "circle.com",
    href: OFFICIAL_SOURCES.circleAgentStack,
    description: "Circle's published financial infrastructure direction for the agentic economy.",
  },
  {
    title: "Introducing Circle Agent Stack",
    source: "circle.com/blog",
    href: OFFICIAL_SOURCES.circleAgentStackBlog,
    description: "Announcement outlining agent wallets, programmable payments and machine-native settlement.",
  },
  {
    title: "Sub-cent, high-frequency transactions",
    source: "circle.com/blog",
    href: OFFICIAL_SOURCES.circleSubCent,
    description: "Why agent traffic requires pricing granularity below one cent.",
  },
  {
    title: "Turn your API into a storefront for agents",
    source: "circle.com/blog",
    href: OFFICIAL_SOURCES.circleStorefront,
    description: "The provider side of the loop: APIs quoting a price agents can pay directly.",
  },
  {
    title: "Nanopayments",
    source: "circle.com",
    href: OFFICIAL_SOURCES.circleNanopayments,
    description: "Primary reference for the payment size class this interface models.",
  },
  {
    title: "ARC Network",
    source: "arc.network",
    href: OFFICIAL_SOURCES.arc,
    description: "The settlement network this concept is designed around.",
  },
];

function ProofPage() {
  return (
    <PageShell
      eyebrow="APA://PROOF"
      title="Proof & Verifiable References"
      description="ARCPAY AGENT is a concept build inspired by publicly documented work on agentic payments. Every external claim on this site links to a primary source you can read yourself."
      wide
    >
      <DataPanel title="STATUS DISCLOSURE">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["PROJECT", projectConfig.PROJECT_NAME],
            ["TICKER", projectConfig.TICKER],
            ["CONTRACT", isContractAvailable ? projectConfig.CONTRACT_ADDRESS : "NOT DEPLOYED — COMING SOON"],
            ["DATA MODE", projectConfig.DATA_MODE],
          ].map(([k, v]) => (
            <div key={k} className="border border-border bg-background/50 px-3 py-2.5">
              <dt className="label-mono">{k}</dt>
              <dd className="mt-1 break-words font-mono text-[11px] text-silver">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-mono text-[11px] leading-6 text-warning">
          ArcPay Agent is an independent concept project. It is not affiliated with, endorsed by, or in partnership with
          Circle, ARC, or any organization referenced below.
        </p>
      </DataPanel>

      <section className="mt-12">
        <SectionTitle
          index="01 / SOURCES"
          title="Primary public references"
          subtitle="Read the underlying material before drawing conclusions from any interface — including this one."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REFS.map((r) => (
            <ProofCard key={r.href} title={r.title} source={r.source} href={r.href} description={r.description} />
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <DataPanel title="TOKEN LINKS">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            The only official market links for {projectConfig.TICKER}. Ignore any address shared elsewhere.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ExternalButton href={projectConfig.BUY_URL} variant="primary" size="sm">
              BUY · RADARDEX.PRO
            </ExternalButton>
            <ExternalButton href={projectConfig.CHART_URL} size="sm">
              CHART · RADARDEX.PRO
            </ExternalButton>
          </div>
        </DataPanel>
        <DataPanel title="WHAT IS NOT CLAIMED">
          <ul className="space-y-2 font-mono text-[11px] leading-6 text-muted-foreground">
            <li>→ No live on-chain transactions are executed by this site.</li>
            <li>→ No partnership, integration or endorsement is implied.</li>
            <li>→ No yield, return or price expectation is offered.</li>
            <li>→ No contract address is displayed until one exists.</li>
          </ul>
        </DataPanel>
      </section>
    </PageShell>
  );
}
