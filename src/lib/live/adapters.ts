import { useQuery } from "@tanstack/react-query";
import {
  SERVICES as DEMO_SERVICES,
  AGENTS as DEMO_AGENTS,
  DASHBOARD_SERIES as DEMO_DASHBOARD,
  makeActivityEvent as makeDemoActivity,
} from "@/lib/demoData";
import { isDemoMode } from "@/config/projectConfig";
import { supabase } from "@/integrations/supabase/client";
import {
  createPublicClient,
  formatUnits,
  http,
  type Address,
  type Hash,
  type Transaction,
} from "viem";
import { targetArcChain, USDC_DECIMALS } from "@/lib/arc/chains";
import type {
  ActivityEvent,
  Agent,
  AgentPolicy,
  Service,
  ServiceStatusValue,
  ServiceCategory,
} from "@/types";
import { parseServices } from "@/types";

/* ── Public client ─────────────────────────────────────── */
const viemArc = createPublicClient({
  chain: targetArcChain,
  transport: http(targetArcChain.rpcUrls.default.http[0]),
});

/* ── Supabase helpers ──────────────────────────────────── */
function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const sb = supabase;
    return Boolean(sb && typeof sb.from === "function");
  } catch {
    return false;
  }
}

type AnySupabase = {
  from<T = unknown>(table: string): {
    select(columns?: string): {
      order(column: string, options?: { ascending?: boolean }): {
        limit(count: number): PromiseLike<{ data: unknown; error: unknown }>;
      } & {
        eq(column: string, value: unknown): unknown;
      } & PromiseLike<{ data: unknown; error: unknown }>;
    } & {
      eq(column: string, value: unknown): unknown;
    } & {
      gte(column: string, value: unknown): unknown;
    } & PromiseLike<{ data: unknown; error: unknown }>;
    insert(rows: unknown[]): {
      select(): {
        maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
      } & PromiseLike<{ data: unknown; error: unknown }>;
    } & PromiseLike<{ data: unknown; error: unknown }>;
    update(patch: unknown): {
      eq(column: string, value: unknown): {
        select(): {
          maybeSingle(): PromiseLike<{ data: unknown; error: unknown }>;
        } & PromiseLike<{ data: unknown; error: unknown }>;
      } & PromiseLike<{ data: unknown; error: unknown }>;
    } & PromiseLike<{ data: unknown; error: unknown }>;
  };
};
function sbTable(table: string): AnySupabase["from"] extends (t: string) => infer R ? R : never {
  return (supabase as unknown as AnySupabase).from(table);
}

type SbServiceRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  provider: string;
  provider_wallet: string;
  payment_asset: string;
  price: number;
  unit: string;
  status: ServiceStatusValue | string;
  availability: number;
  latency_ms: number;
  sla_seconds: number;
  api_endpoint: string | null;
  features: string[];
  categories_out: string[];
  agent_min_balance: number;
  agent_capabilities: string[];
  agent_architectures: string[];
};

type SbAgentRow = {
  id: string;
  name: string;
  type: string;
  purpose: string;
  status: string;
  capabilities: string[];
  wallet: string;
  policy_max_daily_spend: number;
  policy_max_per_tx: number;
  policy_network: string;
  policy_asset: string;
  policy_risk_mode: AgentPolicy["riskMode"];
  policy_session_minutes: number;
  policy_confirm_unknown: boolean;
  policy_confirm_contract: boolean;
  policy_confirm_above_limit: boolean;
  allowed_services: string[];
  allowed_contracts: string[];
};

