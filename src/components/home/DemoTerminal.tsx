import { useEffect, useRef, useState } from "react";
import { DEMO_SCRIPT } from "@/lib/terminalEngine";
import { TerminalWindow, Caret } from "@/components/kit/TerminalWindow";
import { CyberButton } from "@/components/kit/primitives";
import { cn } from "@/lib/utils";

const kindClass: Record<string, string> = {
  input: "text-accent",
  output: "text-silver/85",
  success: "text-success",
  error: "text-destructive",
  system: "text-muted-foreground",
};

export function DemoTerminal({ autoStart = false }: { autoStart?: boolean }) {
  const [running, setRunning] = useState(autoStart);
  const [index, setIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running || index >= DEMO_SCRIPT.length) return;
    const t = setTimeout(() => setIndex((i) => i + 1), DEMO_SCRIPT[index]!.delay);
    return () => clearTimeout(t);
  }, [running, index]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [index]);

  const done = index >= DEMO_SCRIPT.length;

  return (
    <TerminalWindow
      title="APA://DEMO/AGENT-ECONOMIC-LOOP"
      mode="SIMULATION"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="label-mono">
            {done ? "TASK COMPLETED · SIMULATED TRANSACTION" : running ? "AGENT RUNNING" : "AGENT IDLE"}
          </span>
          <div className="flex gap-2">
            <CyberButton
              size="sm"
              variant="primary"
              onClick={() => {
                setIndex(0);
                setRunning(true);
              }}
            >
              {done || !running ? "RUN AGENT DEMO" : "RESTART"}
            </CyberButton>
            {running && !done ? (
              <CyberButton size="sm" variant="ghost" onClick={() => setRunning(false)}>
                PAUSE
              </CyberButton>
            ) : null}
          </div>
        </div>
      }
    >
      <div ref={bodyRef} className="h-[300px] overflow-y-auto pr-1 sm:h-[340px]">
        {!running && index === 0 ? (
          <p className="text-muted-foreground">
            An AI agent needs market data. Press <span className="text-accent">RUN AGENT DEMO</span> to watch it
            discover a service, receive a 402 challenge, authorize a USDC payment on ARC and unlock the resource.
          </p>
        ) : null}
        {DEMO_SCRIPT.slice(0, index).map((l, i) => (
          <div key={i} className={cn("break-words", kindClass[l.kind])}>
            {l.text}
          </div>
        ))}
        {running && !done ? (
          <div className="text-accent">
            <Caret />
          </div>
        ) : null}
        {done ? (
          <div className="mt-3 border-t border-border pt-2 text-[11px] text-warning">
            SIMULATED TRANSACTION — no blockchain call was made and no funds moved.
          </div>
        ) : null}
      </div>
    </TerminalWindow>
  );
}
