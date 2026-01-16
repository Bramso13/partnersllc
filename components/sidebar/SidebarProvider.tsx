"use client";

import { useState } from "react";
import type { UserRole } from "@/types/auth";
import type { NavConfig } from "@/lib/navigation-config";
import { Sidebar } from "./Sidebar";
import { HamburgerButton } from "./HamburgerButton";
import { DashboardHeader } from "../DashboardHeader";
import { NotificationBell } from "../NotificationBell";

interface SidebarProviderProps {
  children: React.ReactNode;
  role: UserRole;
  navConfig: NavConfig;
}

export function SidebarProvider({
  children,
  role,
  navConfig,
}: SidebarProviderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        navConfig={navConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content area */}
      <main
        className="
          flex-1 flex flex-col overflow-hidden
          bg-[#2D3033]
          md:ml-72
          min-h-screen
        "
      >
        {/* Desktop Header */}
        <DashboardHeader />

        {/* Mobile header with hamburger */}
        <div className="md:hidden p-4 border-b border-[#363636] flex items-center justify-between">
          <HamburgerButton onClick={() => setIsSidebarOpen(true)} />
          <NotificationBell />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