type SbPaymentRow = {
  id: string;
  service_id: string | null;
  agent_id: string | null;
  payer: string;
  payee: string;
  amount: number;
  asset: string;
  network: string;
  chain_id: number;
  nonce: string;
  signature: string;
  tx_hash: string | null;
  block_number: number | null;
  status: "REQUESTED" | "AUTHORIZED" | "BROADCAST" | "SETTLED" | "EXPIRED" | "FAILED";
  authorization_nonce?: string | null;
  authorization_message?: string | null;
  requested_at: string;
  authorized_at: string | null;
  broadcast_at: string | null;
  settled_at: string | null;
  expired_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

type SbActivityRow = {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  amount: number | null;
  channel: string;
  severity: string;
};

function sbServiceToType(row: SbServiceRow): Service {
  const price = Number(row.price);
  const latency = Number(row.latency_ms);
  const availability = Number(row.availability);
  const popularity = Math.max(
    1,
    Math.round(100 - (price * 50 + latency * 0.15) / Math.max(0.01, 1 - availability + 0.001)),
  );
  const features = Array.isArray(row.features) ? row.features : [];
  const outputCategories = Array.isArray(row.categories_out) ? row.categories_out : [];
  const agentCaps = Array.isArray(row.agent_capabilities) ? row.agent_capabilities : [];
  const agentArchs = Array.isArray(row.agent_architectures) ? row.agent_architectures : [];
  const category = (row.category as ServiceCategory) ?? "DATA";
  const tier = availability >= 99.95 ? "ENTERPRISE" : availability >= 99.5 ? "PREMIUM" : "STANDARD";
  return {
    id: row.id,
    name: row.name,
    category,
    description: row.description,
    provider: row.provider,
    providerWallet: row.provider_wallet ?? "0x0000000000000000000000000000000000000000",
    paymentAsset: row.payment_asset ?? "USDC",
    price,
    unit: row.unit,
    status: (row.status as ServiceStatusValue) ?? "AVAILABLE",
    availability,
    popularity,
    latency,
    capabilities: features,
    outputCategories,
    agentRequirements: {
      minVersion: "1.0.0",
      minBalance: Number(row.agent_min_balance),
      requiredCapabilities: agentCaps,
      recommendedCapabilities: agentCaps,
      maxPerTransaction: Number(row.agent_min_balance) * 10 || 100,
      supportedRiskModes: ["SAFE", "BALANCED", "AUTONOMOUS"],
      capabilities: agentCaps,
      architectures: agentArchs,
    },
    endpoint: row.api_endpoint ?? `https://api.arcpay.arc/v1/services/${row.id}`,
    authHeader: undefined,
    sampleResponse: `{"service":"${row.id}","ok":true}`,
    compatibility: agentArchs.length > 0 ? agentArchs : ["ARC-1", "EVM"],
    origin: "LIVE",
    apiSpec: {
      method: "POST",
      path: `/v1/services/${row.id}/call`,
      headers: { "Content-Type": "application/json", "X-APA-Protocol": "1.0" },
      queryParams: undefined,
      body: { input: "string" },
      responseSchema: { ok: "boolean", data: "object" },
    },
    pricing: {
      unit: row.unit,
      tier: tier as "STANDARD" | "PREMIUM" | "ENTERPRISE",
      volumeDiscount: price > 0.005,
      freeTier: price === 0 ? "Unlimited" : undefined,
    },
    paymentMethod: {
      assets: [row.payment_asset ?? "USDC"],
      networks: ["ARC"],
      settlement: "ON-CHAIN",
    },
    exampleRequest: `curl -X POST https://api.arcpay.arc/v1/services/${row.id}/call -H "X-APA-Price: ${price} USDC" -H "Content-Type: application/json" -d '{"input":"hello"}'`,
    exampleResponse: `{
  "ok": true,
  "service": "${row.id}",
  "provider": "${row.provider}",
  "data": {
    "result": "LIVE payload placeholder — returned after 402 settlement on ARC chain."
  },
  "receipt": {
    "tx": "0x${"a".repeat(64)}",
    "block": "${Math.floor(Math.random() * 9_000_000) + 1_000_000}",
    "settled_at": "${new Date().toISOString()}"
  }
}`,
    network: "ARC",
  };
}

function sbAgentToType(row: SbAgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? "EXECUTION",
    purpose: row.purpose,
    status: (row.status as Agent["status"]) ?? "IDLE",
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    balance: 0,
    spendingPerTask: Number(row.policy_max_per_tx) / 4,
    tasksCompleted: 0,
    lastAction: "Awaiting LIVE telemetry…",
    wallet: row.wallet,
    policy: {
      maxDailySpend: Number(row.policy_max_daily_spend),
      maxPerTransaction: Number(row.policy_max_per_tx),
      network: row.policy_network ?? "ARC",
      asset: row.policy_asset ?? "USDC",
      riskMode: row.policy_risk_mode ?? "BALANCED",
      sessionMinutes: Number(row.policy_session_minutes),
      confirmUnknownRecipient: Boolean(row.policy_confirm_unknown),
      confirmContractInteraction: Boolean(row.policy_confirm_contract),
      confirmAboveLimit: Boolean(row.policy_confirm_above_limit),
      allowedServices: Array.isArray(row.allowed_services) ? row.allowed_services : [],
      allowedContracts: Array.isArray(row.allowed_contracts) ? row.allowed_contracts : [],
    },
    tasks: [],
    payments: [],
    logs: [],
    origin: "LIVE",
  };
}

/* ── Services hook ─────────────────────────────────────── */
export async function fetchLiveServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return DEMO_SERVICES;
  const { data, error } = await sbTable("services").select("*").order("created_at", { ascending: true });
  if (error || !data) return DEMO_SERVICES;
  const rows = data as unknown as SbServiceRow[];
  const mapped = rows.map(sbServiceToType);
  const parsed = parseServices(mapped as unknown as unknown[]);
  return parsed.length > 0 ? parsed : DEMO_SERVICES;
}

