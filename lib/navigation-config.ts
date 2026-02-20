export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface NavConfig {
  sections: NavSection[];
}

export const clientNavConfig: NavConfig = {
  sections: [
    {
      label: "Menu",
      items: [
        {
          href: "/dashboard",
          icon: "fa-chart-pie",
          label: "Tableau de bord",
        },
        {
          href: "/dashboard/dossiers",
          icon: "fa-list-check",
          label: "Mes dossiers",
        },
        {
          href: "/dashboard/documents",
          icon: "fa-folder-open",
          label: "Documents",
        },
        {
          href: "/dashboard/entreprise",
          icon: "fa-building",
          label: "Mon entreprise",
        },
        {
          href: "/hub/dashboard",
          icon: "fa-users",
          label: "PARTNERS Hub",
        },
        {
          href: "/dashboard/formation",
          icon: "fa-graduation-cap",
          label: "Formation",
        },
      ],
    },
    {
      label: "Support",
      items: [
        {
          href: "/dashboard/support",
          icon: "fa-headset",
          label: "Support",
        },
        {
          href: "/dashboard/profile",
          icon: "fa-gear",
          label: "Paramètres",
        },
      ],
    },
  ],
};

export const agentNavConfig: NavConfig = {
  sections: [
    {
      label: "Agent Space",
      items: [
        {
          href: "/agent",
          icon: "fa-gauge-high",
          label: "Dashboard",
        },
        {
          href: "/agent/dossiers",
          icon: "fa-folder-tree",
          label: "My dossiers",
        },
      ],
    },
  ],
};

export const adminNavConfig: NavConfig = {
  sections: [
    {
      label: "Menu",
      items: [
        {
          href: "/admin/analytics",
          icon: "fa-chart-pie",
          label: "Vue d'ensemble",
        },
        {
          href: "/admin/dossiers",
          icon: "fa-folder-tree",
          label: "Dossiers LLC",
        },
        {
          href: "/admin/clients",
          icon: "fa-users",
          label: "Gestion Clients",
        },
        {
          href: "/admin/agents",
          icon: "fa-user-tie",
          label: "Gestion Agents",
        },
        {
          href: "/admin/hub/subscriptions",
          icon: "fa-ticket",
          label: "Inscriptions Hub",
        },
        {
          href: "/admin/hub/events",
          icon: "fa-calendar-days",
          label: "Événements Hub",
        },
        {
          href: "/admin/products",
          icon: "fa-box",
          label: "Produits",
        },
        {
          href: "/admin/payment-links",
          icon: "fa-link",
          label: "Liens de paiement",
          // },
          // {
          //   href: "/admin/analytics",
          //   icon: "fa-chart-line",
          //   label: "Analyses",
          // },
        },
        {
          href: "/admin/facturation",
          icon: "fa-file-invoice-dollar",
          label: "Facturation",
        },
        {
          href: "/admin/acomptes",
          icon: "fa-money-bill-transfer",
          label: "Acomptes",
        },
        {
          href: "/admin/orders",
          icon: "fa-shopping-cart",
          label: "Commandes",
        },
      ],
    },
    {
      label: "Outils",
      items: [
        {
          href: "/admin/conversations/clients",
          icon: "fa-comments",
          label: "Conversations",
        },
        {
          href: "/admin/formations",
          icon: "fa-graduation-cap",
          label: "Formations",
        },
        {
          href: "/admin/notifications",
          icon: "fa-bullhorn",
          label: "Notifications",
        },
        {
          href: "/admin/settings",
          icon: "fa-gear",
          label: "Paramètres",
        },
        {
          href: "/admin/backoffice",
          icon: "fa-database",
          label: "Back-office Données",
        },
        {
          href: "/admin/test",
          icon: "fa-flask",
          label: "Test",
        },
      ],
    },
  ],
};

/**
 * Get navigation config based on user role
 */
export function getNavConfigForRole(
  role: "CLIENT" | "AGENT" | "ADMIN"
): NavConfig {
  switch (role) {
    case "ADMIN":
      return adminNavConfig;
    case "AGENT":
      return agentNavConfig;
    case "CLIENT":
    default:
      return clientNavConfig;
  }
}
