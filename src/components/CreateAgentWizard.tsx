"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INBOUND_TEMPLATES, OUTBOUND_TEMPLATES, defaultRulesFor, getTemplate } from "@/lib/templates";
import { INTEGRATIONS, INTEGRATION_KIND_LABEL } from "@/lib/integrations";
import { CampaignRules, Direction } from "@/lib/types";
import TemplateCard from "@/components/TemplateCard";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Rocket } from "lucide-react";

const VOICES = ["Aria (Female, US)", "Leo (Male, US)", "Maya (Female, IN)", "Kabir (Male, IN)", "Sofia (Female, UK)"];
const LANGUAGES = ["English (US)", "English (UK)", "English (IN)", "Hindi", "Spanish", "German"];

const STEPS = ["Template", "Configure", "Rules & Integrations", "Review"];

export default function CreateAgentWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const initialDir = (params.get("direction") as Direction) || "outbound";

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<Direction>(initialDir);
  const [templateId, setTemplateId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const templates = direction === "outbound" ? OUTBOUND_TEMPLATES : INBOUND_TEMPLATES;
  const template = getTemplate(templateId);

  const [name, setName] = useState("");
  const [voice, setVoice] = useState(VOICES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [phoneNumber, setPhoneNumber] = useState("+1 (415) 555-0100");
  const [greeting, setGreeting] = useState("");
  const [objective, setObjective] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [rules, setRules] = useState<CampaignRules>(defaultRulesFor(""));
  const [integrations, setIntegrations] = useState<string[]>(["twilio"]);

  function chooseTemplate(id: string) {
    setTemplateId(id);
    const t = getTemplate(id);
    if (t) {
      setName(t.name);
      setGreeting(t.greeting);
      setObjective(t.objective);
      setRules(defaultRulesFor(id));
    }
  }

  function toggleIntegration(id: string) {
    setIntegrations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const canNext = useMemo(() => {
    if (step === 0) return !!templateId;
    if (step === 1) return name.trim().length > 1;
    return true;
  }, [step, templateId, name]);

  async function launch() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          direction,
          templateId,
          voice,
          language,
          phoneNumber,
          greeting,
          objective,
          knowledgeBase,
          rules,
          integrations,
        }),
      });
      const data = await res.json();
      setCreatedId(data.agent?.id ?? "created");
    } catch {
      setCreatedId("created");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          {name} is live
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Your {direction} agent was deployed and is now handling calls on{" "}
          {phoneNumber}. Everything is tracked in your dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-primary" onClick={() => router.push("/app/agents")}>
            View my agents
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setCreatedId(null);
              setStep(0);
              setTemplateId("");
              setName("");
            }}
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                i <= step
                  ? "bg-brand-600 text-white"
                  : "bg-slate-200 text-slate-500 dark:bg-white/10"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={i <= step ? "text-slate-900 dark:text-white" : "text-slate-400"}>
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 text-slate-300">—</span>}
          </li>
        ))}
      </ol>

      {/* Step 0: template */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Choose a predefined {direction} agent template
            </h2>
            <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
              {(["outbound", "inbound"] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDirection(d);
                    setTemplateId("");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    direction === d
                      ? "bg-brand-600 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={templateId === t.id}
                onSelect={() => chooseTemplate(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1: configure identity */}
      {step === 1 && template && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agent identity</h3>
            <div>
              <label className="label">Agent name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Voice</label>
                <select className="input" value={voice} onChange={(e) => setVoice(e.target.value)}>
                  {VOICES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select
                  className="input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Phone number</label>
              <input
                className="input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Conversation</h3>
            <div>
              <label className="label">Opening line</label>
              <textarea
                className="input min-h-[70px]"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Objective</label>
              <input
                className="input"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Knowledge base</label>
              <textarea
                className="input min-h-[70px]"
                placeholder="Paste URLs, docs, FAQs, or policies the agent should know…"
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
              />
            </div>
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-700 dark:bg-brand-600/10 dark:text-brand-200">
              This agent will collect: {template.collects.join(", ")}.
            </div>
          </div>
        </div>
      )}

      {/* Step 2: rules + integrations */}
      {step === 2 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card space-y-4 p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rule-based campaign scheduling
              </h3>
              <p className="text-xs text-slate-500">Configure everything without writing code.</p>
            </div>

            <RuleSwitch
              label="Call only during business hours"
              checked={rules.businessHoursOnly}
              onChange={(v) => setRules({ ...rules, businessHoursOnly: v })}
            />
            {rules.businessHoursOnly && (
              <div className="grid grid-cols-2 gap-3 pl-1">
                <div>
                  <label className="label">Start</label>
                  <input
                    type="time"
                    className="input"
                    value={rules.businessHoursStart}
                    onChange={(e) => setRules({ ...rules, businessHoursStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End</label>
                  <input
                    type="time"
                    className="input"
                    value={rules.businessHoursEnd}
                    onChange={(e) => setRules({ ...rules, businessHoursEnd: e.target.value })}
                  />
                </div>
              </div>
            )}
            <RuleSwitch
              label="Respect customer time zones"
              checked={rules.respectCustomerTimezone}
              onChange={(v) => setRules({ ...rules, respectCustomerTimezone: v })}
            />

            <RuleNumber
              label="Send appointment reminders (hours before)"
              value={rules.reminderHoursBefore}
              onChange={(v) => setRules({ ...rules, reminderHoursBefore: v })}
            />
            <RuleNumber
              label="Trigger feedback calls (hours after checkout/discharge)"
              value={rules.feedbackHoursAfter}
              onChange={(v) => setRules({ ...rules, feedbackHoursAfter: v })}
            />
            <RuleNumber
              label="Intelligent reschedule window (minutes)"
              value={rules.rescheduleMinutes}
              onChange={(v) => setRules({ ...rules, rescheduleMinutes: v })}
              hint='If a customer says "call me after 30 minutes", the agent reschedules automatically.'
            />
            <RuleNumber
              label="Max retries per contact"
              value={rules.maxRetries}
              onChange={(v) => setRules({ ...rules, maxRetries: v })}
            />
          </div>

          <div className="card space-y-3 p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Enterprise integrations
              </h3>
              <p className="text-xs text-slate-500">
                Connect CRM, ERP, calendars & telephony to go production-ready.
              </p>
            </div>
            <div className="space-y-2">
              {INTEGRATIONS.map((it) => {
                const on = integrations.includes(it.id);
                return (
                  <button
                    key={it.id}
                    onClick={() => toggleIntegration(it.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      on
                        ? "border-brand-400 bg-brand-50/60 dark:bg-brand-600/10"
                        : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-white/10">
                      {it.name.slice(0, 2)}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {it.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {INTEGRATION_KIND_LABEL[it.kind]}
                        {it.connected ? " · connected" : " · not connected"}
                      </div>
                    </div>
                    <span
                      className={`pill ${
                        on ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {on ? "Enabled" : "Enable"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: review */}
      {step === 3 && template && (
        <div className="card mx-auto max-w-2xl space-y-4 p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Review & launch</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Review label="Name" value={name} />
            <Review label="Direction" value={direction} />
            <Review label="Template" value={template.name} />
            <Review label="Voice" value={voice} />
            <Review label="Language" value={language} />
            <Review label="Phone" value={phoneNumber} />
            <Review
              label="Business hours"
              value={
                rules.businessHoursOnly
                  ? `${rules.businessHoursStart}–${rules.businessHoursEnd}`
                  : "Anytime"
              }
            />
            <Review
              label="Reminders"
              value={`${rules.reminderHoursBefore}h before`}
            />
            <Review label="Feedback calls" value={`${rules.feedbackHoursAfter}h after`} />
            <Review label="Reschedule window" value={`${rules.rescheduleMinutes} min`} />
            <Review
              label="Integrations"
              value={integrations.join(", ") || "none"}
            />
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <span className="font-semibold">Opening line:</span> “{greeting}”
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between">
        <button
          className="btn-secondary disabled:opacity-40"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            className="btn-primary disabled:opacity-40"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button className="btn-primary" disabled={submitting} onClick={launch}>
            {submitting ? (
              "Deploying…"
            ) : (
              <>
                <Rocket className="h-4 w-4" /> Deploy agent
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function RuleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-brand-600" : "bg-slate-300 dark:bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function RuleNumber({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-white/10">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold capitalize text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
