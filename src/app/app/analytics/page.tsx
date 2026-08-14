import { Phone, Target, CheckCircle2, DollarSign } from "lucide-react";
import BarChart from "@/components/BarChart";
import StatCard from "@/components/StatCard";
import { analyticsSeries, computeStats, listAgentsWithMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [stats, agents, series] = await Promise.all([
    computeStats(),
    listAgentsWithMetrics(),
    analyticsSeries(7),
  ]);

  const callSeries = series.map((s) => ({ label: s.label, value: s.calls }));
  const convSeries = series.map((s) => ({ label: s.label, value: s.conversions }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-500">
          Calls, conversions, and cost across all your voice agents — live from your database.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Phone className="h-5 w-5" />} tint="bg-rose-100 text-rose-600" value={stats.callsToday.toLocaleString()} label="Calls today" delta={`${stats.callsDeltaPct >= 0 ? "+" : ""}${stats.callsDeltaPct}%`} deltaPositive={stats.callsDeltaPct >= 0} />
        <StatCard icon={<Target className="h-5 w-5" />} tint="bg-emerald-100 text-emerald-600" value={`${stats.conversionRate}%`} label="Conversion rate" delta={`${stats.conversionDeltaPct >= 0 ? "+" : ""}${stats.conversionDeltaPct}%`} deltaPositive={stats.conversionDeltaPct >= 0} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} tint="bg-brand-100 text-brand-700" value={stats.conversionsToday.toLocaleString()} label="Conversions today" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} tint="bg-amber-100 text-amber-600" value={`$${stats.avgCostPerCall.toFixed(2)}`} label="Avg. cost / call" delta={`${stats.costDeltaPct}%`} deltaPositive={stats.costDeltaPct <= 0} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Calls — last 7 days
          </h2>
          <BarChart data={callSeries} color="#7c3aed" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {series.map((s, i) => (
              <span key={i}>{s.label}</span>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Conversions — last 7 days
          </h2>
          <BarChart data={convSeries} color="#10b981" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {series.map((s, i) => (
              <span key={i}>{s.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
          Performance by agent
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                <th className="py-2 font-medium">Agent</th>
                <th className="py-2 font-medium">Direction</th>
                <th className="py-2 font-medium">Calls today</th>
                <th className="py-2 font-medium">Conversion</th>
                <th className="py-2 font-medium">Cost / call</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {agents.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">{a.name}</td>
                  <td className="py-3 capitalize text-slate-600 dark:text-slate-300">{a.direction}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{a.callsToday.toLocaleString()}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{a.conversionRate}%</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">${a.avgCostPerCall.toFixed(2)}</td>
                  <td className="py-3">
                    <span className={`pill capitalize ${a.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No agents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
