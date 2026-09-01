import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runTask, StoppedError } from "@/lib/runtime/machine";
import { simulatedBackend } from "@/lib/runtime/simulated";
import type {
  RuntimeBackend,
  RuntimeChannel,
  RuntimeLogEvent,
  RuntimeSnapshot,
  SpendingPolicy,
  TaskRequest,
  AgentState,
} from "@/lib/runtime/types";

export const DEFAULT_POLICY: SpendingPolicy = {
  maxPerTransaction: 0.05,
  maxDailySpend: 5,
  asset: "USDC",
  network: "ARC",
  riskMode: "BALANCED",
  allowedServices: ["market-data-api", "ai-inference", "web-search"],
  requireConfirmationAbove: 1,
};

export const TASK_PRESETS: TaskRequest[] = [
  { id: "TASK-001", label: "MARKET DATA", capability: "MARKET", preferredServiceId: "market-data-api" },
  { id: "TASK-002", label: "MODEL INFERENCE", capability: "INFERENCE", preferredServiceId: "ai-inference" },
  { id: "TASK-003", label: "WEB RESEARCH", capability: "DISCOVERY", preferredServiceId: "web-search" },
  { id: "TASK-004", label: "CHEAPEST ROUTE", capability: "" },
];

const AGENT = {
  id: "apa-runtime-agent",
  name: "APA RUNTIME AGENT",
  wallet: "0xA1F2...9C4D",
};

const INITIAL_BALANCE = 12.5;

function emptySnapshot(policy: SpendingPolicy): RuntimeSnapshot {
  return {
    state: "IDLE",
    paused: false,
    running: false,
    agentId: AGENT.id,
    agentName: AGENT.name,
    wallet: AGENT.wallet,
    balance: INITIAL_BALANCE,
    spentToday: 0,
    policy,
    task: null,
    discovered: [],
    service: null,
    challenge: null,
    decision: null,
    authorization: null,
    receipt: null,
    verification: null,
    response: null,
    logs: [],
    history: [],
    error: null,
    startedAt: null,
    finishedAt: null,
  };
}

let logSeq = 0;

export function useAgentRuntime(backend: RuntimeBackend = simulatedBackend) {
  const [snap, setSnap] = useState<RuntimeSnapshot>(() => emptySnapshot(DEFAULT_POLICY));
  const [speed, setSpeed] = useState(1);

  const pausedRef = useRef(false);
  const stoppedRef = useRef(false);
  const runningRef = useRef(false);
  const startRef = useRef(0);
  const speedRef = useRef(1);
  speedRef.current = speed;

  const patch = useCallback((p: Partial<RuntimeSnapshot>) => {
    setSnap((s) => ({ ...s, ...p }));
  }, []);

  const log = useCallback(
    (channel: RuntimeChannel, state: AgentState, message: string, level: RuntimeLogEvent["level"] = "info") => {
      const now = new Date();
      const event: RuntimeLogEvent = {
        id: `E${++logSeq}`,
        at: now.toTimeString().slice(0, 8),
        elapsedMs: startRef.current ? now.getTime() - startRef.current : 0,
        channel,
        state,
        message,
        level,
      };
      setSnap((s) => ({ ...s, logs: [...s.logs, event] }));
    },
    [],
  );

  const start = useCallback(
    async (task: TaskRequest) => {
      if (runningRef.current) return;
      runningRef.current = true;
      pausedRef.current = false;
      stoppedRef.current = false;
      startRef.current = Date.now();

      let policy = DEFAULT_POLICY;
      let balance = INITIAL_BALANCE;
      let spentToday = 0;
      setSnap((s) => {
        policy = s.policy;
        balance = s.balance;
        spentToday = s.spentToday;
        return {
          ...s,
          state: "IDLE",
          running: true,
          paused: false,
          task,
          discovered: [],
          service: null,
          challenge: null,
          decision: null,
          authorization: null,
          receipt: null,
          verification: null,
          response: null,
          error: null,
          startedAt: Date.now(),
          finishedAt: null,
          logs: [],
        };
      });

      // let the state flush before the machine starts writing
      await new Promise((r) => setTimeout(r, 0));

      try {
        const { record, receipt } = await runTask({
          backend,
          task,
          agent: { ...AGENT, balance, spentToday },
          policy,
          controls: {
            stepDelayMs: Math.round(420 / speedRef.current),
            isStopped: () => stoppedRef.current,
            waitWhilePaused: async () => {
              while (pausedRef.current && !stoppedRef.current) {
                await new Promise((r) => setTimeout(r, 120));
              }
            },
          },
          hooks: { patch, log },
        });

        setSnap((s) => ({
          ...s,
          running: false,
          history: [record, ...s.history].slice(0, 20),
          balance: receipt ? Math.max(0, s.balance - receipt.amount) : s.balance,
          spentToday: receipt ? s.spentToday + receipt.amount : s.spentToday,
        }));
      } catch (err) {
        if (err instanceof StoppedError) {
          setSnap((s) => ({ ...s, running: false, state: "FAILED", error: "Stopped by operator." }));
          log("SYSTEM", "FAILED", "STOP signal received — runtime halted by operator.", "error");
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setSnap((s) => ({ ...s, running: false, state: "FAILED", error: message }));
          log("ERROR", "FAILED", message, "error");
        }
      } finally {
        runningRef.current = false;
        pausedRef.current = false;
        setSnap((s) => ({ ...s, running: false, paused: false }));
      }
    },
    [backend, log, patch],
  );

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    pausedRef.current = !pausedRef.current;
    const paused = pausedRef.current;
    setSnap((s) => ({ ...s, paused }));
    log("SYSTEM", "IDLE", paused ? "Runtime paused — awaiting operator." : "Runtime resumed.", "warn");
  }, [log]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    stoppedRef.current = true;
    pausedRef.current = false;
  }, []);

  const reset = useCallback(() => {
    stoppedRef.current = true;
    pausedRef.current = false;
    setSnap((s) => emptySnapshot(s.policy));
  }, []);

  const replay = useCallback(() => {
    const task = snap.task ?? TASK_PRESETS[0]!;
    void start(task);
  }, [snap.task, start]);

  const setPolicy = useCallback((p: Partial<SpendingPolicy>) => {
    setSnap((s) => ({ ...s, policy: { ...s.policy, ...p } }));
  }, []);

  useEffect(() => () => {
    stoppedRef.current = true;
  }, []);

  const summary = useMemo(
    () => ({
      status: snap.state,
      task: snap.task?.label ?? "—",
      service: snap.service?.name ?? "—",
      price: snap.challenge ? `${snap.challenge.amount} ${snap.challenge.asset}` : "—",
      network: snap.policy.network,
      policy: snap.decision ? (snap.decision.approved ? "APPROVED" : snap.decision.code) : "PENDING",
      payment: snap.verification?.verified
        ? "VERIFIED"
        : snap.receipt
          ? "SETTLED"
          : snap.authorization
            ? "AUTHORIZED"
            : "—",
      result:
        snap.state === "COMPLETED"
          ? "SUCCESS"
          : snap.state === "FAILED"
            ? "FAILED"
            : snap.running
              ? "IN PROGRESS"
              : "—",
    }),
    [snap],
  );

  return { snap, summary, start, pause, stop, reset, replay, setPolicy, speed, setSpeed, backend };
}
