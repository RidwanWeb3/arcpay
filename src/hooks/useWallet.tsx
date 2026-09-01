import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Wallet architecture placeholder.
 * NOTHING here touches real funds, keys or signatures. It exposes the exact
 * surface a real provider (EIP-1193 / ARC RPC) would implement later.
 */

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
  nativeBalance: string;
  usdcBalance: string;
  simulated: boolean;
}

interface WalletContextValue extends WalletState {
  connect: () => void;
  disconnect: () => void;
  short: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const DEMO_ADDRESS = "0x12A4C7E9B03F1D5860AAcc41Bb99E210dEadABCD";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    network: "ARC",
    nativeBalance: "0.00",
    usdcBalance: "0.00",
    simulated: true,
  });

  const connect = useCallback(() => {
    setState({
      connected: true,
      address: DEMO_ADDRESS,
      network: "ARC",
      nativeBalance: "0.0000",
      usdcBalance: "0.0000",
      simulated: true,
    });
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, connected: false, address: null, nativeBalance: "0.00", usdcBalance: "0.00" }));
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      connect,
      disconnect,
      short: state.address ? `${state.address.slice(0, 4)}...${state.address.slice(-4)}` : null,
    }),
    [state, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
