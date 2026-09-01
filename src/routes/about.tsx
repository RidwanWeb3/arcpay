import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { CyberCard, DataPanel, Divider, LinkButton, SectionTitle } from "@/components/kit/primitives";
import { projectConfig, BANNER_SRC } from "@/config/projectConfig";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ArcPay Agent — Why Agents Need Their Own Payment Layer" },
      {
        name: "description",
        content:
          "The thesis behind ArcPay Agent (APA): autonomous software needs identity, spending policy and stable-value settlement to transact at machine speed on ARC.",
      },
      { property: "og:title", content: "About ArcPay Agent" },
      { property: "og:description", content: "Why autonomous agents need a payment layer designed for machines." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const PROBLEMS = [
  {
    t: "HUMAN RAILS ASSUME A HUMAN",
    d: "Card networks, invoices and checkout flows are built around a person approving a purchase. An agent making 4,000 sub-cent calls an hour has no place in that model.",
  },
  {
    t: "MINIMUM TICKET SIZES",
    d: "Traditional fees make a $0.001 request economically impossible. Machine commerce needs pricing granularity below one cent.",
  },
  {
    t: "NO NATIVE ACCOUNTABILITY",
    d: "When software spends money, the question is not 'did it pay' but 'was it allowed to'. Policy has to live next to the wallet.",
  },
];

const ANSWERS = [
  { t: "AGENT WALLETS", d: "Isolated balances per agent, so a compromised or looping agent cannot drain the treasury." },
  { t: "POLICY CEILINGS", d: "Per-transaction, per-day and per-session limits evaluated before value moves." },
  { t: "PRICED DISCOVERY", d: "Services quote a price in a machine-readable challenge. Agents compare before committing." },
  { t: "STABLE SETTLEMENT", d: "USDC keeps pricing legible; ARC targets the throughput profile machine traffic requires." },
];

const ROADMAP = [
  { p: "PHASE 01", t: "INTERFACE", d: "Agent terminal, service marketplace and simulated 402 payment lifecycle.", s: "CURRENT" },
  { p: "PHASE 02", t: "POLICY ENGINE", d: "Declarative spending policies with signed operator approval and audit export.", s: "NEXT" },
  { p: "PHASE 03", t: "LIVE RAILS", d: "Wire the interface to real ARC endpoints and USDC settlement.", s: "PLANNED" },
  { p: "PHASE 04", t: "AGENT ECONOMY", d: "Provider onboarding, reputation and revenue share for service operators.", s: "PLANNED" },
];

function AboutPage() {
  return (
    <PageShell
      eyebrow="APA://ABOUT"
      title="Agents transact. ArcPay settles."
      description="ARCPAY AGENT is a concept build: a complete, honest interface for what agent-native payment infrastructure should feel like — before a single cent moves on-chain."
      actions={
        <>
          <LinkButton to="/proof" size="sm" variant="primary">VERIFIABLE REFERENCES</LinkButton>
          <LinkButton to="/arc" size="sm">NETWORK ARCHITECTURE</LinkButton>
        </>
      }
    >
      <CyberCard className="hud-corners overflow-hidden p-0">
        <img
          src={BANNER_SRC}
          alt="ARCPAY AGENT banner — automate, participate, earn"
          className="w-full object-cover"
          width={1200}
          height={630}
        />
      </CyberCard>

      <section className="mt-14">
        <SectionTitle index="01 / PROBLEM" title="Payment rails were not designed for software" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <CyberCard key={p.t} interactive className="p-5">
              <h3 className="font-mono text-[12px] tracking-[0.16em] text-accent">{p.t}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{p.d}</p>
            </CyberCard>
          ))}
        </div>
      </section>

      <div className="mt-14"><Divider /></div>

      <section className="mt-14">
        <SectionTitle index="02 / APPROACH" title="Four primitives, one loop" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ANSWERS.map((a) => (
            <DataPanel key={a.t} title={a.t}>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{a.d}</p>
            </DataPanel>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionTitle index="03 / ROADMAP" title="Where this goes" subtitle="Stated plainly, with no promised dates." />
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROADMAP.map((r) => (
            <CyberCard key={r.p} className="p-5">
              <div className="flex items-center justify-between">
                <span className="label-mono text-accent">{r.p}</span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-warning">{r.s}</span>
              </div>
              <h3 className="mt-3 font-mono text-[12px] tracking-[0.16em] text-silver">{r.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{r.d}</p>
            </CyberCard>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <DataPanel title="HONEST DISCLOSURE">
          <ul className="space-y-2 font-mono text-[11px] leading-6 text-muted-foreground">
            <li>→ Every number, agent and transaction in this build is demo data.</li>
            <li>→ No token contract is deployed. {projectConfig.TICKER} contract status: COMING SOON.</li>
            <li>→ ArcPay Agent is not affiliated with, endorsed by, or partnered with Circle or ARC.</li>
            <li>→ Nothing here is financial advice or an offer of any instrument.</li>
          </ul>
        </DataPanel>
      </section>
    </PageShell>
  );
}
