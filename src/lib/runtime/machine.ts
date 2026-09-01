/**
 * ARCPAY AGENT — central agent state machine.
 *
 * Pure orchestration: it drives a task through the agent lifecycle by
 * calling the RuntimeBackend interfaces. It knows nothing about React,
 * and nothing about whether the backend is simulated or live.
 */
import type {
  AgentState,
  PaymentReceipt,
  RuntimeBackend,
  RuntimeLogEvent,
  RuntimeChannel,
  RuntimeSnapshot,
  ServiceDescriptor,
  TaskRecord,
  TaskRequest,
} from "./types";

export const TRANSITIONS: Record<AgentState, AgentState[]> = {
  IDLE: ["DISCOVERING"],
  DISCOVERING: ["ANALYZING", "FAILED"],
  ANALYZING: ["AUTHORIZING", "FAILED"],
  AUTHORIZING: ["PAYING", "FAILED"],
  PAYING: ["SETTLING", "FAILED"],
  SETTLING: ["VERIFYING", "FAILED"],
  VERIFYING: ["EXECUTING", "FAILED"],
  EXECUTING: ["COMPLETED", "FAILED"],
  COMPLETED: ["IDLE", "DISCOVERING"],
  FAILED: ["IDLE", "DISCOVERING"],
};

export function canTransition(from: AgentState, to: AgentState) {
  return TRANSITIONS[from].includes(to);
}

export interface RunControls {
  /** Resolves when the runtime is allowed to continue; rejects nothing. */
  waitWhilePaused: () => Promise<void>;
  /** True once STOP has been requested. */
  isStopped: () => boolean;
  /** Artificial pacing so the lifecycle is legible on screen. */
  stepDelayMs: number;
}

export interface RunHooks {
  patch: (p: Partial<RuntimeSnapshot>) => void;
  log: (
    channel: RuntimeChannel,
    state: AgentState,
    message: string,
    level?: RuntimeLogEvent["level"],
  ) => void;
}

