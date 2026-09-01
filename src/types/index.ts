import { z } from "zod";

export type DataOrigin = "DEMO" | "SIMULATION" | "LIVE";

export type AgentStatusValue = "ONLINE" | "IDLE" | "BUSY" | "OFFLINE";

export type ServiceStatusValue = "AVAILABLE" | "DEGRADED" | "OFFLINE";

export type RiskMode = "SAFE" | "BALANCED" | "AUTONOMOUS";

export interface AgentPolicy {
  maxDailySpend: number;
  maxPerTransaction: number;
  network: string;
  asset: string;
  riskMode: RiskMode;
  sessionMinutes: number;
  confirmUnknownRecipient: boolean;
  confirmContractInteraction: boolean;
  confirmAboveLimit: boolean;
  allowedServices: string[];
  allowedContracts: string[];
}

export interface AgentTask {
  id: string;
  name: string;
  status: "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED";
  cost: number;
  at: string;
}

export interface AgentPayment {
  id: string;
  to: string;
  amount: number;
  status: "SETTLED" | "PENDING" | "AUTHORIZED";
  at: string;
}

export interface AgentLogLine {
  at: string;
  channel: "AGENT" | "SERVICE" | "PAYMENT" | "NETWORK" | "SETTLEMENT" | "RESOURCE" | "POLICY";
  message: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  purpose: string;
  status: AgentStatusValue;
  capabilities: string[];
  balance: number;
  spendingPerTask: number;
  tasksCompleted: number;
  lastAction: string;
  wallet: string;
  policy: AgentPolicy;
  tasks: AgentTask[];
  payments: AgentPayment[];
  logs: AgentLogLine[];
  origin: DataOrigin;
}

export type ServiceCategory =
  "DATA" | "AI" | "COMPUTE" | "SEARCH" | "STORAGE" | "FINANCE" | "ORACLES" | "CONTENT";

export type SortKey = "PRICE" | "POPULARITY" | "LATENCY" | "AVAILABILITY";

export interface ApiSpec {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  headers: Record<string, string>;
  queryParams?: Record<string, string> | undefined;
  body?: Record<string, unknown> | undefined;
  responseSchema: Record<string, unknown>;
}

export interface AgentRequirements {
  minVersion: string;
  minBalance: number;
  requiredCapabilities: string[];
  recommendedCapabilities: string[];
  maxPerTransaction: number;
  supportedRiskModes: Array<"SAFE" | "BALANCED" | "AUTONOMOUS">;
  capabilities: string[];
  architectures: string[];
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  unit: string;
  paymentAsset: string;
  network: string;
  status: ServiceStatusValue;
  availability: number;
  provider: string;
  providerWallet: string;
  latency: number;
  popularity: number;
  description: string;
  endpoint: string;
  authHeader?: string | undefined;
  capabilities: string[];
  sampleResponse: string;
  compatibility: string[];
  outputCategories: string[];
  origin: DataOrigin;
  apiSpec: ApiSpec;
  pricing: {
    unit: string;
    tier: "STANDARD" | "PREMIUM" | "ENTERPRISE";
    volumeDiscount?: boolean | undefined;
    freeTier?: string | undefined;
  };
  paymentMethod: {
    assets: string[];
    networks: string[];
    settlement: "ON-CHAIN" | "CHANNEL" | "ESCROW";
  };
  agentRequirements: AgentRequirements;
  exampleRequest: string;
  exampleResponse: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  amount?: number | undefined;
  network: string;
  channel: "AGENT" | "SERVICE" | "PAYMENT" | "NETWORK" | "SETTLEMENT" | "RESOURCE" | "POLICY";
  severity: "INFO" | "WARN" | "ERROR" | "OK";
  meta?: Record<string, unknown> | undefined;
}

export interface SimulatedPayment {
  id: string;
  from: string;
  to: string;
  amount: number;
  asset: string;
  network: string;
  purpose: string;
  status: "REQUEST" | "AUTHORIZATION" | "VERIFICATION" | "SETTLEMENT" | "CONFIRMED";
  timestamp: string;
}

export interface StoredFile {
  id: string;
  filename: string;
  mime_type: string;
  extension: string | null;
  size_bytes: number;
  storage_path: string;
  created_at: string;
}

/* ── Zod runtime schemas (rulebook compliance) ─────────── */

export const DataOriginSchema = z.enum(["DEMO", "SIMULATION", "LIVE"]);
export const ServiceCategorySchema = z.enum([
  "DATA",
  "AI",
  "COMPUTE",
  "SEARCH",
  "STORAGE",
  "FINANCE",
  "ORACLES",
  "CONTENT",
]);
export const ServiceStatusSchema = z.enum(["AVAILABLE", "DEGRADED", "OFFLINE"]);
export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);
export const PricingTierSchema = z.enum(["STANDARD", "PREMIUM", "ENTERPRISE"]);
export const SettlementModeSchema = z.enum(["ON-CHAIN", "CHANNEL", "ESCROW"]);
export const RiskModeSchema = z.enum(["SAFE", "BALANCED", "AUTONOMOUS"]);

export const ApiSpecSchema: z.ZodType<ApiSpec> = z.object({
  method: HttpMethodSchema,
  path: z.string(),
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  responseSchema: z.record(z.string(), z.unknown()),
});

export const AgentRequirementsSchema: z.ZodType<AgentRequirements> = z.object({
  minVersion: z.string(),
  minBalance: z.number(),
  requiredCapabilities: z.array(z.string()),
  recommendedCapabilities: z.array(z.string()),
  maxPerTransaction: z.number(),
  supportedRiskModes: z.array(RiskModeSchema),
  capabilities: z.array(z.string()),
  architectures: z.array(z.string()),
});

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ServiceCategorySchema,
  price: z.number(),
  unit: z.string(),
  paymentAsset: z.string(),
  network: z.string(),
  status: ServiceStatusSchema,
  availability: z.number(),
  provider: z.string(),
  providerWallet: z.string().default("0x0000000000000000000000000000000000000000"),
  latency: z.number(),
  popularity: z.number(),
  description: z.string(),
  endpoint: z.string(),
  authHeader: z.string().optional(),
  capabilities: z.array(z.string()),
  sampleResponse: z.string(),
  compatibility: z.array(z.string()),
  outputCategories: z.array(z.string()).optional().default([]),
  origin: DataOriginSchema,
  apiSpec: ApiSpecSchema,
  pricing: z.object({
    unit: z.string(),
    tier: PricingTierSchema,
    volumeDiscount: z.boolean().optional(),
    freeTier: z.string().optional(),
  }),
  paymentMethod: z.object({
    assets: z.array(z.string()),
    networks: z.array(z.string()),
    settlement: SettlementModeSchema,
  }),
  agentRequirements: AgentRequirementsSchema,
  exampleRequest: z.string(),
  exampleResponse: z.string(),
});

export const parseServices = (raw: unknown[]): Service[] => {
  return raw.map((s, i) => {
    const r = ServiceSchema.safeParse(s);
    if (!r.success) {
      const issues = r.error.issues
        .slice(0, 3)
        .map((iss) => `[${iss.path.join(".")}] ${iss.message}`)
        .join("; ");
      throw new Error(`Service at index ${i} failed Zod validation: ${issues}`);
    }
    return r.data;
  });
};
