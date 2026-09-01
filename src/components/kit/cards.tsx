import { Link } from "@tanstack/react-router";
import type { Agent, AgentStatusValue, Service } from "@/types";
import { CyberCard, StatusIndicator, LinkButton, ExternalButton } from "./primitives";
import { cn } from "@/lib/utils";
import { LOGO_SRC } from "@/config/projectConfig";

const statusTone: Record<AgentStatusValue, "online" | "busy" | "idle" | "offline"> = {
  ONLINE: "online",
  BUSY: "busy",
  IDLE: "idle",
  OFFLINE: "offline",
};

export function AgentStatus({ status }: { status: AgentStatusValue }) {
  return <StatusIndicator tone={statusTone[status]} label={status} />;
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <CyberCard interactive className="flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-semibold tracking-[0.12em] text-silver">
            {agent.name}
          </h3>
          <p className="label-mono mt-1">{agent.type}</p>
        </div>
        <AgentStatus status={agent.status} />
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/60">
        <Field label="SPENDING POLICY" value={`$${agent.spendingPerTask} / TASK`} />
        <Field label="BALANCE" value={`${agent.balance.toFixed(2)} USDC`} sub="DEMO" />
        <Field label="TASKS" value={String(agent.tasksCompleted)} />
        <Field label="WALLET" value={agent.wallet} mono />
      </div>

      <div className="p-4">
        <div className="label-mono">CAPABILITIES</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {agent.capabilities.map((c) => (
            <span
              key={c}
              className="border border-border bg-surface-2/40 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <div className="label-mono">LAST ACTION</div>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {agent.lastAction}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border p-3">
        <LinkButton to={`/agents/${agent.id}`} size="sm" variant="primary">
          OPEN AGENT
        </LinkButton>
        <LinkButton to="/activity" size="sm">
          VIEW ACTIVITY
        </LinkButton>
      </div>
    </CyberCard>
  );
}

function Field({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-background/40 p-3">
      <div className="label-mono">{label}</div>
      <div className={cn("mt-1 truncate text-[12px] text-silver", mono !== false && "font-mono")}>
        {value}
      </div>
      {sub ? <div className="label-mono mt-0.5 text-warning">{sub}</div> : null}
    </div>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const tone =
    service.status === "AVAILABLE" ? "online" : service.status === "DEGRADED" ? "idle" : "offline";
  const popularityTier =
    service.popularity > 70000 ? "★★★" : service.popularity > 40000 ? "★★☆" : "★☆☆";
  return (
    <CyberCard interactive className="flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-silver">{service.name}</h3>
            <span
              className="font-mono text-[10px] text-warning"
              title={`Popularity ${service.popularity}`}
            >
              {popularityTier}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="label-mono text-accent">{service.category}</span>
            <span className="label-mono">· {service.provider}</span>
          </div>
        </div>
        <StatusIndicator tone={tone} label={service.status} />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/60">
        <MetricField
          label="PRICE"
          value={`${service.price} ${service.paymentAsset}`}
          sub={`PER ${service.unit.toUpperCase()}`}
          tone="accent"
        />
        <MetricField
          label="NETWORK"
          value={service.network}
          sub={`LAT ${service.latency}MS`}
          tone="cyan"
        />
        <MetricField label="AVAILABILITY" value={`${service.availability}%`} sub={service.status} />
        <MetricField
          label="SETTLEMENT"
          value={service.paymentMethod.settlement}
          sub={service.pricing.tier}
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="label-mono">COMPATIBLE AGENTS</div>
        <div className="flex flex-wrap gap-1">
          {service.compatibility.slice(0, 3).map((c) => (
            <span
              key={c}
              className="border border-border bg-surface-2/40 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-silver/75"
            >
              {c.split(" ")[0]}
            </span>
          ))}
          {service.compatibility.length > 3 ? (
            <span className="border border-border bg-surface-2/40 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
              +{service.compatibility.length - 3}
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {service.description}
        </p>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border p-3">
        <LinkButton to={`/services/${service.id}`} size="sm" className="w-full">
          INSPECT
        </LinkButton>
        <LinkButton to={`/services/${service.id}`} size="sm" variant="primary" className="w-full">
          REQUEST
        </LinkButton>
      </div>
    </CyberCard>
  );
}

function MetricField({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "cyan";
}) {
  return (
    <div className="bg-background/40 p-3">
      <div className="label-mono">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate font-mono text-[12px] tabular-nums",
          tone === "accent" && "text-accent",
          tone === "cyan" && "text-cyan",
          tone === undefined && "text-silver",
        )}
      >
        {value}
      </div>
      {sub ? <div className="label-mono mt-0.5">{sub}</div> : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-3">
      <span className="label-mono">{k}</span>
      <span className="truncate text-right text-silver">{v}</span>
    </div>
  );
}

export function ProofCard({
  index,
  title,
  body,
  href,
  source,
}: {
  index: string;
  title: string;
  body: string;
  href: string;
  source: string;
}) {
  return (
    <CyberCard interactive className="flex flex-col p-5">
      <div className="label-mono text-accent">{index}</div>
      <h3 className="mt-2 text-base font-semibold text-silver">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-4 break-all font-mono text-[10px] text-accent/70">{source}</div>
      <div className="mt-4 pt-1">
        <ExternalButton href={href} size="sm" variant="outline">
          OPEN OFFICIAL SOURCE ↗
        </ExternalButton>
      </div>
    </CyberCard>
  );
}

export function TransactionRow({
  id,
  from,
  to,
  amount,
  status,
  at,
}: {
  id: string;
  from?: string;
  to: string;
  amount: number;
  status: string;
  at: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-3 py-2.5 font-mono text-[11px] last:border-b-0 hover:bg-accent/5">
      <div className="min-w-0">
        <div className="truncate text-silver">
          {from ? <span className="text-muted-foreground">{from} → </span> : null}
          {to}
        </div>
        <div className="label-mono mt-0.5">
          {id} · {at}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-accent tabular-nums">{amount.toFixed(4)} USDC</div>
        <div className="label-mono mt-0.5 text-success">{status}</div>
      </div>
    </div>
  );
}

export function AgentTabLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2 font-mono text-[11px] tracking-[0.16em] transition-colors",
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted-foreground hover:border-border-strong hover:text-silver",
      )}
    >
      {children}
    </button>
  );
}

export function BrandLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="ArcPay Agent APA logo"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn("shrink-0 object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function LogoWordmark() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="relative block overflow-hidden rounded-sm border border-border-strong/60">
        <BrandLogo size={32} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-mono text-[12px] font-semibold tracking-[0.22em] text-silver">
          ARCPAY AGENT
        </span>
        <span className="label-mono block">APA · ARC NETWORK</span>
      </span>
    </Link>
  );
}
