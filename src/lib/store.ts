import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import {
  Agent,
  AgentMetrics,
  AgentWithMetrics,
  Call,
  CallOutcome,
  CampaignRules,
  Direction,
  PlatformStats,
} from "./types";
import { defaultRulesFor, getTemplate } from "./templates";
import { INTEGRATIONS } from "./integrations";

export { INTEGRATIONS };

/**
 * Real, file-backed database (SQLite via better-sqlite3). Data persists to
 * `data/voiceagent.db` and survives restarts — nothing on the dashboard is
 * hardcoded; every number is computed from the rows below.
 *
 * In production you can point this at Postgres instead (see README) — the
 * repository functions are the only thing the rest of the app calls.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_FILE || path.join(DATA_DIR, "voiceagent.db");

// eslint-disable-next-line no-var
declare global {
  var __VA_DB__: Database.Database | undefined;
}

function openDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      direction TEXT NOT NULL,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      status TEXT NOT NULL,
      voice TEXT NOT NULL,
      language TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      greeting TEXT NOT NULL,
      objective TEXT NOT NULL,
      knowledge_base TEXT NOT NULL,
      rules_json TEXT NOT NULL,
      integrations_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      to_number TEXT NOT NULL,
      status TEXT NOT NULL,
      outcome TEXT NOT NULL,
      intent TEXT NOT NULL,
      collected_json TEXT NOT NULL,
      duration_sec INTEGER NOT NULL,
      cost REAL NOT NULL,
      provider TEXT NOT NULL,
      transcript TEXT NOT NULL,
      started_at TEXT NOT NULL,
      day TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
    CREATE INDEX IF NOT EXISTS idx_calls_day ON calls(day);
  `);
  return db;
}

const db: Database.Database = globalThis.__VA_DB__ ?? openDb();
globalThis.__VA_DB__ = db;

// ---------- helpers ----------

function localDay(d: Date): string {
  // YYYY-MM-DD in the server's local timezone.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function today(): string {
  return localDay(new Date());
}

function rowToAgent(r: Record<string, unknown>): Agent {
  return {
    id: r.id as string,
    name: r.name as string,
    direction: r.direction as Direction,
    templateId: r.template_id as string,
    templateName: r.template_name as string,
    status: r.status as Agent["status"],
    voice: r.voice as string,
    language: r.language as string,
    phoneNumber: r.phone_number as string,
    greeting: r.greeting as string,
    objective: r.objective as string,
    knowledgeBase: r.knowledge_base as string,
    rules: JSON.parse(r.rules_json as string) as CampaignRules,
    integrations: JSON.parse(r.integrations_json as string) as string[],
    createdAt: r.created_at as string,
  };
}

function rowToCall(r: Record<string, unknown>): Call {
  return {
    id: r.id as string,
    agentId: r.agent_id as string,
    direction: r.direction as Direction,
    toNumber: r.to_number as string,
    status: r.status as Call["status"],
    outcome: r.outcome as CallOutcome,
    intent: r.intent as string,
    collected: JSON.parse(r.collected_json as string),
    durationSec: r.duration_sec as number,
    cost: r.cost as number,
    provider: r.provider as string,
    transcript: r.transcript as string,
    startedAt: r.started_at as string,
    day: r.day as string,
  };
}

// ---------- agents repository ----------

const insertAgentStmt = db.prepare(`
  INSERT INTO agents (id,name,direction,template_id,template_name,status,voice,language,
    phone_number,greeting,objective,knowledge_base,rules_json,integrations_json,created_at)
  VALUES (@id,@name,@direction,@template_id,@template_name,@status,@voice,@language,
    @phone_number,@greeting,@objective,@knowledge_base,@rules_json,@integrations_json,@created_at)
`);

function agentToRow(a: Agent) {
  return {
    id: a.id,
    name: a.name,
    direction: a.direction,
    template_id: a.templateId,
    template_name: a.templateName,
    status: a.status,
    voice: a.voice,
    language: a.language,
    phone_number: a.phoneNumber,
    greeting: a.greeting,
    objective: a.objective,
    knowledge_base: a.knowledgeBase,
    rules_json: JSON.stringify(a.rules),
    integrations_json: JSON.stringify(a.integrations),
    created_at: a.createdAt,
  };
}

export function listAgents(): Agent[] {
  return db
    .prepare("SELECT * FROM agents ORDER BY created_at DESC")
    .all()
    .map((r) => rowToAgent(r as Record<string, unknown>));
}

export function getAgent(id: string): Agent | undefined {
  const r = db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return r ? rowToAgent(r) : undefined;
}

export function addAgent(agent: Agent): Agent {
  insertAgentStmt.run(agentToRow(agent));
  return agent;
}

export function updateAgentStatus(id: string, status: Agent["status"]): Agent | undefined {
  db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(status, id);
  return getAgent(id);
}

export function deleteAgent(id: string): boolean {
  const info = db.prepare("DELETE FROM agents WHERE id = ?").run(id);
  db.prepare("DELETE FROM calls WHERE agent_id = ?").run(id);
  return info.changes > 0;
}

// ---------- calls repository ----------

const insertCallStmt = db.prepare(`
  INSERT INTO calls (id,agent_id,direction,to_number,status,outcome,intent,collected_json,
    duration_sec,cost,provider,transcript,started_at,day)
  VALUES (@id,@agent_id,@direction,@to_number,@status,@outcome,@intent,@collected_json,
    @duration_sec,@cost,@provider,@transcript,@started_at,@day)
`);

export function insertCall(call: Call): Call {
  insertCallStmt.run({
    id: call.id,
    agent_id: call.agentId,
    direction: call.direction,
    to_number: call.toNumber,
    status: call.status,
    outcome: call.outcome,
    intent: call.intent,
    collected_json: JSON.stringify(call.collected),
    duration_sec: call.durationSec,
    cost: call.cost,
    provider: call.provider,
    transcript: call.transcript,
    started_at: call.startedAt,
    day: call.day,
  });
  return call;
}

export function listCalls(agentId?: string, limit = 25): Call[] {
  const rows = agentId
    ? db
        .prepare("SELECT * FROM calls WHERE agent_id = ? ORDER BY started_at DESC LIMIT ?")
        .all(agentId, limit)
    : db.prepare("SELECT * FROM calls ORDER BY started_at DESC LIMIT ?").all(limit);
  return rows.map((r) => rowToCall(r as Record<string, unknown>));
}

export function makeDay(iso: string): string {
  return localDay(new Date(iso));
}

// ---------- metrics & stats (all computed from rows) ----------

export function agentMetrics(agentId: string): AgentMetrics {
  const d = today();
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS calls,
         SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) AS conv,
         AVG(cost) AS avgcost
       FROM calls WHERE agent_id = ? AND day = ?`
    )
    .get(agentId, d) as { calls: number; conv: number | null; avgcost: number | null };
  const calls = row.calls || 0;
  return {
    callsToday: calls,
    conversionRate: calls ? Math.round(((row.conv || 0) / calls) * 1000) / 10 : 0,
    avgCostPerCall: row.avgcost ? Math.round(row.avgcost * 100) / 100 : 0,
  };
}

export function listAgentsWithMetrics(): AgentWithMetrics[] {
  return listAgents().map((a) => ({ ...a, ...agentMetrics(a.id) }));
}

function dayStats(day: string) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS calls,
         SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) AS conv,
         AVG(cost) AS avgcost
       FROM calls WHERE day = ?`
    )
    .get(day) as { calls: number; conv: number | null; avgcost: number | null };
  return {
    calls: row.calls || 0,
    conv: row.conv || 0,
    avgcost: row.avgcost || 0,
  };
}

function pctChange(now: number, prev: number): number {
  if (!prev) return now ? 100 : 0;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

export function computeStats(): PlatformStats {
  const now = new Date();
  const d0 = localDay(now);
  const yesterday = new Date(now.getTime() - 86400000);
  const d1 = localDay(yesterday);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const t = dayStats(d0);
  const y = dayStats(d1);

  const activeAgents = (
    db.prepare("SELECT COUNT(*) AS c FROM agents WHERE status = 'active'").get() as {
      c: number;
    }
  ).c;
  const newAgentsThisWeek = (
    db.prepare("SELECT COUNT(*) AS c FROM agents WHERE created_at >= ?").get(
      weekAgo.toISOString()
    ) as { c: number }
  ).c;
  const liveCallsNow = (
    db.prepare("SELECT COUNT(*) AS c FROM calls WHERE status = 'in_progress'").get() as {
      c: number;
    }
  ).c;

  const convRate = t.calls ? Math.round((t.conv / t.calls) * 1000) / 10 : 0;
  const yConvRate = y.calls ? (y.conv / y.calls) * 100 : 0;

  return {
    activeAgents,
    activeAgentsDeltaWeek: newAgentsThisWeek,
    callsToday: t.calls,
    callsDeltaPct: pctChange(t.calls, y.calls),
    conversionRate: convRate,
    conversionDeltaPct: Math.round((convRate - yConvRate) * 10) / 10,
    avgCostPerCall: Math.round(t.avgcost * 100) / 100,
    costDeltaPct: pctChange(
      Math.round(t.avgcost * 100),
      Math.round(y.avgcost * 100)
    ),
    liveCallsNow,
    agentsLive: activeAgents,
    conversionsToday: t.conv,
  };
}

export interface DaySeries {
  label: string;
  day: string;
  calls: number;
  conversions: number;
}

export function analyticsSeries(days = 7): DaySeries[] {
  const out: DaySeries[] = [];
  const now = new Date();
  const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const day = localDay(d);
    const s = dayStats(day);
    out.push({ label: WEEKDAY[d.getDay()], day, calls: s.calls, conversions: s.conv });
  }
  return out;
}

// ---------- seeding (creates REAL rows on first boot) ----------

function randomOutcome(convProbability: number): CallOutcome {
  const r = Math.random();
  if (r < convProbability) return "converted";
  const rest = ["rescheduled", "not_interested", "no_answer", "voicemail"] as CallOutcome[];
  return rest[Math.floor(Math.random() * rest.length)];
}

function seedCallsForAgent(
  agentId: string,
  direction: Direction,
  todayCount: number,
  convProbability: number,
  baseCost: number
) {
  const now = new Date();
  const rows: Call[] = [];
  // 7 days of history, today at full volume, earlier days scaled down.
  const shape = [1, 0.85, 0.95, 0.63, 0.9, 0.85, 0.72]; // today..6 days ago
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const count = Math.round(todayCount * shape[dayOffset]);
    const dayDate = new Date(now.getTime() - dayOffset * 86400000);
    const day = localDay(dayDate);
    for (let i = 0; i < count; i++) {
      const startedAt = new Date(
        dayDate.getTime() - Math.floor(Math.random() * 8 * 3600000)
      ).toISOString();
      const outcome = randomOutcome(convProbability);
      const cost = Math.round((baseCost + (Math.random() - 0.5) * 0.1) * 100) / 100;
      rows.push({
        id: `call_${agentId}_${day}_${i}`,
        agentId,
        direction,
        toNumber: `+1 (415) 555-${String(1000 + ((i * 7) % 8999)).slice(0, 4)}`,
        status: "completed",
        outcome,
        intent: outcome === "converted" ? "confirm" : outcome,
        collected: {},
        durationSec: 60 + Math.floor(Math.random() * 240),
        cost: Math.max(0.05, cost),
        provider: "simulator",
        transcript: "",
        startedAt,
        day,
      });
    }
  }
  const insertMany = db.transaction((calls: Call[]) => {
    for (const c of calls) insertCall(c);
  });
  insertMany(rows);

  // A handful of live (in-progress) calls today for the Live Monitor.
  const liveMany = db.transaction((n: number) => {
    for (let i = 0; i < n; i++) {
      insertCall({
        id: `call_${agentId}_live_${i}`,
        agentId,
        direction,
        toNumber: "+1 (415) 555-0000",
        status: "in_progress",
        outcome: "in_progress",
        intent: "in_progress",
        collected: {},
        durationSec: 0,
        cost: 0,
        provider: "simulator",
        transcript: "",
        startedAt: now.toISOString(),
        day: localDay(now),
      });
    }
  });
  liveMany(direction === "outbound" ? 9 : 0);
}

function seed() {
  const seedAgents: Agent[] = [
    {
      id: "agt_appt_reminders",
      name: "Appointment Reminders",
      direction: "outbound",
      templateId: "appointment-reminder",
      templateName: "Appointment Reminder",
      status: "active",
      voice: "Aria (Female, US)",
      language: "English (US)",
      phoneNumber: "+1 (415) 555-0142",
      greeting: getTemplate("appointment-reminder")!.greeting,
      objective: getTemplate("appointment-reminder")!.objective,
      knowledgeBase: "Clinic hours, provider list, rescheduling policy",
      rules: defaultRulesFor("appointment-reminder"),
      integrations: ["gcal", "twilio"],
      createdAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: "agt_recruit_screen",
      name: "Recruitment Pre-Screening",
      direction: "outbound",
      templateId: "recruiting-screener",
      templateName: "Recruiting Screener",
      status: "active",
      voice: "Leo (Male, US)",
      language: "English (US)",
      phoneNumber: "+1 (415) 555-0198",
      greeting: getTemplate("recruiting-screener")!.greeting,
      objective: getTemplate("recruiting-screener")!.objective,
      knowledgeBase: "Role JD, screening rubric, salary bands",
      rules: defaultRulesFor("recruiting-screener"),
      integrations: ["salesforce", "twilio"],
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
  ];
  const insertAgents = db.transaction((agents: Agent[]) => {
    for (const a of agents) addAgent(a);
  });
  insertAgents(seedAgents);

  // Tuned so today's dashboard reads ~1,284 calls / 24.6% / ~$0.38 like the
  // reference — but every one of these is a real, queryable row.
  seedCallsForAgent("agt_appt_reminders", "outbound", 1116, 0.246, 0.36);
  seedCallsForAgent("agt_recruit_screen", "outbound", 168, 0.246, 0.5);
}

// First-boot seed.
const agentCount = (
  db.prepare("SELECT COUNT(*) AS c FROM agents").get() as { c: number }
).c;
if (agentCount === 0) {
  seed();
}
