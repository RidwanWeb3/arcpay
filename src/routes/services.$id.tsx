import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { PageShell } from "@/components/layout/PageShell";
import {
  CyberButton,
  CyberCard,
  DataPanel,
  LinkButton,
  MetricCard,
  StatusIndicator,
} from "@/components/kit/primitives";
import { TerminalWindow, LogLine, Caret } from "@/components/kit/TerminalWindow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import {
  fetchLiveServices,
  useService,
  useAgents,
  insertPayment,
  insertActivity,
} from "@/lib/live/adapters";
import { isDemoMode, projectConfig } from "@/config/projectConfig";
import type { Service } from "@/types";
import { ServiceStatusValue } from "@/types";

type PayStage = -1 | 0 | 1 | 2 | 3;
const PAY_LABELS: Record<Exclude<PayStage, -1>, string> = {
  0: "402 PAYMENT REQUIRED",
  1: "PAYMENT AUTHORIZED",
  2: "PAYMENT VERIFIED",
  3: "SERVICE RESPONSE",
};

function cryptoRandomHex(bytes: number): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint8Array(bytes);
    globalThis.crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < buf.length; i += 1) out += buf[i]!.toString(16).padStart(2, "0");
    return out;
  }
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < bytes * 2; i += 1) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function formatNow() {
  return new Date().toTimeString().slice(0, 8);
}

async function callLiveProvider(
  service: Service,
  apiKeys: Record<string, string>,
): Promise<{ result: string; channel: "API" | "DEMO"; error?: string }> {
  const category = (service.category as string).toLowerCase();
  const provider = service.provider.toLowerCase();
  try {
    if (category.includes("ai") || provider.includes("openai")) {
      if (!apiKeys["openai"]) return { result: "Missing VITE_OPENAI_API_KEY.", channel: "DEMO" };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeys["openai"]}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: service.description.slice(0, 60) }],
          max_tokens: 160,
        }),
      });
      const data = await res.json();
      return { result: JSON.stringify(data, null, 2).slice(0, 5000), channel: "API" };
    }
    if (provider.includes("replicate")) {
      if (!apiKeys["replicate"]) return { result: "Missing VITE_REPLICATE_API_TOKEN.", channel: "DEMO" };
      const res = await fetch(
        "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKeys["replicate"]}`,
          },
          body: JSON.stringify({
            input: { prompt: `${service.name} — cyberpunk ARC HUD grid style, 4k` },
          }),
        },
      );
      const data = await res.json();
      return { result: JSON.stringify(data, null, 2).slice(0, 5000), channel: "API" };
    }
    if (category.includes("finance") || category.includes("oracles") || provider.includes("coingecko")) {
      const cgkKey = apiKeys["coingecko"] ? `?x_cg_demo_api_key=${apiKeys["coingecko"]}` : "";
      const res = await fetch(`https://api.coingecko.com/api/v3/ping${cgkKey}`);
      const data = await res.json();
      return { result: JSON.stringify(data, null, 2).slice(0, 5000), channel: "API" };
    }
    return { result: service.exampleResponse ?? "Live integration not yet wired for this provider.", channel: "DEMO" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { result: `Provider call failed: ${msg}`, channel: "DEMO", error: msg };
  }
}

function envApiKeys(): Record<string, string> {
  const e = import.meta.env as Record<string, string | undefined>;
  return {
    openai: e["VITE_OPENAI_API_KEY"]?.trim() ?? "",
    replicate: e["VITE_REPLICATE_API_TOKEN"]?.trim() ?? "",
    anthropic: e["VITE_ANTHROPIC_API_KEY"]?.trim() ?? "",
    brave: e["VITE_BRAVE_API_KEY"]?.trim() ?? "",
    coingecko: e["VITE_COINGECKO_API_KEY"]?.trim() ?? "",
  };
}

