# 🎙️ Voice Agent OS — Modular Voice Agent Platform (Voice Agent as a Service)

Launch **inbound and outbound AI voice agents in under 2 minutes** using
pre‑configured templates and a **no‑code interface** — everything tracked in one
dashboard.

This is a faithful, runnable rebuild of the platform shown in the reference
screenshots: an Overview dashboard, a Create‑Agent template flow, My Agents,
Analytics, and an SDK & API surface. Rather than building yet another voice
*orchestration* engine, it focuses on the **operational layer** that most
platforms leave out — intelligent rescheduling, rule‑based campaign scheduling,
and enterprise integrations.

> Built with Next.js (App Router) + TypeScript + Tailwind CSS. No external
> services required — the whole product runs end‑to‑end with a built‑in mock
> API so you can demo the flow instantly.

---

## ✨ What's inside (maps 1:1 to the screenshots)

| Screen | Route | What it does |
| --- | --- | --- |
| **Overview** | `/app/overview` | Hero “deploy in minutes”, **Live Operations Monitor** (animated waveform), stat cards (Active agents, Calls today, Conversion, Avg cost/call), Recent agents, Quick actions |
| **Create Agent** | `/app/create` | Pick a predefined **inbound/outbound template** → configure identity → set **rules & integrations** → review → **deploy**. A 4‑step no‑code wizard |
| **My Agents** | `/app/agents` | Inspect each agent, its rules and integrations, live metrics, and a **“try it” intelligent‑rescheduling demo** |
| **Analytics** | `/app/analytics` | 7‑day calls & conversions charts (dependency‑free SVG) + per‑agent performance table |
| **SDK & API** | `/app/sdk` | API keys, and copy‑paste cURL / Node SDK / campaign / webhook snippets |
| **Settings** | `/app/settings` | Workspace defaults and connected CRM / ERP / calendar / telephony systems |

The three headline capabilities from the original pitch are all implemented as
real, configurable features — see the worked examples below.

---

## 🧠 The three capabilities, explained with examples

### 1) Intelligent Call Rescheduling

If a customer says *“I’m busy, call me after 30 minutes,”* the agent understands
the **intent** and reschedules automatically — no human needed.

Try it live on any agent’s detail page (`/app/agents`), or see the logic in
[`src/lib/intent.ts`](src/lib/intent.ts):

```text
Customer says:  "I'm busy, call me after 30 minutes"
      ↓  detectIntent()
{ intent: "reschedule", delayMinutes: 30,
  reason: 'Detected "call back in 30 minutes". Rescheduling the call.' }
```

More examples the parser handles out of the box:

| Customer utterance | Detected intent | Next call |
| --- | --- | --- |
| “Try again in 2 hours” | `reschedule` | +2 h |
| “Can you call me back tomorrow?” | `reschedule` | ~24 h |
| “I’m busy, call me later” | `callback_unspecified` | agent’s default reschedule window |
| “Not interested, stop calling” | `not_interested` | added to Do‑Not‑Call |
| “Yes, that works” | `confirm` | booked |

### 2) Rule‑Based Campaign Scheduling

Create campaigns with configurable business rules **directly from the UI** — no
code (see the Create‑Agent wizard, step 3):

- ✅ Call only during business hours (with start/end times)
- ✅ Respect customer time zones
- ✅ Send appointment reminders **exactly N hours before** an appointment
- ✅ Trigger feedback calls **N hours after** checkout / discharge
- ✅ Max retries & intelligent reschedule window

**Example — an “Appointment Reminder” campaign:**

```jsonc
{
  "businessHoursOnly": true,
  "businessHoursStart": "09:00",
  "businessHoursEnd": "18:00",
  "respectCustomerTimezone": true,
  "reminderHoursBefore": 8,     // remind exactly 8h before the appointment
  "feedbackHoursAfter": 24,     // feedback call 24h after the visit
  "maxRetries": 2,
  "rescheduleMinutes": 30
}
```

The same rules are available programmatically via `client.campaigns.create({...})`
(see the SDK page).

