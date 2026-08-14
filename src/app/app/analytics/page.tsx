import BarChart from "@/components/BarChart";
import StatCard from "@/components/StatCard";
import { computeStats, listAgents } from "@/lib/store";

export const dynamic = "force-dynamic";

// Deterministic 7-day series derived from current totals (demo data).
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHAPE = [0.72, 0.85, 0.63, 0.95, 1, 0.48, 0.4];

export default function AnalyticsPage() {
  const stats = computeStats();
  const agents = listAgents();

  const callSeries = DAYS.map((label, i) => ({
    label,
    value: Math.round(stats.callsToday * SHAPE[i]),
  }));
  const convSeries = DAYS.map((label, i) => ({
    label,
    value: Math.round(stats.conversionsToday * SHAPE[i] * 6),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-500">
          Calls, conversions, and cost across all your voice agents.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="📞" tint="bg-rose-100 text-rose-600" value={stats.callsToday.toLocaleString()} label="Calls today" delta={`+${stats.callsDeltaPct}%`} />
        <StatCard icon="🎯" tint="bg-emerald-100 text-emerald-600" value={`${stats.conversionRate}%`} label="Conversion rate" delta={`+${stats.conversionDeltaPct}%`} />
        <StatCard icon="⏱️" tint="bg-brand-100 text-brand-700" value="3m 41s" label="Avg. call duration" delta="+6.2%" deltaPositive={false} />
        <StatCard icon="💲" tint="bg-amber-100 text-amber-600" value={`$${stats.avgCostPerCall.toFixed(2)}`} label="Avg. cost / call" delta={`${stats.costDeltaPct}%`} deltaPositive={false} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Calls — last 7 days
          </h2>
          <BarChart data={callSeries} color="#7c3aed" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Conversions — last 7 days
          </h2>
          <BarChart data={convSeries} color="#10b981" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
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
                <th className="py-2 font-medium">Calls</th>
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
                    <span className="pill bg-emerald-50 text-emerald-600 capitalize">{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
