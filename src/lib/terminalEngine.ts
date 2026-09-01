import { AGENTS, SERVICES } from "@/lib/demoData";
import { projectConfig } from "@/config/projectConfig";

export interface TerminalLine {
  id: string;
  kind: "input" | "output" | "system" | "error" | "success";
  text: string;
}

let counter = 0;
export const line = (kind: TerminalLine["kind"], text: string): TerminalLine => ({
  id: `l${++counter}`,
  kind,
  text,
});

export const BANNER: TerminalLine[] = [
  line("system", "ARCPAY AGENT // AGENT COMMAND TERMINAL v0.9.4"),
  line("system", `NETWORK ${projectConfig.NETWORK}  ·  ASSET ${projectConfig.PAYMENT_ASSET}  ·  MODE ${projectConfig.DATA_MODE}`),
  line("system", 'Type "help" for the command index. All values are simulated.'),
];

const HELP = `AVAILABLE COMMANDS
------------------
help        command index
status      system diagnostics
agents      list registered agents
agent <id>  inspect a single agent
services    list discoverable services
balance     aggregated demo balances
payments    recent simulated payments
network     network + settlement parameters
demo        run the agentic payment demo
clear       clear the terminal`;

export function runCommand(raw: string): TerminalLine[] {
  const input = raw.trim();
  if (!input) return [];
  const [cmd, ...args] = input.toLowerCase().split(/\s+/);

  switch (cmd) {
    case "help":
      return [line("output", HELP)];

    case "status":
      return [
        line(
          "output",
          `SYSTEM STATUS
-------------
NETWORK: ${projectConfig.NETWORK}
PAYMENT ASSET: ${projectConfig.PAYMENT_ASSET}
AGENT ENGINE: ONLINE
SERVICE DISCOVERY: ONLINE
PAYMENT ROUTER: READY
MODE: ${projectConfig.DATA_MODE}`,
        ),
      ];

    case "agents":
      return [
        line(
          "output",
          `REGISTERED AGENTS (${AGENTS.length})
------------------
${AGENTS.map((a) => `${a.id.padEnd(16)} ${a.status.padEnd(8)} ${a.capabilities.join(",")}`).join("\n")}`,
        ),
      ];

    case "agent": {
      const id = args[0];
      const a = AGENTS.find((x) => x.id === id);
      if (!a) return [line("error", `AGENT NOT FOUND: ${id ?? "<missing id>"}`)];
      return [
        line(
          "output",
          `${a.name}
STATUS: ${a.status}
WALLET: ${a.wallet}
CAPABILITIES: ${a.capabilities.join(" ")}
POLICY: $${a.policy.maxPerTransaction}/tx · $${a.policy.maxDailySpend}/day · ${a.policy.riskMode}
BALANCE: ${a.balance.toFixed(2)} USDC (DEMO)`,
        ),
      ];
    }

    case "services":
      return [
        line(
          "output",
          `DISCOVERABLE SERVICES (${SERVICES.length})
---------------------
${SERVICES.map((s) => `${s.id.padEnd(18)} $${String(s.price).padEnd(8)} /${s.unit.padEnd(10)} ${s.status}`).join("\n")}`,
        ),
      ];

    case "balance":
      return [
        line(
          "output",
          `DEMO BALANCES (${projectConfig.PAYMENT_ASSET})
-------------
${AGENTS.map((a) => `${a.name.padEnd(16)} ${a.balance.toFixed(2)}`).join("\n")}
TOTAL            ${AGENTS.reduce((s, a) => s + a.balance, 0).toFixed(2)}
[SIMULATED — NOT REAL FUNDS]`,
        ),
      ];

    case "payments":
      return [
        line(
          "output",
          `SIMULATED PAYMENTS
------------------
${AGENTS.flatMap((a) => a.payments.map((p) => `${p.at} ${p.id.padEnd(9)} ${p.amount.toFixed(4)} USDC → ${p.to} [${p.status}]`)).join("\n") || "No payments recorded."}`,
        ),
      ];

    case "network":
      return [
        line(
          "output",
          `NETWORK PARAMETERS
------------------
CHAIN: ${projectConfig.NETWORK}
SETTLEMENT ASSET: ${projectConfig.PAYMENT_ASSET}
PAYMENT CHALLENGE: HTTP 402
DATA SOURCE: LOCAL SIMULATION
LIVE RPC: NOT CONNECTED`,
        ),
      ];

    case "clear":
      return [line("system", "__CLEAR__")];

    case "demo":
      return [line("system", "__DEMO__")];

    default:
      return [line("error", `UNKNOWN COMMAND: ${cmd}. Type "help".`)];
  }
}

export const DEMO_SCRIPT: Array<{ kind: TerminalLine["kind"]; text: string; delay: number }> = [
  { kind: "input", text: "> boot agent", delay: 260 },
  { kind: "success", text: "AGENT ONLINE", delay: 420 },
  { kind: "input", text: "> discover services", delay: 380 },
  { kind: "output", text: "[AGENT] Searching services...", delay: 420 },
  { kind: "output", text: "3 SERVICES FOUND", delay: 380 },
  { kind: "input", text: "> select market-data-api", delay: 380 },
  { kind: "output", text: "[SERVICE] Market Data API found. SERVICE SELECTED", delay: 400 },
  { kind: "input", text: "> inspect price", delay: 340 },
  { kind: "output", text: "PRICE: 0.001 USDC / REQUEST", delay: 380 },
  { kind: "error", text: "[SERVICE] HTTP 402 PAYMENT REQUIRED", delay: 460 },
  { kind: "input", text: "> authorize", delay: 360 },
  { kind: "output", text: "[PAYMENT] 0.001 USDC requested — within policy ceiling.", delay: 400 },
  { kind: "success", text: "PAYMENT AUTHORIZED", delay: 380 },
  { kind: "input", text: "> settle", delay: 340 },
  { kind: "output", text: "[NETWORK] ARC", delay: 300 },
  { kind: "success", text: "[SETTLEMENT] Confirmed (SIMULATED TRANSACTION)", delay: 460 },
  { kind: "input", text: "> execute", delay: 340 },
  { kind: "output", text: "[RESOURCE] Market data unlocked.", delay: 400 },
  { kind: "input", text: "> task complete", delay: 320 },
  { kind: "success", text: "AGENT TASK COMPLETED", delay: 380 },
];
