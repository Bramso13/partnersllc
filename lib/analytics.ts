"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { DashboardMetrics } from "@/types/analytics";

/**
 * Fetch all dashboard metrics with optional date range and filters
 */
export async function getDashboardMetrics(filters?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  agentId?: string;
}): Promise<DashboardMetrics> {
  const supabase = createAdminClient();

  // Helper to apply filters to a query
  const applyFilters = (query: any, table: string = "") => {
    let q = query;
    const prefix = table ? `${table}.` : "";
    if (filters?.startDate) q = q.gte(`${prefix}created_at`, filters.startDate);
    if (filters?.endDate) q = q.lte(`${prefix}created_at`, filters.endDate);
    return q;
  };

  // 1. Revenue Metrics
  const { data: totalRevData } = await applyFilters(
    supabase.from("orders").select("amount"),
    "orders"
  ).eq("status", "PAID");

  const totalRevenue =
    (totalRevData || []).reduce(
      (sum: number, o: { amount: number }) => sum + (o.amount || 0),
      0
    ) / 100;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthRevData } = await supabase
    .from("orders")
    .select("amount")
    .eq("status", "PAID")
    .gte("created_at", startOfMonth.toISOString());

  const revenueThisMonth =
    (monthRevData || []).reduce(
      (sum: number, o: { amount: number }) => sum + (o.amount || 0),
      0
    ) / 100;

  const avgOrderValue =
    totalRevData && totalRevData.length > 0
      ? totalRevenue / totalRevData.length
      : 0;

  // Revenue Trend (Daily last 90 days if no range)
  const trendStartDate =
    filters?.startDate ||
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: trendData } = await supabase
    .from("orders")
    .select("amount, created_at")
    .eq("status", "PAID")
    .gte("created_at", trendStartDate);

  const dailyTrend: Record<string, number> = {};
  (trendData || []).forEach((o: { amount: number; created_at: string }) => {
    const date = new Date(o.created_at).toISOString().split("T")[0];
    dailyTrend[date] = (dailyTrend[date] || 0) + o.amount / 100;
  });
  const revenueTrend = Object.entries(dailyTrend)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue by Product
  const { data: revByProdData } = await applyFilters(
    supabase.from("orders").select("amount, products(name)"),
    "orders"
  ).eq("status", "PAID");

  const prodRevenue: Record<string, number> = {};
  (revByProdData || []).forEach((o: any) => {
    const name = o.products?.name || "Unknown";
    prodRevenue[name] = (prodRevenue[name] || 0) + o.amount / 100;
  });
  const revenueByProduct = Object.entries(prodRevenue).map(
    ([name, revenue]) => ({ name, revenue })
  );

  // 2. Conversion Metrics
  const { count: totalLinks } = await applyFilters(
    supabase.from("payment_links").select("*", { count: "exact", head: true })
  );
  const { count: convertedLinks } = await applyFilters(
    supabase.from("orders").select("*", { count: "exact", head: true })
  )
    .not("payment_link_id", "is", null)
    .eq("status", "PAID");

  const paymentLinkConversionRate = totalLinks
    ? ((convertedLinks || 0) / totalLinks) * 100
    : 0;

  // Registration to payment
  const { count: totalProfiles } = await applyFilters(
    supabase.from("profiles").select("*", { count: "exact", head: true })
  );
  const { count: paidProfiles } = await applyFilters(
    supabase.from("profiles").select("*", { count: "exact", head: true })
  ).eq("status", "ACTIVE");

  const registration_to_payment_rate = totalProfiles
    ? ((paidProfiles || 0) / totalProfiles) * 100
    : 0;

  // Funnel
  const funnelData = [
    { name: "Liens Créés", value: totalLinks || 0 },
    { name: "Paiements", value: convertedLinks || 0 },
    { name: "Inscriptions", value: totalProfiles || 0 },
    { name: "Clients Actifs", value: paidProfiles || 0 },
  ];

  // 3. Dossier Performance
  const { count: totalDossiers } = await applyFilters(
    supabase.from("dossiers").select("*", { count: "exact", head: true })
  );
  const { count: activeDossiers } = await applyFilters(
    supabase.from("dossiers").select("*", { count: "exact", head: true })
  )
    .neq("status", "COMPLETED")
    .neq("status", "CLOSED");

  const { count: completedThisMonth } = await supabase
    .from("dossiers")
    .select("*", { count: "exact", head: true })
    .eq("status", "COMPLETED")
    .gte("completed_at", startOfMonth.toISOString());

  const { data: completedDossiers } = await applyFilters(
    supabase.from("dossiers").select("created_at, completed_at")
  )
    .eq("status", "COMPLETED")
    .not("completed_at", "is", null);

  const totalDays = (completedDossiers || []).reduce(
    (sum: number, d: { created_at: string; completed_at: string }) => {
      const start = new Date(d.created_at);
      const end = new Date(d.completed_at);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    },
    0
  );

  const avgDaysToCompletion =
    completedDossiers && completedDossiers.length > 0
      ? totalDays / completedDossiers.length
      : 0;

  // Completion rate by product
  const { data: dossiersByProd } = await applyFilters(
    supabase.from("dossiers").select("status, products(name)"),
    "dossiers"
  );

  const prodStats: Record<string, { total: number; completed: number }> = {};
  (dossiersByProd || []).forEach((d: any) => {
    const name = d.products?.name || "Unknown";
    if (!prodStats[name]) prodStats[name] = { total: 0, completed: 0 };
    prodStats[name].total++;
    if (d.status === "COMPLETED") prodStats[name].completed++;
  });

  const completion_rate_by_product = Object.entries(prodStats).map(
    ([name, s]) => ({
      name,
      rate: (s.completed / s.total) * 100,
    })
  );

  // Bottlenecks
  const { data: stepsData } = await applyFilters(
    supabase
      .from("step_instances")
      .select("started_at, completed_at, steps(label)"),
    "step_instances"
  )
    .not("completed_at", "is", null)
    .not("started_at", "is", null);

  const stepDurations: Record<string, { totalHours: number; count: number }> =
    {};
  (stepsData || []).forEach((s: any) => {
    const label = s.steps?.label || "Étape Inconnue";
    const start = new Date(s.started_at);
    const end = new Date(s.completed_at);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (!stepDurations[label])
      stepDurations[label] = { totalHours: 0, count: 0 };
    stepDurations[label].totalHours += hours;
    stepDurations[label].count++;
  });

  const bottlenecks = Object.entries(stepDurations)
    .map(([name, s]) => ({ name, avg_hours: s.totalHours / s.count }))
    .sort((a, b) => b.avg_hours - a.avg_hours)
    .slice(0, 10);

  // 4. Agent Performance
  const { data: reviewsData } = await applyFilters(
    supabase
      .from("document_reviews")
      .select("reviewer_id, reviewed_at, agents(name)"),
    "document_reviews"
  );

  const agentStats: Record<string, { count: number; name: string }> = {};
  (reviewsData || []).forEach((r: any) => {
    const id = r.reviewer_id;
    if (!agentStats[id])
      agentStats[id] = { count: 0, name: r.agents?.name || "Agent Inconnu" };
    agentStats[id].count++;
  });

  const workloadDistribution = Object.values(agentStats).map((s) => ({
    agent_name: s.name,
    count: s.count,
  }));

  // Leaderboard
  const leaderboard = Object.values(agentStats)
    .map((s) => ({ agent_name: s.name, reviews: s.count, avg_time: 0 }))
    .sort((a, b) => b.reviews - a.reviews);

  // 5. Document Metrics
  const { count: totalReviews } = await applyFilters(
    supabase
      .from("document_reviews")
      .select("*", { count: "exact", head: true })
  );
  const { count: approvedReviews } = await applyFilters(
    supabase
      .from("document_reviews")
      .select("*", { count: "exact", head: true })
  ).eq("status", "APPROVED");

  const approvalRate = totalReviews
    ? ((approvedReviews || 0) / totalReviews) * 100
    : 0;

  const { data: rejections } = await applyFilters(
    supabase.from("document_reviews").select("reason")
  ).eq("status", "REJECTED");

  const rejectionCounts: Record<string, number> = {};
  (rejections || []).forEach((r: { reason: string | null }) => {
    if (r.reason)
      rejectionCounts[r.reason] = (rejectionCounts[r.reason] || 0) + 1;
  });

  const rejection_reasons = Object.entries(rejectionCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const finalMetrics: DashboardMetrics = {
    revenue: {
      total_revenue: totalRevenue,
      revenue_this_month: revenueThisMonth,
      avg_order_value: avgOrderValue,
      revenue_trend: revenueTrend,
      revenue_by_product: revenueByProduct,
    },
    conversion: {
      payment_link_conversion_rate: paymentLinkConversionRate,
      registration_to_payment_rate: registration_to_payment_rate,
      suspended_recovery_rate: 0,
      funnel_data: funnelData,
    },
    dossier: {
      total_dossiers: totalDossiers || 0,
      active_dossiers: activeDossiers || 0,
      completed_this_month: completedThisMonth || 0,
      avg_days_to_completion: avgDaysToCompletion,
      completion_rate_by_product,
      bottlenecks,
    },
    agent: {
      documents_reviewed: totalReviews || 0,
      avg_review_time_hours: 0,
      workload_distribution: workloadDistribution,
      leaderboard,
    },
    document: {
      approval_rate: approvalRate,
      rejection_reasons,
      avg_versions_per_document: 0,
    },
  };

  // If no data, return mock data for preview
  if (totalDossiers === 0 && totalRevenue === 0) {
    return getMockMetrics();
  }

  return finalMetrics;
}

