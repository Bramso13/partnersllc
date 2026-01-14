"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";
import type { NavConfig } from "@/lib/navigation-config";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNavSection } from "./SidebarNavSection";
import { SidebarFooter } from "./SidebarFooter";

interface SidebarProps {
  role: UserRole;
  navConfig: NavConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, navConfig, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-72 bg-[#191A1D] text-[#B7B7B7] flex flex-col p-4
          fixed inset-y-0 left-0 z-40
          transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Navigation principale"
      >
        <SidebarHeader role={role} />

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto space-y-2" aria-label="Menu">
          {navConfig.sections.map((section, index) => (
            <SidebarNavSection key={index} section={section} role={role} />
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-4 bg-[#2D3033] hover:bg-[#3A3D42] text-[#F9F9F9] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </button>

          <SidebarFooter role={role} />
        </div>

        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 text-[#F9F9F9] hover:bg-[#2D3033] rounded-lg transition-colors"
          aria-label="Fermer le menu"
        >
          <i className="fa-solid fa-times text-xl"></i>
        </button>
      </aside>
    </>
  );
}