export function useServices() {
  return useQuery({
    queryKey: ["arcpay", "services"],
    queryFn: fetchLiveServices,
    initialData: DEMO_SERVICES,
    staleTime: isDemoMode ? Infinity : 15_000,
    refetchOnMount: !isDemoMode,
  });
}

/* ── Single service hook ───────────────────────────────── */
export function useService(id: string | undefined) {
  const all = useServices();
  return {
    ...all,
    service: all.data.find((s) => s.id === id) ?? null,
  };
}

/* ── Agents hook + LIVE balance merge ──────────────────── */
export async function fetchLiveAgents(): Promise<Agent[]> {
  let source: Agent[] = DEMO_AGENTS;
  if (isSupabaseConfigured()) {
    const { data, error } = await sbTable("agents").select("*").order("created_at", { ascending: true });
    const rows = data as unknown as SbAgentRow[] | null;
    if (!error && rows && rows.length > 0) {
      source = rows.map(sbAgentToType);
    }
  }
  const wallets = source.map((a) => a.wallet).filter((w): w is Address => /^0x[a-fA-F0-9]{40}$/.test(w));
  if (wallets.length === 0) return source;
  try {
    const balances = await Promise.all(
      wallets.map((w) =>
        viemArc
          .getBalance({ address: w })
          .then((val) => Number(formatUnits(val, USDC_DECIMALS)))
          .catch(() => 0),
      ),
    );
    const byWallet = new Map<string, number>();
    wallets.forEach((w, i) => byWallet.set(w.toLowerCase(), balances[i]!));
    return source.map((a) => {
      const bal = byWallet.get(a.wallet.toLowerCase()) ?? a.balance;
      return { ...a, balance: bal };
    });
  } catch {
    return source;
  }
}

export function useAgents() {
  return useQuery({
    queryKey: ["arcpay", "agents"],
    queryFn: fetchLiveAgents,
    initialData: DEMO_AGENTS,
    staleTime: isDemoMode ? Infinity : 10_000,
    refetchOnMount: !isDemoMode,
    refetchInterval: isDemoMode ? false : 30_000,
  });
}

export function useAgent(id: string | undefined) {
  const all = useAgents();
  return {
    ...all,
    agent: all.data.find((a) => a.id === id) ?? null,
  };
}

/* ── Dashboard series ──────────────────────────────────── */
export function useDashboardSeries() {
  const { data: agents } = useAgents();
  const { data: payments } = usePayments();
  return useQuery({
    queryKey: ["arcpay", "dashboard-series", agents.length, payments.length],
    queryFn: async () => {
      if (isDemoMode) return DEMO_DASHBOARD;
      const now = Date.now();
      const last24 = Array.from({ length: 24 }, (_, i) => {
        const t = new Date(now - (23 - i) * 60 * 60 * 1000);
        return `${t.getHours().toString().padStart(2, "0")}:00`;
      });
      const vol = payments.length > 0
        ? payments.reduce((s, p) => s + Number(p.amount), 0)
        : DEMO_DASHBOARD.paymentVolume.reduce((s: number, p: number) => s + p, 0);
      const perHour = Math.max(0.01, vol / 24);
      const agentActivity = last24.map((label, i) => ({ label, value: Math.max(1, Math.round(agents.length * (2 + Math.sin(i / 3) * 1.2))) }));
      const paymentVolume = last24.map((label, i) => ({
        label,
        value: Number((perHour * (0.6 + ((i * 37) % 100) / 160)).toFixed(2)),
      }));
      const serviceUsage = agents.flatMap((a) => a.policy.allowedServices).reduce((acc, s) => {
        acc.set(s, (acc.get(s) ?? 0) + 1);
        return acc;
      }, new Map<string, number>());
      const usageArr = Array.from(serviceUsage.entries()).slice(0, 12);
      const demoFallback = DEMO_DASHBOARD.serviceUsage;
      const serviceUsageOut = usageArr.length >= 3
        ? usageArr.map(([label, value]) => ({ label, value }))
        : demoFallback;
      const txFreq = last24.map((label, i) => ({
        label,
        value: Math.max(1, Math.round(payments.length * (0.3 + ((i * 17) % 100) / 150))),
      }));
      return { agentActivity, paymentVolume, serviceUsage: serviceUsageOut, txFrequency: txFreq };
    },
    initialData: DEMO_DASHBOARD,
    staleTime: isDemoMode ? Infinity : 20_000,
    refetchInterval: isDemoMode ? false : 60_000,
  });
}

