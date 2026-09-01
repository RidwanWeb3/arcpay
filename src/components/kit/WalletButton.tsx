import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { CyberButton, CyberCard, ModeBadge, StatusIndicator } from "./primitives";
import { arcMainnet, arcTestnet } from "@/lib/arc/chains";

function explorerForChain(chainId: number | null, address: string | null): string {
  const mainnetBase = arcMainnet.blockExplorers?.default?.url ?? "https://arc-scan.org";
  const testnetBase = arcTestnet.blockExplorers?.default?.url ?? "https://testnet.arcscan.app";
  const base = chainId === arcMainnet.id ? mainnetBase : testnetBase;
  return `${base}/address/${address ?? ""}`;
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);

  if (!wallet.connected) {
    if (picking && wallet.availableConnectors.length > 1) {
      return (
        <CyberCard className={`${compact ? "w-full p-3" : "w-64 p-3"}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-mono">SELECT WALLET</span>
            <CyberButton variant="ghost" size="sm" onClick={() => setPicking(false)}>
              BACK
            </CyberButton>
          </div>
          <ul className="grid gap-2">
            {wallet.availableConnectors.map((c) => (
              <li key={c.uid}>
                <CyberButton
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    wallet.connect(c.uid);
                    setPicking(false);
                  }}
                >
                  <span className="truncate font-mono tracking-wide">{c.name.toUpperCase()}</span>
                  <span className="ml-auto label-mono text-muted-foreground">{c.type}</span>
                </CyberButton>
              </li>
            ))}
          </ul>
        </CyberCard>
      );
    }

    const canPick = wallet.availableConnectors.length > 1;
    return (
      <CyberButton
        size="sm"
        variant="primary"
        className={compact ? "w-full" : undefined}
        onClick={() => (canPick ? setPicking(true) : wallet.connect())}
      >
        {canPick ? "CONNECT WALLET ▾" : "CONNECT WALLET"}
      </CyberButton>
    );
  }

  const tone = wallet.isCorrectChain ? "online" : "offline";
  const variant = wallet.isCorrectChain ? "outline" : "primary";

  return (
    <div className="relative">
      <CyberButton
        size="sm"
        variant={variant}
        onClick={() => setOpen((o) => !o)}
        className={compact ? "w-full" : undefined}
      >
        <StatusIndicator tone={tone} />
        <span className="font-mono tracking-wide">
          {wallet.isCorrectChain ? wallet.short : `WRONG NETWORK · ${wallet.short ?? "?"}`}
        </span>
      </CyberButton>

      {open ? (
        <CyberCard className="absolute right-0 z-50 mt-2 w-72 p-3">
          <div className="flex items-center justify-between">
            <span className="label-mono">WALLET</span>
            <ModeBadge mode={wallet.simulated ? "DEMO SESSION" : "LIVE SESSION"} />
          </div>
          <p className="mt-2 break-all font-mono text-[10px] text-silver">{wallet.address}</p>
          {wallet.connectorName ? (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              via {wallet.connectorName.toUpperCase()}
            </p>
          ) : null}
          <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
            <Row k="NETWORK" v={wallet.network} />
            <Row
              k="CHAIN ID"
              v={wallet.chainId != null ? `0x${wallet.chainId.toString(16)}` : "—"}
            />
            <Row k="ARC (NATIVE)" v={`${wallet.nativeBalance} USDC`} />
            <Row k="USDC BALANCE" v={`${wallet.usdcBalance} USDC`} />
          </dl>
          {!wallet.isCorrectChain ? (
            <div className="mt-3 border border-destructive/40 bg-destructive/5 p-2">
              <p className="label-mono text-destructive">WRONG NETWORK</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Switch to the Arc chain to authorize payments and settle services.
              </p>
              <CyberButton
                size="sm"
                variant="primary"
                className="mt-2 w-full"
                onClick={() => {
                  wallet.switchToArc();
                  setOpen(false);
                }}
              >
                SWITCH TO ARC
              </CyberButton>
            </div>
          ) : null}
          {wallet.simulated ? (
            <p className="mt-3 font-mono text-[10px] leading-4 text-muted-foreground">
              Simulated wallet — no real keys or signatures are produced. Install MetaMask/Rabby and
              add Arc Mainnet for real on-chain settlement.
            </p>
          ) : (
            <a
              href={explorerForChain(wallet.chainId, wallet.address)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block border border-border px-2 py-1.5 text-center font-mono text-[10px] tracking-[0.12em] text-accent hover:border-accent"
            >
              VIEW ON ARCSCAN
            </a>
          )}
          <CyberButton
            size="sm"
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => {
              wallet.disconnect();
              setOpen(false);
              setPicking(false);
            }}
          >
            DISCONNECT
          </CyberButton>
        </CyberCard>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="label-mono">{k}</dt>
      <dd className="truncate text-silver">{v}</dd>
    </div>
  );
}
