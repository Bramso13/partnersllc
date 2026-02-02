"use client";

import { useEffect, useState } from "react";
import { getDashboardMetrics } from "@/lib/analytics";
import { DashboardMetrics } from "@/types/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Funnel,
  FunnelChart,
  LabelList,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { DateRangeSelector } from "./DateRangeSelector";
import { RevenueMetrics } from "./RevenueMetrics";

const CHART_COLORS = ["#50b989", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

type TabId = "overview" | "revenue" | "conversion" | "team";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "fa-solid fa-chart-pie" },
  { id: "revenue", label: "Revenus", icon: "fa-solid fa-euro-sign" },
  {
    id: "conversion",
    label: "Conversion & dossiers",
    icon: "fa-solid fa-filter-circle-dollar",
  },
  { id: "team", label: "Équipe & qualité", icon: "fa-solid fa-users" },
];

export function AnalyticsDashboardContent() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    productId?: string;
    agentId?: string;
  }>({});
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardMetrics(filters);
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleRangeChange = (
    range: { startDate: string; endDate: string } | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      startDate: range?.startDate,
      endDate: range?.endDate,
    }));
  };

  const exportPDF = async () => {
    const element = document.getElementById("analytics-dashboard");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#191a1d",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`analytics-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-3 text-[#b7b7b7]">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#50b989]" />
          <span className="text-sm">Chargement des indicateurs…</span>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header fixe : période + actions */}
      <header className="sticky top-0 z-10 -mx-4 px-4 py-4 bg-[#191a1d]/95 backdrop-blur-sm border-b border-[#363636]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeSelector onRangeChange={handleRangeChange} />
            <span className="text-xs text-[#b7b7b7] flex items-center gap-1.5">
              <i className="fa-solid fa-clock text-[10px]" />
              Actualisé{" "}
              {lastRefresh.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchMetrics}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm font-medium hover:bg-[#363636]/50 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <i
                className={`fa-solid fa-arrows-rotate ${isLoading ? "fa-spin" : ""}`}
              />
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={exportPDF}
              className="px-4 py-2 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-file-pdf" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Onglets */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#252628] border border-[#363636] w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#2d3033] text-[#f9f9f9] shadow-sm"
                : "text-[#b7b7b7] hover:text-[#f9f9f9] hover:bg-[#2d3033]/50"
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu par onglet */}
      <div id="analytics-dashboard">
        {activeTab === "overview" && (
          <OverviewTab metrics={metrics} onGoToTab={setActiveTab} />
        )}
        {activeTab === "revenue" && <RevenueTab metrics={metrics} />}
        {activeTab === "conversion" && <ConversionTab metrics={metrics} />}
        {activeTab === "team" && <TeamTab metrics={metrics} />}
      </div>
    </div>
  );
}