export class StoppedError extends Error {
  constructor() {
    super("STOPPED");
    this.name = "StoppedError";
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface RunTaskInput {
  backend: RuntimeBackend;
  task: TaskRequest;
  agent: { id: string; name: string; wallet: string; balance: number; spentToday: number };
  policy: RuntimeSnapshot["policy"];
  controls: RunControls;
  hooks: RunHooks;
}

export interface RunTaskResult {
  record: TaskRecord;
  receipt: PaymentReceipt | null;
}

export async function runTask(input: RunTaskInput): Promise<RunTaskResult> {
  const { backend, task, agent, policy, controls, hooks } = input;
  const started = Date.now();

  const gate = async (state: AgentState) => {
    await controls.waitWhilePaused();
    if (controls.isStopped()) throw new StoppedError();
    hooks.patch({ state });
    await sleep(controls.stepDelayMs);
    await controls.waitWhilePaused();
    if (controls.isStopped()) throw new StoppedError();
  };

  const fail = (reason: string, serviceRef?: ServiceDescriptor | null): RunTaskResult => {
    hooks.patch({ state: "FAILED", error: reason, finishedAt: Date.now() });
    hooks.log("ERROR", "FAILED", reason, "error");
    return {
      receipt: null,
      record: {
        id: task.id,
        label: task.label,
        serviceId: serviceRef?.id ?? null,
        serviceName: serviceRef?.name ?? null,
        amount: 0,
        asset: policy.asset,
        network: policy.network,
        txHash: null,
        outcome: "FAILED",
        reason,
        durationMs: Date.now() - started,
        finishedAt: new Date().toISOString(),
        simulated: backend.simulated,
      },
    };
  };

  hooks.log("AGENT", "IDLE", `Task accepted: ${task.label} (${task.id})`, "info");

  /* 1 — DISCOVER */
  await gate("DISCOVERING");
  hooks.log("AGENT", "DISCOVERING", `Broadcasting discovery query capability=${task.capability}`);
  const found = await backend.directory.discover({
    capability: task.capability,
    maxPrice: task.maxPrice,
  });
  hooks.patch({ discovered: found });
  hooks.log("SERVICE", "DISCOVERING", `${found.length} service(s) responded to discovery.`);
  if (found.length === 0) return fail("No service matched the task capability.");

  /* 2 — ANALYZE */
  await gate("ANALYZING");
  const picked =
    (task.preferredServiceId ? found.find((s) => s.id === task.preferredServiceId) : undefined) ??
    [...found].sort((a, b) => a.price - b.price)[0]!;
  const service = (await backend.directory.describe(picked.id)) ?? picked;
  hooks.patch({ service });
  hooks.log(
    "SERVICE",
    "ANALYZING",
    `Selected ${service.name} · ${service.endpoint} · provider ${service.provider}`,
  );

  const challenge = await backend.directory.quote(service.id);
  hooks.patch({ challenge });
  hooks.log(
    "SERVICE",
    "ANALYZING",
    `HTTP 402 PAYMENT REQUIRED — ${challenge.amount} ${challenge.asset} / ${service.unit} on ${challenge.network}`,
    "warn",
  );

  const decision = backend.policyEngine.evaluate({
    policy,
    challenge,
    spentToday: agent.spentToday,
    balance: agent.balance,
  });
  hooks.patch({ decision });
  hooks.log("POLICY", "ANALYZING", `${decision.code} — ${decision.reason}`, decision.approved ? "success" : "error");
  if (!decision.approved) return fail(`Policy rejected payment: ${decision.code}`, service);

  /* 3 — AUTHORIZE */
  await gate("AUTHORIZING");
  const authorization = await backend.paymentRail.authorize({ challenge, payer: agent.wallet });
  hooks.patch({ authorization });
  hooks.log(
    "PAYMENT",
    "AUTHORIZING",
    `Authorization ${authorization.id} signed by ${authorization.payer} → ${authorization.payee}`,
    "success",
  );

  /* 4 — PAY */
  await gate("PAYING");
  hooks.log(
    "NETWORK",
    "PAYING",
    `Submitting ${authorization.amount} ${authorization.asset} to ${authorization.network} payment router...`,
  );

  /* 5 — SETTLE */
  await gate("SETTLING");
  const receipt = await backend.paymentRail.settle(authorization);
  hooks.patch({ receipt });
  if (receipt.status !== "SETTLED") return fail("Settlement failed on the payment rail.", service);
  hooks.log(
    "SETTLEMENT",
    "SETTLING",
    `Settled ${receipt.amount} ${receipt.asset} · tx ${receipt.txHash.slice(0, 18)}… · block ${receipt.blockHeight}`,
    "success",
  );

  /* 6 — VERIFY */
  await gate("VERIFYING");
  const verification = await backend.paymentRail.verify(receipt);
  hooks.patch({ verification });
  hooks.log(
    "SETTLEMENT",
    "VERIFYING",
    `${verification.verified ? "VERIFIED" : "UNVERIFIED"} · ${verification.confirmations} confirmation(s) · ${verification.detail}`,
    verification.verified ? "success" : "error",
  );
  if (!verification.verified) return fail("Payment could not be verified.", service);

  /* 7 — EXECUTE */
  await gate("EXECUTING");
  const response = await backend.serviceClient.invoke({ service, receipt, task });
  hooks.patch({ response });
  hooks.log(
    "RESOURCE",
    "EXECUTING",
    `${service.name} returned ${response.httpStatus} in ${response.latencyMs}ms — resource unlocked.`,
    "success",
  );

  /* 8 — COMPLETE */
  await gate("COMPLETED");
  const record: TaskRecord = {
    id: task.id,
    label: task.label,
    serviceId: service.id,
    serviceName: service.name,
    amount: receipt.amount,
    asset: receipt.asset,
    network: receipt.network,
    txHash: receipt.txHash,
    outcome: "SUCCESS",
    reason: "Task completed and payment verified.",
    durationMs: Date.now() - started,
    finishedAt: new Date().toISOString(),
    simulated: backend.simulated,
  };
  hooks.patch({ state: "COMPLETED", finishedAt: Date.now() });
  hooks.log("AGENT", "COMPLETED", `Task ${task.id} recorded · ${record.amount} ${record.asset} spent.`, "success");
  return { record, receipt };
}
