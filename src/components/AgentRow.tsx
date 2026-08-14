import Link from "next/link";
import { Agent } from "@/lib/types";

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  draft: "bg-slate-100 text-slate-500",
};

export default function AgentRow({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/app/agents?focus=${agent.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${
          agent.direction === "outbound"
            ? "bg-brand-100 text-brand-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {agent.direction === "outbound" ? "📤" : "📥"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {agent.name}
        </div>
        <div className="truncate text-xs text-slate-500">
          {agent.direction === "outbound" ? "Outbound" : "Inbound"} ·{" "}
          {agent.templateName}
        </div>
      </div>
      <span className={`pill ${STATUS[agent.status]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {agent.status[0].toUpperCase() + agent.status.slice(1)}
      </span>
    </Link>
  );
}
