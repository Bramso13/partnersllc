"use client";

import { useEffect, useRef, useState } from "react";
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
  const [overlayCanClose, setOverlayCanClose] = useState(false);
  const prevPathnameRef = useRef(pathname);

  // L'overlay ne doit pas recevoir les events tout de suite : le mouseup/touchend
  // du geste "ouvrir" pourrait tomber dessus et fermer la sidebar. On le rend
  // cliquable seulement après un court délai.
  useEffect(() => {
    if (isOpen) {
      setOverlayCanClose(false);
      const t = setTimeout(() => setOverlayCanClose(true), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Fermer la sidebar au changement de route (mobile uniquement).
  // On ne ferme que quand pathname change (navigation), pas à l'ouverture.
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [pathname]);

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
      {/* Overlay for mobile - pointer-events désactivés au début pour éviter
          que le geste "ouvrir" (mouseup/touchend) ne ferme la sidebar */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 z-30 md:hidden ${
            overlayCanClose ? "" : "pointer-events-none"
          }`}
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