function OverviewTab({
  metrics,
  onGoToTab,
}: {
  metrics: DashboardMetrics;
  onGoToTab: (tab: TabId) => void;
}) {
  return (
    <div className="space-y-6">
      <RevenueMetrics />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenu total"
          value={`${metrics.revenue.total_revenue.toLocaleString("fr-FR")} €`}
          sub={`Moy. commande : ${metrics.revenue.avg_order_value.toFixed(0)} €`}
          icon="fa-solid fa-chart-line"
          accent="text-[#50b989]"
        />
        <KpiCard
          title="Dossiers actifs"
          value={metrics.dossier.active_dossiers.toLocaleString("fr-FR")}
          sub={`${metrics.dossier.completed_this_month} terminés ce mois`}
          icon="fa-solid fa-folder-open"
          accent="text-emerald-400"
        />
        <KpiCard
          title="Taux de conversion"
          value={`${metrics.conversion.payment_link_conversion_rate.toFixed(1)} %`}
          sub="Liens → ventes"
          icon="fa-solid fa-percent"
          accent="text-amber-400"
        />
        <KpiCard
          title="Taux d’approbation"
          value={`${metrics.document.approval_rate.toFixed(1)} %`}
          sub="Validation 1ère soumission"
          icon="fa-solid fa-file-circle-check"
          accent="text-[#50b989]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tendance revenu (90 j)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={metrics.revenue.revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
              <XAxis
                dataKey="date"
                stroke="#b7b7b7"
                fontSize={11}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })
                }
              />
              <YAxis
                stroke="#b7b7b7"
                fontSize={11}
                tickFormatter={(v) => `${v} €`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#252628",
                  border: "1px solid #363636",
                  color: "#f9f9f9",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [
                  `${value != null ? value : 0} €`,
                  "Revenu",
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#50b989"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#50b989" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <button
            type="button"
            onClick={() => onGoToTab("revenue")}
            className="mt-2 text-xs text-[#50b989] hover:underline"
          >
            Voir détail revenus →
          </button>
        </ChartCard>

        <ChartCard title="Revenu par produit">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={metrics.revenue.revenue_by_product}
              layout="vertical"
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#363636"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                stroke="#b7b7b7"
                fontSize={11}
                tickFormatter={(v) => `${v} €`}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#b7b7b7"
                fontSize={11}
                width={90}
                tick={{ fill: "#b7b7b7" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#252628",
                  border: "1px solid #363636",
                  color: "#f9f9f9",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [
                  `${value != null ? value : 0} €`,
                  "Revenu",
                ]}
              />
              <Bar dataKey="revenue" fill="#50b989" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <button
            type="button"
            onClick={() => onGoToTab("revenue")}
            className="mt-2 text-xs text-[#50b989] hover:underline"
          >
            Voir détail revenus →
          </button>
        </ChartCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onGoToTab("conversion")}
          className="text-sm text-[#b7b7b7] hover:text-[#50b989] transition-colors flex items-center gap-1.5"
        >
          <i className="fa-solid fa-filter-circle-dollar" />
          Conversion & dossiers
        </button>
        <button
          type="button"
          onClick={() => onGoToTab("team")}
          className="text-sm text-[#b7b7b7] hover:text-[#50b989] transition-colors flex items-center gap-1.5"
        >
          <i className="fa-solid fa-users" />
          Équipe & qualité
        </button>
      </div>
    </div>
  );
}

