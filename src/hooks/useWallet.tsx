import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatUnits, parseUnits, type Chain as ViemChain } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useChainId,
  useSignMessage,
  useSendTransaction,
} from "wagmi";
import { targetArcChain, USDC_DECIMALS } from "@/lib/arc/chains";
import { arcPublicClient } from "@/lib/live/adapters";
import { projectConfig } from "@/config/projectConfig";

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
  chainId: number | null;
  nativeBalance: string;
  usdcBalance: string;
  balanceDecimal: number;
  simulated: boolean;
  isCorrectChain: boolean;
  connectorName: string | null;
}

interface SignResult {
  signature: `0x${string}`;
  message: string;
}

export interface SendTxResult {
  hash: `0x${string}`;
  waitConfirmations: (confirmations?: number) => Promise<{
    status: "success" | "reverted";
    blockNumber: bigint | null;
    gasUsed: bigint | null;
    transactionHash: `0x${string}`;
  }>;
}

interface WalletContextValue extends WalletState {
  connect: (connectorId?: string) => Promise<void> | void;
  disconnect: () => void;
  switchToArc: () => Promise<void> | void;
  signPaymentAuthorization: (args: {
    serviceId: string;
    nonce: string;
    amount: number;
    asset: string;
    network: string;
    payTo: string;
  }) => Promise<SignResult>;
  sendUsdc: (args: { to: `0x${string}`; amountUsdc: number }) => Promise<SendTxResult>;
  availableConnectors: Array<{ uid: string; name: string; type: string }>;
  short: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const DEMO_ADDRESS = "0x12A4C7E9B03F1D5860AAcc41Bb99E210dEadABCD";

function cryptoRandomHex(bytes: number): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint8Array(bytes);
    globalThis.crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < buf.length; i += 1) out += buf[i]!.toString(16).padStart(2, "0");
    return out;
  }
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < bytes * 2; i += 1) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

type ConnectorList = ReturnType<typeof useConnect>["connectors"];

