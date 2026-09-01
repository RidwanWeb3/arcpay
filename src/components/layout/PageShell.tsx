import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ModeBadge, NetworkBadge } from "@/components/kit/primitives";

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  wide = false,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-50" />
      <div className={cn("relative mx-auto px-4 py-10 lg:px-6 lg:py-14", wide ? "max-w-[1600px]" : "max-w-6xl")}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="label-mono text-accent">{eyebrow}</div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-silver sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
            <NetworkBadge network="ARC" asset="USDC" />
            <ModeBadge />
          </div>
        </div>
        {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
