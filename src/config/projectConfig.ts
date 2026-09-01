/**
 * ARCPAY AGENT — central project configuration.
 * Every externally-facing value lives here so it can be swapped in one place.
 * Values may also be overridden at build time through Vite env variables.
 */

const env = import.meta.env as Record<string, string | undefined>;

export const projectConfig = {
  PROJECT_NAME: "ArcPay Agent",
  SHORT_NAME: "APA",
  TICKER: "APA",
  TAGLINE: "Agents transact. ArcPay settles.",
  TAGLINE_ALT: "The Payment Layer for Autonomous Agents.",

  NETWORK: "ARC",
  PAYMENT_ASSET: "USDC",

  /** No contract deployed yet — never render a fake address. */
  CONTRACT_ADDRESS: env["VITE_CONTRACT_ADDRESS"] ?? "COMING_SOON",

  BUY_URL: env["VITE_BUY_URL"] ?? "https://RADARDEX.pro",
  CHART_URL: env["VITE_CHART_URL"] ?? "https://RADARDEX.pro",

  /** Only X is supported. Empty until an official handle is provided. */
  X_URL: env["VITE_X_URL"] ?? "",

  /** Global data mode. Flip to "LIVE" once real ARC APIs are wired in. */
  DATA_MODE: (env["VITE_DATA_MODE"] as "DEMO" | "LIVE") ?? "DEMO",
} as const;

export const isContractAvailable = projectConfig.CONTRACT_ADDRESS !== "COMING_SOON";
export const isXConfigured = projectConfig.X_URL.trim().length > 0;
export const isDemoMode = projectConfig.DATA_MODE === "DEMO";

export const LOGO_SRC = "/brand/apa-logo.png";
export const BANNER_SRC = "/brand/apa-banner.png";

export const OFFICIAL_SOURCES = {
  circleAgentStackBlog:
    "https://www.circle.com/blog/introducing-circle-agent-stack-financial-infrastructure-for-the-agentic-economy",
  circleSubCent: "https://www.circle.com/blog/build-agentic-systems-for-high-frequency-sub-cent-transactions",
  circleStorefront: "https://www.circle.com/blog/turn-your-api-into-a-storefront-for-agents",
  circleNanopayments: "https://www.circle.com/nanopayments",
  circleAgentStack: "https://www.circle.com/agent-stack",
  arc: "https://www.arc.network",
} as const;

export const NAV_LINKS = [
  { label: "HOME", to: "/" },
  { label: "AGENTS", to: "/agents" },
  { label: "TERMINAL", to: "/terminal" },
  { label: "SERVICES", to: "/services" },
  { label: "PAYMENTS", to: "/payments" },
  { label: "ABOUT", to: "/about" },
  { label: "PROOF", to: "/proof" },
] as const;
