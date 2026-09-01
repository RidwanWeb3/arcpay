import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "@wagmi/connectors";
import { arcMainnet, arcTestnet } from "./chains";
import { isDemoMode } from "@/config/projectConfig";

const env = import.meta.env as Record<string, string | undefined>;

const connectors: Array<ReturnType<typeof injected> | ReturnType<typeof walletConnect>> = [];
connectors.push(
  injected({
    shimDisconnect: true,
    unstable_shimAsyncInject: true,
  }),
);

const walletConnectProjectId = env["VITE_WALLETCONNECT_PROJECT_ID"];
if (walletConnectProjectId && walletConnectProjectId.trim().length > 0) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
  );
}

void isDemoMode;

export const wagmiConfig = createConfig({
  chains: [arcMainnet, arcTestnet] as const,
  connectors,
  transports: {
    [arcMainnet.id]: http(),
    [arcTestnet.id]: http(),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});
