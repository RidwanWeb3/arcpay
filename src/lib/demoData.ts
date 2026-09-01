import type { Agent, ActivityEvent, Service, ServiceCategory } from "@/types";
import { parseServices } from "@/types";

const wallet = (suffix: string) => `0x${suffix}`;

export const AGENTS: Agent[] = [
  {
    id: "payment-agent",
    name: "PAYMENT AGENT",
    type: "SETTLEMENT",
    purpose: "Authorize, route and settle programmable payments for other agents.",
    status: "ONLINE",
    capabilities: ["PAY", "VERIFY", "SETTLE", "DISCOVER"],
    balance: 128.4,
    spendingPerTask: 50,
    tasksCompleted: 1284,
    lastAction: "Settled 0.001 USDC → Market Data API",
    wallet: wallet("A1F2...9C4D"),
    policy: {
      maxDailySpend: 500,
      maxPerTransaction: 50,
      network: "ARC",
      asset: "USDC",
      riskMode: "BALANCED",
      sessionMinutes: 240,
      confirmUnknownRecipient: true,
      confirmContractInteraction: true,
      confirmAboveLimit: true,
      allowedServices: ["eth-ohclv-feed", "llama-gpt-inference", "chainlink-price-oracle"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [
      {
        id: "T-8821",
        name: "Settle nanopayment batch",
        status: "COMPLETED",
        cost: 0.014,
        at: "10:42:35",
      },
      {
        id: "T-8822",
        name: "Authorize inference call",
        status: "COMPLETED",
        cost: 0.004,
        at: "10:41:02",
      },
      {
        id: "T-8823",
        name: "Verify settlement receipt",
        status: "RUNNING",
        cost: 0,
        at: "10:43:10",
      },
    ],
    payments: [
      { id: "PAY-4471", to: "ETH OHLCV Feed", amount: 0.001, status: "SETTLED", at: "10:42:35" },
      {
        id: "PAY-4470",
        to: "LLaMA GPT Inference",
        amount: 0.004,
        status: "SETTLED",
        at: "10:41:02",
      },
      {
        id: "PAY-4469",
        to: "Brave Agent Search",
        amount: 0.0008,
        status: "AUTHORIZED",
        at: "10:39:55",
      },
    ],
    logs: [
      { at: "10:42:31", channel: "AGENT", message: "Discovery request issued for category=DATA" },
      {
        at: "10:42:32",
        channel: "SERVICE",
        message: "ETH OHLCV Feed responded 402 PAYMENT REQUIRED",
      },
      {
        at: "10:42:33",
        channel: "PAYMENT",
        message: "0.001 USDC authorized under per-task policy",
      },
      { at: "10:42:35", channel: "SETTLEMENT", message: "Confirmed on ARC (simulated)" },
    ],
    origin: "DEMO",
  },
  {
    id: "research-agent",
    name: "RESEARCH AGENT",
    type: "KNOWLEDGE",
    purpose: "Search, read and synthesize external sources into structured briefs.",
    status: "BUSY",
    capabilities: ["SEARCH", "READ", "SUMMARIZE", "PAY"],
    balance: 42.15,
    spendingPerTask: 5,
    tasksCompleted: 611,
    lastAction: "Purchased 12 web-search calls",
    wallet: wallet("77B3...1E08"),
    policy: {
      maxDailySpend: 100,
      maxPerTransaction: 5,
      network: "ARC",
      asset: "USDC",
      riskMode: "SAFE",
      sessionMinutes: 120,
      confirmUnknownRecipient: true,
      confirmContractInteraction: true,
      confirmAboveLimit: true,
      allowedServices: ["brave-agent-search", "perplexity-research-api"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [
      {
        id: "T-6610",
        name: "Compile agentic payments brief",
        status: "RUNNING",
        cost: 0.031,
        at: "10:40:12",
      },
      {
        id: "T-6609",
        name: "Source verification pass",
        status: "COMPLETED",
        cost: 0.012,
        at: "10:22:04",
      },
    ],
    payments: [
      {
        id: "PAY-3310",
        to: "Brave Agent Search",
        amount: 0.012,
        status: "SETTLED",
        at: "10:22:04",
      },
    ],
    logs: [
      { at: "10:40:12", channel: "AGENT", message: "Task accepted: compile brief" },
      {
        at: "10:40:18",
        channel: "PAYMENT",
        message: "0.012 USDC authorized for brave-agent-search",
      },
    ],
    origin: "DEMO",
  },
  {
    id: "data-agent",
    name: "DATA AGENT",
    type: "INGESTION",
    purpose: "Pull, normalize and stream structured datasets to downstream agents.",
    status: "ONLINE",
    capabilities: ["FETCH", "NORMALIZE", "STREAM", "PAY"],
    balance: 88.9,
    spendingPerTask: 10,
    tasksCompleted: 2940,
    lastAction: "Requested Dune Analytics API",
    wallet: wallet("C4D9...77AA"),
    policy: {
      maxDailySpend: 250,
      maxPerTransaction: 10,
      network: "ARC",
      asset: "USDC",
      riskMode: "BALANCED",
      sessionMinutes: 480,
      confirmUnknownRecipient: true,
      confirmContractInteraction: false,
      confirmAboveLimit: true,
      allowedServices: ["dune-analytics-api", "ipfs-file-storage", "chainlink-price-oracle"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [
      {
        id: "T-2201",
        name: "Stream orderbook snapshots",
        status: "RUNNING",
        cost: 0.09,
        at: "10:43:01",
      },
    ],
    payments: [
      { id: "PAY-9902", to: "ETH OHLCV Feed", amount: 0.001, status: "PENDING", at: "10:43:02" },
    ],
    logs: [
      { at: "10:43:01", channel: "AGENT", message: "Opened streaming session with eth-ohclv-feed" },
    ],
    origin: "DEMO",
  },
  {
    id: "api-agent",
    name: "API AGENT",
    type: "INTEGRATION",
    purpose: "Negotiate machine-readable pricing and call paid endpoints on demand.",
    status: "IDLE",
    capabilities: ["CALL", "NEGOTIATE", "RETRY", "PAY"],
    balance: 19.75,
    spendingPerTask: 2,
    tasksCompleted: 421,
    lastAction: "Idle — awaiting task",
    wallet: wallet("5E11...0B62"),
    policy: {
      maxDailySpend: 50,
      maxPerTransaction: 2,
      network: "ARC",
      asset: "USDC",
      riskMode: "SAFE",
      sessionMinutes: 60,
      confirmUnknownRecipient: true,
      confirmContractInteraction: true,
      confirmAboveLimit: true,
      allowedServices: ["dune-analytics-api", "arweave-archive-storage"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [],
    payments: [],
    logs: [
      { at: "09:58:00", channel: "AGENT", message: "Session expired — awaiting re-authorization" },
    ],
    origin: "DEMO",
  },
  {
    id: "trading-agent",
    name: "TRADING AGENT",
    type: "EXECUTION",
    purpose: "Evaluate market data feeds and execute policy-bounded strategies.",
    status: "ONLINE",
    capabilities: ["ANALYZE", "QUOTE", "EXECUTE", "PAY"],
    balance: 310.0,
    spendingPerTask: 25,
    tasksCompleted: 1502,
    lastAction: "Evaluated 42 signals",
    wallet: wallet("9AB0...FF31"),
    policy: {
      maxDailySpend: 1000,
      maxPerTransaction: 25,
      network: "ARC",
      asset: "USDC",
      riskMode: "AUTONOMOUS",
      sessionMinutes: 720,
      confirmUnknownRecipient: true,
      confirmContractInteraction: true,
      confirmAboveLimit: true,
      allowedServices: ["chainlink-price-oracle", "pyth-network-feed", "nvidia-a100-gpu"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [
      { id: "T-7710", name: "Signal sweep", status: "COMPLETED", cost: 0.22, at: "10:38:40" },
    ],
    payments: [
      { id: "PAY-7701", to: "Pyth Network Feed", amount: 0.05, status: "SETTLED", at: "10:38:41" },
    ],
    logs: [
      {
        at: "10:38:40",
        channel: "POLICY",
        message: "Autonomous mode active — per-tx ceiling 25 USDC",
      },
    ],
    origin: "DEMO",
  },
  {
    id: "compute-agent",
    name: "COMPUTE AGENT",
    type: "RUNTIME",
    purpose: "Rent ephemeral compute and pay per second of execution.",
    status: "OFFLINE",
    capabilities: ["PROVISION", "RUN", "TEARDOWN", "PAY"],
    balance: 0,
    spendingPerTask: 15,
    tasksCompleted: 88,
    lastAction: "Runtime terminated",
    wallet: wallet("13CC...48E7"),
    policy: {
      maxDailySpend: 120,
      maxPerTransaction: 15,
      network: "ARC",
      asset: "USDC",
      riskMode: "BALANCED",
      sessionMinutes: 30,
      confirmUnknownRecipient: true,
      confirmContractInteraction: true,
      confirmAboveLimit: true,
      allowedServices: ["nvidia-a100-gpu", "ipfs-file-storage"],
      allowedContracts: ["ARC:USDC"],
    },
    tasks: [],
    payments: [],
    logs: [{ at: "08:12:00", channel: "AGENT", message: "Runtime terminated — balance depleted" }],
    origin: "DEMO",
  },
];

const ALL_COMPATIBILITY = [
  "PAYMENT AGENT",
  "RESEARCH AGENT",
  "DATA AGENT",
  "API AGENT",
  "TRADING AGENT",
  "COMPUTE AGENT",
];

function buildService(args: {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  unit: string;
  paymentAsset?: string;
  network?: string;
  status?: "AVAILABLE" | "DEGRADED" | "OFFLINE";
  availability: number;
  provider: string;
  latency: number;
  popularity: number;
  description: string;
  endpoint: string;
  capabilities: string[];
  compatibility: string[];
  apiMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  apiPath: string;
  apiHeaders: Record<string, string>;
  apiQuery?: Record<string, string>;
  apiBody?: Record<string, unknown>;
  apiResponseSchema: Record<string, unknown>;
  pricingTier?: "STANDARD" | "PREMIUM" | "ENTERPRISE";
  volumeDiscount?: boolean;
  freeTier?: string;
  settlement?: "ON-CHAIN" | "CHANNEL" | "ESCROW";
  agentVersion: string;
  requiredCaps: string[];
  recommendedCaps: string[];
  maxPerTx: number;
  riskModes: Array<"SAFE" | "BALANCED" | "AUTONOMOUS">;
  exampleRequest: string;
  exampleResponse: string;
}): Service {
  return {
    id: args.id,
    name: args.name,
    category: args.category,
    price: args.price,
    unit: args.unit,
    paymentAsset: args.paymentAsset ?? "USDC",
    network: args.network ?? "ARC",
    status: args.status ?? "AVAILABLE",
    availability: args.availability,
    provider: args.provider,
    providerWallet: "0x0000000000000000000000000000000000000000",
    latency: args.latency,
    popularity: args.popularity,
    description: args.description,
    endpoint: args.endpoint,
    capabilities: args.capabilities,
    sampleResponse: args.exampleResponse,
    compatibility: args.compatibility,
    outputCategories: [],
    origin: "DEMO",
    apiSpec: {
      method: args.apiMethod,
      path: args.apiPath,
      headers: args.apiHeaders,
      queryParams: args.apiQuery,
      body: args.apiBody,
      responseSchema: args.apiResponseSchema,
    },
    pricing: {
      unit: args.unit,
      tier: args.pricingTier ?? "STANDARD",
      volumeDiscount: args.volumeDiscount,
      freeTier: args.freeTier,
    },
    paymentMethod: {
      assets: [args.paymentAsset ?? "USDC", "USDT", "ARC"],
      networks: [args.network ?? "ARC", "BASE", "OP"],
      settlement: args.settlement ?? "ON-CHAIN",
    },
    agentRequirements: {
      minVersion: args.agentVersion,
      minBalance: 0,
      requiredCapabilities: args.requiredCaps,
      recommendedCapabilities: args.recommendedCaps,
      maxPerTransaction: args.maxPerTx,
      supportedRiskModes: args.riskModes,
      capabilities: [],
      architectures: [],
    },
    exampleRequest: args.exampleRequest,
    exampleResponse: args.exampleResponse,
  };
}

const _SERVICES_RAW: unknown[] = [
  // ── DATA ────────────────────────────────────────────────
  buildService({
    id: "eth-ohclv-feed",
    name: "ETH OHLCV Feed",
    category: "DATA",
    price: 0.001,
    unit: "request",
    availability: 99.98,
    provider: "arcfeed.arc",
    latency: 84,
    popularity: 94210,
    description:
      "Sub-cent priced Ethereum OHLCV + orderbook snapshots designed for agent consumption. Returns 402 Payment Required before payload release.",
    endpoint: "GET /v1/market/ohlcv?pair=ETH-USDC&interval=1m",
    capabilities: ["SNAPSHOT", "OHLCV", "ORDERBOOK", "TRADES"],
    compatibility: ["PAYMENT AGENT", "DATA AGENT", "TRADING AGENT"],
    apiMethod: "GET",
    apiPath: "/v1/market/ohlcv",
    apiHeaders: { "X-APA-Protocol": "1.0", Accept: "application/json" },
    apiQuery: { pair: "ETH-USDC", interval: "1m", limit: "100" },
    apiResponseSchema: {
      pair: "string",
      interval: "string",
      candles: "array<{open,high,low,close,volume,ts}>",
    },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    freeTier: "10 req/day",
    settlement: "CHANNEL",
    agentVersion: "2.4.0",
    requiredCaps: ["PAY", "FETCH"],
    recommendedCaps: ["STREAM", "NORMALIZE"],
    maxPerTx: 500,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `curl -X GET "https://api.arcpay.arc/v1/market/ohlcv?pair=ETH-USDC&interval=1m" \\
  -H "X-APA-Protocol: 1.0" \\
  -H "X-APA-Wallet: 0xA1F2...9C4D" \\
  -H "Accept: application/json"

// → HTTP 402 Payment Required
// →   X-APA-Price: 0.001 USDC
// →   X-APA-Settle: ARC USDC`,
    exampleResponse: `{
  "pair": "ETH-USDC",
  "interval": "1m",
  "candles": [
    { "open": 3421.55, "high": 3424.10, "low": 3420.12, "close": 3423.88, "volume": 184.22, "ts": 1767254400 },
    { "open": 3423.88, "high": 3426.44, "low": 3422.10, "close": 3425.00, "volume": 203.71, "ts": 1767254460 }
  ],
  "settlement_tx": "0x7f...9c21",
  "signature": "0x...",
  "mode": "SIMULATED"
}`,
  }),

  buildService({
    id: "dune-analytics-api",
    name: "Dune Analytics API",
    category: "DATA",
    price: 0.015,
    unit: "query",
    availability: 99.7,
    provider: "dune.arc",
    latency: 1420,
    popularity: 38210,
    description:
      "Execute parameterized Dune queries with row-level metering. Results signed and timestamped by the provider.",
    endpoint: "POST /v1/dune/execute",
    capabilities: ["QUERY", "SCHEMA", "EXPORT", "STREAM"],
    compatibility: ["DATA AGENT", "API AGENT", "RESEARCH AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/dune/execute",
    apiHeaders: { "X-APA-Protocol": "1.0", "Content-Type": "application/json" },
    apiBody: { query_id: 3940233, parameters: { network: "ethereum" } },
    apiResponseSchema: { job_id: "string", rows: "array<record>", execution_ms: "number" },
    pricingTier: "PREMIUM",
    volumeDiscount: true,
    settlement: "ON-CHAIN",
    agentVersion: "2.6.0",
    requiredCaps: ["PAY", "EXEC", "RETRY"],
    recommendedCaps: ["CACHE", "NORMALIZE"],
    maxPerTx: 10,
    riskModes: ["SAFE", "BALANCED"],
    exampleRequest: `POST /v1/dune/execute HTTP/1.1
X-APA-Protocol: 1.0
Content-Type: application/json

{
  "query_id": 3940233,
  "parameters": { "network": "ethereum" },
  "max_rows": 500
}`,
    exampleResponse: `{
  "job_id": "job_0x71c2...f4a9",
  "rows": [
    { "block_number": 22345001, "tx_count": 1842, "gas_used_gwei": 9842112 },
    { "block_number": 22345002, "tx_count": 1755, "gas_used_gwei": 9215400 }
  ],
  "row_count": 2,
  "execution_ms": 1388,
  "settlement_tx": "0x3b...c8a0",
  "signed_by": "dune.arc"
}`,
  }),

  // ── AI ──────────────────────────────────────────────────
  buildService({
    id: "llama-gpt-inference",
    name: "LLaMA GPT Inference",
    category: "AI",
    price: 0.004,
    unit: "call",
    availability: 99.85,
    provider: "inference.arc",
    latency: 640,
    popularity: 88420,
    description:
      "Metered LLaMA-70B inference billed per output token with machine-readable pricing headers.",
    endpoint: "POST /v1/infer/llama70b",
    capabilities: ["COMPLETION", "EMBEDDING", "RERANK", "FUNCTION-CALL"],
    compatibility: ["PAYMENT AGENT", "RESEARCH AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/infer/llama70b",
    apiHeaders: { "X-APA-Protocol": "1.0", "Content-Type": "application/json" },
    apiBody: { prompt: "", max_tokens: 512, temperature: 0.7 },
    apiResponseSchema: {
      output: "string",
      tokens_in: "number",
      tokens_out: "number",
      latency_ms: "number",
    },
    pricingTier: "PREMIUM",
    volumeDiscount: true,
    freeTier: "50 tok/day",
    settlement: "CHANNEL",
    agentVersion: "2.5.0",
    requiredCaps: ["PAY", "NEGOTIATE"],
    recommendedCaps: ["RETRY", "CACHE"],
    maxPerTx: 100,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/infer/llama70b HTTP/1.1
X-APA-Protocol: 1.0
Content-Type: application/json

{
  "messages": [
    {"role":"system","content":"You are an expert DeFi analyst."},
    {"role":"user","content":"Summarize agentic payment trends in 2026."}
  ],
  "max_tokens": 512,
  "temperature": 0.3
}`,
    exampleResponse: `{
  "output": "Agentic payments in 2026 have matured into three pillars: (1) nanopayment channels settling sub-cent API calls, (2) policy-driven agent wallets enforcing per-transaction ceilings, and (3) oracle-attested receipts enabling downstream verification. USDC on ARC has emerged as the dominant settlement rail with ~1.2B monthly agent-to-agent transfers.",
  "tokens_in": 42,
  "tokens_out": 89,
  "latency_ms": 624,
  "cost_breakdown": { "input": 0.00084, "output": 0.00356 },
  "settlement_tx": "0x4a...1f2d"
}`,
  }),

  buildService({
    id: "embedding-ada-multilingual",
    name: "Embedding Ada Multilingual",
    category: "AI",
    price: 0.00012,
    unit: "1k-tokens",
    availability: 99.92,
    provider: "vector.arc",
    latency: 210,
    popularity: 52100,
    description:
      "1536-dim multilingual text embeddings with signed similarity-verification receipts.",
    endpoint: "POST /v1/embeddings/ada",
    capabilities: ["EMBED", "VERIFY", "BATCH"],
    compatibility: ["RESEARCH AGENT", "DATA AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/embeddings/ada",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { input: ["query text"], model: "ada-multilingual-v2", dimensions: 1536 },
    apiResponseSchema: { data: "array<{embedding:number[1536],index:number}>", usage: "object" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    settlement: "ON-CHAIN",
    agentVersion: "2.3.0",
    requiredCaps: ["PAY", "BATCH"],
    recommendedCaps: ["CACHE"],
    maxPerTx: 20,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/embeddings/ada HTTP/1.1
X-APA-Protocol: 1.0

{ "input": ["agentic payment infrastructure 2026"], "model": "ada-multilingual-v2", "dimensions": 1536 }`,
    exampleResponse: `{
  "data": [
    {
      "embedding": [0.0182, -0.0401, 0.1283, 0.0076, -0.0512, "... 1531 more values"],
      "index": 0
    }
  ],
  "usage": { "tokens": 8, "documents": 1 },
  "signature": "vec:0x91c2...e4af",
  "settlement_tx": "0xd2...11bb"
}`,
  }),

  // ── COMPUTE ─────────────────────────────────────────────
  buildService({
    id: "nvidia-a100-gpu",
    name: "NVIDIA A100 GPU Runtime",
    category: "COMPUTE",
    price: 0.085,
    unit: "minute",
    availability: 97.4,
    status: "DEGRADED",
    provider: "gpu-cloud.arc",
    latency: 1200,
    popularity: 21430,
    description:
      "Ephemeral A100 80GB sandboxed runtime rented by the minute. Teardown triggered on settlement failure.",
    endpoint: "POST /v1/runtime/a100/session",
    capabilities: ["PROVISION", "EXEC", "TEARDOWN", "SSH-FORWARD", "GPU"],
    compatibility: ["COMPUTE AGENT", "TRADING AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/runtime/a100/session",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { image: "pytorch-2.5:latest", ttl_min: 30, gpu_count: 1, disk_gb: 200 },
    apiResponseSchema: { session_id: "string", ssh_endpoint: "string", expires_at: "iso8601" },
    pricingTier: "ENTERPRISE",
    volumeDiscount: true,
    settlement: "ESCROW",
    agentVersion: "2.8.0",
    requiredCaps: ["PAY", "PROVISION", "RUN", "TEARDOWN"],
    recommendedCaps: ["MONITOR", "CACHE"],
    maxPerTx: 500,
    riskModes: ["BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/runtime/a100/session HTTP/1.1
X-APA-Protocol: 1.0

{
  "image": "ghcr.io/arc/runtimes/pytorch-2.5:latest",
  "gpu_count": 1,
  "disk_gb": 200,
  "ttl_min": 30,
  "budget_usdc": 2.55
}`,
    exampleResponse: `{
  "session_id": "gpu-sess_8f3a...b2c1",
  "ssh_endpoint": "ssh://u1337@a100-42.gpu.arc:22",
  "auth_token": "gpat_***",
  "expires_at": "2026-09-01T11:15:00Z",
  "escrow": { "locked": 2.55, "asset": "USDC", "network": "ARC" },
  "heartbeat_url": "https://runtime.arc/hb/gpu-sess_8f3a...b2c1",
  "settlement_tx": "0xec...55d9"
}`,
  }),

  buildService({
    id: "cpu-spot-fleet",
    name: "CPU Spot Fleet",
    category: "COMPUTE",
    price: 0.0018,
    unit: "core-hour",
    availability: 94.2,
    provider: "spot-grid.arc",
    latency: 180,
    popularity: 18220,
    description:
      "Interruptible x86-64 CPU cores across a global spot market. Preemption notices via webhook.",
    endpoint: "POST /v1/spot/claim",
    capabilities: ["PROVISION", "BATCH", "MAP-REDUCE", "WEBHOOK"],
    compatibility: ["COMPUTE AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/spot/claim",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { cores: 32, region: "eu-west", duration_sec: 3600, allow_preempt: true },
    apiResponseSchema: { claim_id: "string", endpoints: "string[]", estimated_cost: "number" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    settlement: "CHANNEL",
    agentVersion: "2.7.0",
    requiredCaps: ["PAY", "BATCH", "RETRY"],
    recommendedCaps: ["FALLBACK", "CACHE"],
    maxPerTx: 50,
    riskModes: ["BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/spot/claim HTTP/1.1
X-APA-Protocol: 1.0

{ "cores": 32, "region": "eu-west", "duration_sec": 3600, "allow_preempt": true }`,
    exampleResponse: `{
  "claim_id": "spot_0x1d9c...a4ef",
  "endpoints": [
    "https://worker-17.eu-west.spot.arc",
    "https://worker-18.eu-west.spot.arc",
    "..."
  ],
  "cores": 32,
  "estimated_cost_usdc": 0.0576,
  "preemption_hook": "https://agent.local/spot/preempt/0x1d9c",
  "settlement_tx": "0x99...a01f"
}`,
  }),

  // ── SEARCH ──────────────────────────────────────────────
  buildService({
    id: "brave-agent-search",
    name: "Brave Agent Search",
    category: "SEARCH",
    price: 0.0008,
    unit: "query",
    availability: 99.95,
    provider: "brave.arc",
    latency: 210,
    popularity: 76840,
    description:
      "Agent-oriented search index with per-query nanopayment settlement and citation-verified results.",
    endpoint: "GET /v1/search?q=",
    capabilities: ["QUERY", "RANK", "CITE", "SUMMARIZE", "NEWS"],
    compatibility: ["RESEARCH AGENT", "API AGENT"],
    apiMethod: "GET",
    apiPath: "/v1/search",
    apiHeaders: { "X-APA-Protocol": "1.0", Accept: "application/json" },
    apiQuery: { q: "", count: "10", freshness: "7d", safe: "strict" },
    apiResponseSchema: { query: "string", results: "array<{url,title,snippet,citations}>" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    freeTier: "20 queries/day",
    settlement: "CHANNEL",
    agentVersion: "2.4.0",
    requiredCaps: ["PAY", "SEARCH"],
    recommendedCaps: ["SUMMARIZE", "READ"],
    maxPerTx: 10,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `GET /v1/search?q=agentic+payments+2026&freshness=30d&count=5 HTTP/1.1
X-APA-Protocol: 1.0
Accept: application/json`,
    exampleResponse: `{
  "query": "agentic payments 2026",
  "freshness": "30d",
  "results": [
    {
      "url": "https://circle.com/blog/agent-stack",
      "title": "Circle Agent Stack — Financial Infrastructure for Agents",
      "snippet": "Agents require per-call pricing, policy enforcement, and receipts that downstream systems can verify...",
      "citations": ["cite:circle-2026-agent-stack"],
      "rank": 1
    }
  ],
  "settlement_tx": "0x2e...bc44"
}`,
  }),

  buildService({
    id: "perplexity-research-api",
    name: "Perplexity Research API",
    category: "SEARCH",
    price: 0.009,
    unit: "research",
    availability: 99.6,
    provider: "perplexity.arc",
    latency: 3800,
    popularity: 41200,
    description:
      "Deep-research mode with multi-hop source verification, synthesis, and cited bibliography output.",
    endpoint: "POST /v1/research/deep",
    capabilities: ["RESEARCH", "CITATIONS", "BIBLIOGRAPHY", "SUMMARY"],
    compatibility: ["RESEARCH AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/research/deep",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { topic: "", depth: 3, citations: true, output_format: "markdown" },
    apiResponseSchema: {
      report: "string",
      sources: "array",
      word_count: "number",
      time_ms: "number",
    },
    pricingTier: "PREMIUM",
    settlement: "ON-CHAIN",
    agentVersion: "2.6.0",
    requiredCaps: ["PAY", "RESEARCH", "READ"],
    recommendedCaps: ["SUMMARIZE", "CACHE"],
    maxPerTx: 25,
    riskModes: ["SAFE", "BALANCED"],
    exampleRequest: `POST /v1/research/deep HTTP/1.1
X-APA-Protocol: 1.0

{ "topic": "ARC nanopayments adoption metrics", "depth": 3, "citations": true }`,
    exampleResponse: `{
  "report": "## ARC Nanopayments Adoption — 2026 Q3\\n\\nARC has processed 4.2 billion agent-to-agent transactions...",
  "sources": [
    { "title": "ARC Network State Report Q3", "url": "https://arc.network/reports/q3-2026" },
    { "title": "Circle Sub-Cent Payments Paper", "url": "https://circle.com/papers/sub-cent" }
  ],
  "word_count": 1820,
  "sources_consulted": 14,
  "time_ms": 3420,
  "settlement_tx": "0x5c...88bd"
}`,
  }),

  // ── STORAGE ─────────────────────────────────────────────
  buildService({
    id: "ipfs-file-storage",
    name: "IPFS Pinning Storage",
    category: "STORAGE",
    price: 0.0002,
    unit: "MB-month",
    availability: 99.99,
    provider: "pinata.arc",
    latency: 150,
    popularity: 33500,
    description:
      "Durable IPFS pinning with content-addressable retrieval, signed receipts, and ENS resolvers.",
    endpoint: "PUT /v1/ipfs/pin/:cid",
    capabilities: ["PUT", "GET", "SIGN", "ENS-RESOLVE", "GATEWAY"],
    compatibility: ["API AGENT", "COMPUTE AGENT", "DATA AGENT"],
    apiMethod: "PUT",
    apiPath: "/v1/ipfs/pin/{cid}",
    apiHeaders: { "X-APA-Protocol": "1.0", "Content-Length": "<bytes>" },
    apiBody: { "content-bytes": "binary", ttl_days: 365 },
    apiResponseSchema: { cid: "string", size_bytes: "number", pin_expires: "iso8601" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    freeTier: "1 GB free",
    settlement: "ESCROW",
    agentVersion: "2.3.0",
    requiredCaps: ["PAY", "PUT"],
    recommendedCaps: ["GET", "VERIFY"],
    maxPerTx: 100,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `PUT /v1/ipfs/pin/bafybei...zdq HTTP/1.1
X-APA-Protocol: 1.0
Content-Type: application/octet-stream
Content-Length: 8423112

<binary payload — research-brief.pdf>`,
    exampleResponse: `{
  "cid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  "size_bytes": 8423112,
  "pin_expires": "2027-09-01T10:00:00Z",
  "gateway": "https://ipfs.arc/ipfs/bafybei...zdq",
  "provider_signature": "pin:0x7d...ef12",
  "settlement_tx": "0x81...9aa3"
}`,
  }),

  buildService({
    id: "arweave-archive-storage",
    name: "Arweave Permanent Archive",
    category: "STORAGE",
    price: 0.0045,
    unit: "MB-once",
    availability: 100.0,
    provider: "arweave.arc",
    latency: 940,
    popularity: 14800,
    description:
      "One-time payment for permanent, censorship-resistant archival storage with 200+ year retention guarantee.",
    endpoint: "POST /v1/arweave/ingest",
    capabilities: ["ARCHIVE", "BUNDLE", "VERIFY", "TAGS"],
    compatibility: ["DATA AGENT", "API AGENT", "RESEARCH AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/arweave/ingest",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { data: "base64", tags: { "App-Name": "ArcPay Agent" } },
    apiResponseSchema: { tx_id: "string", block_height: "number", anchor: "string" },
    pricingTier: "STANDARD",
    settlement: "ON-CHAIN",
    agentVersion: "2.5.0",
    requiredCaps: ["PAY", "VERIFY"],
    recommendedCaps: ["BATCH", "TAGS"],
    maxPerTx: 500,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/arweave/ingest HTTP/1.1
X-APA-Protocol: 1.0

{
  "data": "base64:<evidence-bundle>",
  "tags": {
    "App-Name": "ArcPay Agent",
    "Evidence-Type": "Settlement Receipt",
    "Bundle-ID": "bndl_0xabcd..."
  }
}`,
    exampleResponse: `{
  "tx_id": "9FkHBrnLhfV8eBdR9P2U5c...",
  "block_height": 1482301,
  "reward_winstons": "1234098521",
  "anchor": "pRjL6U8g2Dn5Wq3vA1c7",
  "confirmations": 1,
  "settlement_tx": "0x1a...e388"
}`,
  }),

  // ── FINANCE ─────────────────────────────────────────────
  buildService({
    id: "stripe-agent-checkout",
    name: "Stripe Agent Checkout",
    category: "FINANCE",
    price: 0.02,
    unit: "invoice",
    availability: 99.9,
    provider: "stripe.arc",
    latency: 420,
    popularity: 28900,
    description:
      "Agent-to-human invoicing: generate Stripe checkout sessions on-demand, settled in USDC with policy approval.",
    endpoint: "POST /v1/invoices/create",
    capabilities: ["INVOICE", "CHECKOUT", "RECONCILE", "WEBHOOK"],
    compatibility: ["PAYMENT AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/invoices/create",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: {
      customer_email: "",
      line_items: [],
      currency: "USD",
      success_url: "",
      cancel_url: "",
    },
    apiResponseSchema: { invoice_id: "string", checkout_url: "string", amount_due: "number" },
    pricingTier: "PREMIUM",
    settlement: "ESCROW",
    agentVersion: "2.6.0",
    requiredCaps: ["PAY", "VERIFY", "CONFIRM-ABOVE-LIMIT"],
    recommendedCaps: ["WEBHOOK", "RECONCILE"],
    maxPerTx: 500,
    riskModes: ["SAFE", "BALANCED"],
    exampleRequest: `POST /v1/invoices/create HTTP/1.1
X-APA-Protocol: 1.0

{
  "customer_email": "client@corp.com",
  "line_items": [
    {"description":"Q3 ARC settlement bundle","quantity":1,"unit_amount_cents":42000}
  ],
  "success_url": "https://agent.local/invoice/done",
  "cancel_url": "https://agent.local/invoice/cancelled"
}`,
    exampleResponse: `{
  "invoice_id": "in_1PqABC2eZvKYlo2C9XYz",
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_abc123...",
  "amount_due_usd": 420.00,
  "agent_fee_usdc": 0.02,
  "expires_at": "2026-09-02T10:00:00Z",
  "status": "OPEN",
  "settlement_tx": "0x7b...7a11"
}`,
  }),

  buildService({
    id: "alchemy-transaction-indexer",
    name: "Alchemy Transaction Indexer",
    category: "FINANCE",
    price: 0.0025,
    unit: "1k-blocks",
    availability: 99.94,
    provider: "alchemy.arc",
    latency: 260,
    popularity: 24700,
    description:
      "Trace-accurate EVM transaction indexing with receipt-level settlement attestations.",
    endpoint: "POST /v1/indexer/tx/trace",
    capabilities: ["INDEX", "TRACE", "RECEIPT", "ERC20-LOG", "INTERNAL-TX"],
    compatibility: ["PAYMENT AGENT", "TRADING AGENT", "DATA AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/indexer/tx/trace",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { chain_id: 42161, from_block: 24000000, to_block: 24000999, address: "0x..." },
    apiResponseSchema: { traces: "array", transfer_events: "array", gas_summary: "object" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    settlement: "CHANNEL",
    agentVersion: "2.5.0",
    requiredCaps: ["PAY", "INDEX"],
    recommendedCaps: ["STREAM", "NORMALIZE"],
    maxPerTx: 100,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/indexer/tx/trace HTTP/1.1
X-APA-Protocol: 1.0

{ "chain_id": 42161, "from_block": 24000000, "to_block": 24000999, "contracts": ["USDC","WBTC"] }`,
    exampleResponse: `{
  "blocks_indexed": 1000,
  "traces": 48291,
  "erc20_transfers": [
    {"from":"0xA1F2...","to":"0xB3C7...","contract":"USDC","amount":"1255.22","block":24000042}
  ],
  "gas_summary": {"total_eth":"4.2811","avg_gwei":0.142},
  "settlement_tx": "0x33...ff92"
}`,
  }), // ── ORACLES ────────────────────────────────────────────────────
  buildService({
    id: "chainlink-price-oracle",
    name: "Chainlink Price Oracle",
    category: "ORACLES",
    price: 0.05,
    unit: "attestation",
    availability: 99.999,
    provider: "chainlink.arc",
    latency: 320,
    popularity: 67100,
    description:
      "Signed Chainlink Data Feed attestations for off-chain values consumed by settlement logic and policy engines.",
    endpoint: "GET /v1/oracle/attest?feed=",
    capabilities: ["ATTEST", "SIGN", "VERIFY", "AGGREGATE", "DEVIATION"],
    compatibility: ["TRADING AGENT", "PAYMENT AGENT", "DATA AGENT"],
    apiMethod: "GET",
    apiPath: "/v1/oracle/attest",
    apiHeaders: { "X-APA-Protocol": "1.0", Accept: "application/signed-json" },
    apiQuery: { feed: "ETH-USDC", round: "latest" },
    apiResponseSchema: {
      price: "string",
      decimals: "number",
      timestamp: "number",
      signatures: "string[]",
    },
    pricingTier: "ENTERPRISE",
    volumeDiscount: true,
    settlement: "ON-CHAIN",
    agentVersion: "2.8.0",
    requiredCaps: ["PAY", "VERIFY", "ATTEST"],
    recommendedCaps: ["CACHE", "FALLBACK"],
    maxPerTx: 250,
    riskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
    exampleRequest: `GET /v1/oracle/attest?feed=ETH-USDC&round=latest HTTP/1.1
X-APA-Protocol: 1.0
Accept: application/signed-json`,
    exampleResponse: `{
  "feed": "ETH-USDC",
  "round_id": 110842301,
  "price": "3421.55421288",
  "decimals": 8,
  "timestamp": 1767254460,
  "deviation_ppm": 18,
  "node_signatures": [
    "0x7a...f1c0", "0x21...00ad", "0xb3...4e12", "0x81...6d09", "..."
  ],
  "round_complete": true,
  "settlement_tx": "0xcd...0f3a"
}`,
  }),

  buildService({
    id: "pyth-network-feed",
    name: "Pyth Pull Oracle Feed",
    category: "ORACLES",
    price: 0.003,
    unit: "pull-update",
    availability: 99.97,
    provider: "pyth.arc",
    latency: 110,
    popularity: 51800,
    description:
      "Low-latency Pyth pull-price updates with verifiable, on-chain-replayable payloads.",
    endpoint: "POST /v1/pyth/pull",
    capabilities: ["PULL", "ON-CHAIN-VERIFY", "EMA", "CONFIDENCE"],
    compatibility: ["TRADING AGENT", "PAYMENT AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/pyth/pull",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { price_ids: ["0xe62...USDC", "0xf8c...ETH"] },
    apiResponseSchema: { updates: "array<{price_id,price,confidence,publish_time,vaa}>" },
    pricingTier: "STANDARD",
    volumeDiscount: true,
    settlement: "CHANNEL",
    agentVersion: "2.7.0",
    requiredCaps: ["PAY", "VERIFY"],
    recommendedCaps: ["STREAM", "CACHE"],
    maxPerTx: 100,
    riskModes: ["BALANCED", "AUTONOMOUS"],
    exampleRequest: `POST /v1/pyth/pull HTTP/1.1
X-APA-Protocol: 1.0

{ "price_ids": ["0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b7263d456f4d90016d5d001", "Crypto.ETH/USD"] }`,
    exampleResponse: `{
  "updates": [
    {
      "price_id": "0xe62df6c8...5d001",
      "price": "342155421288",
      "expo": -8,
      "confidence": "1288421",
      "publish_time": 1767254461,
      "vaa": "AQAAAAAgbQZ2...base64...",
      "onchain_ready": true
    }
  ],
  "settlement_tx": "0x57...0a8c"
}`,
  }),

  buildService({
    id: "replicate-image-gen",
    name: "Replicate Image Generator",
    category: "CONTENT",
    price: 0.018,
    unit: "image",
    availability: 99.5,
    provider: "replicate.arc",
    latency: 5400,
    popularity: 29200,
    description:
      "Diffusion image generation via SDXL + Flux. Images signed, watermarked, and delivered as IPFS CIDs.",
    endpoint: "POST /v1/content/generate/image",
    capabilities: ["GENERATE", "WATERMARK", "SIGN", "UPSCALE"],
    compatibility: ["RESEARCH AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/content/generate/image",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { prompt: "", model: "flux-dev", width: 1024, height: 1024, steps: 30 },
    apiResponseSchema: { image_cid: "string", seed: "number", model: "string" },
    pricingTier: "PREMIUM",
    settlement: "ON-CHAIN",
    agentVersion: "2.6.0",
    requiredCaps: ["PAY", "GENERATE"],
    recommendedCaps: ["CACHE", "BATCH"],
    maxPerTx: 25,
    riskModes: ["SAFE", "BALANCED"],
    exampleRequest: `POST /v1/content/generate/image HTTP/1.1
X-APA-Protocol: 1.0

{
  "prompt": "futuristic agent payment terminal HUD, neon blue grid, cinematic lighting",
  "model": "flux-dev",
  "width": 1280,
  "height": 720,
  "steps": 40
}`,
    exampleResponse: `{
  "image_cid": "bafybeihkxm6g...g4m",
  "gateway": "https://ipfs.arc/ipfs/bafybeihkxm6g...g4m",
  "model": "flux-dev",
  "seed": 48219033,
  "watermark_sig": "wm:0x2d...b711",
  "settlement_tx": "0x6f...10c5"
}`,
  }),

  buildService({
    id: "midjourney-style-engine",
    name: "Midjourney-Style Engine",
    category: "CONTENT",
    price: 0.032,
    unit: "render",
    availability: 99.2,
    provider: "style-engine.arc",
    latency: 7200,
    popularity: 19800,
    description:
      "Signature-grade content renders with on-chain attribution. Delivers 4x style variants per request with license receipts.",
    endpoint: "POST /v1/content/style-render",
    capabilities: ["STYLE-TRANSFER", "VARIANT", "LICENSE-ATTEST", "4K-UPSCALE"],
    compatibility: ["RESEARCH AGENT", "API AGENT"],
    apiMethod: "POST",
    apiPath: "/v1/content/style-render",
    apiHeaders: { "X-APA-Protocol": "1.0" },
    apiBody: { seed_image_cid: "", style: "cyberpunk", variants: 4, attribution: true },
    apiResponseSchema: {
      variants: "array<{cid,style,license}>",
      attribution_tx: "string",
    },
    pricingTier: "ENTERPRISE",
    volumeDiscount: true,
    settlement: "ESCROW",
    agentVersion: "2.7.0",
    requiredCaps: ["PAY", "GENERATE", "VERIFY"],
    recommendedCaps: ["BATCH", "RETRY"],
    maxPerTx: 100,
    riskModes: ["SAFE", "BALANCED"],
    exampleRequest: `POST /v1/content/style-render HTTP/1.1
X-APA-Protocol: 1.0

{
  "seed_image_cid": "bafybei...src",
  "style": "cyberpunk-terminal",
  "variants": 4,
  "attribution": true,
  "commercial_license": true
}`,
    exampleResponse: `{
  "variants": [
    {"cid":"bafy1...v1","style":"cyberpunk-terminal","license":"commercial"},
    {"cid":"bafy2...v2","style":"cyberpunk-neon","license":"commercial"},
    {"cid":"bafy3...v3","style":"cyberpunk-noir","license":"commercial"},
    {"cid":"bafy4...v4","style":"cyberpunk-glitch","license":"commercial"}
  ],
  "attribution_tx": "0x8a...e100",
  "license_hash": "ipfs://bafyattrib...lic",
  "settlement_tx": "0x11...4d2b"
}`,
  }),
];
export const SERVICES: Service[] = parseServices(_SERVICES_RAW);

export const getAgent = (id: string) => AGENTS.find((a) => a.id === id);
export const getService = (id: string) => SERVICES.find((s) => s.id === id);

const ACTORS = AGENTS.filter((a) => a.status !== "OFFLINE").map((a) => a.name);
const ACTIONS: Array<{ action: string; target: string; amount?: number }> = [
  { action: "requested", target: "ETH OHLCV Feed", amount: 0.001 },
  { action: "paid", target: "LLaMA GPT Inference", amount: 0.004 },
  { action: "settled", target: "ARC" },
  { action: "authorized", target: "Brave Agent Search", amount: 0.0008 },
  { action: "discovered", target: "Chainlink Price Oracle" },
  { action: "verified", target: "Settlement Receipt" },
  { action: "executed", target: "Dune Analytics API", amount: 0.015 },
];

const CHANNELS: ActivityEvent["channel"][] = ["AGENT", "SERVICE", "PAYMENT", "NETWORK", "SETTLEMENT", "RESOURCE", "POLICY"];
const SEVERITIES: ActivityEvent["severity"][] = ["INFO", "OK", "WARN", "ERROR"];

export function makeActivityEvent(seed = Date.now()): ActivityEvent {
  const a = ACTIONS[seed % ACTIONS.length]!;
  const actor = ACTORS[(seed >> 3) % ACTORS.length]!;
  const now = new Date();
  const isPay = a.action === "paid" || a.action === "authorized" || a.action === "settled";
  return {
    id: `${seed}-${Math.floor(Math.random() * 1e6)}`,
    time: now.toTimeString().slice(0, 8),
    actor,
    action: a.action,
    target: a.target,
    amount: a.amount,
    network: "ARC",
    channel: isPay ? "PAYMENT" : CHANNELS[seed % CHANNELS.length]!,
    severity: SEVERITIES[seed % SEVERITIES.length]!,
    meta: {},
  };
}

export const DASHBOARD_SERIES = {
  agentActivity: [12, 18, 15, 26, 22, 34, 30, 41, 38, 47, 44, 52],
  paymentVolume: [4, 9, 7, 14, 11, 19, 17, 24, 21, 29, 26, 33],
  serviceUsage: [
    { label: "DATA", value: 42 },
    { label: "AI", value: 28 },
    { label: "SEARCH", value: 15 },
    { label: "STORAGE", value: 9 },
    { label: "COMPUTE", value: 6 },
  ],
  txFrequency: [3, 6, 4, 9, 7, 12, 10, 16, 13, 18, 15, 21],
};
