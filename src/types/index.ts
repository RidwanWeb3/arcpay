export type DataOrigin = "DEMO" | "SIMULATION" | "LIVE";

export type AgentStatusValue = "ONLINE" | "IDLE" | "BUSY" | "OFFLINE";

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

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  method: string;
  network: string;
  status: "AVAILABLE" | "DEGRADED" | "OFFLINE";
  provider: string;
  responseTimeMs: number;
  description: string;
  endpoint: string;
  capabilities: string[];
  sampleResponse: string;
  compatibility: string[];
  origin: DataOrigin;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  amount?: number;
  network: string;
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