### 3) Enterprise Integrations

Connect **CRM, ERP, calendars, and telephony** so agents can read/write real
records and become production‑ready. Toggle them per‑agent in the wizard or
manage them in Settings. Catalog lives in
[`src/lib/integrations.ts`](src/lib/integrations.ts) (Salesforce, HubSpot, Zoho,
SAP, Google/Outlook Calendar, Twilio, Zendesk).

**Example flow:** a *Post‑Purchase Survey* agent finishes a call →
`call.completed` webhook fires → collected fields (`CSAT`, open feedback) are
written straight back to the CRM contact.

---

## 🚀 Run it

```bash
npm install
npm run dev
# open http://localhost:3000  → redirects to /app/overview
```

Production build:

```bash
npm run build && npm run start
```

Requires Node 18+ (developed on Node 22).

---

## 🏗️ Architecture

```
Browser (Next.js App Router UI, Tailwind)
        │  fetch()
        ▼
Route handlers  /api/agents  /api/stats        ← the "backend" for this MVP
        │
        ▼
In‑memory store (src/lib/store.ts)             ← swap for a DB in production
        │
        ▼
[ In production ] Voice orchestration layer
   • Telephony:  Twilio / Vapi / Bolna
   • Speech:     STT + TTS
   • Brain:      an LLM with the template's prompt + your knowledge base
   • Rules:      the scheduler that enforces business hours, reminders, retries
```

Everything the UI does is also exposed as an API, so agents drop into any app.

### Where the real work plugs in

This repo ships a **working product shell** with a mock backend so the flow is
fully demoable. To make calls actually happen, wire the store’s create/dispatch
path to a provider:

- **Telephony + realtime voice:** Twilio Programmable Voice, or a voice
  orchestrator like **Vapi** / **Bolna**.
- **LLM brain:** feed the template’s `greeting` + `objective` + `knowledgeBase`
  as the system prompt; return structured outputs for `collects[]` and intent.
- **Scheduler:** a job queue (e.g. cron / BullMQ / Temporal) that honors
  `CampaignRules` — business hours, timezone, `reminderHoursBefore`,
  `feedbackHoursAfter`, `maxRetries`, `rescheduleMinutes`.

---

## 📁 Project structure

```
src/
├─ app/
│  ├─ layout.tsx                # root layout + global styles
│  ├─ page.tsx                  # redirects to /app/overview
│  ├─ app/                      # dashboard (route prefix /app/*)
│  │  ├─ layout.tsx             # shell + TopNav
│  │  ├─ overview/page.tsx
│  │  ├─ create/page.tsx        # no‑code wizard
│  │  ├─ agents/page.tsx
│  │  ├─ analytics/page.tsx
│  │  ├─ sdk/page.tsx
│  │  └─ settings/page.tsx
│  └─ api/
│     ├─ agents/route.ts        # GET list / POST create
│     └─ stats/route.ts         # GET platform stats
├─ components/                  # TopNav, StatCard, LiveMonitor, wizard, charts…
└─ lib/
   ├─ types.ts                  # domain types (Agent, CampaignRules, …)
   ├─ templates.ts              # 8 outbound + 4 inbound pre‑configured agents
   ├─ integrations.ts           # CRM/ERP/calendar/telephony catalog
   ├─ intent.ts                 # intelligent‑rescheduling parser
   └─ store.ts                  # in‑memory data + stats
```

## 🔌 API reference (mock backend)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/stats` | Platform KPIs for the Overview cards |
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Create & “deploy” an agent (body: name, direction, templateId, voice, language, phoneNumber, greeting, objective, knowledgeBase, rules, integrations) |

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"Win-back Q3","direction":"outbound","templateId":"winback-renewal","integrations":["salesforce","twilio"]}'
```

---

## 📝 Notes

- The in‑memory store resets on server restart — that’s intentional for a demo.
  Replace it with a database to persist agents.
- `next/image` isn’t used, so image‑optimization dependencies aren’t on the
  runtime path.
- This is an independent implementation inspired by the referenced concept; no
  proprietary code or branding is included.
