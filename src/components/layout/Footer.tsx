import { Link } from "@tanstack/react-router";
import { projectConfig, isContractAvailable, isXConfigured } from "@/config/projectConfig";
import { BrandLogo } from "@/components/kit/cards";
import { CyberButton, ExternalButton, Divider } from "@/components/kit/primitives";
import { XIcon } from "@/components/kit/XIcon";

const FOOTER_LINKS = [
  { label: "Agents", to: "/agents" },
  { label: "Terminal", to: "/terminal" },
  { label: "Services", to: "/services" },
  { label: "Payments", to: "/payments" },
  { label: "Activity", to: "/activity" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Files", to: "/files" },
  { label: "About", to: "/about" },
  { label: "Proof", to: "/proof" },
  { label: "ARC", to: "/arc" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/30">
      <div className="mx-auto max-w-[1600px] px-4 py-12 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="block overflow-hidden rounded-sm border border-border-strong/60">
                <BrandLogo size={44} />
              </span>
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold tracking-[0.22em] text-silver">APA</div>
                <div className="label-mono">ARCPAY AGENT</div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {projectConfig.TAGLINE_ALT}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ExternalButton href={projectConfig.BUY_URL} size="sm" variant="primary">
                BUY · RADARDEX.PRO
              </ExternalButton>
              <ExternalButton href={projectConfig.CHART_URL} size="sm">
                CHART · RADARDEX.PRO
              </ExternalButton>
              {isXConfigured ? (
                <ExternalButton href={projectConfig.X_URL} size="sm" variant="ghost">
                  <XIcon /> X
                </ExternalButton>
              ) : (
                <span className="inline-flex h-8 items-center gap-2 border border-border px-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  <XIcon /> X · NOT CONFIGURED
                </span>
              )}
            </div>
          </div>

          <nav className="min-w-0">
            <div className="label-mono mb-4">NAVIGATION</div>
            <ul className="grid grid-cols-2 gap-y-2">
              {FOOTER_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            <div className="label-mono mb-4">PROJECT</div>
            <dl className="space-y-2 font-mono text-[11px]">
              <Row k="TICKER" v={projectConfig.TICKER} />
              <Row k="NETWORK" v={projectConfig.NETWORK} />
              <Row k="ASSET" v={projectConfig.PAYMENT_ASSET} />
              <Row k="CONTRACT" v={isContractAvailable ? projectConfig.CONTRACT_ADDRESS : "COMING SOON"} />
            </dl>
            <CyberButton size="sm" variant="ghost" className="mt-3" disabled={!isContractAvailable}>
              COPY CONTRACT
            </CyberButton>
            <p className="mt-4 font-mono text-[10px] leading-4 text-muted-foreground">
              Build on ARC. Built around publicly documented Circle agentic payment infrastructure — not an official
              partnership.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Divider />
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <p className="min-w-0 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            © {new Date().getFullYear()} ARCPAY AGENT — {projectConfig.TAGLINE}
          </p>
          <span className="label-mono shrink-0 text-warning">DEMO ENVIRONMENT</span>
        </div>
      </div>
    </footer>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-3">
      <dt className="label-mono">{k}</dt>
      <dd className="truncate text-right text-silver">{v}</dd>
    </div>
  );
}
