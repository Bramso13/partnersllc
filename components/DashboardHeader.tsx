"use client";

import { NotificationBell } from "./NotificationBell";
import { RoleBadge } from "./ui/RoleBadge";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/types/auth";

export function DashboardHeader() {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole>("CLIENT");
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
        if (profile?.role) {
          setUserRole(profile.role as UserRole);
        }
      }
    }
    loadUser();
  }, []);

  // Determine if we're in agent workspace
  const isAgentWorkspace = pathname.startsWith("/agent");

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#363636] bg-[#2D3033]">
      <div className="flex-1 max-w-lg">
        {/* Search bar - placeholder for future implementation */}
        <div className="relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#B7B7B7]"></i>
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full bg-[#191A1D] border border-[#363636] rounded-lg pl-10 pr-4 py-2.5 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 hover:bg-[#363636] rounded-lg p-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#191A1D] flex items-center justify-center text-[#F9F9F9] font-semibold">
              {userName ? userName[0].toUpperCase() : "U"}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#F9F9F9]">
                {userName || "Utilisateur"}
              </p>
              <RoleBadge role={userRole} className="mt-0.5" />
            </div>
            <i className={`fa-solid fa-chevron-down text-[#B7B7B7] text-xs transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#191A1D] border border-[#363636] rounded-lg shadow-lg z-50 overflow-hidden">
                {/* Admin switch link - only shown for ADMIN role in agent workspace */}
                {userRole === "ADMIN" && isAgentWorkspace && (
                  <Link
                    href="/admin/analytics"
                    className="flex items-center gap-3 px-4 py-3 text-[#F9F9F9] hover:bg-[#2D3033] transition-colors border-b border-[#363636]"
                    onClick={() => setShowDropdown(false)}
                  >
                    <i className="fa-solid fa-shield-halved text-purple-400"></i>
                    <span>Espace Admin</span>
                  </Link>
                )}
                {/* Agent switch link - only shown for ADMIN role in admin workspace */}
                {userRole === "ADMIN" && !isAgentWorkspace && pathname.startsWith("/admin") && (
                  <Link
                    href="/agent"
                    className="flex items-center gap-3 px-4 py-3 text-[#F9F9F9] hover:bg-[#2D3033] transition-colors border-b border-[#363636]"
                    onClick={() => setShowDropdown(false)}
                  >
                    <i className="fa-solid fa-user-tie text-cyan-400"></i>
                    <span>Espace Agent</span>
                  </Link>
                )}
                {/* Profile settings link */}
                <Link
                  href={isAgentWorkspace ? "/agent/profile" : "/dashboard/profile"}
                  className="flex items-center gap-3 px-4 py-3 text-[#B7B7B7] hover:bg-[#2D3033] hover:text-[#F9F9F9] transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="fa-solid fa-gear"></i>
                  <span>Paramètres</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
