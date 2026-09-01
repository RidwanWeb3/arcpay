import { type Chain } from "viem";

const env = import.meta.env as Record<string, string | undefined>;

/* ── ARC Testnet (Live public testnet) ────────────────────
 * Circle Arc public testnet parameters, sourced from
 * docs.arc.network + chainlist.org (verified 2025-10).
 * USDC is the native gas token with 6 decimals.
 */
export const arcTestnet: Chain = {
  id: 5_042_002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: [
        env["VITE_ARC_TESTNET_RPC"] ?? "https://rpc.testnet.arc.network",
        "https://arc-testnet.drpc.org",
      ],
    },
    public: {
      http: [
        env["VITE_ARC_TESTNET_RPC"] ?? "https://rpc.testnet.arc.network",
        "https://arc-testnet.drpc.org",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan Testnet",
      url: env["VITE_ARC_TESTNET_EXPLORER"] ?? "https://testnet.arcscan.app",
    },
  },
  testnet: true,
};

/* ── ARC Mainnet (Live) ───────────────────────────────────
 * Official Arc mainnet parameters provided by operator.
 * USDC is the native gas token with 6 decimals.
 */
export const arcMainnet: Chain = {
  id: Number(env["VITE_ARC_MAINNET_CHAIN_ID"] ?? 5042),
  name: env["VITE_ARC_MAINNET_NAME"] ?? "Arc",
  nativeCurrency: {
    name: "USDC",
    symbol: (env["VITE_ARC_MAINNET_SYMBOL"] as "USDC" | undefined) ?? "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: [
        env["VITE_ARC_MAINNET_RPC"] ??
          "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
      ],
    },
    public: {
      http: [
        env["VITE_ARC_MAINNET_RPC"] ??
          "https://arc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: env["VITE_ARC_MAINNET_EXPLORER"] ?? "https://arc-scan.org",
    },
  },
  testnet: false,
};

/* ── Default target chain ─────────────────────────────────
 * Defaults to ARC Mainnet now that live mainnet params are
 * configured. Override to testnet with VITE_ARC_NETWORK=TESTNET.
 */
export const targetArcChain = env["VITE_ARC_NETWORK"] === "TESTNET" ? arcTestnet : arcMainnet;

export const USDC_DECIMALS = 6;
