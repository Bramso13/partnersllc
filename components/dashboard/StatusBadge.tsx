import type { UserStatus } from "@/types/user";

const statusConfig = {
  PENDING: {
    color: "bg-yellow-500",
    label: "En traitement",
    textColor: "text-yellow-900",
  },
  ACTIVE: {
    color: "bg-green-500",
    label: "Actif",
    textColor: "text-green-900",
  },
  SUSPENDED: {
    color: "bg-red-500",
    label: "Paiement requis",
    textColor: "text-red-900",
  },
};

export function StatusBadge({ status }: { status: UserStatus }) {
  const config = statusConfig[status];
  return (
    <div
      className={`${config.color} ${config.textColor} px-3 py-1 rounded-full text-sm font-medium`}
    >
      {config.label}
    </div>
  );
}
