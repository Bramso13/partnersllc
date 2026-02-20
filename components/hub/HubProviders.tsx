"use client";

import { HubMarketplaceProvider } from "@/lib/contexts/hub/marketplace/HubMarketplaceContext";
import { HubEventsProvider } from "@/lib/contexts/hub/events/HubEventsContext";
import { HubMessagesProvider } from "@/lib/contexts/hub/messages/HubMessagesContext";

/**
 * Wrapper qui regroupe tous les providers Hub.
 * À monter une seule fois dans app/(hub-platform)/hub/(app)/layout.tsx
 */
export function HubProviders({ children }: { children: React.ReactNode }) {
  return (
    <HubMarketplaceProvider>
      <HubEventsProvider>
        <HubMessagesProvider>
          {children}
        </HubMessagesProvider>
      </HubEventsProvider>
    </HubMarketplaceProvider>
  );
}
