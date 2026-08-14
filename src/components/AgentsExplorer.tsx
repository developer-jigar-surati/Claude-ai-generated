"use client";

import { useMemo, useState } from "react";
import { Agent, Direction } from "@/lib/types";
import { getIntegration, INTEGRATION_KIND_LABEL } from "@/lib/integrations";
import { detectIntent, formatDelay, RescheduleIntent } from "@/lib/intent";

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  draft: "bg-slate-100 text-slate-500",
};

export default function AgentsExplorer({
  agents,
  initialFocus,
}: {
  agents: Agent[];
  initialFocus?: string;
}) {
  const [filter, setFilter] = useState<"all" | Direction>("all");
  const [selectedId, setSelectedId] = useState<string>(
    initialFocus && agents.some((a) => a.id === initialFocus)
      ? initialFocus
      : agents[0]?.id ?? ""
  );

  const filtered = useMemo(
    () => agents.filter((a) => filter === "all" || a.direction === filter),
    [agents, filter]
  );
  const selected = agents.find((a) => a.id === selectedId) ?? filtered[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* List */}
      <div className="space-y-3">
        <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
          {(["all", "outbound", "inbound"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`card flex w-full items-center gap-3 p-3 text-left transition ${
                selected?.id === a.id ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${
                  a.direction === "outbound"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {a.direction === "outbound" ? "📤" : "📥"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {a.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {a.direction} · {a.callsToday} calls today
                </div>
              </div>
              <span className={`pill ${STATUS[a.status]}`}>{a.status}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500">No agents for this filter.</p>
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && <AgentDetail agent={selected} />}
    </div>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{agent.name}</h2>
            <p className="text-sm text-slate-500">
              {agent.templateName} · {agent.voice} · {agent.language}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`pill ${STATUS[agent.status]}`}>{agent.status}</span>
            <span className="pill bg-slate-100 text-slate-600">{agent.phoneNumber}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Calls today" value={agent.callsToday.toLocaleString()} />
          <Metric label="Conversion" value={`${agent.conversionRate}%`} />
          <Metric label="Cost / call" value={`$${agent.avgCostPerCall.toFixed(2)}`} />
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Opening line
          </div>
          <p className="mt-1 text-slate-700 dark:text-slate-200">“{agent.greeting}”</p>
          <div className="mt-2 text-xs text-slate-500">Objective: {agent.objective}</div>
        </div>
      </div>

      {/* Rules */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
          Campaign rules
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Rule
            ok={agent.rules.businessHoursOnly}
            label={
              agent.rules.businessHoursOnly
                ? `Business hours ${agent.rules.businessHoursStart}–${agent.rules.businessHoursEnd}`
                : "Calls any time"
            }
          />
          <Rule ok={agent.rules.respectCustomerTimezone} label="Respect customer timezone" />
          <Rule ok label={`Reminders ${agent.rules.reminderHoursBefore}h before`} />
          <Rule ok label={`Feedback ${agent.rules.feedbackHoursAfter}h after`} />
          <Rule ok label={`Reschedule window ${agent.rules.rescheduleMinutes} min`} />
          <Rule ok label={`Up to ${agent.rules.maxRetries} retries`} />
        </div>

        <h3 className="mb-2 mt-5 text-sm font-bold text-slate-900 dark:text-white">
          Integrations
        </h3>
        <div className="flex flex-wrap gap-2">
          {agent.integrations.length === 0 && (
            <span className="text-sm text-slate-400">None connected</span>
          )}
          {agent.integrations.map((id) => {
            const it = getIntegration(id);
            return (
              <span key={id} className="pill bg-brand-50 text-brand-700">
                {it ? `${it.name} · ${INTEGRATION_KIND_LABEL[it.kind]}` : id}
              </span>
            );
          })}
        </div>
      </div>

      {/* Intelligent rescheduling demo */}
      <IntentDemo rescheduleMinutes={agent.rules.rescheduleMinutes} />
    </div>
  );
}

function IntentDemo({ rescheduleMinutes }: { rescheduleMinutes: number }) {
  const examples = [
    "I'm busy, call me after 30 minutes",
    "Try again in 2 hours",
    "Not interested, stop calling",
    "Yes, that works for me",
    "Can you call me back tomorrow?",
  ];
  const [text, setText] = useState(examples[0]);
  const [result, setResult] = useState<RescheduleIntent | null>(null);

  function run(input: string) {
    setText(input);
    const r = detectIntent(input);
    // For unspecified callbacks, apply the agent's default reschedule window.
    if (r.intent === "callback_unspecified") r.delayMinutes = rescheduleMinutes;
    setResult(r);
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        🧠 Intelligent call rescheduling — try it
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Type what a customer might say. The agent detects intent and reschedules automatically.
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((e) => (
          <button
            key={e}
            onClick={() => run(e)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did the customer say?"
        />
        <button className="btn-primary shrink-0" onClick={() => run(text)}>
          Detect
        </button>
      </div>
      {result && (
        <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-slate-400">Intent</div>
            <div className="font-semibold capitalize text-slate-900 dark:text-white">
              {result.intent.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Next call in</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {formatDelay(result.delayMinutes)}
            </div>
          </div>
          <div className="sm:col-span-3">
            <div className="text-xs uppercase text-slate-400">Action</div>
            <div className="text-slate-700 dark:text-slate-200">{result.reason}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-white/10">
      <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
      <span className={ok ? "text-emerald-500" : "text-slate-300"}>{ok ? "✓" : "○"}</span>
      {label}
    </div>
  );
}
