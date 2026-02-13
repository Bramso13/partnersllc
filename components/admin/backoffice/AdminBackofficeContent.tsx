"use client";

import { useState } from "react";
import { BackofficeProvider } from "@/lib/contexts/backoffice/BackofficeContext";
import { ClientsProvider } from "@/lib/contexts/clients/ClientsContext";
import { ProductsProvider } from "@/lib/contexts/products/ProductsContext";
import { ResetDossierTab } from "./ResetDossierTab";
import { CreateDossierTab } from "./CreateDossierTab";
import { DataExplorerTab } from "./DataExplorerTab";

type TabId = "reset" | "create" | "explorer";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "reset", label: "Reset dossier", icon: "fa-rotate-left" },
  { id: "create", label: "Créer un dossier", icon: "fa-plus-circle" },
  { id: "explorer", label: "Explorer les données", icon: "fa-table" },
];

export function AdminBackofficeContent() {
  const [activeTab, setActiveTab] = useState<TabId>("reset");

  return (
    <BackofficeProvider>
      <ClientsProvider>
        <ProductsProvider>
          <div className="min-h-screen bg-[#191a1d]">
            {/* Header */}
            <header className="border-b border-[#363636] bg-[#1e1f22]/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-[#50b989]/15 flex items-center justify-center">
                    <i className="fa-solid fa-database text-[#50b989] text-sm" />
                  </div>
                  <h1 className="text-xl font-semibold text-[#f9f9f9]">
                    Back-office Données
                  </h1>
                </div>
                <p className="text-sm text-[#b7b7b7]">
                  Outils d&apos;administration avancée — réservé aux administrateurs
                </p>
              </div>
            </header>

            {/* Tabs + content */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
              <div className="flex gap-1 p-1 rounded-xl bg-[#252628] border border-[#363636] w-fit mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
                        : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "reset" && <ResetDossierTab />}
              {activeTab === "create" && <CreateDossierTab />}
              {activeTab === "explorer" && <DataExplorerTab />}
            </div>
          </div>
        </ProductsProvider>
      </ClientsProvider>
    </BackofficeProvider>
  );
}
