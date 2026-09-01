/**
 * ARCPAY AGENT — Agent Runtime contracts.
 *
 * These interfaces are the seam between the UI and the execution backend.
 * Today they are fulfilled by `simulated.ts` (pure in-browser fixtures).
 * A real ARC / USDC / Circle backend can implement the same interfaces
 * (HTTP 402 discovery, wallet authorization, on-chain settlement) and be
 * dropped in without touching the state machine or any component.
 */

export const AGENT_STATES = [
  "IDLE",
  "DISCOVERING",
  "ANALYZING",
  "AUTHORIZING",
  "PAYING",
  "SETTLING",
  "EXECUTING",
  "VERIFYING",
  "COMPLETED",
  "FAILED",
] as const;

export type AgentState = (typeof AGENT_STATES)[number];

export type RuntimeChannel =
  | "AGENT"
  | "SERVICE"
  | "POLICY"
  | "PAYMENT"
  | "NETWORK"
  | "SETTLEMENT"
  | "RESOURCE"
  | "SYSTEM"
  | "ERROR";

export interface RuntimeLogEvent {
  id: string;
  at: string;
  elapsedMs: number;
  channel: RuntimeChannel;
  state: AgentState;
  message: string;
  level: "info" | "success" | "warn" | "error";
}

/* ── Service discovery ─────────────────────────────────── */

export interface ServiceDescriptor {
  id: string;
  name: string;
  category: string;
  provider: string;
  endpoint: string;
  price: number;
  asset: string;
  unit: string;
  network: string;
  latencyMs: number;
  status: "AVAILABLE" | "DEGRADED" | "OFFLINE";
  capabilities: string[];
}

export interface DiscoveryQuery {
  capability?: string | undefined;
  maxPrice?: number | undefined;
}

export interface ServiceDirectory {
  discover(query: DiscoveryQuery): Promise<ServiceDescriptor[]>;
  describe(serviceId: string): Promise<ServiceDescriptor | null>;
  /** Machine-readable HTTP 402 challenge, as an agent would receive it. */
  quote(serviceId: string): Promise<PaymentChallenge>;
}

export interface PaymentChallenge {
  serviceId: string;
  httpStatus: 402;
  amount: number;
  asset: string;
  network: string;
  payTo: string;
  nonce: string;
  expiresInSeconds: number;
}

/* ── Spending policy ───────────────────────────────────── */

export interface SpendingPolicy {
  maxPerTransaction: number;
  maxDailySpend: number;
  asset: string;
  network: string;
  riskMode: "SAFE" | "BALANCED" | "AUTONOMOUS";
  allowedServices: string[];
  requireConfirmationAbove: number;
}

export interface PolicyDecision {
  approved: boolean;
  code:
    | "APPROVED"
    | "DENIED_PER_TX_LIMIT"
    | "DENIED_DAILY_LIMIT"
    | "DENIED_SERVICE_NOT_ALLOWED"
    | "DENIED_NETWORK_MISMATCH"
    | "DENIED_INSUFFICIENT_BALANCE";
  reason: string;
  remainingDaily: number;
}

export interface PolicyEngine {
  evaluate(input: {
    policy: SpendingPolicy;
    challenge: PaymentChallenge;
    spentToday: number;
    balance: number;
  }): PolicyDecision;
}

/* ── Payment rail ──────────────────────────────────────── */

export interface PaymentAuthorization {
  id: string;
  serviceId: string;
  amount: number;
  asset: string;
  network: string;
  payer: string;
  payee: string;
  nonce: string;
  signature: string;
  expiresAt: string;
}

export interface PaymentReceipt {
  id: string;
  authorizationId: string;
  txHash: string;
  amount: number;
  asset: string;
  network: string;
  blockHeight: number;
  feePaid: number;
  settledAt: string;
  status: "SETTLED" | "FAILED";
  simulated: boolean;
}

export interface VerificationResult {
  verified: boolean;
  confirmations: number;
  detail: string;
}

export interface PaymentRail {
  authorize(input: { challenge: PaymentChallenge; payer: string }): Promise<PaymentAuthorization>;
  settle(auth: PaymentAuthorization): Promise<PaymentReceipt>;
  verify(receipt: PaymentReceipt): Promise<VerificationResult>;
}

/* ── Service execution ─────────────────────────────────── */

export interface ServiceResponse {
  serviceId: string;
  httpStatus: number;
  latencyMs: number;
  contentType: string;
  body: string;
  simulated: boolean;
}

export interface ServiceClient {
  invoke(input: {
    service: ServiceDescriptor;
    receipt: PaymentReceipt;
    task: TaskRequest;
  }): Promise<ServiceResponse>;
}

/* ── Tasks ─────────────────────────────────────────────── */

export interface TaskRequest {
  id: string;
  label: string;
  capability: string;
  /** Optional pinned service; otherwise the agent picks the cheapest match. */
  preferredServiceId?: string | undefined;
  maxPrice?: number | undefined;
}

export interface TaskRecord {
  id: string;
  label: string;
  serviceId: string | null;
  serviceName: string | null;
  amount: number;
  asset: string;
  network: string;
  txHash: string | null;
  outcome: "SUCCESS" | "FAILED";
  reason: string;
  durationMs: number;
  finishedAt: string;
  simulated: boolean;
}

/* ── Runtime snapshot ──────────────────────────────────── */

export interface RuntimeSnapshot {
  state: AgentState;
  paused: boolean;
  running: boolean;
  agentId: string;
  agentName: string;
  wallet: string;
  balance: number;
  spentToday: number;
  policy: SpendingPolicy;

  task: TaskRequest | null;
  discovered: ServiceDescriptor[];
  service: ServiceDescriptor | null;
  challenge: PaymentChallenge | null;
  decision: PolicyDecision | null;
  authorization: PaymentAuthorization | null;
  receipt: PaymentReceipt | null;
  verification: VerificationResult | null;
  response: ServiceResponse | null;

  logs: RuntimeLogEvent[];
  history: TaskRecord[];
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface RuntimeBackend {
  directory: ServiceDirectory;
  policyEngine: PolicyEngine;
  paymentRail: PaymentRail;
  serviceClient: ServiceClient;
  /** Label rendered in the UI, e.g. "SIMULATED AGENT RUNTIME". */
  label: string;
  simulated: boolean;
}
