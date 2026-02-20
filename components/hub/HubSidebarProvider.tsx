"use client";

import { useState } from "react";
import { HubSidebar } from "./HubSidebar";
import { Menu } from "lucide-react";

interface HubSidebarProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function HubSidebarProvider({
  children,
  userId,
}: HubSidebarProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0B0D]">
      <HubSidebar
        userId={userId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-[220px] min-h-screen flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-[#07080A]">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">
            Partners Hub
          </span>
          <div className="w-9" />
        </div>

        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
