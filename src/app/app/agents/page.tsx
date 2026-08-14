import Link from "next/link";
import AgentsExplorer from "@/components/AgentsExplorer";
import { listAgentsWithMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;
  const agents = listAgentsWithMetrics();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Agents
          </h1>
          <p className="text-sm text-slate-500">
            {agents.length} agent{agents.length === 1 ? "" : "s"} · manage, inspect, and test.
          </p>
        </div>
        <Link href="/app/create" className="btn-primary">
          ＋ New agent
        </Link>
      </div>

      <AgentsExplorer agents={agents} initialFocus={focus} />
    </div>
  );
}
