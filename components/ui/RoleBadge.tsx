import type { UserRole } from "@/types/auth";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig = {
  CLIENT: {
    label: "Client",
    // Gray (#6B7280) for dark theme
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: "fa-user",
  },
  AGENT: {
    label: "Agent",
    // Cyan (#00F0FF) for dark theme
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    icon: "fa-user-tie",
  },
  ADMIN: {
    label: "Admin",
    // Purple (#A78BFA) for dark theme
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: "fa-shield-halved",
  },
};

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color} ${className}`}
    >
      <i className={`fa-solid ${config.icon} text-xs`} aria-hidden="true"></i>
      <span>{config.label}</span>
    </span>
  );
}
