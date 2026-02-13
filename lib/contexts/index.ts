/**
 * Contexts API par domaine - ré-exports.
 * @see docs/architecture/dev-agent-api-conventions.md
 */

export {
  ClientsProvider,
  useClients,
} from "./clients/ClientsContext";
export type { CreateClientData, DossierSummary } from "./clients/types";
export type { ClientProfile, ClientWithDossierCount } from "./clients/types";

export {
  ProductsProvider,
  useProducts,
} from "./products/ProductsContext";
export type { Product, ProductFormData, ProductType } from "./products/types";

export {
  AgentsProvider,
  useAgents,
} from "./agents/AgentsContext";
export type { DossierAgentAssignments } from "./agents/AgentsContext";
export type { Agent, AgentType, AgentDashboardData } from "./agents/types";

export {
  DossiersProvider,
  useDossiers,
} from "./dossiers/DossiersContext";
export type { AdvisorInfo, DossierApiResponse } from "./dossiers/types";

export {
  FormationsProvider,
  useFormations,
} from "./formations/FormationsContext";

export {
  PaymentLinksProvider,
  usePaymentLinks,
} from "./payment-links/PaymentLinksContext";

export {
  NotificationsProvider,
  useNotifications,
} from "./notifications/NotificationsContext";

export {
  ConversationsProvider,
  useConversations,
} from "./conversations/ConversationsContext";

export {
  OrdersProvider,
  useOrders,
} from "./orders/OrdersContext";

export {
  BackofficeProvider,
  useBackoffice,
} from "./backoffice/BackofficeContext";
export type {
  DossierSearchResult,
  EntityType,
  EntitiesResponse,
} from "./backoffice/types";