/* ── Payments log hook ─────────────────────────────────── */
async function fetchLivePayments(): Promise<SbPaymentRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await sbTable("payments")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as unknown as SbPaymentRow[];
}

export function usePayments() {
  return useQuery({
    queryKey: ["arcpay", "payments"],
    queryFn: fetchLivePayments,
    initialData: [] as SbPaymentRow[],
    staleTime: isDemoMode ? Infinity : 5_000,
    refetchInterval: isDemoMode ? false : 15_000,
  });
}

export type PublicPaymentRow = SbPaymentRow;

/* ── Insert payment record ─────────────────────────────── */
export async function insertPayment(p: Omit<SbPaymentRow, "id" | "requested_at">): Promise<SbPaymentRow | null> {
  if (!isSupabaseConfigured()) return null;
  const row: Omit<SbPaymentRow, "id" | "requested_at"> = p;
  const { data, error } = await sbTable("payments").insert([row]).select().maybeSingle();
  if (error || !data) return null;
  return data as unknown as SbPaymentRow;
}

/* ── Update payment status + side-channel fields ───────── */
export async function updatePayment(
  id: string,
  patch: Partial<Omit<SbPaymentRow, "id" | "requested_at" | "payer" | "payee" | "amount" | "chain_id" | "asset" | "network">>,
): Promise<SbPaymentRow | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await sbTable("payments").update(patch).eq("id", id).select().maybeSingle();
  if (error || !data) return null;
  return data as unknown as SbPaymentRow;
}

/* ── Activity feed hook ────────────────────────────────── */
async function fetchLiveActivity(limit = 60): Promise<ActivityEvent[]> {
  const sb = isSupabaseConfigured();
  if (!sb) return [];
  const { data, error } = await sbTable("activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const rows = data as unknown as SbActivityRow[];
  return rows.map((r): ActivityEvent => ({
    id: r.id,
    time: r.time,
    actor: r.actor,
    action: r.action,
    target: r.target,
    amount: r.amount ?? undefined,
    network: "ARC",
    channel: (r.channel as ActivityEvent["channel"]) ?? "SERVICE",
    severity: (r.severity as ActivityEvent["severity"]) ?? "INFO",
    meta: {},
  }));
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ["arcpay", "activity-feed"],
    queryFn: () => fetchLiveActivity(60),
    initialData: [] as ActivityEvent[],
    staleTime: isDemoMode ? Infinity : 3_000,
    refetchInterval: isDemoMode ? false : 5_000,
  });
}

export async function insertActivity(a: Omit<SbActivityRow, "id"> & { created_at?: string }): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { created_at: _c, ...row } = a;
  void _c;
  await sbTable("activity").insert([row]);
}

export function makeFallbackActivity(): ActivityEvent {
  return makeDemoActivity();
}

/* ── On-chain transactions hook ───────────────────────── */
export type ArcTx = {
  hash: Hash;
  from: Address;
  to: Address | null;
  value: bigint;
  input: `0x${string}`;
  blockNumber: bigint | null;
  timestamp: number;
  formattedAmount: string;
  usdcEquiv: number;
};

async function recentWalletTxns(address: Address, count = 10): Promise<ArcTx[]> {
  try {
    const block = await viemArc.getBlockNumber();
    const from = block - 5000n < 0n ? 0n : block - 5000n;
    const txns: Transaction[] = [];
    for (let b = from; b <= block && txns.length < count * 3; b += 1n) {
      try {
        const blk = await viemArc.getBlock({ blockNumber: b, includeTransactions: true });
        for (const tx of blk.transactions) {
          if (typeof tx !== "string" && (tx.from === address || tx.to === address)) {
            txns.push(tx);
            if (txns.length >= count * 3) break;
          }
        }
      } catch {
        /* ignore missing blocks */
      }
    }
    return txns.slice(0, count).map((tx) => {
      const formatted = formatUnits(tx.value, USDC_DECIMALS);
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? null,
        value: tx.value,
        input: tx.input,
        blockNumber: tx.blockNumber ?? null,
        timestamp: 0,
        formattedAmount: formatted,
        usdcEquiv: Number(formatted),
      };
    });
  } catch {
    return [];
  }
}

export function useWalletTransactions(address: Address | undefined) {
  return useQuery({
    queryKey: ["arcpay", "wallet-txns", address],
    queryFn: () => (address ? recentWalletTxns(address, 10) : []),
    initialData: [] as ArcTx[],
    enabled: Boolean(address && !isDemoMode),
    refetchInterval: isDemoMode ? false : 12_000,
  });
}

/* ── Re-export public client for direct use ───────────── */
export const arcPublicClient = viemArc;

export type { SbServiceRow, SbAgentRow, SbPaymentRow, SbActivityRow };
