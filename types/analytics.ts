export interface RevenueMetrics {
  total_revenue: number;
  revenue_this_month: number;
  avg_order_value: number;
  revenue_trend: { date: string; revenue: number }[];
  revenue_by_product: { name: string; revenue: number }[];
}

export interface ConversionMetrics {
  payment_link_conversion_rate: number;
  registration_to_payment_rate: number;
  suspended_recovery_rate: number;
  funnel_data: { name: string; value: number }[];
}

export interface DossierPerformance {
  total_dossiers: number;
  active_dossiers: number;
  completed_this_month: number;
  avg_days_to_completion: number;
  completion_rate_by_product: { name: string; rate: number }[];
  bottlenecks: { name: string; avg_hours: number }[];
}

export interface AgentPerformance {
  documents_reviewed: number;
  avg_review_time_hours: number;
  workload_distribution: { agent_name: string; count: number }[];
  leaderboard: { agent_name: string; reviews: number; avg_time: number }[];
}

export interface DocumentMetrics {
  approval_rate: number;
  rejection_reasons: { reason: string; count: number }[];
  avg_versions_per_document: number;
}

export interface DashboardMetrics {
  revenue: RevenueMetrics;
  conversion: ConversionMetrics;
  dossier: DossierPerformance;
  agent: AgentPerformance;
  document: DocumentMetrics;
}
