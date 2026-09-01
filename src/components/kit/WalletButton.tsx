import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { CyberButton, CyberCard, ModeBadge, StatusIndicator } from "./primitives";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);

  if (!wallet.connected) {
    return (
      <CyberButton size="sm" variant="primary" onClick={wallet.connect} className={compact ? "w-full" : undefined}>
        CONNECT WALLET
      </CyberButton>
    );
  }

  return (
    <div className="relative">
      <CyberButton size="sm" variant="outline" onClick={() => setOpen((o) => !o)} className={compact ? "w-full" : undefined}>
        <StatusIndicator tone="online" />
        {wallet.short}
      </CyberButton>
      {open ? (
        <CyberCard className="absolute right-0 z-50 mt-2 w-64 p-3">
          <div className="flex items-center justify-between">
            <span className="label-mono">WALLET</span>
            <ModeBadge mode="DEMO SESSION" />
          </div>
          <p className="mt-2 break-all font-mono text-[10px] text-silver">{wallet.address}</p>
          <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
            <Row k="NETWORK" v={wallet.network} />
            <Row k="BALANCE" v={`${wallet.nativeBalance} ARC`} />
            <Row k="USDC" v={`${wallet.usdcBalance} USDC`} />
          </dl>
          <p className="mt-3 font-mono text-[10px] leading-4 text-muted-foreground">
            No real keys, signatures or funds are involved. Read-only interface preview.
          </p>
          <CyberButton
            size="sm"
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => {
              wallet.disconnect();
              setOpen(false);
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
