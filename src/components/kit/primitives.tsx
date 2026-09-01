import { Link } from "@tanstack/react-router";
import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ── StatusIndicator ─────────────────────────────────────── */

type Tone = "online" | "busy" | "idle" | "offline" | "info";

const toneClass: Record<Tone, string> = {
  online: "text-success",
  busy: "text-accent",
  idle: "text-warning",
  offline: "text-muted-foreground",
  info: "text-cyan",
};

export function StatusIndicator({
  tone = "online",
  label,
  pulse = true,
  className,
}: {
  tone?: Tone;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-block h-[6px] w-[6px] rounded-full bg-current",
          toneClass[tone],
          pulse && tone !== "offline" && "animate-status",
        )}
        aria-hidden
      />
      {label ? (
        <span className={cn("font-mono text-[10px] tracking-[0.18em]", toneClass[tone])}>{label}</span>
      ) : null}
    </span>
  );
}

/* ── CyberCard ───────────────────────────────────────────── */

export function CyberCard({
  children,
  className,
  interactive = false,
  corners = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; corners?: boolean }) {
  return (
    <div
      className={cn("panel rounded-sm", corners && "hud-corners", interactive && "panel-hover", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── DataPanel ───────────────────────────────────────────── */

export function DataPanel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <CyberCard className={cn("flex flex-col", className)}>
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="label-mono truncate text-silver/80">{title}</span>
        <span className="shrink-0">{right}</span>
      </div>
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </CyberCard>
  );
}

/* ── Buttons ─────────────────────────────────────────────── */

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] rounded-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary/90 text-primary-foreground border border-primary/60 hover:bg-primary shadow-[0_0_24px_-10px_var(--color-primary)] hover:shadow-[0_0_30px_-6px_var(--color-primary)]",
  outline:
    "border border-border-strong/70 bg-surface/40 text-silver hover:border-accent hover:text-accent hover:bg-accent/5",
  ghost: "border border-transparent text-muted-foreground hover:text-accent hover:border-border",
  danger: "border border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-12 px-6 text-xs",
};

export function CyberButton({
  variant = "outline",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function GlowButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  const { className, size = "md", ...rest } = props;
  return <CyberButton variant="primary" size={size} className={cn("glow-ring", className)} {...rest} />;
}

export function LinkButton({
  to,
  children,
  variant = "outline",
  size = "md",
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link to={to} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

export function ExternalButton({
  href,
  children,
  variant = "outline",
  size = "md",
  className,
  disabled,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <span className={cn(base, variants[variant], sizes[size], "cursor-not-allowed opacity-40", className)}>
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </a>
  );
}

/* ── Badges ──────────────────────────────────────────────── */

export function NetworkBadge({ network = "ARC", asset }: { network?: string; asset?: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-border bg-surface/60 px-2 py-1 font-mono text-[10px] tracking-[0.18em] text-accent">
      <StatusIndicator tone="info" />
      {network}
      {asset ? <span className="text-muted-foreground">/ {asset}</span> : null}
    </span>
  );
}

export function ModeBadge({ mode = "DEMO MODE" }: { mode?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-warning">
      <span className="inline-block h-[5px] w-[5px] rounded-full bg-warning animate-status" aria-hidden />
      {mode}
    </span>
  );
}

/* ── MetricCard ──────────────────────────────────────────── */

export function MetricCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "cyan";
}) {
  return (
    <CyberCard interactive className="p-4">
      <div className="label-mono">{label}</div>
      <div
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums",
          tone === "accent" && "text-accent text-glow",
          tone === "cyan" && "text-cyan",
          tone === "default" && "text-silver",
        )}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{sub}</div> : null}
    </CyberCard>
  );
}

/* ── Section heading ─────────────────────────────────────── */

export function SectionTitle({
  index,
  title,
  subtitle,
  right,
}: {
  index?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-4">
      <div className="min-w-0">
        {index ? <div className="label-mono mb-2 text-accent">{index}</div> : null}
        <h2 className="text-xl font-semibold tracking-tight text-silver sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-border-strong to-transparent" />;
}
