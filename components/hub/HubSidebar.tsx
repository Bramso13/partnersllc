"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Globe2,
  ShoppingBag,
  CalendarDays,
  MessageSquare,
  LogOut,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/hub/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/hub/reseau",
    label: "Réseau",
    icon: Globe2,
  },
  {
    href: "/hub/marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
  },
  {
    href: "/hub/evenements",
    label: "Événements",
    icon: CalendarDays,
  },
  {
    href: "/hub/messages",
    label: "Messages",
    icon: MessageSquare,
    badge: 3,
  },
];

interface HubSidebarProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function HubSidebar({ userId, isOpen, onClose }: HubSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/hub");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`
        w-[220px] bg-[#07080A] border-r border-white/[0.05]
        fixed inset-y-0 left-0 z-40
        flex flex-col
        transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(80,185,137,0.1) 100%)",
              border: "1px solid rgba(0,240,255,0.2)",
              boxShadow: "0 0 16px rgba(0,240,255,0.08)",
            }}
          >
            <span
              className="text-[11px] font-black tracking-tight"
              style={{ color: "#00F0FF" }}
            >
              PH
            </span>
          </div>
          <div className="leading-none">
            <p className="text-white text-[13px] font-semibold">Partners</p>
            <p
              className="text-[9px] font-bold tracking-[0.22em] uppercase mt-0.5"
              style={{ color: "#00F0FF", opacity: 0.7 }}
            >
              Hub
            </p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">
          Navigation
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`
                group relative flex items-center gap-3 px-3 py-[9px] rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? "text-white"
                    : "text-white/35 hover:text-white/75 hover:bg-white/[0.035]"
                }
              `}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(90deg, rgba(0,240,255,0.07) 0%, rgba(0,240,255,0.02) 100%)",
                      border: "1px solid rgba(0,240,255,0.08)",
                    }
                  : {}
              }
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full"
                  style={{
                    background: "#00F0FF",
                    boxShadow: "0 0 10px rgba(0,240,255,0.7)",
                  }}
                />
              )}
              <Icon
                size={16}
                className="flex-shrink-0 transition-colors"
                style={isActive ? { color: "#00F0FF" } : {}}
              />
              <span className="text-[13px] font-medium">{label}</span>
              {badge && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-[#0A0B0D]"
                  style={{ background: "#00F0FF" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-4 border-t border-white/[0.05] space-y-0.5">
        <Link
          href={`/hub/members/${userId}`}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-[9px] rounded-xl text-white/35 hover:text-white/75 hover:bg-white/[0.035] transition-all duration-200"
        >
          <div
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white/50"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(80,185,137,0.12))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            P
          </div>
          <span className="text-[13px] font-medium">Mon profil</span>
        </Link>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-[9px] rounded-xl text-white/25 hover:text-white/55 hover:bg-white/[0.035] transition-all duration-200 disabled:opacity-40"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span className="text-[13px] font-medium">
            {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
          </span>
        </button>
      </div>

      {/* Close button (mobile) */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-colors"
      >
        <X size={18} />
      </button>
    </aside>
  );
}
