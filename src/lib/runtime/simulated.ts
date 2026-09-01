/**
 * ARCPAY AGENT — SIMULATED backend for the Agent Runtime.
 *
 * Implements every interface in `./types` with deterministic, in-browser
 * fixtures. No RPC, no wallet, no funds. Swap this module for a real
 * ARC / USDC implementation and the runtime keeps working unchanged.
 */
import { SERVICES } from "@/lib/demoData";
import type {
  DiscoveryQuery,
  PaymentAuthorization,
  PaymentChallenge,
  PaymentRail,
  PaymentReceipt,
  PolicyDecision,
  PolicyEngine,
  RuntimeBackend,
  ServiceClient,
  ServiceDescriptor,
  ServiceDirectory,
  ServiceResponse,
  VerificationResult,
} from "./types";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let seq = 0;
const uid = (p: string) => `${p}-${(++seq).toString().padStart(4, "0")}`;

const hex = (n: number) => {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
};

export const DESCRIPTORS: ServiceDescriptor[] = SERVICES.map((s) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  provider: s.provider,
  endpoint: s.endpoint,
  price: s.price,
  asset: s.paymentAsset,
  unit: s.unit,
  network: s.network,
  latencyMs: s.latency,
  status: s.status,
  capabilities: s.capabilities,
}));

/* ── Directory ─────────────────────────────────────────── */

export const simulatedDirectory: ServiceDirectory = {
  async discover(query: DiscoveryQuery) {
    await wait(120);
    return DESCRIPTORS.filter((d) => {
      if (d.status === "OFFLINE") return false;
      if (query.maxPrice !== undefined && d.price > query.maxPrice) return false;
      if (query.capability) {
        const cap = query.capability.toUpperCase();
        const hit =
          d.capabilities.some((c) => c.toUpperCase().includes(cap)) ||
          d.category.toUpperCase().includes(cap) ||
          d.name.toUpperCase().includes(cap) ||
          d.id.toUpperCase().includes(cap);
        if (!hit) return false;
      }
      return true;
    });
  },
  async describe(serviceId: string) {
    await wait(60);
    return DESCRIPTORS.find((d) => d.id === serviceId) ?? null;
  },
  async quote(serviceId: string): Promise<PaymentChallenge> {
    await wait(80);
    const svc = DESCRIPTORS.find((d) => d.id === serviceId);
    if (!svc) throw new Error(`SERVICE_NOT_FOUND: ${serviceId}`);
    return {
      serviceId,
      httpStatus: 402,
      amount: svc.price,
      asset: svc.asset,
      network: svc.network,
      payTo: `0x${hex(4)}...${hex(4)}`,
      nonce: hex(16),
      expiresInSeconds: 60,
    };
  },
};

/* ── Policy engine ─────────────────────────────────────── */

export const simulatedPolicyEngine: PolicyEngine = {
  evaluate({ policy, challenge, spentToday, balance }): PolicyDecision {
    const remainingDaily = Math.max(0, policy.maxDailySpend - spentToday);
    if (challenge.network !== policy.network || challenge.asset !== policy.asset) {
      return {
        approved: false,
        code: "DENIED_NETWORK_MISMATCH",
        reason: `Policy allows ${policy.asset} on ${policy.network}; challenge is ${challenge.asset} on ${challenge.network}.`,
        remainingDaily,
      };
    }
    if (
      policy.allowedServices.length > 0 &&
      !policy.allowedServices.includes(challenge.serviceId)
    ) {
      return {
        approved: false,
        code: "DENIED_SERVICE_NOT_ALLOWED",
        reason: `${challenge.serviceId} is not on the agent allow-list.`,
        remainingDaily,
      };
    }
    if (challenge.amount > policy.maxPerTransaction) {
      return {
        approved: false,
        code: "DENIED_PER_TX_LIMIT",
        reason: `Amount ${challenge.amount} exceeds per-transaction ceiling ${policy.maxPerTransaction}.`,
        remainingDaily,
      };
    }
    if (challenge.amount > remainingDaily) {
      return {
        approved: false,
        code: "DENIED_DAILY_LIMIT",
        reason: `Daily budget exhausted — ${remainingDaily.toFixed(4)} ${policy.asset} remaining.`,
        remainingDaily,
      };
    }
    if (challenge.amount > balance) {
      return {
        approved: false,
        code: "DENIED_INSUFFICIENT_BALANCE",
        reason: `Agent balance ${balance.toFixed(4)} ${policy.asset} is below the quoted price.`,
        remainingDaily,
      };
    }
    return {
      approved: true,
      code: "APPROVED",
      reason: `Within policy — ${challenge.amount} ${policy.asset} ≤ ${policy.maxPerTransaction}/tx, ${remainingDaily.toFixed(2)} left today.`,
      remainingDaily,
    };
  },
};