function getMockMetrics(): DashboardMetrics {
  const now = new Date();
  const trend = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (29 - i));
    return {
      date: d.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 500) + 100,
    };
  });

  return {
    revenue: {
      total_revenue: 12540,
      revenue_this_month: 3200,
      avg_order_value: 850,
      revenue_trend: trend,
      revenue_by_product: [
        { name: "LLC Formation", revenue: 8500 },
        { name: "Compliance", revenue: 2540 },
        { name: "Banking", revenue: 1500 },
      ],
    },
    conversion: {
      payment_link_conversion_rate: 65.5,
      registration_to_payment_rate: 42.1,
      suspended_recovery_rate: 15.2,
      funnel_data: [
        { name: "Links Créés", value: 100 },
        { name: "Paiements", value: 65 },
        { name: "Inscriptions", value: 60 },
        { name: "Clients Actifs", value: 42 },
      ],
    },
    dossier: {
      total_dossiers: 154,
      active_dossiers: 42,
      completed_this_month: 12,
      avg_days_to_completion: 14.5,
      completion_rate_by_product: [
        { name: "LLC Formation", rate: 85 },
        { name: "Compliance", rate: 92 },
        { name: "Banking", rate: 78 },
      ],
      bottlenecks: [
        { name: "NM Pending", avg_hours: 72 },
        { name: "EIN Pending", avg_hours: 48 },
        { name: "Under Review", avg_hours: 24 },
      ],
    },
    agent: {
      documents_reviewed: 450,
      avg_review_time_hours: 2.4,
      workload_distribution: [
        { agent_name: "Jean Dupont", count: 45 },
        { agent_name: "Marie Curie", count: 38 },
        { agent_name: "Pierre Martin", count: 32 },
      ],
      leaderboard: [
        { agent_name: "Jean Dupont", reviews: 145, avg_time: 1.8 },
        { agent_name: "Marie Curie", reviews: 132, avg_time: 2.1 },
        { agent_name: "Pierre Martin", reviews: 98, avg_time: 2.5 },
      ],
    },
    document: {
      approval_rate: 78.4,
      rejection_reasons: [
        { reason: "Document illisible", count: 45 },
        { reason: "Signature manquante", count: 32 },
        { reason: "Mauvais format", count: 28 },
        { reason: "Date expirée", count: 15 },
      ],
      avg_versions_per_document: 1.4,
    },
  };
}
