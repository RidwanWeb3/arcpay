import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModeBadge } from "./primitives";

export function TerminalWindow({
  title = "APA://TERMINAL",
  children,
  className,
  bodyClassName,
  mode = "DEMO",
  footer,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  mode?: string | null;
  footer?: ReactNode;
}) {
  return (
    <div className={cn("panel hud-corners scanlines rounded-sm", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0 gap-1">
            <i className="block h-[6px] w-[6px] rounded-full bg-destructive/70" />
            <i className="block h-[6px] w-[6px] rounded-full bg-warning/70" />
            <i className="block h-[6px] w-[6px] rounded-full bg-success/70" />
          </span>
          <span className="label-mono truncate text-silver/70">{title}</span>
        </div>
        {mode ? <ModeBadge mode={mode} /> : null}
      </div>
      <div className={cn("relative overflow-hidden bg-background/60 p-3 font-mono text-[12px] leading-6", bodyClassName)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-accent/10 to-transparent animate-scan" />
        {children}
      </div>
      {footer ? <div className="border-t border-border px-3 py-2">{footer}</div> : null}
    </div>
  );
}

const channelColor: Record<string, string> = {
  AGENT: "text-accent",
  SERVICE: "text-cyan",
  PAYMENT: "text-primary",
  NETWORK: "text-violet",
  SETTLEMENT: "text-success",
  RESOURCE: "text-silver",
  POLICY: "text-warning",
  SYSTEM: "text-muted-foreground",
  ERROR: "text-destructive",
};

export function LogLine({
  channel,
  message,
  at,
}: {
  channel: string;
  message: string;
  at?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3 py-0.5">
      {at ? <span className="text-[11px] text-muted-foreground/70 tabular-nums">{at}</span> : <span />}
      <span className={cn("text-[11px] font-medium", channelColor[channel] ?? "text-muted-foreground")}>
        [{channel}]
      </span>
      <span className="min-w-0 break-words text-silver/85">{message}</span>
    </div>
  );
}

export function Caret() {
  return <span className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-[2px] bg-accent animate-caret" />;
}