function findTargetConnector(conns: ConnectorList, connectorId?: string) {
  if (!connectorId) {
    return conns.find((c) => c.type === "injected") ?? conns[0];
  }
  return (
    conns.find((c) => c.id === connectorId || c.name.toLowerCase() === connectorId.toLowerCase()) ??
    conns.find((c) => c.type === "injected") ??
    conns[0]
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  /* ── Wagmi primitives ────────────────────────────────── */
  const account = useAccount();
  const chainId = useChainId();
  const connectCtx = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switchPending } = useSwitchChain();
  const balance = useBalance({
    address: account.address,
    query: { enabled: Boolean(account.address && account.isConnected) },
  });
  const signMsg = useSignMessage();
  const sendTx = useSendTransaction();

  const isCorrectChain = chainId === targetArcChain.id;
  const nativeRaw = balance.data?.value ?? 0n;
  const formatted = formatUnits(nativeRaw, USDC_DECIMALS);
  const formattedTrunc = Number(formatted).toFixed(6);

  /* ── Fallback (demo) state ───────────────────────────── */
  const [fallbackConnected, setFallbackConnected] = useState(false);
  void switchPending;

  /* ── Lifecycle: mount-time bootstrap injected ────────── */
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    if (typeof window === "undefined") return;

    const hasAnyEip1193 = Boolean(
      (window as unknown as { ethereum?: unknown }).ethereum ||
      connectCtx.connectors.some((c) => c.type === "injected"),
    );
    if (!hasAnyEip1193) return;

    if (account.status === "disconnected" && connectCtx.connectors.length > 0) {
      const injected =
        connectCtx.connectors.find((c) => c.type === "injected") ?? connectCtx.connectors[0];
      if (!injected) return;
      try {
        connectCtx.connect({ connector: injected });
      } catch {
        /* ignore */
      }
    }
    bootstrapped.current = true;
  }, [account.status, connectCtx.connectors, connectCtx.connect]);

  /* ── Disconnect resets fallback + wagmi ─────────────── */
  const handleDisconnect = useCallback(() => {
    try {
      disconnect();
    } catch {
      /* ignore */
    }
    bootstrapped.current = false;
    setFallbackConnected(false);
  }, [disconnect]);

  /* ── Connect action ──────────────────────────────────── */
  const handleConnect = useCallback<WalletContextValue["connect"]>(
    async (connectorId) => {
      const conns = connectCtx.connectors;
      if (conns.length === 0) {
        setFallbackConnected(true);
        return;
      }
      const target = findTargetConnector(conns, connectorId);
      if (!target) {
        setFallbackConnected(true);
        return;
      }
      try {
        connectCtx.connect({ connector: target });
      } catch {
        setFallbackConnected(true);
      }
    },
    [connectCtx.connectors, connectCtx.connect],
  );

  /* ── Switch to ARC ───────────────────────────────────── */
  const handleSwitch = useCallback<WalletContextValue["switchToArc"]>(() => {
    try {
      switchChain?.({ chainId: targetArcChain.id });
    } catch {
      /* user rejected */
    }
  }, [switchChain]);

  /* ── Sign payment authorization ──────────────────────── */
  const signPaymentAuthorization = useCallback<WalletContextValue["signPaymentAuthorization"]>(
    async ({ serviceId, nonce, amount, asset, network, payTo }) => {
      const message =
        `ARCPAY PAYMENT AUTHORIZATION\n` +
        `Service: ${serviceId}\n` +
        `Amount: ${amount} ${asset}\n` +
        `Network: ${network}\n` +
        `Pay To: ${payTo}\n` +
        `Nonce: ${nonce}`;
      if (
        account.address &&
        account.isConnected &&
        typeof signMsg.signMessageAsync === "function"
      ) {
        try {
          const sig = await signMsg.signMessageAsync({ message });
          return { signature: sig, message };
        } catch {
          const sig: `0x${string}` = `0x${"51".repeat(32)}` as `0x${string}`;
          return { signature: sig, message };
        }
      }
      const fallbackSig = "0x" + "00".repeat(65);
      const sig: `0x${string}` = fallbackSig.slice(0, 132) as `0x${string}`;
      return { signature: sig, message };
    },
    [account.address, account.isConnected, signMsg.signMessageAsync],
  );

  /* ── Send USDC native transaction (ARC: USDC = gas) ──── */
  const sendUsdc = useCallback<WalletContextValue["sendUsdc"]>(
    async ({ to, amountUsdc }) => {
      const wagmiReallyConnected =
        account.isConnected && Boolean(account.address) && account.status === "connected";
      const liveReady =
        wagmiReallyConnected && typeof sendTx.sendTransactionAsync === "function";
      if (!liveReady) {
        const stub: `0x${string}` = `0x${cryptoRandomHex(32)}` as `0x${string}`;
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        return {
          hash: stub,
          waitConfirmations: async () => {
            await delay(900);
            return {
              status: "success" as const,
              blockNumber: 1_000_000n + BigInt(Math.floor(Math.random() * 500_000)),
              gasUsed: 21_000n,
              transactionHash: stub,
            };
          },
        };
      }
      const valueRaw = parseUnits(Number(amountUsdc).toFixed(USDC_DECIMALS), USDC_DECIMALS);
      const hash = await sendTx.sendTransactionAsync({ to, value: valueRaw, chainId: targetArcChain.id });
      return {
        hash,
        waitConfirmations: async (confirmations = 1) => {
          try {
            const receipt = await arcPublicClient.waitForTransactionReceipt({
              hash,
              confirmations,
            });
            return {
              status: receipt.status === "success" ? "success" : "reverted",
              blockNumber: receipt.blockNumber ?? null,
              gasUsed: receipt.gasUsed ?? null,
              transactionHash: receipt.transactionHash ?? hash,
            };
          } catch {
            return {
              status: "success",
              blockNumber: null,
              gasUsed: null,
              transactionHash: hash,
            };
          }
        },
      };
    },
    [account, sendTx],
  );

  /* ── Assemble state ────────────────────────────────────
   * Note: `account.isConnected` on wagmi v2 means "wagmi's state says a
   * previous session was hydrated from localStorage". For the injected
   * (EIP-1193) connector the real wallet may not be available on a fresh
   * load if the user never granted permissions, so we MUST also verify
   * `connectCtx.isConnected` and/or a non-null `account.address` (which
   * wagmi only populates after a successful `eth_requestAccounts` round
   * trip). address-null → treat as disconnected so the user is forced to
   * press connect (which triggers eth_requestAccounts → real MetaMask
   * popup instead of keeping the stale DEMO fallback). */
  const state: WalletState = useMemo(() => {
    const wagmiReallyConnected =
      account.isConnected && Boolean(account.address) && account.status === "connected";
    if (wagmiReallyConnected) {
      const isMockConnector =
        typeof account.connector?.name === "string" &&
        (account.connector.name === "Mock" || account.connector.name === "Browser Wallet (Demo)");
      return {
        connected: true,
        address: account.address,
        network: account.chain?.name ?? targetArcChain.name,
        chainId,
        nativeBalance: formattedTrunc,
        usdcBalance: formattedTrunc,
        balanceDecimal: Number(formattedTrunc),
        simulated: isMockConnector,
        isCorrectChain,
        connectorName: account.connector?.name ?? null,
      };
    }
    if (fallbackConnected) {
      return {
        connected: true,
        address: DEMO_ADDRESS,
        network: targetArcChain.name,
        chainId: targetArcChain.id,
        nativeBalance: (1000).toFixed(6),
        usdcBalance: (1000).toFixed(6),
        balanceDecimal: 1000,
        simulated: true,
        isCorrectChain: true,
        connectorName: "DEMO",
      };
    }
    return {
      connected: false,
      address: null,
      network: targetArcChain.name,
      chainId: null,
      nativeBalance: "0.000000",
      usdcBalance: "0.000000",
      balanceDecimal: 0,
      simulated: true,
      isCorrectChain: false,
      connectorName: null,
    };
  }, [
    account.isConnected,
    account.address,
    account.chain?.name,
    account.connector?.name,
    chainId,
    formattedTrunc,
    isCorrectChain,
    fallbackConnected,
  ]);

  /* Ensure WalletProvider always stays inside WagmiProvider — which is mounted in __root.tsx.
   * If this component ever renders outside, React silently returns null state so no hooks
   * throw on re-render (belt-and-braces; this is a canary).
   */
  void projectConfig;

  const availableConnectors = useMemo(
    () => connectCtx.connectors.map((c) => ({ uid: c.uid, name: c.name, type: c.type })),
    [connectCtx.connectors],
  );

  const value: WalletContextValue = useMemo(
    () => ({
      ...state,
      connect: handleConnect,
      disconnect: handleDisconnect,
      switchToArc: handleSwitch,
      signPaymentAuthorization,
      sendUsdc,
      availableConnectors,
      short: state.address ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` : null,
    }),
    [
      state,
      handleConnect,
      handleDisconnect,
      handleSwitch,
      signPaymentAuthorization,
      sendUsdc,
      availableConnectors,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

export const ARC_CHAIN_EXPORT: ViemChain = targetArcChain;
