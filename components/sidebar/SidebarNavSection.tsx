import type { NavSection } from "@/lib/navigation-config";
import type { UserRole } from "@/types/auth";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarNavSectionProps {
  section: NavSection;
  role: UserRole;
}

export function SidebarNavSection({ section, role }: SidebarNavSectionProps) {
  return (
    <div className="mb-6">
      <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {section.label}
      </p>
      <nav className="space-y-1" aria-label={section.label}>
        {section.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} role={role} />
        ))}
      </nav>
    </div>
  );
}
