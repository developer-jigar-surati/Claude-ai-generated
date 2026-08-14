import CodeBlock from "@/components/CodeBlock";

const CURL = `curl https://api.voiceagentos.dev/v1/calls \\
  -H "Authorization: Bearer $VOICEAGENT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agt_appt_reminders",
    "to": "+14155550142",
    "variables": { "customerName": "Jordan", "appointmentTime": "Tomorrow 3:00 PM" }
  }'`;

const NODE = `import { VoiceAgentOS } from "@voiceagentos/sdk";

const client = new VoiceAgentOS({ apiKey: process.env.VOICEAGENT_API_KEY });

// Launch an outbound call with a pre-configured agent
const call = await client.calls.create({
  agentId: "agt_appt_reminders",
  to: "+14155550142",
  variables: { customerName: "Jordan", appointmentTime: "Tomorrow 3:00 PM" },
});

console.log(call.status); // "queued" -> "in-progress" -> "completed"`;

const WEBHOOK = `// Receive results in real time (Express)
app.post("/webhooks/voiceagentos", (req, res) => {
  const event = req.body;
  if (event.type === "call.completed") {
    // event.outcome: "confirmed" | "rescheduled" | "no_answer" | ...
    // event.collected: { CSAT: 9, preferredTime: "..." }
    crm.update(event.contactId, event.collected);
  }
  res.sendStatus(200);
});`;

const CAMPAIGN = `// Kick off a rule-based campaign over a whole list
await client.campaigns.create({
  agentId: "agt_appt_reminders",
  contacts: "list_9fa3",          // uploaded CSV or CRM segment
  rules: {
    businessHoursOnly: true,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    respectCustomerTimezone: true,
    reminderHoursBefore: 8,        // remind exactly 8h before appointment
    feedbackHoursAfter: 24,        // feedback call 24h after checkout
    maxRetries: 2,
  },
});`;

export default function SdkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          SDK &amp; API
        </h1>
        <p className="text-sm text-slate-500">
          Everything in the UI is available programmatically. Drop your voice agents into any app.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">API keys</h2>
        <p className="mb-3 text-xs text-slate-500">Use these to authenticate SDK and REST calls.</p>
        <div className="space-y-2">
          <KeyRow label="Publishable" value="pk_live_9c2f••••••••••••4a7d" />
          <KeyRow label="Secret" value="sk_live_a81b••••••••••••e30f" />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn-secondary">Rotate keys</button>
          <button className="btn-secondary">Manage webhooks</button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
            Place a call (cURL)
          </h2>
          <CodeBlock code={CURL} lang="bash" />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
            Node SDK
          </h2>
          <CodeBlock code={NODE} lang="typescript" />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
            Launch a rule-based campaign
          </h2>
          <CodeBlock code={CAMPAIGN} lang="typescript" />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
            Handle results (webhook)
          </h2>
          <CodeBlock code={WEBHOOK} lang="javascript" />
        </div>
      </section>
    </div>
  );
}

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <code className="text-sm text-slate-700 dark:text-slate-200">{value}</code>
      </div>
      <span className="pill bg-emerald-50 text-emerald-600">Active</span>
    </div>
  );
}
