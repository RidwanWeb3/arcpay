import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { TerminalWindow, Caret } from "@/components/kit/TerminalWindow";
import { BANNER, DEMO_SCRIPT, runCommand, line, type TerminalLine } from "@/lib/terminalEngine";
import { CyberButton, CyberCard } from "@/components/kit/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Agent Terminal — ArcPay Agent" },
      {
        name: "description",
        content:
          "Interactive ArcPay Agent command terminal: discover services, inspect agent policies and simulate a USDC payment on ARC.",
      },
      { property: "og:title", content: "Agent Terminal — ArcPay Agent" },
      { property: "og:description", content: "Run agent commands and simulate an end-to-end 402 payment flow." },
      { property: "og:url", content: "/terminal" },
    ],
    links: [{ rel: "canonical", href: "/terminal" }],
  }),
  component: TerminalPage,
});

const kindClass: Record<TerminalLine["kind"], string> = {
  input: "text-accent",
  output: "text-silver/85",
  success: "text-success",
  error: "text-destructive",
  system: "text-muted-foreground",
};

const QUICK = ["help", "status", "agents", "services", "pay", "demo", "clear"];

function TerminalPage() {
  const [lines, setLines] = useState<TerminalLine[]>(BANNER);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines, demoStep]);

  useEffect(() => {
    if (demoStep === null) return;
    if (demoStep >= DEMO_SCRIPT.length) {
      setLines((l) => [...l, line("system", "— DEMO COMPLETE · SIMULATED TRANSACTION —")]);
      setDemoStep(null);
      return;
    }
    const step = DEMO_SCRIPT[demoStep]!;
    const t = setTimeout(() => {
      setLines((l) => [...l, line(step.kind, step.text)]);
      setDemoStep((s) => (s === null ? null : s + 1));
    }, step.delay);
    return () => clearTimeout(t);
  }, [demoStep]);

  const submit = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHistIdx(-1);
    setValue("");

    if (cmd.toLowerCase() === "clear") {
      setLines([]);
      return;
    }
    if (cmd.toLowerCase() === "demo") {
      setLines((l) => [...l, line("input", `apa@arc:~$ ${cmd}`), line("system", "STARTING AGENT DEMO...")]);
      setDemoStep(0);
      return;
    }
    setLines((l) => [...l, line("input", `apa@arc:~$ ${cmd}`), ...runCommand(cmd)]);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(value);
  };

  return (
    <PageShell
      eyebrow="APA://TERMINAL"
      title="Agent Command Terminal"
      description="A direct interface to the demo agent runtime. Type a command or run the scripted end-to-end payment flow. Nothing here touches a live network."
      wide
      actions={QUICK.map((q) => (
        <CyberButton key={q} size="sm" variant="ghost" onClick={() => submit(q)}>
          {q.toUpperCase()}
        </CyberButton>
      ))}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <TerminalWindow
          title="APA://TERMINAL/SESSION-01"
          mode="DEMO"
          footer={
            <form onSubmit={onSubmit} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <span className="shrink-0 font-mono text-[12px] text-accent">apa@arc:~$</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const next = Math.min(histIdx + 1, history.length - 1);
                    if (next >= 0) {
                      setHistIdx(next);
                      setValue(history[next] ?? "");
                    }
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = histIdx - 1;
                    setHistIdx(next);
                    setValue(next >= 0 ? (history[next] ?? "") : "");
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                placeholder="type a command — try: help"
                aria-label="Terminal command input"
                className="min-w-0 border-0 bg-transparent font-mono text-[12px] text-silver outline-none placeholder:text-muted-foreground/60"
              />
              <CyberButton size="sm" variant="primary" type="submit" className="shrink-0">
                RUN
              </CyberButton>
            </form>
          }
        >
          <div
            ref={bodyRef}
            onClick={() => inputRef.current?.focus()}
            className="h-[420px] cursor-text overflow-y-auto pr-1 sm:h-[520px]"
          >
            {lines.map((l, i) => (
              <div key={i} className={cn("break-words whitespace-pre-wrap", kindClass[l.kind])}>
                {l.text}
              </div>
            ))}
            <div className="text-accent">
              <Caret />
            </div>
          </div>
        </TerminalWindow>

        <div className="grid content-start gap-4">
          <CyberCard className="p-5">
            <div className="label-mono text-accent">COMMAND REFERENCE</div>
            <dl className="mt-4 space-y-2.5 font-mono text-[11px]">
              {[
                ["help", "List every available command"],
                ["status", "Runtime, network and settlement status"],
                ["agents", "List registered demo agents"],
                ["services", "List priced service endpoints"],
                ["pay", "Simulate a single USDC payment"],
                ["discover", "Run service discovery"],
                ["policy", "Show active spending policy"],
                ["demo", "Play the full agent economic loop"],
                ["clear", "Clear the session buffer"],
              ].map(([c, d]) => (
                <div key={c} className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
                  <dt className="text-accent">{c}</dt>
                  <dd className="min-w-0 text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
          </CyberCard>

          <CyberCard className="p-5">
            <div className="label-mono text-warning">SAFETY NOTICE</div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              This terminal runs entirely in your browser against fixture data. No wallet is connected, no RPC call is
              made and no funds can move. Amounts shown are illustrative.
            </p>
          </CyberCard>
        </div>
      </div>
    </PageShell>
  );
}
