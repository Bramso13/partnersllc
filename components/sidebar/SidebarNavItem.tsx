"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation-config";
import type { UserRole } from "@/types/auth";

interface SidebarNavItemProps {
  item: NavItem;
  role: UserRole;
}

export function SidebarNavItem({ item, role }: SidebarNavItemProps) {
  const pathname = usePathname();
  
  // Determine if this route should match exactly or with sub-routes
  // Routes that are "terminal" (like /dashboard) should only match exactly
  // Routes with children (like /dashboard/dossiers) should match with sub-routes
  const isExactRoute = item.href === "/dashboard" || item.href === "/admin" || item.href === "/agent";
  
  const isActive = isExactRoute
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  // Active state styling based on role
  const activeStyles =
    role === "CLIENT"
      ? "bg-[#50B88A] text-white font-bold"
      : "bg-[#F9F9F9] text-[#191A1D] font-bold";

  const inactiveStyles =
    "text-[#B7B7B7] hover:bg-[#2D3033] hover:text-[#F9F9F9]";

  return (
    <Link
      href={item.href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        isActive ? activeStyles : inactiveStyles
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <i className={`fa-solid ${item.icon} w-6`} aria-hidden="true"></i>
      <span>{item.label}</span>
    </Link>
  );
}
