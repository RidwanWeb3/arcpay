import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/kit/cards";
import { CyberButton } from "@/components/kit/primitives";

const SEQUENCE = [
  "INITIALIZING ARCPAY AGENT...",
  "LOADING AGENT RUNTIME...",
  "LOADING PAYMENT ROUTER...",
  "LOADING SERVICE DISCOVERY...",
  "LOADING ARC...",
  "LOADING USDC...",
];

const STORAGE_KEY = "apa.boot.v1";

export function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible || ready) return;
    if (step >= SEQUENCE.length) {
      const t = setTimeout(() => setReady(true), 320);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [visible, step, ready]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setLeaving(true);
    setTimeout(() => setVisible(false), 420);
  };

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(dismiss, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-[#02040A] transition-opacity duration-400 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative w-full max-w-md px-6 text-center">
        <div className="mx-auto w-fit animate-logo-glow">
          <BrandLogo size={132} className="rounded-sm" />
        </div>
        <div className="mt-8 space-y-1 text-left font-mono text-[11px]">
          {SEQUENCE.slice(0, step).map((s) => (
            <div key={s} className="flex items-center justify-between gap-3 text-muted-foreground">
              <span className="truncate">{s}</span>
              <span className="shrink-0 text-success">OK</span>
            </div>
          ))}
        </div>
        {ready ? (
          <div className="mt-8">
            <div className="font-mono text-[13px] tracking-[0.24em] text-accent text-glow">SYSTEM READY</div>
            <CyberButton variant="primary" size="md" className="mt-4" onClick={dismiss}>
              ENTER TERMINAL
            </CyberButton>
          </div>
        ) : (
          <div className="mt-8 h-[1px] w-full overflow-hidden bg-border">
            <div
              className="h-full bg-gradient-to-r from-primary to-cyan transition-all duration-300"
              style={{ width: `${(step / SEQUENCE.length) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