function RevenueTab({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="space-y-6">
      <RevenueMetrics />

      <ChartCard title="Tendance du revenu">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={metrics.revenue.revenue_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
            <XAxis
              dataKey="date"
              stroke="#b7b7b7"
              fontSize={12}
              tickFormatter={(val) =>
                new Date(val).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              }
            />
            <YAxis
              stroke="#b7b7b7"
              fontSize={12}
              tickFormatter={(v) => `${v} €`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#252628",
                border: "1px solid #363636",
                color: "#f9f9f9",
                borderRadius: "8px",
              }}
              formatter={(value: number | undefined) => [
                `${value != null ? value : 0} €`,
                "Revenu",
              ]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#50b989"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8, fill: "#50b989" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenu par produit">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={metrics.revenue.revenue_by_product}
            layout="vertical"
            margin={{ left: 0, right: 24 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#363636"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              stroke="#b7b7b7"
              fontSize={12}
              tickFormatter={(v) => `${v} €`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#b7b7b7"
              fontSize={12}
              width={120}
              tick={{ fill: "#b7b7b7" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#252628",
                border: "1px solid #363636",
                color: "#f9f9f9",
                borderRadius: "8px",
              }}
              formatter={(value: number | undefined) => [
                `${value != null ? value : 0} €`,
                "Revenu",
              ]}
            />
            <Bar dataKey="revenue" fill="#50b989" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ConversionTab({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Tunnel de conversion">
          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#252628",
                  border: "1px solid #363636",
                  color: "#f9f9f9",
                  borderRadius: "8px",
                }}
              />
              <Funnel
                data={metrics.conversion.funnel_data}
                dataKey="value"
                nameKey="name"
              >
                <LabelList
                  position="right"
                  fill="#b7b7b7"
                  stroke="none"
                  dataKey="name"
                />
                {metrics.conversion.funnel_data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Taux de complétion par produit">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={metrics.dossier.completion_rate_by_product}
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#363636"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                stroke="#b7b7b7"
                fontSize={11}
                unit=" %"
                domain={[0, 100]}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#b7b7b7"
                fontSize={11}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#252628",
                  border: "1px solid #363636",
                  color: "#f9f9f9",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [
                  `${value != null ? value.toFixed(1) : 0} %`,
                  "Complétion",
                ]}
              />
              <Bar dataKey="rate" fill="#4ade80" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Durée moyenne par étape (h)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={metrics.dossier.bottlenecks}
              margin={{ bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
              <XAxis
                dataKey="name"
                stroke="#b7b7b7"
                fontSize={10}
                angle={-35}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="#b7b7b7" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#252628",
                  border: "1px solid #363636",
                  color: "#f9f9f9",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [
                  `${value != null ? value.toFixed(1) : 0} h`,
                  "Durée moy.",
                ]}
              />
              <Bar dataKey="avg_hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function TeamTab({ metrics }: { metrics: DashboardMetrics }) {
  const maxReviews = Math.max(
    ...metrics.agent.leaderboard.map((a) => a.reviews),
    1
  );
  const totalReviewed = metrics.agent.documents_reviewed || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#363636]">
          <h3 className="text-base font-semibold text-[#f9f9f9]">
            Classement agents
          </h3>
          <p className="text-xs text-[#b7b7b7] mt-0.5">Documents revus</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-medium uppercase tracking-wider text-[#b7b7b7] border-b border-[#363636]">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3 w-24">Revus</th>
                <th className="px-4 py-3 w-28">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363636]">
              {metrics.agent.leaderboard.map((agent, i) => (
                <tr key={i} className="hover:bg-[#1e1f22]/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-2">
                    {i === 0 && (
                      <i className="fa-solid fa-trophy text-amber-400 text-sm" />
                    )}
                    {i === 1 && (
                      <i className="fa-solid fa-medal text-[#b7b7b7] text-sm" />
                    )}
                    {i === 2 && (
                      <i className="fa-solid fa-award text-amber-600 text-sm" />
                    )}
                    {i > 2 && (
                      <span className="w-5 text-center text-xs text-[#b7b7b7]">
                        {i + 1}
                      </span>
                    )}
                    <span className="font-medium text-[#f9f9f9]">
                      {agent.agent_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#f9f9f9]">{agent.reviews}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1e1f22] overflow-hidden max-w-[80px]">
                        <div
                          className="h-full bg-[#50b989] rounded-full transition-all"
                          style={{
                            width: `${(agent.reviews / maxReviews) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#50b989] w-8">
                        {((agent.reviews / maxReviews) * 100).toFixed(0)} %
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {metrics.agent.leaderboard.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-[#b7b7b7]"
                  >
                    Aucune donnée agent
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#363636]">
          <h3 className="text-base font-semibold text-[#f9f9f9]">
            Principales raisons de rejet
          </h3>
          <p className="text-xs text-[#b7b7b7] mt-0.5">Documents</p>
        </div>
        <div className="p-4 space-y-4">
          {metrics.document.rejection_reasons.slice(0, 5).map((r, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[#f9f9f9] truncate pr-2">
                  {r.reason}
                </span>
                <span className="text-[#b7b7b7] shrink-0">
                  {r.count} rejets
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#1e1f22] overflow-hidden">
                <div
                  className="h-full bg-red-500/80 rounded-full transition-all"
                  style={{
                    width: `${Math.min((r.count / totalReviewed) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {metrics.document.rejection_reasons.length === 0 && (
            <div className="py-12 text-center text-sm text-[#b7b7b7]">
              <i className="fa-solid fa-circle-check text-2xl text-emerald-500/50 mb-3 block" />
              Aucun rejet enregistré sur la période
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[#b7b7b7]">
          {title}
        </span>
        <span className={`text-lg ${accent}`}>
          <i className={icon} />
        </span>
      </div>
      <p className="text-2xl font-semibold text-[#f9f9f9]">{value}</p>
      {sub && <p className="text-[10px] text-[#b7b7b7] mt-1.5">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#252628] border border-[#363636] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636]">
        <h3 className="text-base font-semibold text-[#f9f9f9]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
