import { useEffect, useState } from "react";
import { StatusIndicator, ModeBadge } from "@/components/kit/primitives";

const ITEMS = [
  { k: "NETWORK", v: "ARC", tone: "info" as const },
  { k: "SETTLEMENT", v: "USDC", tone: "info" as const },
  { k: "AGENTS", v: "ONLINE", tone: "online" as const },
  { k: "PAYMENTS", v: "ACTIVE", tone: "online" as const },
  { k: "STATUS", v: "OPERATIONAL", tone: "online" as const },
];

export function SystemStatusBar() {
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const t = setInterval(() => {
      setTick((x) => x + 1);
      setClock(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="panel hud-corners relative overflow-hidden rounded-sm">
      <div className="grid grid-cols-2 gap-px bg-border/50 sm:grid-cols-3 lg:grid-cols-6">
        {ITEMS.map((i, idx) => (
          <div key={i.k} className="bg-background/70 px-4 py-3.5">
            <div className="label-mono">{i.k}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusIndicator tone={i.tone} pulse={(tick + idx) % 4 !== 0} />
              <span className="truncate font-mono text-[12px] tracking-[0.12em] text-silver">{i.v}</span>
            </div>
          </div>
        ))}
        <div className="bg-background/70 px-4 py-3.5">
          <div className="label-mono">SESSION CLOCK</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="font-mono text-[12px] tabular-nums text-accent">{clock}</span>
            <ModeBadge />
          </div>
        </div>
      </div>
    </div>
  );
}
