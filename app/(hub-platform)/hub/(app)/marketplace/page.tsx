import type { Metadata } from "next";
import { MarketplaceGrid } from "@/components/hub/marketplace/MarketplaceGrid";

export const metadata: Metadata = {
  title: "Marketplace | Partners Hub",
  description: "Services exclusifs entre membres Partners Hub",
};

export default function HubMarketplacePage() {
  return <MarketplaceGrid />;
}
