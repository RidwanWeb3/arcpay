import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SERVICES } from "@/lib/demoData";
import { ServiceCard } from "@/components/kit/cards";
import { CyberButton, MetricCard, LinkButton } from "@/components/kit/primitives";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Service Marketplace — ArcPay Agent" },
      {
        name: "description",
        content:
          "Priced API endpoints agents can buy per request: market data, inference, search, storage and compute, settled in USDC on ARC.",
      },
      { property: "og:title", content: "Service Marketplace — ArcPay Agent" },
      { property: "og:description", content: "Every endpoint advertises a price. Agents pay per request." },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const categories = useMemo(() => ["ALL", ...Array.from(new Set(SERVICES.map((s) => s.category)))], []);
  const [cat, setCat] = useState("ALL");
  const list = SERVICES.filter((s) => (cat === "ALL" ? true : s.category === cat));
  const cheapest = Math.min(...SERVICES.map((s) => s.price));
  const avgLatency = Math.round(SERVICES.reduce((s, x) => s + x.responseTimeMs, 0) / SERVICES.length);

  return (
    <PageShell
      eyebrow="APA://SERVICES"
      title="Agent Service Marketplace"
      description="Machine-readable endpoints that quote a price before they answer. An agent discovers a provider, receives a 402 payment challenge, pays in USDC and consumes the resource."
      wide
      actions={<LinkButton to="/payments" size="sm" variant="primary">OPEN PAYMENT TERMINAL</LinkButton>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="SERVICES" value={String(SERVICES.length)} sub="PRICED ENDPOINTS" tone="accent" />
        <MetricCard label="LOWEST PRICE" value={`${cheapest} USDC`} sub="SUB-CENT CAPABLE" tone="cyan" />
        <MetricCard label="AVG RESPONSE" value={`${avgLatency} ms`} sub="DEMO FIXTURE" />
        <MetricCard label="SETTLEMENT" value="ARC / USDC" sub="STABLE VALUE" />
      </div>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <CyberButton key={c} size="sm" variant={cat === c ? "primary" : "ghost"} onClick={() => setCat(c)}>
            {c}
          </CyberButton>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </PageShell>
  );
}
