import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { NAV_LINKS, projectConfig, isXConfigured } from "@/config/projectConfig";
import { LogoWordmark } from "@/components/kit/cards";
import { CyberButton, ExternalButton, StatusIndicator } from "@/components/kit/primitives";
import { WalletButton } from "@/components/kit/WalletButton";
import { XIcon } from "@/components/kit/XIcon";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <LogoWordmark />
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="border border-transparent px-2.5 py-1.5 font-mono text-[11px] tracking-[0.16em] text-muted-foreground transition-colors hover:border-border hover:text-accent data-[status=active]:border-accent/40 data-[status=active]:bg-accent/10 data-[status=active]:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 border border-border px-2 py-1.5 lg:inline-flex">
            <StatusIndicator tone="online" label={`${projectConfig.NETWORK} NETWORK`} />
          </span>
          <div className="hidden md:block">
            <WalletButton />
          </div>
          {isXConfigured ? (
            <ExternalButton href={projectConfig.X_URL} size="sm" variant="ghost" className="hidden sm:inline-flex">
              <XIcon />
            </ExternalButton>
          ) : null}
          <CyberButton
            size="sm"
            variant="ghost"
            className="xl:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "CLOSE" : "MENU"}
          </CyberButton>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface/95 px-4 py-4 xl:hidden">
          <nav className="grid gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                className="border border-border/60 px-3 py-2.5 font-mono text-[12px] tracking-[0.16em] text-muted-foreground data-[status=active]:border-accent/50 data-[status=active]:text-accent"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="border border-border/60 px-3 py-2.5 font-mono text-[12px] tracking-[0.16em] text-muted-foreground"
            >
              DASHBOARD
            </Link>
            <Link
              to="/files"
              onClick={() => setOpen(false)}
              className="border border-border/60 px-3 py-2.5 font-mono text-[12px] tracking-[0.16em] text-muted-foreground"
            >
              FILES
            </Link>
          </nav>
          <div className="mt-4">
            <WalletButton compact />
          </div>
        </div>
      ) : null}
    </header>
  );
}
