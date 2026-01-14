import Link from "next/link";
import Image from "next/image";
import type { UserRole } from "@/types/auth";

interface SidebarHeaderProps {
  role: UserRole;
}

export function SidebarHeader({ role }: SidebarHeaderProps) {
  if (role === "ADMIN") {
    return (
      <div className="p-4 mb-8">
        <Link href="/admin/analytics" className="flex items-center gap-3">
          <div className="flex-row items-center gap-3">
            <Image
              src="/logo_partnersllc_blanc.png"
              alt="PARTNERS LLC Logo"
              width={200}
              height={200}
              className="object-contain"
            />
            <div className="text-xs text-gray-500 mt-1 ml-0">Back-Office</div>
          </div>
        </Link>
      </div>
    );
  }

  if (role === "AGENT") {
    return (
      <div className="p-4 mb-8">
        <Link href="/agent" className="flex items-center gap-3">
          <div className="flex-row items-center gap-3">
            <Image
              src="/logo_partnersllc_blanc.png"
              alt="PARTNERS LLC Logo"
              width={200}
              height={200}
              className="object-contain"
            />
            <div className="text-xs text-gray-500 mt-1 ml-0">Espace Agent</div>
          </div>
        </Link>
      </div>
    );
  }

  // Client version - using logo placeholder
  return (
    <div className="p-4 mb-8">
      <Link href="/dashboard">
        <div className="flex-row items-center gap-3">
          <Image
            src="/logo_partnersllc_blanc.png"
            alt="PARTNERS LLC Logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>
      </Link>
    </div>
  );
}
