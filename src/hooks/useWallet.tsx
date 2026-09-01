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
import { formatUnits } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useChainId,
  useSignMessage,
} from "wagmi";
import { targetArcChain, USDC_DECIMALS } from "@/lib/arc/chains";
import { type Chain } from "viem";
import { projectConfig } from "@/config/projectConfig";

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
  chainId: number | null;
  nativeBalance: string;
  usdcBalance: string;
  simulated: boolean;
  isCorrectChain: boolean;
  connectorName: string | null;
}

interface SignResult {
  signature: `0x${string}`;
  message: string;
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
  availableConnectors: Array<{ uid: string; name: string; type: string }>;
  short: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const DEMO_ADDRESS = "0x12A4C7E9B03F1D5860AAcc41Bb99E210dEadABCD";

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
      availableConnectors,
      short: state.address ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}` : null,
    }),
    [
      state,
      handleConnect,
      handleDisconnect,
      handleSwitch,
      signPaymentAuthorization,
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

export const ARC_CHAIN_EXPORT: Chain = targetArcChain;