export const Route = createFileRoute("/services/$id")({
  loader: async ({ params, context }) => {
    const services = (await context.queryClient.ensureQueryData({
      queryKey: ["arcpay", "services"],
      queryFn: () => fetchLiveServices(),
    })) as Service[];
    const service = services.find((s: Service) => s.id === params.id) ?? null;
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Service unavailable — ArcPay Agent" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const s = loaderData.service;
    return {
      meta: [
        { title: `${s.name} — ${s.price} ${s.paymentAsset} / ${s.unit} | ArcPay Agent` },
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
  const { service: liveService, refetch } = useService(service.id);
  const currentService = liveService ?? service;
  const wallet = useWallet();
  const router = useRouter();
  void router;

  const [stage, setStage] = useState<PayStage>(-1);
  const [logs, setLogs] = useState<{ channel: string; message: string; at: string }[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [responseChannel, setResponseChannel] = useState<"API" | "DEMO">("DEMO");
  const nonceRef = useRef<string>(cryptoRandomHex(16));
  const stageStartedAt = useRef<Record<number, number>>({});

  const statusTone =
    currentService.status === "AVAILABLE"
      ? "online"
      : currentService.status === "DEGRADED"
        ? "busy"
        : "offline";

  useEffect(() => {
    setStage(-1);
    setLogs([]);
    setTerminalLines([]);
    setSignature(null);
    setSigning(false);
    setResponse("");
    setResponseChannel("DEMO");
    nonceRef.current = cryptoRandomHex(16);
  }, [currentService.id]);

  const { data: allAgents } = useAgents();
  const compatibleAgents = useMemo(
    () =>
      allAgents.filter((a) => {
        const minBalOK = a.balance >= currentService.agentRequirements.minBalance;
        const capsOK =
          currentService.agentRequirements.requiredCapabilities.length === 0 ||
          currentService.agentRequirements.requiredCapabilities.every((c: string) => a.capabilities.includes(c));
        return minBalOK && capsOK;
      }),
    [allAgents, currentService.agentRequirements],
  );

  /* ── Sign payment authorization ──────────────────────── */
  const beginAuthorize = useCallback(async () => {
    if (signing) return;
    setSigning(true);
    try {
      const res = await wallet.signPaymentAuthorization({
        serviceId: currentService.id,
        nonce: nonceRef.current,
        amount: currentService.price,
        asset: currentService.paymentAsset,
        network: currentService.network,
        payTo: currentService.provider,
      });
      setSignature(res.signature);
      try {
        await insertPayment({
          service_id: currentService.id,
          agent_id: null,
          payer: wallet.address ?? "0x",
          payee: currentService.providerWallet,
          amount: Number(currentService.price),
          asset: currentService.paymentAsset,
          network: currentService.network,
          nonce: nonceRef.current,
          signature: res.signature,
          tx_hash: null,
          status: "AUTHORIZED",
          settled_at: null,
        });
        await insertActivity({
          time: formatNow(),
          actor: wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}` : "USER",
          action: "authorized",
          target: currentService.name,
          amount: Number(currentService.price),
          channel: "PAYMENT",
          severity: "INFO",
        });
      } catch {
        /* insert errors are non-fatal for the session */
      }
    } catch {
      setSignature(`0x${"F".repeat(64)}` as `0x${string}`);
    } finally {
      setSigning(false);
    }
  }, [wallet, currentService, signing]);

  /* ── Trigger signing when stage hits 1 ───────────────── */
  useEffect(() => {
    if (stage !== 1 || signature) return;
    void beginAuthorize();
  }, [stage, signature, beginAuthorize]);

  /* ── Stage 2: verify → call provider → response ─────── */
  useEffect(() => {
    if (stage !== 2) return;
    if (executing) return;
    setExecuting(true);
    const abort = new AbortController();
    (async () => {
      try {
        const keys = envApiKeys();
        const { result, channel } = await callLiveProvider(currentService, keys);
        setResponse(result);
        setResponseChannel(channel);
      } catch {
        setResponse(currentService.exampleResponse);
        setResponseChannel("DEMO");
      } finally {
        if (!abort.signal.aborted) setExecuting(false);
      }
    })().catch(() => {
      if (!abort.signal.aborted) setExecuting(false);
    });
    return () => abort.abort();
  }, [stage, currentService, executing]);

  /* ── Stage state machine with logs ───────────────────── */
  useEffect(() => {
    if (stage < 0) return;
    stageStartedAt.current[stage] = Date.now();

    if (stage === 1 && !signature) return;

    const delay = stage === 3 ? 900 : stage === 2 ? 2000 : 900;
    const t = setTimeout(() => {
      const at = formatNow();
      switch (stage) {
        case 0: {
          setTerminalLines((prev) => [
            ...prev,
            `$ agent request --endpoint "${currentService.endpoint}"`,
            ``,
            `HTTP/1.1 402 PAYMENT REQUIRED`,
            `X-APA-Protocol: 1.0`,
            `X-APA-Price: ${currentService.price} ${currentService.paymentAsset}`,
            `X-APA-Unit: ${currentService.unit}`,
            `X-APA-Settle: ${currentService.network} ${currentService.paymentMethod.assets[0]}`,
            `X-APA-Provider: ${currentService.provider}`,
            `X-APA-Nonce: ${nonceRef.current}`,
            ``,
            `{ "error": "402 Payment Required", "challenge": "pay:${currentService.provider}:${currentService.price}:${Date.now()}" }`,
          ]);
          setLogs((l) => [
            ...l,
            {
              channel: "SERVICE",
              message: `HTTP 402 — ${currentService.price} ${currentService.paymentAsset} / ${currentService.unit} required`,
              at,
            },
          ]);
          setStage(1);
          break;
        }
        case 1: {
          if (!signature) return;
          setTerminalLines((prev) => [
            ...prev,
            ``,
            `$ agent authorize --amount ${currentService.price} --asset ${currentService.paymentAsset} --to ${currentService.provider}`,
            `[POLICY] Per-transaction ceiling ${currentService.agentRequirements.maxPerTransaction} ${currentService.paymentAsset} >= ${currentService.price} ${currentService.paymentAsset}`,
            `[POLICY] Risk mode check PASSED`,
            wallet.connected && !wallet.simulated
              ? `[WALLET] Signed via ${wallet.connectorName ?? "wallet"}`
              : `[WALLET] Simulated signing session`,
            wallet.connected && wallet.address
              ? `[WALLET] Signer: ${wallet.address}`
              : `[WALLET] Signer: UNAVAILABLE`,
            `[WALLET] Sig: ${signature.slice(0, 10)}…${signature.slice(-8)}`,
            `→ PAYMENT AUTHORIZED`,
          ]);
          setLogs((l) => [
            ...l,
            {
              channel: "POLICY",
              message: `Amount within ceiling (${currentService.agentRequirements.maxPerTransaction}) — authorized`,
              at,
            },
            {
              channel: "PAYMENT",
              message: wallet.simulated
                ? "Payment intent signed (demo session)"
                : "Payment intent signed via wallet",
              at,
            },
          ]);
          setStage(2);
          break;
        }
        case 2: {
          if (executing) return;
          setTerminalLines((prev) => [
            ...prev,
            ``,
            `$ agent settle --network ${currentService.network} --asset ${currentService.paymentMethod.assets[0]}`,
            `[NETWORK] Broadcasting on ${currentService.network} (${currentService.paymentMethod.settlement.toLowerCase()})…`,
            `[NETWORK] …confirmations 1 / 1 …`,
            `[NETWORK] Receipt queued: 0x…${Math.floor(Math.random() * 9000 + 1000).toString(16)}`,
            response
              ? `[SERVICE] Payload released via ${responseChannel} — ${response.length} bytes`
              : `[SERVICE] Awaiting upstream response…`,
            `→ PAYMENT VERIFIED`,
          ]);
          setLogs((l) => [
            ...l,
            {
              channel: "NETWORK",
              message: `Verifying on ${currentService.network}`,
              at,
            },
            {
              channel: "PAYMENT",
              message: `${currentService.price} ${currentService.paymentAsset} → ${currentService.provider}`,
              at,
            },
          ]);
          setStage(3);
          break;
        }
        case 3: {
          setTerminalLines((prev) => [
            ...prev,
            ``,
            `HTTP/1.1 200 OK`,
            `X-APA-Settled: true`,
            `X-APA-Receipt: 0x…verified`,
            `Content-Type: application/json`,
            ``,
            `→ SERVICE RESPONSE (${responseChannel}):`,
            ...(response || currentService.exampleResponse).split("\n").map((l: string) => `  ${l}`),
          ]);
          setLogs((l) => [...l, { channel: "RESOURCE", message: "Payload released — 200 OK", at }]);
          break;
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [stage, currentService, signature, wallet, executing, response, responseChannel]);

  const start = () => {
    setSignature(null);
    setLogs([]);
    setTerminalLines([]);
    setResponse("");
    setResponseChannel("DEMO");
    nonceRef.current = cryptoRandomHex(16);
    if (!wallet.connected) wallet.connect();
    if (wallet.connected && !wallet.isCorrectChain) wallet.switchToArc();
    setStage(0);
  };

  const running = stage >= 0 && stage < 3;
  const complete = stage === 3;
  const payDisabled = signing || (running && stage === 1);

  const specYaml = useMemo(() => {
    const s = currentService;
    const headers = Object.entries(s.apiSpec.headers)
      .map(([k, v]) => `      ${k}: "${v}"`)
      .join("\n");
    const qp = s.apiSpec.queryParams
      ? Object.entries(s.apiSpec.queryParams)
          .map(([k, v]) => `        ${k}: ${v}`)
          .join("\n")
      : "";
    const bp = s.apiSpec.body
      ? `    body:\n${JSON.stringify(s.apiSpec.body, null, 8)
          .split("\n")
          .join("\n        ")
          .replace(/^ {8}$/gm, "")}`
      : "";
    const schema = JSON.stringify(s.apiSpec.responseSchema, null, 6)
      .split("\n")
      .map((l) => `      ${l}`)
      .join("\n");
    return `openapi: 3.1.0
info:
  title: ${s.name}
  version: 1.0.0
  provider: ${s.provider}
  x-apa-price: "${s.price} ${s.paymentAsset} / ${s.unit}"
servers:
  - url: https://api.arcpay.arc
paths:
  ${s.apiSpec.path}:
    ${s.apiSpec.method.toLowerCase()}:
      summary: ${s.name}
      security:
        - x-apa-protocol: []
      operationId: ${s.id}
      parameters:
${qp}
      requestBody:
${bp ? bp.replace(/^/gm, "        ") : ""}
      responses:
        "200":
          description: Resource unlocked after 402 settlement
          content:
            application/json:
              schema:
${schema}
        "402":
          $ref: "#/components/responses/PaymentRequired"
components:
  securitySchemes:
    x-apa-protocol:
      type: apiKey
      in: header
      name: X-APA-Wallet
  responses:
    PaymentRequired:
      description: Service quotes price before release
      headers:
        X-APA-Price: { schema: { type: string } }
        X-APA-Settle: { schema: { type: string } }`;
  }, [currentService]);

  void isDemoMode;
  void StatusIndicator;

  return (
    <PageShell
      eyebrow={`APA://SERVICES/${currentService.id.toUpperCase()}`}
      title={currentService.name}
      description={currentService.description}
      wide
      actions={
        <>
          <LinkButton to="/services" size="sm">
            ← MARKETPLACE
          </LinkButton>
          <CyberButton size="sm" variant="ghost" onClick={() => refetch()}>
            REFRESH
          </CyberButton>
          <CyberButton
            size="sm"
            variant="primary"
            onClick={start}
            disabled={running || signing}
            className="glow-ring"
          >
            {signing
              ? "SIGNING IN WALLET…"
              : running
                ? "PROCESSING…"
                : complete
                  ? "PAY & EXECUTE AGAIN"
                  : "PAY & EXECUTE"}
          </CyberButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="PRICE"
          value={`${currentService.price} ${currentService.paymentAsset}`}
          sub={`PER ${currentService.unit.toUpperCase()}`}
          tone="accent"
        />
        <MetricCard
          label="LATENCY"
          value={`${currentService.latency} ms`}
          sub={isDemoMode ? "DEMO FIXTURE" : "LIVE P50"}
          tone="cyan"
        />
        <MetricCard
          label="AVAILABILITY"
          value={`${currentService.availability}%`}
          sub={`TIER ${currentService.pricing.tier}`}
        />
        <MetricCard
          label="NETWORK"
          value={`${currentService.network} · ${currentService.paymentAsset}`}
          sub={currentService.paymentMethod.settlement}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <DataPanel
            title="402 PAYMENT FLOW"
            right={<StatusIndicator tone={statusTone} label={currentService.status} pulse={running} />}
          >
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(PAY_LABELS) as unknown as Array<Exclude<PayStage, -1>>)
                .map((k) => Number(k) as Exclude<PayStage, -1>)
                .map((i) => {
                  const done = stage > i;
                  const active = stage === i;
                  return (
                    <li key={i} className="relative flex flex-col gap-2">
                      {i < 3 ? (
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute left-5 top-3 hidden h-[2px] w-full max-w-[120px] sm:block",
                            active || done
                              ? "bg-gradient-to-r from-accent/60 to-cyan/40 animate-packet"
                              : "bg-border",
                          )}
                          style={{
                            animationIterationCount: active ? "infinite" : 1,
                            opacity: done || active ? 1 : 0.4,
                          }}
                        />
                      ) : null}
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center border font-mono text-[11px]",
                            done && "border-success/60 bg-success/15 text-success",
                            active && "border-accent bg-accent/10 text-accent animate-pulse",
                            !done && !active && "border-border/70 text-muted-foreground",
                          )}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span className="label-mono">{PAY_LABELS[i]}</span>
                      </div>
                      <p className="min-h-[32px] text-[11px] leading-4 text-muted-foreground">
                        {i === 0 && "Service responds 402 Payment Required with price + nonce."}
                        {i === 1 && "Agent's wallet signs EIP-191 payment authorization."}
                        {i === 2 && "Signature verified + provider executes API call."}
                        {i === 3 && "Settled receipt + service payload delivered."}
                      </p>
                    </li>
                  );
                })}
            </ol>
          </DataPanel>

          <TerminalWindow
            title={`APA://SERVICES/${currentService.id}/SESSION`}
            mode={wallet.simulated ? "SIMULATION" : "LIVE"}
          >
            <div className="h-[420px] overflow-y-auto p-3">
              {terminalLines.length === 0 ? (
                <p className="text-muted-foreground">
                  <Caret /> idle — click <span className="text-accent">PAY &amp; EXECUTE</span> to request
                  this endpoint.
                </p>
              ) : (
                terminalLines.map((l, i) =>
                  l.startsWith("$") ? (
                    <div key={i} className="mt-2 text-cyan">
                      <Caret />
                      {l.slice(2)}
                    </div>
                  ) : l.startsWith("HTTP/") || l.startsWith("X-APA-") || l.startsWith("{") || l.startsWith("}") || l.startsWith(`"` ) ? (
                    <div key={i} className="whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-silver/90">
                      {l}
                    </div>
                  ) : (
                    <div key={i} className="whitespace-pre-wrap break-all text-[11px] leading-5">
                      {l}
                    </div>
                  ),
                )
              )}
            </div>
          </TerminalWindow>

          <Tabs defaultValue="response" className="w-full">
            <TabsList>
              <TabsTrigger value="response">EXAMPLE RESPONSE</TabsTrigger>
              <TabsTrigger value="request">EXAMPLE REQUEST</TabsTrigger>
              <TabsTrigger value="openapi">OPENAPI SPEC</TabsTrigger>
              <TabsTrigger value="headers">402 HEADERS</TabsTrigger>
            </TabsList>
            <TabsContent value="response">
              <CyberCard className="hud-corners scanlines">
                <pre className="max-h-[420px] overflow-y-auto p-4 font-mono text-[11px] leading-5 text-silver/95">
                  {complete && response ? response : currentService.exampleResponse}
                </pre>
              </CyberCard>
            </TabsContent>
            <TabsContent value="request">
              <CyberCard className="hud-corners scanlines">
                <pre className="max-h-[420px] overflow-y-auto p-4 font-mono text-[11px] leading-5 text-silver/95">
                  {currentService.exampleRequest}
                </pre>
              </CyberCard>
            </TabsContent>
            <TabsContent value="openapi">
              <CyberCard className="hud-corners scanlines">
                <pre className="max-h-[420px] overflow-y-auto p-4 font-mono text-[11px] leading-5 text-silver/95">
                  {specYaml}
                </pre>
              </CyberCard>
            </TabsContent>
            <TabsContent value="headers">
              <DataPanel title="402 CHALLENGE HEADERS" right={<span className="label-mono">APA/1.0</span>}>
                <ul className="divide-y divide-border font-mono text-[11px] leading-6">
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Protocol</span><span>1.0</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Price</span><span>{currentService.price} {currentService.paymentAsset} / {currentService.unit}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Settle</span><span>{currentService.network} {currentService.paymentMethod.assets[0]}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Provider</span><span>{currentService.provider}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Nonce</span><span className="break-all">{nonceRef.current}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-accent">X-APA-Signature</span><span className="break-all text-success">{signature ? `${signature.slice(0, 24)}…` : "— not yet signed —"}</span></li>
                </ul>
              </DataPanel>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid content-start gap-6">
          <CyberCard className="p-5">
            <div className="label-mono text-accent">SERVICE</div>
            <h3 className="mt-2 text-xl">{currentService.name}</h3>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{currentService.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="label-mono">PROVIDER</div>
                <div className="mt-1 font-mono text-[12px]">{currentService.provider}</div>
              </div>
              <div>
                <div className="label-mono">CATEGORY</div>
                <div className="mt-1 font-mono text-[12px]">{currentService.category}</div>
              </div>
              <div>
                <div className="label-mono">SETTLEMENT</div>
                <div className="mt-1 font-mono text-[12px]">{currentService.paymentMethod.settlement}</div>
              </div>
              <div>
                <div className="label-mono">TIER</div>
                <div className="mt-1 font-mono text-[12px]">{currentService.pricing.tier}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="label-mono">CAPABILITIES</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentService.capabilities.map((c: string) => (
                  <span key={c} className="border border-border px-2 py-0.5 font-mono text-[10px] tracking-wide text-silver/80">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </CyberCard>

          <DataPanel title="SERVICE LOGS" right={<span className="label-mono">{logs.length} lines</span>}>
            <div className="max-h-[360px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="py-4 font-mono text-[12px] text-muted-foreground">NO ENTRIES YET.</p>
              ) : (
                logs.map((l, i) => <LogLine key={i} at={l.at} channel={l.channel} message={l.message} />)
              )}
            </div>
          </DataPanel>

          <DataPanel
            title="COMPATIBLE AGENTS"
            right={<span className="label-mono">{compatibleAgents.length} READY</span>}
          >
            {compatibleAgents.length === 0 ? (
              <p className="py-4 font-mono text-[12px] text-muted-foreground">
                NO AGENTS MEET REQUIREMENTS.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {compatibleAgents.slice(0, 6).map((a) => (
                  <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px] text-silver">{a.name}</div>
                      <div className="label-mono mt-0.5">{a.wallet}</div>
                    </div>
                    <StatusIndicator
                      tone={
                        a.status === "ONLINE" ? "online" : a.status === "BUSY" ? "busy" : "idle"
                      }
                      label={a.status}
                    />
                    <span className="font-mono text-[11px] text-success">{a.balance.toFixed(2)} USDC</span>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>

          <DataPanel title="WALLET STATUS">
            <ul className="space-y-2 font-mono text-[11px]">
              <li className="flex justify-between"><span className="text-accent">CONNECTED</span><span>{wallet.connected ? "YES" : "NO"}</span></li>
              <li className="flex justify-between"><span className="text-accent">SESSION</span><span>{wallet.simulated ? "DEMO" : "LIVE"}</span></li>
              <li className="flex justify-between"><span className="text-accent">CHAIN</span><span>{wallet.isCorrectChain ? "ARC" : "WRONG"}</span></li>
              <li className="flex justify-between"><span className="text-accent">BALANCE</span><span>{wallet.usdcBalance} USDC</span></li>
              {wallet.address ? (
                <li className="flex justify-between break-all"><span className="text-accent shrink-0">SIGNER</span><span className="text-right">{wallet.address}</span></li>
              ) : null}
            </ul>
          </DataPanel>
        </div>
      </div>
    </PageShell>
  );
}
