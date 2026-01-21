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
  PieChart,
  Pie,
  Cell,
  Legend,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  ChevronRight,
  Medal,
  Activity,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { DateRangeSelector } from "./DateRangeSelector";
import { RevenueMetrics } from "./RevenueMetrics";

const COLORS = ["#00F0FF", "#4ADE80", "#FACC15", "#F95757", "#8B5CF6"];

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

    // Auto-refresh every 5 minutes
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

  const handleProductClick = (data: any) => {
    // Basic drill-down: alert the user for now as we don't have product IDs in the chart data yet
    // In a real app, we would update filters.productId and re-fetch
    console.log("Drill down by product:", data.name);
  };

  const exportPDF = async () => {
    const element = document.getElementById("analytics-dashboard");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#191A1D",
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
      pdf.save(
        `partners-llc-analytics-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div id="analytics-dashboard" className="space-y-8 pb-12">
      {/* Revenue Metrics Section */}
      <RevenueMetrics />

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <DateRangeSelector onRangeChange={handleRangeChange} />
          <div className="flex items-center gap-2 text-brand-text-secondary text-sm">
            <Clock className="w-4 h-4" />
            Actualisé : {lastRefresh.toLocaleTimeString("fr-FR")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-dark-surface border border-brand-dark-border rounded-md text-brand-text-primary hover:bg-brand-dark-border transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Rafraîchir
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-dark-bg font-bold rounded-md hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Revenu Total"
          value={`${metrics.revenue.total_revenue.toLocaleString("fr-FR")} €`}
          icon={<TrendingUp className="w-6 h-6 text-brand-accent" />}
          description={`Moyenne par commande : ${metrics.revenue.avg_order_value.toFixed(0)} €`}
        />
        <MetricCard
          title="Dossiers Actifs"
          value={metrics.dossier.active_dossiers.toLocaleString("fr-FR")}
          icon={<Activity className="w-6 h-6 text-brand-success" />}
          description={`${metrics.dossier.completed_this_month} terminés ce mois`}
        />
        <MetricCard
          title="Taux de Conversion"
          value={`${metrics.conversion.payment_link_conversion_rate.toFixed(1)}%`}
          icon={<CheckCircle className="w-6 h-6 text-brand-warning" />}
          description="Liens de paiement -> Ventes"
        />
        <MetricCard
          title="Taux d'Approbation"
          value={`${metrics.document.approval_rate.toFixed(1)}%`}
          icon={<FileText className="w-6 h-6 text-brand-accent" />}
          description="Validation dès la 1ère soumission"
        />
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Tendance du Revenu (90 jours)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.revenue.revenue_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
              <XAxis
                dataKey="date"
                stroke="#B7B7B7"
                fontSize={12}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })
                }
              />
              <YAxis stroke="#B7B7B7" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2D3033",
                  border: "1px solid #363636",
                  color: "#F9F9F9",
                }}
                itemStyle={{ color: "#00F0FF" }}
                formatter={(value: any) => [`${value} €`, "Revenu"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00F0FF"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenu par Produit">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.revenue.revenue_by_product}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="revenue"
                label={({ name, percent }) =>
                  `${name} ${(typeof percent === "number" ? percent * 100 : 0).toFixed(0)}%`
                }
                onClick={handleProductClick}
                className="cursor-pointer"
              >
                {metrics.revenue.revenue_by_product.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2D3033",
                  border: "1px solid #363636",
                  color: "#F9F9F9",
                }}
                formatter={(value: any) => [`${value} €`, "Revenu"]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Conversion & Dossier Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ChartCard title="Tunnel de Conversion">
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2D3033",
                  border: "1px solid #363636",
                  color: "#F9F9F9",
                }}
              />
              <Funnel
                data={metrics.conversion.funnel_data}
                dataKey="value"
                nameKey="name"
              >
                <LabelList
                  position="right"
                  fill="#B7B7B7"
                  stroke="none"
                  dataKey="name"
                />
                {metrics.conversion.funnel_data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Taux de Complétion par Produit">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={metrics.dossier.completion_rate_by_product}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#363636"
                horizontal={true}
                vertical={false}
              />
              <XAxis type="number" stroke="#B7B7B7" fontSize={12} unit="%" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#B7B7B7"
                fontSize={12}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2D3033",
                  border: "1px solid #363636",
                  color: "#F9F9F9",
                }}
                formatter={(value: any) => [
                  `${value.toFixed(1)}%`,
                  "Complétion",
                ]}
              />
              <Bar dataKey="rate" fill="#4ADE80" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance des Étapes (Heures moy.)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.dossier.bottlenecks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363636" />
              <XAxis
                dataKey="name"
                stroke="#B7B7B7"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#B7B7B7" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2D3033",
                  border: "1px solid #363636",
                  color: "#F9F9F9",
                }}
                formatter={(value: any) => [
                  `${value.toFixed(1)}h`,
                  "Durée Moyenne",
                ]}
              />
              <Bar dataKey="avg_hours" fill="#FACC15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Agent & Document Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Leaderboard Agents">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-brand-text-secondary text-sm border-b border-brand-dark-border">
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Documents Revus</th>
                  <th className="pb-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark-border">
                {metrics.agent.leaderboard.map((agent, i) => (
                  <tr
                    key={i}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 flex items-center gap-3">
                      {i === 0 && (
                        <Medal className="w-4 h-4 text-brand-warning" />
                      )}
                      {i === 1 && (
                        <Medal className="w-4 h-4 text-brand-text-secondary" />
                      )}
                      {i === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                      {i > 2 && (
                        <span className="w-4 text-center text-brand-text-secondary text-xs">
                          {i + 1}
                        </span>
                      )}
                      <span className="text-brand-text-primary font-medium">
                        {agent.agent_name}
                      </span>
                    </td>
                    <td className="py-4 text-brand-text-primary">
                      {agent.reviews}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-brand-dark-bg h-1.5 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="bg-brand-accent h-full"
                            style={{
                              width: `${(agent.reviews / metrics.agent.leaderboard[0].reviews) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-brand-accent text-xs font-bold">
                          {(
                            (agent.reviews /
                              metrics.agent.leaderboard[0].reviews) *
                            100
                          ).toFixed(0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {metrics.agent.leaderboard.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-brand-text-secondary text-sm"
                    >
                      Aucune donnée d'agent disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Principales Raisons de Rejet">
          <div className="space-y-5">
            {metrics.document.rejection_reasons.slice(0, 5).map((r, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-primary font-medium">
                    {r.reason}
                  </span>
                  <span className="text-brand-text-secondary">
                    {r.count} rejets
                  </span>
                </div>
                <div className="w-full bg-brand-dark-bg h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-danger h-full"
                    style={{
                      width: `${(r.count / metrics.agent.documents_reviewed) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {metrics.document.rejection_reasons.length === 0 && (
              <div className="text-center py-12 text-brand-text-secondary">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>Aucun rejet enregistré pour cette période</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  description?: string;
}) {
  return (
    <div className="bg-brand-dark-surface border border-brand-dark-border p-6 rounded-xl hover:border-brand-accent/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-brand-dark-bg rounded-lg border border-brand-dark-border">
          {icon}
        </div>
        {trend && (
          <span className="text-brand-success text-sm font-bold bg-brand-success/10 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-brand-text-secondary text-sm font-medium mb-1">
          {title}
        </h3>
        <p className="text-3xl font-bold text-brand-text-primary mb-1">
          {value}
        </p>
        {description && (
          <p className="text-brand-text-secondary text-xs">{description}</p>
        )}
      </div>
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
    <div className="bg-brand-dark-surface border border-brand-dark-border p-6 rounded-xl">
      <h3 className="text-brand-text-primary font-bold mb-6 text-lg">
        {title}
      </h3>
      {children}
    </div>
  );
}
