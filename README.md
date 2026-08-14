# 🎙️ Voice Agent OS — Modular Voice Agent Platform (Voice Agent as a Service)

Launch **inbound and outbound AI voice agents in minutes** using pre‑configured
templates and a **no‑code interface** — everything tracked in one dashboard.

A **fully working, data‑driven** app: a real database stores your agents and
every call, dashboard numbers are **calculated live from real records**, you can
**create / pause / delete agents and place calls** from the UI, and it plugs
into **Claude** (understanding callers) and **Vapi** (real phone calls) — both
optional.

> Runs with **zero setup and zero cost**. No keys needed to start (calls are
> simulated but the database, records, and dashboards are all real). Deploy it
> **free** with Vercel + Turso — **no credit card** — using the guide below.

---

## 🔐 Test credentials (the login)

The dashboard is protected by a simple login. Use these to sign in:

```
Email:    demo@voiceagentos.dev
Password: demo1234
```

The sign‑in page also shows these and has a **“Fill these in”** button.
You can change them in `.env` (`DEMO_EMAIL` / `DEMO_PASSWORD`) before sharing a
public link.

---

## 🚀 Run it on your computer (2 steps)

You need **Node.js 18+** ([download](https://nodejs.org)). In a terminal, inside
this folder:

```bash
npm install       # 1. install (one time)
npm run dev       # 2. start
```

Open **http://localhost:3000**, sign in with the test credentials above. Done. 🎉

The first run creates a local database and fills it with sample agents and call
history so nothing is empty.

**Try it (all live):** *My Agents → Place test call* / *Run 10‑call campaign*,
the *Intelligent call rescheduling* box, *Create Agent*, and *Pause / Delete*.

---

## ☁️ Deploy it for FREE (Vercel + Turso, no credit card)

Your app has two parts to host: the **website** (free on Vercel) and the
**database** (free on Turso — a SQLite database in the cloud). ~15 minutes.

### Step 1 — Put the code on GitHub
Create a free GitHub account, make a new repository, and push this project to it.
(If it’s already on GitHub, skip this.)

### Step 2 — Create a free database on Turso
1. Go to **https://turso.tech** and sign up (free, no card).
2. Create a database (any name, e.g. `voice-agent-os`).
3. Copy two values it gives you:
   - the **Database URL** (starts with `libsql://…`)
   - an **auth token** (create one if asked)

   *(Using the Turso CLI instead? `turso db show <name> --url` and
   `turso db tokens create <name>`.)*

### Step 3 — Deploy on Vercel
1. Go to **https://vercel.com**, sign up with your GitHub account (free).
2. Click **Add New → Project**, and **Import** your GitHub repository.
3. Before clicking Deploy, open **Environment Variables** and add these:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Turso URL (`libsql://…`) |
   | `DATABASE_AUTH_TOKEN` | your Turso auth token |
   | `AUTH_SECRET` | any long random text (keep it private) |
   | `DEMO_EMAIL` | the login email you want |
   | `DEMO_PASSWORD` | the login password you want |
   | `WORKSPACE_NAME` | your company name (optional) |
   | `ANTHROPIC_API_KEY` | *(optional)* turns on the AI brain |
   | `VAPI_API_KEY` | *(optional)* turns on real phone calls |

4. Click **Deploy**. After a minute you get a public link like
   `https://your-app.vercel.app`.
5. Open it, sign in with your `DEMO_EMAIL` / `DEMO_PASSWORD`. That’s your live app. 🚀

> **Why Turso?** The app’s database is SQLite. On free serverless hosts like
> Vercel the local file disappears between requests, so we store the same SQLite
> database on Turso (free) instead. Set `DATABASE_URL` and it just works — no
> code changes.

**Free and no card:** Vercel Hobby plan, Turso free tier. You can run entirely in
demo mode (no Anthropic/Vapi keys) and it stays $0.

---

## 🔑 The `.env` file (plain‑English guide)

`.env` is a small text file for your settings. **You don’t need it to run
locally** — skip it and you get demo mode with the default login.

Set it up:
```bash
cp .env.example .env     # make your own copy, then edit it
```

| Setting | What it’s for | Needed? |
| --- | --- | --- |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Your **login** credentials | Optional (defaults above) |
| `AUTH_SECRET` | Signs the login session — set a long random value when deploying | Recommended for deploy |
| `WORKSPACE_NAME` | Your company name in the header | Optional |
| `ANTHROPIC_API_KEY` | **AI brain** (Claude) — smarter caller understanding | Optional |
| `ANTHROPIC_MODEL` | Which Claude model (`claude-opus-5` default) | Optional |
| `VAPI_API_KEY` + `VAPI_PHONE_NUMBER_ID` | **Real phone calls** | Optional |
| `DATABASE_URL` + `DATABASE_AUTH_TOKEN` | Cloud database (Turso) — **for deployment** | For deploy only |

**Demo mode vs Live mode** (shown as a banner on Overview and in Settings):

| | No keys (Demo) | + `ANTHROPIC_API_KEY` | + `VAPI_API_KEY` |
| --- | --- | --- | --- |
| Database & dashboards | ✅ real | ✅ real | ✅ real |
| Understanding callers | Built‑in parser | 🧠 **Claude** | 🧠 Claude |
| Phone calls | Simulated | Simulated | ☎️ **Real** |

Where to get the optional keys (both have free tiers):
- Claude: **console.anthropic.com** → API Keys
- Vapi: **dashboard.vapi.ai** → API Keys, and a phone number’s ID

---

## 🛠️ Tech stack & database

| Layer | What we used |
| --- | --- |
| **Framework** | **Next.js 15** (App Router) — one project holds the website *and* the backend API |
| **Language** | **TypeScript** |
| **UI** | **React 18 + Tailwind CSS**; charts are hand‑drawn SVG (no chart library) |
| **Backend** | Next.js **Route Handlers** (`/api/*`) — serverless functions |
| **Database** | **SQLite** via **libSQL** — a local file (`data/voiceagent.db`) for development, or a free **Turso** cloud database for deployment. Tables: **`agents`** + **`calls`** |
| **AI (optional)** | **Anthropic SDK (Claude)** for intent detection |
| **Voice (optional)** | **Vapi** REST API for real calls |
| **Login** | Lightweight cookie session via Next.js **middleware** |

**Why libSQL / Turso?** It’s SQLite (same tables, same SQL) but works on free
serverless hosting where a local file can’t persist. Same code runs both places.

---

## 🧠 The three capabilities, with examples

1. **Intelligent Call Rescheduling** — *“call me after 30 minutes”* → the agent
   detects the intent and reschedules. Try it live on any agent’s page (it even
   tells you whether **Claude** or the built‑in parser answered).
2. **Rule‑Based Campaign Scheduling** — business‑hours‑only, time zones,
   reminders N hours before, feedback calls N hours after, retries — all set in
   the UI (Create Agent → step 3) and stored per agent.
3. **Enterprise Integrations** — toggle CRM / ERP / calendar / telephony per
   agent (Salesforce, HubSpot, Zoho, SAP, Google/Outlook Calendar, Twilio, Zendesk).

---

## 🏗️ How it works (fully dynamic)

```
Browser (sign in) ─▶ dashboard
      │  fetch()
      ▼
API routes  /api/agents · /api/agents/[id]/call · /api/stats · /api/analytics · /api/intent · /api/auth/*
      │
      ▼
Database (libSQL/SQLite — local file OR Turso)   ← agents + every call, persists
      │
      ├── Call engine → real intent detection → records a call row
      │        ├─ Live:  places the call via Vapi (if VAPI_API_KEY set)
      │        └─ Demo:  simulates it (still a real DB record)
      │
      └── Stats & analytics are COMPUTED from the call rows — nothing is hardcoded
```

## 📁 Project structure

```
src/
├─ middleware.ts               # login gate for /app/* and /api/*
├─ app/
│  ├─ login/                   # sign-in page
│  ├─ app/                     # dashboard pages (overview, create, agents, analytics, sdk, settings)
│  └─ api/                     # backend
│     ├─ auth/{login,logout,demo}   agents  agents/[id]  agents/[id]/call
│     └─ calls  stats  analytics  intent  config
└─ lib/
   ├─ store.ts                 # libSQL database + all queries (the engine room)
   ├─ callEngine.ts            # runs a call (real or simulated) and records it
   ├─ llm.ts  voice.ts         # Claude intent detection · Vapi phone calls
   ├─ auth.ts  config.ts       # demo login · reads .env / feature flags
   └─ intent.ts  templates.ts  integrations.ts  types.ts
```

## 🔌 API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` · `/api/auth/logout` | Sign in / out |
| `GET` | `/api/config` | Live feature flags (demo vs live) |
| `GET` | `/api/stats` · `/api/analytics` | KPIs & 7‑day series, computed from rows |
| `GET` `POST` | `/api/agents` | List / create agents |
| `GET` `PATCH` `DELETE` | `/api/agents/[id]` | Inspect / pause‑activate / delete |
| `POST` | `/api/agents/[id]/call` | Place or simulate call(s) |
| `GET` | `/api/calls?agentId=` | Recent call records |
| `POST` | `/api/intent` | Detect caller intent |

---

## 📝 Notes

- Requires Node 18+ (developed on Node 22).
- Demo login is a simple shared‑password gate for protecting a demo — not a full
  multi‑user system. Change `AUTH_SECRET`, `DEMO_EMAIL`, `DEMO_PASSWORD` before
  sharing publicly.
- This is an independent implementation inspired by the referenced concept; no
  proprietary code or branding is included.