/* ── Payment rail ──────────────────────────────────────── */

export const simulatedPaymentRail: PaymentRail = {
  async authorize({ challenge, payer }): Promise<PaymentAuthorization> {
    await wait(160);
    return {
      id: uid("AUTH"),
      serviceId: challenge.serviceId,
      amount: challenge.amount,
      asset: challenge.asset,
      network: challenge.network,
      payer,
      payee: challenge.payTo,
      nonce: challenge.nonce,
      signature: `sig:0x${hex(24)}`,
      expiresAt: new Date(Date.now() + challenge.expiresInSeconds * 1000).toISOString(),
    };
  },
  async settle(auth): Promise<PaymentReceipt> {
    await wait(220);
    return {
      id: uid("PAY"),
      authorizationId: auth.id,
      txHash: `0x${hex(40)}`,
      amount: auth.amount,
      asset: auth.asset,
      network: auth.network,
      blockHeight: 4_100_000 + Math.floor(Math.random() * 90_000),
      feePaid: 0.000001,
      settledAt: new Date().toISOString(),
      status: "SETTLED",
      simulated: true,
    };
  },
  async verify(receipt): Promise<VerificationResult> {
    await wait(140);
    return {
      verified: receipt.status === "SETTLED",
      confirmations: 2,
      detail: `Receipt ${receipt.id} verified against ${receipt.network} (simulated ledger).`,
    };
  },
};

/* ── Service client ────────────────────────────────────── */

const BODIES: Record<string, () => string> = {
  "market-data-api": () =>
    JSON.stringify(
      {
        symbol: "ETHUSD",
        price: (2400 + Math.random() * 220).toFixed(2),
        change24h: `${(Math.random() * 6 - 3).toFixed(2)}%`,
        source: "demo-fixture",
        mode: "SIMULATED",
      },
      null,
      2,
    ),
  "ai-inference": () =>
    JSON.stringify(
      {
        output: "Agent-ready summary generated from fixture corpus.",
        tokens: 120 + Math.floor(Math.random() * 400),
        model: "demo-model",
        mode: "SIMULATED",
      },
      null,
      2,
    ),
  "web-search": () =>
    JSON.stringify(
      { results: 3, top: "arc.network — payment rails for agents", mode: "SIMULATED" },
      null,
      2,
    ),
};

export const simulatedServiceClient: ServiceClient = {
  async invoke({ service, receipt }): Promise<ServiceResponse> {
    await wait(Math.min(400, service.latencyMs));
    const body =
      BODIES[service.id]?.() ??
      JSON.stringify(
        { service: service.id, ok: true, receipt: receipt.id, mode: "SIMULATED" },
        null,
        2,
      );
    return {
      serviceId: service.id,
      httpStatus: 200,
      latencyMs: service.latencyMs,
      contentType: "application/json",
      body,
      simulated: true,
    };
  },
};

export const simulatedBackend: RuntimeBackend = {
  directory: simulatedDirectory,
  policyEngine: simulatedPolicyEngine,
  paymentRail: simulatedPaymentRail,
  serviceClient: simulatedServiceClient,
  label: "SIMULATED AGENT RUNTIME",
  simulated: true,
};
