import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ServiceCard } from "@/components/kit/cards";
import { CyberButton, MetricCard, LinkButton } from "@/components/kit/primitives";
import type { ServiceCategory, SortKey } from "@/types";
import { useServices } from "@/lib/live/adapters";
import { isDemoMode } from "@/config/projectConfig";

const MARKETPLACE_FILTERS: ReadonlyArray<"ALL" | ServiceCategory> = [
  "ALL",
  "AI",
  "DATA",
  "COMPUTE",
  "FINANCE",
];
const MARKETPLACE_SORTS: ReadonlyArray<SortKey> = [
  "PRICE",
  "POPULARITY",
  "LATENCY",
  "AVAILABILITY",
];

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Service Marketplace — ArcPay Agent" },
      {
        name: "description",
        content:
          "Futuristic API exchange for AI agents. Priced endpoints in DATA / AI / COMPUTE / SEARCH / STORAGE / FINANCE / ORACLES / CONTENT with 402 Payment Required flow.",
      },
      { property: "og:title", content: "Agent Service Marketplace — ArcPay Agent" },
      {
        property: "og:description",
        content: "Every endpoint advertises a price. Agents pay per request.",
      },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: SERVICES, isFetching, refetch } = useServices();
  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(SERVICES.map((s) => s.category)))],
    [SERVICES],
  );
  const [cat, setCat] = useState<(typeof MARKETPLACE_FILTERS)[number] | ServiceCategory>("ALL");
  const [sort, setSort] = useState<SortKey>("POPULARITY");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  const cheapest = useMemo(() => Math.min(...SERVICES.map((s) => s.price)), [SERVICES]);
  const avgLatency = useMemo(
    () => (SERVICES.length ? Math.round(SERVICES.reduce((s, x) => s + x.latency, 0) / SERVICES.length) : 0),
    [SERVICES],
  );
  const avgAvailability = useMemo(
    () => (SERVICES.length ? (SERVICES.reduce((s, x) => s + x.availability, 0) / SERVICES.length).toFixed(2) : "0.00"),
    [SERVICES],
  );

  const list = useMemo(() => {
    const filtered = SERVICES.filter((s) => (cat === "ALL" ? true : s.category === cat));
    return [...filtered].sort((a, b) => {
      let va: number;
      let vb: number;
      switch (sort) {
        case "PRICE":
          va = a.price;
          vb = b.price;
          return sortDir === "ASC" ? va - vb : vb - va;
        case "POPULARITY":
          va = a.popularity;
          vb = b.popularity;
          return sortDir === "ASC" ? va - vb : vb - va;
        case "LATENCY":
          va = a.latency;
          vb = b.latency;
          return sortDir === "ASC" ? va - vb : vb - va;
        case "AVAILABILITY":
          va = a.availability;
          vb = b.availability;
          return sortDir === "ASC" ? va - vb : vb - va;
      }
    });
  }, [SERVICES, cat, sort, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    else {
      setSort(k);
      setSortDir(k === "PRICE" || k === "LATENCY" ? "ASC" : "DESC");
    }
  };

  const secondaryCats = categories.filter(
    (c) => !MARKETPLACE_FILTERS.includes(c as (typeof MARKETPLACE_FILTERS)[number]),
  );

  return (
    <PageShell
      eyebrow="APA://SERVICES/EXCHANGE"
      title="Agent Service Marketplace"
      description="Machine-readable API exchange designed for autonomous agents. Every endpoint advertises a price, returns a 402 Payment Required challenge, then releases the payload once USDC settles on ARC."
      wide
      actions={
        <>
          <CyberButton size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "REFETCHING…" : "REFRESH"}
          </CyberButton>
          <LinkButton to="/payments" size="sm" variant="primary">
            OPEN PAYMENT TERMINAL
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="SERVICES"
          value={String(SERVICES.length)}
          sub="PRICED ENDPOINTS"
          tone="accent"
        />
        <MetricCard
          label="LOWEST PRICE"
          value={`${cheapest} USDC`}
          sub="SUB-CENT CAPABLE"
          tone="cyan"
        />
        <MetricCard label="AVG LATENCY" value={`${avgLatency} ms`} sub={isDemoMode ? "DEMO FIXTURE" : "MEASURED LIVE"} />
        <MetricCard label="AVG UPTIME" value={`${avgAvailability}%`} sub="SLA MEASURED" />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {MARKETPLACE_FILTERS.map((c) => (
            <CyberButton
              key={c}
              size="sm"
              variant={cat === c ? "primary" : "ghost"}
              onClick={() => setCat(c)}
            >
              {c}
            </CyberButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label-mono mr-1">SORT:</span>
          {MARKETPLACE_SORTS.map((k) => {
            const active = sort === k;
            return (
              <CyberButton
                key={k}
                size="sm"
                variant={active ? "primary" : "ghost"}
                onClick={() => toggleSort(k)}
              >
                {k}
                {active ? (sortDir === "ASC" ? " ↑" : " ↓") : ""}
              </CyberButton>
            );
          })}
        </div>
      </div>

      {secondaryCats.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {secondaryCats.map((c) => (
            <CyberButton
              key={c}
              size="sm"
              variant={cat === c ? "outline" : "ghost"}
              onClick={() => setCat(c as ServiceCategory)}
              className={cat !== c ? "opacity-75" : ""}
            >
              {c}
            </CyberButton>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </PageShell>
  );
}
