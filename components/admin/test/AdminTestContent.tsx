"use client";

import { useState } from "react";
import { BackofficeProvider } from "@/lib/contexts/backoffice/BackofficeContext";
import { ProductsProvider } from "@/lib/contexts/products/ProductsContext";
import { ConfigTab } from "./ConfigTab";
import { TestEmailTab } from "./TestEmailTab";
import { TestProcessusTab } from "./TestProcessusTab";
import { TestUsersTab } from "./TestUsersTab";

type TabId = "config" | "processus" | "users" | "email" | "email-smtp";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "config", label: "Config coordonnées", icon: "fa-sliders" },
  { id: "processus", label: "Test processus dossier", icon: "fa-diagram-project" },
  { id: "users", label: "Users de test", icon: "fa-users" },
  { id: "email", label: "Test email (Resend)", icon: "fa-envelope" },
  { id: "email-smtp", label: "Test email (Nodemailer)", icon: "fa-paper-plane" },
];

const SESSION_KEY_EMAIL = "test_email";
const SESSION_KEY_PHONE = "test_phone";

export function AdminTestContent() {
  const [activeTab, setActiveTab] = useState<TabId>("config");
  const [testEmail, setTestEmail] = useState(
    () => (typeof window !== "undefined" ? (sessionStorage.getItem(SESSION_KEY_EMAIL) ?? "") : "")
  );
  const [testPhone, setTestPhone] = useState(
    () => (typeof window !== "undefined" ? (sessionStorage.getItem(SESSION_KEY_PHONE) ?? "") : "")
  );

  const handleSaveConfig = (email: string, phone: string) => {
    setTestEmail(email);
    setTestPhone(phone);
    sessionStorage.setItem(SESSION_KEY_EMAIL, email);
    sessionStorage.setItem(SESSION_KEY_PHONE, phone);
  };

  return (
    <BackofficeProvider>
      <ProductsProvider>
        <div className="min-h-screen bg-[#191a1d]">
          {/* Header */}
          <header className="border-b border-[#363636] bg-[#1e1f22]/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#7c6af7]/15 flex items-center justify-center">
                  <i className="fa-solid fa-flask text-[#7c6af7] text-sm" />
                </div>
                <h1 className="text-xl font-semibold text-[#f9f9f9]">Test</h1>
              </div>
              <p className="text-sm text-[#b7b7b7]">
                Testez les processus métier avec des coordonnées dédiées — réservé aux administrateurs
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

            {activeTab === "config" && (
              <ConfigTab
                email={testEmail}
                phone={testPhone}
                onSave={handleSaveConfig}
              />
            )}
            {activeTab === "processus" && (
              <TestProcessusTab
                testEmail={testEmail}
                testPhone={testPhone}
                onGoToConfig={() => setActiveTab("config")}
              />
            )}
            {activeTab === "users" && <TestUsersTab />}
            {activeTab === "email" && (
              <TestEmailTab defaultTo={testEmail} transport="resend" />
            )}
            {activeTab === "email-smtp" && (
              <TestEmailTab defaultTo={testEmail} transport="smtp" />
            )}
          </div>
        </div>
      </ProductsProvider>
    </BackofficeProvider>
  );
}
