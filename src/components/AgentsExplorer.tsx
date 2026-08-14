"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentWithMetrics, Call, Direction } from "@/lib/types";
import { getIntegration, INTEGRATION_KIND_LABEL } from "@/lib/integrations";
import { formatDelay, RescheduleIntent } from "@/lib/intent";
import VoiceTester from "@/components/VoiceTester";
import { DirectionIcon } from "@/components/icons";
import { Phone, Play, Pause, Trash2, Brain, Check, Circle } from "lucide-react";

const STATUS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  draft: "bg-slate-100 text-slate-500",
};

export default function AgentsExplorer({
  agents: initialAgents,
  initialFocus,
}: {
  agents: AgentWithMetrics[];
  initialFocus?: string;
}) {
  const [agents, setAgents] = useState<AgentWithMetrics[]>(initialAgents);
  const [filter, setFilter] = useState<"all" | Direction>("all");
  const [selectedId, setSelectedId] = useState<string>(
    initialFocus && initialAgents.some((a) => a.id === initialFocus)
      ? initialFocus
      : initialAgents[0]?.id ?? ""
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/agents", { cache: "no-store" });
    const data = await res.json();
    setAgents(data.agents as AgentWithMetrics[]);
  }, []);

  const filtered = useMemo(
    () => agents.filter((a) => filter === "all" || a.direction === filter),
    [agents, filter]
  );
  const selected = agents.find((a) => a.id === selectedId) ?? filtered[0];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
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
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  a.direction === "outbound"
                    ? "bg-brand-100 text-brand-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <DirectionIcon direction={a.direction} />
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
      {selected && (
        <AgentDetail
          key={selected.id}
          agent={selected}
          onChanged={refresh}
          onDeleted={async () => {
            await refresh();
            setSelectedId("");
          }}
        />
      )}
    </div>
  );
}

function AgentDetail({
  agent,
  onChanged,
  onDeleted,
}: {
  agent: AgentWithMetrics;
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const loadCalls = useCallback(async () => {
    const res = await fetch(`/api/calls?agentId=${agent.id}&limit=8`, { cache: "no-store" });
    const data = await res.json();
    setCalls(data.calls as Call[]);
  }, [agent.id]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function setStatus(status: "active" | "paused") {
    setBusy(status);
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await onChanged();
    setBusy(null);
  }

  async function remove() {
    if (!confirm(`Delete "${agent.name}"? This removes its call history too.`)) return;
    setBusy("delete");
    await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    await onDeleted();
  }

  async function placeCall(count: number) {
    setBusy(count > 1 ? "campaign" : "call");
    const res = await fetch(`/api/agents/${agent.id}/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    const converted = (data.calls as Call[]).filter((c) => c.outcome === "converted").length;
    flash(
      count > 1
        ? `Ran ${data.count} calls — ${converted} converted.`
        : `Call complete — outcome: ${(data.calls as Call[])[0]?.outcome}.`
    );
    await Promise.all([onChanged(), loadCalls()]);
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10">
          {toast}
        </div>
      )}

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{agent.name}</h2>
            <p className="text-sm text-slate-500">
              {agent.templateName} · {agent.voice} · {agent.language}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`pill ${STATUS[agent.status]}`}>{agent.status}</span>
            <span className="pill bg-slate-100 text-slate-600">{agent.phoneNumber}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn-primary"
            disabled={busy !== null}
            onClick={() => placeCall(1)}
          >
            {busy === "call" ? (
              "Calling…"
            ) : (
              <>
                <Phone className="h-4 w-4" /> Place test call
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            disabled={busy !== null}
            onClick={() => placeCall(10)}
          >
            {busy === "campaign" ? (
              "Running…"
            ) : (
              <>
                <Play className="h-4 w-4" /> Run 10-call campaign
              </>
            )}
          </button>
          {agent.status === "active" ? (
            <button
              className="btn-secondary"
              disabled={busy !== null}
              onClick={() => setStatus("paused")}
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          ) : (
            <button
              className="btn-secondary"
              disabled={busy !== null}
              onClick={() => setStatus("active")}
            >
              <Play className="h-4 w-4" /> Activate
            </button>
          )}
          <button
            className="btn-secondary text-rose-600"
            disabled={busy !== null}
            onClick={remove}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
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

      {/* Live in-browser voice test */}
      <VoiceTester
        agent={{
          id: agent.id,
          name: agent.name,
          greeting: agent.greeting,
          voice: agent.voice,
          objective: agent.objective,
        }}
        onEnded={async () => {
          await Promise.all([onChanged(), loadCalls()]);
        }}
      />

      {/* Recent calls (live from the database) */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent calls</h3>
          <button onClick={loadCalls} className="text-xs font-semibold text-brand-600 hover:underline">
            Refresh
          </button>
        </div>
        {calls.length === 0 ? (
          <p className="text-sm text-slate-500">
            No calls yet — hit “Place test call” to generate one.
          </p>
        ) : (
          <div className="space-y-1.5">
            {calls.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <span className={`pill ${outcomeTint(c.outcome)}`}>
                  {c.outcome.replace(/_/g, " ")}
                </span>
                <span className="text-slate-500">{c.toNumber}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {c.status === "in_progress" ? "live" : `$${c.cost.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules & integrations */}
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Campaign rules</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

      {/* Intelligent rescheduling demo (server-side intent detection) */}
      <IntentDemo agentId={agent.id} rescheduleMinutes={agent.rules.rescheduleMinutes} />
    </div>
  );
}

function IntentDemo({
  agentId,
  rescheduleMinutes,
}: {
  agentId: string;
  rescheduleMinutes: number;
}) {
  const examples = [
    "I'm busy, call me after 30 minutes",
    "Try again in 2 hours",
    "Not interested, stop calling",
    "Yes, that works for me",
    "Can you call me back tomorrow?",
  ];
  const [text, setText] = useState(examples[0]);
  const [result, setResult] = useState<(RescheduleIntent & { source?: string }) | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(input: string) {
    setText(input);
    setLoading(true);
    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: input, agentId }),
      });
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <Brain className="h-4 w-4 text-brand-600" /> Intelligent call rescheduling — try it
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
        <button className="btn-primary shrink-0" disabled={loading} onClick={() => run(text)}>
          {loading ? "…" : "Detect"}
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
            <div className="text-xs uppercase text-slate-400">
              Action {result.source ? `· via ${result.source === "llm" ? "Claude" : "built-in parser"}` : ""}
            </div>
            <div className="text-slate-700 dark:text-slate-200">{result.reason}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function outcomeTint(outcome: string): string {
  switch (outcome) {
    case "converted":
      return "bg-emerald-50 text-emerald-600";
    case "rescheduled":
      return "bg-brand-50 text-brand-700";
    case "not_interested":
      return "bg-rose-50 text-rose-600";
    case "in_progress":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
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
      {ok ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-slate-300" />
      )}
      {label}
    </div>
  );
}
