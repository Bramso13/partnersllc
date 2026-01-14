import type { UserRole } from "@/types/auth";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig = {
  CLIENT: {
    label: "Client",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "fa-user",
  },
  AGENT: {
    label: "Agent",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "fa-user-tie",
  },
  ADMIN: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800 border-purple-200",
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
