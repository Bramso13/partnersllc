import Link from "next/link";
import type { UserRole } from "@/types/auth";

interface SidebarFooterProps {
  role: UserRole;
}

export function SidebarFooter({ role }: SidebarFooterProps) {
  if (role === "ADMIN" || role === "AGENT") {
    return (
      <div className="bg-[#2D3033] rounded-xl p-4 text-center">
        <div className="text-sm text-[#B7B7B7]">© 2025 PARTNERS LLC</div>
        <div className="text-xs text-gray-500 mt-1">Tous droits réservés</div>
      </div>
    );
  }

  // Client version
  return (
    <div className="bg-[#2D3033] rounded-xl p-4">
      <div className="font-semibold text-[#F9F9F9]">Besoin d'aide ?</div>
      <div className="text-sm mt-1 mb-3 text-[#B7B7B7]">
        Notre équipe est là pour vous accompagner dans toutes vos démarches.
      </div>
      <Link
        href="/dashboard/support"
        className="w-full py-2 bg-[#50B88A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity block text-center"
      >
        Contacter le support
      </Link>
    </div>
  );
}
