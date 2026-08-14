# 🎙️ Voice Agent OS — Modular Voice Agent Platform (Voice Agent as a Service)

Launch **inbound and outbound AI voice agents in minutes** using pre‑configured
templates and a **no‑code interface** — everything tracked in one dashboard.

This is a **fully working, data‑driven** app (not a mock‑up): a real database
stores your agents and every call, the dashboard numbers are **calculated live
from real call records**, you can **create, pause, delete agents and place
calls** right from the UI, and it optionally plugs into **Claude** (for
understanding callers) and **Vapi** (for placing real phone calls).

> Works out of the box with **zero setup** — no accounts, no API keys. In this
> “demo mode” calls are simulated but everything else is real (real database,
> real records, real dashboards). Add keys later to go fully live.

---

## 🚀 Quick start (for non‑technical users)

You need **Node.js 18 or newer** installed ([download here](https://nodejs.org)).
Then, in a terminal, inside this project folder:

```bash
npm install       # 1. install (one time, ~1 min)
npm run dev       # 2. start the app
```

Now open **http://localhost:3000** in your browser. That’s it. 🎉

The first time it runs, it creates a local database and fills it with sample
agents and call history so the dashboard isn’t empty.

To stop the app, press `Ctrl + C` in the terminal.

### Try it (everything is live)

- **My Agents → Place test call** — runs a real call (simulated), detects the
  caller’s intent, and saves the result. Watch the dashboard numbers change.
- **My Agents → Run 10‑call campaign** — generates 10 calls at once.
- **My Agents → the “Intelligent call rescheduling” box** — type what a customer
  might say and see the agent decide what to do.
- **Create Agent** — build a new agent in 4 steps; it’s saved permanently.
- **Pause / Activate / Delete** — manage agents; changes persist.

---

## 🔑 The `.env` file (plain‑English guide)

`.env` is a small text file where you paste your keys. **You don’t need it to
run the app** — skip this whole section and you get demo mode. Add it when
you’re ready to turn features “live”.

**How to set it up:**

1. Make a copy of the example file and name it `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in only the lines you want.
3. Save, then restart the app (`Ctrl + C`, then `npm run dev`).

**What each setting does:**

| Setting | What it’s for | Needed? | Where to get it |
| --- | --- | --- | --- |
| `WORKSPACE_NAME` | Your company name (shown in the header) | Optional | Just type it |
| `ANTHROPIC_API_KEY` | The **AI brain** (Claude) that understands what callers mean | Optional | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `ANTHROPIC_MODEL` | Which Claude model to use | Optional | Leave as `claude-opus-5` |
| `VAPI_API_KEY` | Places **real phone calls** (voice + telephony) | Optional | [dashboard.vapi.ai](https://dashboard.vapi.ai) → API Keys |
| `VAPI_PHONE_NUMBER_ID` | The number to call **from** | Optional | Vapi → Phone Numbers |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Alternative phone provider | Optional | [console.twilio.com](https://console.twilio.com) |
| `DATABASE_FILE` | Where the local database file lives | Optional | Leave blank |

**Demo mode vs Live mode** (shown as a banner on the Overview page and in Settings):

| | No keys (Demo) | With `ANTHROPIC_API_KEY` | With `VAPI_API_KEY` |
| --- | --- | --- | --- |
| Database & dashboards | ✅ real | ✅ real | ✅ real |
| Understanding callers | Built‑in parser | 🧠 **Claude** | 🧠 Claude |
| Phone calls | Simulated | Simulated | ☎️ **Real calls** |

Nothing breaks when a key is missing — that feature just runs in simulation.

---

## 🧠 The three capabilities, with examples

### 1) Intelligent Call Rescheduling
Customer says *“I’m busy, call me after 30 minutes.”* → the agent understands
the intent and reschedules automatically.

```text
Customer: "I'm busy, call me after 30 minutes"
   →  { intent: "reschedule", nextCallIn: "30 min" }
```

Try it live on any agent’s page. With no key it uses a built‑in parser; with
`ANTHROPIC_API_KEY` set it uses **Claude** (the box even tells you which one
answered). Logic: [`src/lib/intent.ts`](src/lib/intent.ts) + [`src/lib/llm.ts`](src/lib/llm.ts).

### 2) Rule‑Based Campaign Scheduling
Configure business rules from the UI (Create Agent → step 3), **no code**:
business‑hours‑only + times, respect customer time zones, reminders **N hours
before**, feedback calls **N hours after**, retries, and the reschedule window.
Every agent stores its own rules in the database.

### 3) Enterprise Integrations
Toggle **CRM / ERP / calendar / telephony** connections per agent (Salesforce,
HubSpot, Zoho, SAP, Google/Outlook Calendar, Twilio, Zendesk) so calls read and
write real records. Catalog: [`src/lib/integrations.ts`](src/lib/integrations.ts).

---

## 🏗️ How it works (fully dynamic)

```
Browser (dashboard)
      │  fetch()
      ▼
API routes  /api/agents · /api/agents/[id]/call · /api/stats · /api/analytics · /api/intent · /api/config
      │
      ▼
Database (SQLite file: data/voiceagent.db)   ← agents + every call, persists across restarts
      │
      ├── Call engine  → real intent detection → records a call row
      │         │
      │         ├─ Live:  places the call through Vapi (if VAPI_API_KEY set)
      │         └─ Demo:  simulates the call (still a real DB record)
      │
      └── Stats & analytics are COMPUTED from the call rows — nothing is hardcoded
```

- **Nothing on the dashboard is static.** “Calls today”, conversion rate, avg
  cost, the 7‑day charts, and per‑agent metrics are all `SELECT`‑ed from the
  `calls` table. Place calls and the numbers move.
- **It persists.** Everything is stored in `data/voiceagent.db`. Restart the
  app and your agents and history are still there.
- **Where real voice plugs in:** set `VAPI_API_KEY` and the call engine
  (`src/lib/callEngine.ts` → `src/lib/voice.ts`) dials real phones instead of
  simulating.

---

## 📁 Project structure

```
src/
├─ app/
│  ├─ app/                      # dashboard pages (/app/*)
│  │  ├─ overview  create  agents  analytics  sdk  settings
│  └─ api/                      # backend
│     ├─ agents/route.ts              GET list · POST create
│     ├─ agents/[id]/route.ts         GET · PATCH status · DELETE
│     ├─ agents/[id]/call/route.ts    POST place/simulate call(s)
│     ├─ calls  stats  analytics  intent  config
├─ components/                  # TopNav, wizard, charts, AgentsExplorer, ConnectionStatus…
└─ lib/
   ├─ store.ts                  # SQLite database + all queries (the engine room)
   ├─ callEngine.ts             # runs a call (real or simulated) and records it
   ├─ llm.ts                    # Claude intent detection (+ heuristic fallback)
   ├─ voice.ts                  # Vapi phone‑call adapter
   ├─ config.ts                 # reads .env, exposes feature flags
   ├─ intent.ts  templates.ts  integrations.ts  types.ts
```

## 🔌 API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/config` | Live feature flags (demo vs live, which keys are set) |
| `GET` | `/api/stats` | Dashboard KPIs, computed from call rows |
| `GET` | `/api/analytics` | 7‑day series + per‑agent metrics |
| `GET` `POST` | `/api/agents` | List / create agents |
| `GET` `PATCH` `DELETE` | `/api/agents/[id]` | Inspect / pause‑activate / delete |
| `POST` | `/api/agents/[id]/call` | Place or simulate call(s): `{ toNumber?, utterance?, count? }` |
| `GET` | `/api/calls?agentId=` | Recent call records |
| `POST` | `/api/intent` | Detect caller intent: `{ utterance, agentId? }` |

---

## ☁️ Deployment notes (for later)

- The database is a **local file**, so it needs a host with a **persistent
  disk** — e.g. **Railway, Render, Fly.io, or a VPS**. Run `npm run build` then
  `npm run start`.
- On **serverless hosts like Vercel** the filesystem is temporary, so the
  SQLite file won’t persist between requests. For those, point the data layer
  at a hosted database (e.g. Postgres via Neon/Supabase) — only `src/lib/store.ts`
  needs to change; the rest of the app already talks to it through functions.
- Set the same keys from `.env` as environment variables in your host’s
  dashboard.

---

## 📝 Notes

- Requires Node 18+ (developed on Node 22).
- `next/image` isn’t used, so image‑optimization dependencies aren’t on the
  runtime path.
- This is an independent implementation inspired by the referenced concept; no
  proprietary code or branding is included.
