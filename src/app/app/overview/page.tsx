import Link from "next/link";
import {
  Sparkles,
  Plus,
  Phone,
  Bot,
  Target,
  DollarSign,
  PhoneOutgoing,
  PhoneIncoming,
  BarChart3,
  KeyRound,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import LiveMonitor from "@/components/LiveMonitor";
import AgentRow from "@/components/AgentRow";
import ConnectionStatus from "@/components/ConnectionStatus";
import { computeStats, listAgents } from "@/lib/store";

export const dynamic = "force-dynamic";
// First page load seeds the database — allow extra time on serverless hosts.
export const maxDuration = 60;

export default async function OverviewPage() {
  const [stats, agents] = await Promise.all([computeStats(), listAgents()]);

  return (
    <div className="space-y-6">
      <ConnectionStatus />

      {/* Hero + Live monitor */}
      <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <span className="pill bg-white/15 text-white">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back, Priya
          </span>
          <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
            Deploy your next voice agent in minutes
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80">
            Choose inbound or outbound, connect your knowledge, and launch —
            everything is tracked in one dashboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/app/create" className="btn-primary">
              <Plus className="h-4 w-4" /> Create new agent
            </Link>
            <Link href="/app/agents" className="btn-ghost">
              <Phone className="h-4 w-4" /> View my agents
            </Link>
          </div>
        </div>

        <LiveMonitor
          liveCalls={stats.liveCallsNow}
          agentsLive={stats.agentsLive}
          conversions={stats.conversionsToday}
        />
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Bot className="h-5 w-5" />}
          tint="bg-brand-100 text-brand-700"
          value={String(stats.activeAgents)}
          label="Active agents"
          delta={`+${stats.activeAgentsDeltaWeek} this week`}
          deltaPositive
        />
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          tint="bg-rose-100 text-rose-600"
          value={stats.callsToday.toLocaleString()}
          label="Calls today"
          delta={`${stats.callsDeltaPct >= 0 ? "+" : ""}${stats.callsDeltaPct}%`}
          deltaPositive={stats.callsDeltaPct >= 0}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          tint="bg-emerald-100 text-emerald-600"
          value={`${stats.conversionRate}%`}
          label="Conversion rate"
          delta={`${stats.conversionDeltaPct >= 0 ? "+" : ""}${stats.conversionDeltaPct}%`}
          deltaPositive={stats.conversionDeltaPct >= 0}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          tint="bg-amber-100 text-amber-600"
          value={`$${stats.avgCostPerCall.toFixed(2)}`}
          label="Avg. cost / call"
          delta={`${stats.costDeltaPct >= 0 ? "+" : ""}${stats.costDeltaPct}%`}
          deltaPositive={stats.costDeltaPct <= 0}
        />
      </section>

      {/* Recent agents + Quick actions */}
      <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="card p-4">
          <div className="mb-1 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent agents
            </h2>
            <Link
              href="/app/agents"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {agents.slice(0, 6).map((a) => (
              <AgentRow key={a.id} agent={a} />
            ))}
            {agents.length === 0 && (
              <p className="px-2 py-6 text-sm text-slate-400">No agents yet.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Quick Actions
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Deploy new agents or access developer keys instantly
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/app/create?direction=outbound"
              icon={<PhoneOutgoing className="h-5 w-5" />}
              title="New Outbound"
              subtitle="Dial leads & lists"
            />
            <QuickAction
              href="/app/create?direction=inbound"
              icon={<PhoneIncoming className="h-5 w-5" />}
              title="New Inbound"
              subtitle="24/7 support line"
            />
            <QuickAction
              href="/app/analytics"
              icon={<BarChart3 className="h-5 w-5" />}
              title="View Analytics"
              subtitle="Calls & conversions"
            />
            <QuickAction
              href="/app/sdk"
              icon={<KeyRound className="h-5 w-5" />}
              title="Developer Keys"
              subtitle="SDK & REST API"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:hover:bg-white/5"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
        {icon}
      </span>
      <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </Link>
  );
}
