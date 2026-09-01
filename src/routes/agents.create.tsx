import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { CyberButton, CyberCard, DataPanel, LinkButton, StatusIndicator } from "@/components/kit/primitives";
import { TerminalWindow } from "@/components/kit/TerminalWindow";
import { SERVICES } from "@/lib/demoData";
import type { RiskMode } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents/create")({
  head: () => ({
    meta: [
      { title: "Create an Agent — ArcPay Agent" },
      {
        name: "description",
        content:
          "Configure a simulated autonomous agent: purpose, capabilities, spending ceilings, risk mode and allowed services on ARC.",
      },
      { property: "og:title", content: "Create an Agent — ArcPay Agent" },
      { property: "og:description", content: "Design an agent's wallet policy before it ever spends a cent." },
      { property: "og:url", content: "/agents/create" },
    ],
    links: [{ rel: "canonical", href: "/agents/create" }],
  }),
  component: CreateAgent,
});

const CAPABILITIES = ["PAY", "VERIFY", "SETTLE", "DISCOVER", "RESEARCH", "ANALYZE", "MONITOR", "EXECUTE"];
const RISK: RiskMode[] = ["SAFE", "BALANCED", "AUTONOMOUS"];

function CreateAgent() {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [caps, setCaps] = useState<string[]>(["DISCOVER", "PAY"]);
  const [perTx, setPerTx] = useState(5);
  const [daily, setDaily] = useState(50);
  const [risk, setRisk] = useState<RiskMode>("BALANCED");
  const [session, setSession] = useState(120);
  const [allowed, setAllowed] = useState<string[]>([SERVICES[0]?.id ?? ""]);
  const [deployed, setDeployed] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const config = {
    name: name || "UNNAMED AGENT",
    purpose: purpose || "—",
    capabilities: caps,
    policy: {
      maxPerTransaction: perTx,
      maxDailySpend: daily,
      riskMode: risk,
      sessionMinutes: session,
      network: "ARC",
      asset: "USDC",
      allowedServices: allowed.filter(Boolean),
    },
    origin: "SIMULATION",
  };

  return (
    <PageShell
      eyebrow="APA://AGENTS/CREATE"
      title="Agent Builder"
      description="Define an agent's mandate and the financial guardrails it must operate within. Deployment here is simulated — the configuration is generated locally and never leaves your browser."
      wide
      actions={<LinkButton to="/agents" size="sm">← AGENT REGISTRY</LinkButton>}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <DataPanel title="01 · IDENTITY">
            <label className="label-mono block">AGENT NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TREASURY AGENT"
              className="mt-2 w-full border border-border bg-background/60 px-3 py-2.5 font-mono text-[12px] text-silver outline-none focus:border-accent"
            />
            <label className="label-mono mt-5 block">PURPOSE</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              placeholder="What is this agent allowed to accomplish?"
              className="mt-2 w-full resize-none border border-border bg-background/60 px-3 py-2.5 font-mono text-[12px] text-silver outline-none focus:border-accent"
            />
          </DataPanel>

          <DataPanel title="02 · CAPABILITIES">
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(caps, setCaps, c)}
                  className={cn(
                    "border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] transition-colors",
                    caps.includes(c)
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </DataPanel>

          <DataPanel title="03 · SPENDING POLICY" right={<StatusIndicator tone="idle" label={risk} />}>
            <Slider label="MAX PER TRANSACTION" value={perTx} min={1} max={100} onChange={setPerTx} unit="USDC" />
            <Slider label="MAX DAILY SPEND" value={daily} min={5} max={1000} step={5} onChange={setDaily} unit="USDC" />
            <Slider label="SESSION DURATION" value={session} min={15} max={480} step={15} onChange={setSession} unit="MIN" />
            <div className="mt-5">
              <div className="label-mono">RISK MODE</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {RISK.map((r) => (
                  <CyberButton
                    key={r}
                    size="sm"
                    variant={risk === r ? "primary" : "ghost"}
                    onClick={() => setRisk(r)}
                  >
                    {r}
                  </CyberButton>
                ))}
              </div>
            </div>
          </DataPanel>

          <DataPanel title="04 · ALLOWED SERVICES">
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(allowed, setAllowed, s.id)}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2.5 text-left transition-colors",
                    allowed.includes(s.id)
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-accent/30",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11px] text-silver">{s.name}</span>
                    <span className="label-mono">{s.category}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-cyan">{s.price} USDC</span>
                </button>
              ))}
            </div>
          </DataPanel>
        </div>

        <div className="grid content-start gap-6">
          <TerminalWindow title="APA://AGENTS/CREATE/PREVIEW" mode="SIMULATION">
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-[11px] text-silver/85">
              {JSON.stringify(config, null, 2)}
            </pre>
          </TerminalWindow>

          <CyberCard className="p-5">
            <div className="label-mono text-accent">DEPLOY</div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Deployment is simulated. In a live build this configuration would be signed by the operator wallet and
              registered with the ARC agent runtime.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CyberButton variant="primary" onClick={() => setDeployed(true)} disabled={!name.trim()}>
                DEPLOY AGENT (SIMULATED)
              </CyberButton>
              <CyberButton
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard?.writeText(JSON.stringify(config, null, 2));
                }}
              >
                COPY CONFIG
              </CyberButton>
            </div>
            {deployed ? (
              <p className="mt-4 border border-success/40 bg-success/10 px-3 py-2 font-mono text-[11px] text-success">
                AGENT “{config.name}” REGISTERED IN LOCAL SESSION — SIMULATED DEPLOYMENT.
              </p>
            ) : null}
          </CyberCard>
        </div>
      </div>
    </PageShell>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <span className="label-mono">{label}</span>
        <span className="shrink-0 font-mono text-[11px] text-accent">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}
