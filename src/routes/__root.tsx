import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { WalletProvider } from "@/hooks/useWallet";
import { CyberCard, LinkButton, CyberButton } from "@/components/kit/primitives";
import { BrandLogo } from "@/components/kit/cards";
import { wagmiConfig } from "@/lib/arc/wagmiConfig";

function ErrorFrame({
  code,
  title,
  message,
  children,
}: {
  code: string;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid-bg flex min-h-[70vh] items-center justify-center px-4">
      <CyberCard className="scanlines w-full max-w-lg p-8 text-center">
        <div className="mx-auto w-fit animate-logo-glow">
          <BrandLogo size={72} className="rounded-sm" />
        </div>
        <div className="mt-6 font-mono text-[11px] tracking-[0.3em] text-destructive">{code}</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-silver">{title}</h1>
        <p className="mt-3 font-mono text-[12px] leading-6 text-muted-foreground">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">{children}</div>
      </CyberCard>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <ErrorFrame
      code="ERR_404 · ROUTE_UNRESOLVED"
      title="AGENT NOT FOUND"
      message="No agent, service or route is registered at this address. The discovery layer returned an empty result set."
    >
      <LinkButton to="/" variant="primary">
        RETURN TO BASE
      </LinkButton>
      <LinkButton to="/terminal">OPEN TERMINAL</LinkButton>
    </ErrorFrame>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorFrame
      code="ERR_500 · RUNTIME_FAULT"
      title="SYSTEM FAILURE"
      message="The agent runtime encountered an unrecoverable fault. No transaction was executed."
    >
      <CyberButton
        variant="primary"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        RESTART RUNTIME
      </CyberButton>
      <a
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-sm border border-border-strong/70 px-4 font-mono text-[11px] tracking-[0.16em] text-silver hover:border-accent hover:text-accent"
      >
        GO HOME
      </a>
    </ErrorFrame>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ArcPay Agent — Payment Infrastructure for Autonomous Agents" },
      {
        name: "description",
        content:
          "ArcPay Agent is an agent-native payment interface for autonomous services, programmable transactions and USDC-powered commerce on ARC.",
      },
      { name: "theme-color", content: "#02040A" },
      { property: "og:site_name", content: "ArcPay Agent" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ArcPay Agent",
          alternateName: "APA",
          description:
            "Payment infrastructure concept for autonomous agents on ARC, settling in USDC.",
          logo: "/brand/apa-logo.png",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <WalletProvider>
          {mounted ? null : <div aria-hidden style={{ display: "none" }} />}
          <LoadingScreen />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <Footer />
          </div>
        </WalletProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export { Link };
