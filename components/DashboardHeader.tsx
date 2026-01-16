"use client";

import { NotificationBell } from "./NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
      }
    }
    loadUser();
  }, []);

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-[#363636] bg-[#2D3033]">
      <div className="flex-1 max-w-lg">
        {/* Search bar - placeholder for future implementation */}
        <div className="relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#B7B7B7]"></i>
          <input
            type="text"
            placeholder="Rechercher dans votre dossier..."
            className="w-full bg-[#191A1D] border border-[#363636] rounded-lg pl-10 pr-4 py-2.5 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile - placeholder */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#191A1D] flex items-center justify-center text-[#F9F9F9] font-semibold">
            {userName ? userName[0].toUpperCase() : "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-[#F9F9F9]">
              {userName || "Utilisateur"}
            </p>
            <p className="text-xs text-[#B7B7B7]">Client</p>
          </div>
        </div>
      </div>
    </header>
  );
}
