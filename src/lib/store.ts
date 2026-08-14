import fs from "fs";
import path from "path";
import { createClient, type Client, type InArgs } from "@libsql/client";
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
 * Database layer — libSQL (a SQLite fork).
 *
 *  • Local development: a plain file at `data/voiceagent.db` (no setup).
 *  • Production / free hosting: point DATABASE_URL at a free Turso database
 *    (libsql://... + DATABASE_AUTH_TOKEN). Same SQL, same tables.
 *
 * Everything the dashboard shows is computed from the `calls` table — nothing
 * is hardcoded.
 */

const DB_URL = process.env.DATABASE_URL?.trim() || "file:data/voiceagent.db";
const DB_AUTH = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

// eslint-disable-next-line no-var
declare global {
  var __VA_CLIENT__: Client | undefined;
  var __VA_READY__: Promise<void> | undefined;
}

function makeClient(): Client {
  // Ensure the local folder exists for file: URLs.
  if (DB_URL.startsWith("file:")) {
    const filePath = DB_URL.slice("file:".length);
    const dir = path.dirname(path.resolve(filePath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  return createClient({ url: DB_URL, authToken: DB_AUTH });
}

const db: Client = globalThis.__VA_CLIENT__ ?? makeClient();
globalThis.__VA_CLIENT__ = db;

// ---------- schema + seed (run once) ----------

async function migrate(): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, direction TEXT NOT NULL,
        template_id TEXT NOT NULL, template_name TEXT NOT NULL, status TEXT NOT NULL,
        voice TEXT NOT NULL, language TEXT NOT NULL, phone_number TEXT NOT NULL,
        greeting TEXT NOT NULL, objective TEXT NOT NULL, knowledge_base TEXT NOT NULL,
        rules_json TEXT NOT NULL, integrations_json TEXT NOT NULL, created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, direction TEXT NOT NULL,
        to_number TEXT NOT NULL, status TEXT NOT NULL, outcome TEXT NOT NULL,
        intent TEXT NOT NULL, collected_json TEXT NOT NULL, duration_sec INTEGER NOT NULL,
        cost REAL NOT NULL, provider TEXT NOT NULL, transcript TEXT NOT NULL,
        started_at TEXT NOT NULL, day TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id)`,
      `CREATE INDEX IF NOT EXISTS idx_calls_day ON calls(day)`,
    ],
    "write"
  );
}

/** Idempotent, concurrency-safe: only the instance that wins the `meta` lock seeds. */
export async function ensureReady(): Promise<void> {
  if (!globalThis.__VA_READY__) {
    globalThis.__VA_READY__ = (async () => {
      await migrate();
      try {
        // Whoever inserts this row first owns seeding; others hit the PK and skip.
        await db.execute({
          sql: "INSERT INTO meta (key, value) VALUES ('seeded', ?)",
          args: [new Date().toISOString()],
        });
      } catch {
        return; // already seeded by someone else
      }
      await seed();
    })();
  }
  return globalThis.__VA_READY__;
}

// ---------- helpers ----------

function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function today(): string {
  return localDay(new Date());
}
function num(v: unknown): number {
  return typeof v === "bigint" ? Number(v) : ((v as number) ?? 0);
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
    durationSec: num(r.duration_sec),
    cost: num(r.cost),
    provider: r.provider as string,
    transcript: r.transcript as string,
    startedAt: r.started_at as string,
    day: r.day as string,
  };
}

// ---------- agents repository ----------

const AGENT_COLS =
  "id,name,direction,template_id,template_name,status,voice,language,phone_number,greeting,objective,knowledge_base,rules_json,integrations_json,created_at";

function agentArgs(a: Agent): InArgs {
  return [
    a.id,
    a.name,
    a.direction,
    a.templateId,
    a.templateName,
    a.status,
    a.voice,
    a.language,
    a.phoneNumber,
    a.greeting,
    a.objective,
    a.knowledgeBase,
    JSON.stringify(a.rules),
    JSON.stringify(a.integrations),
    a.createdAt,
  ];
}

export async function listAgents(): Promise<Agent[]> {
  await ensureReady();
  const rs = await db.execute("SELECT * FROM agents ORDER BY created_at DESC");
  return rs.rows.map((r) => rowToAgent(r as Record<string, unknown>));
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  await ensureReady();
  const rs = await db.execute({ sql: "SELECT * FROM agents WHERE id = ?", args: [id] });
  return rs.rows[0] ? rowToAgent(rs.rows[0] as Record<string, unknown>) : undefined;
}

export async function addAgent(agent: Agent): Promise<Agent> {
  await ensureReady();
  await db.execute({
    sql: `INSERT INTO agents (${AGENT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: agentArgs(agent),
  });
  return agent;
}

export async function updateAgentStatus(
  id: string,
  status: Agent["status"]
): Promise<Agent | undefined> {
  await ensureReady();
  await db.execute({ sql: "UPDATE agents SET status = ? WHERE id = ?", args: [status, id] });
  return getAgent(id);
}

export async function deleteAgent(id: string): Promise<boolean> {
  await ensureReady();
  const rs = await db.execute({ sql: "DELETE FROM agents WHERE id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM calls WHERE agent_id = ?", args: [id] });
  return num(rs.rowsAffected) > 0;
}

// ---------- calls repository ----------

const CALL_COLS =
  "id,agent_id,direction,to_number,status,outcome,intent,collected_json,duration_sec,cost,provider,transcript,started_at,day";

function callArgs(c: Call): InArgs {
  return [
    c.id,
    c.agentId,
    c.direction,
    c.toNumber,
    c.status,
    c.outcome,
    c.intent,
    JSON.stringify(c.collected),
    c.durationSec,
    c.cost,
    c.provider,
    c.transcript,
    c.startedAt,
    c.day,
  ];
}

export async function insertCall(call: Call): Promise<Call> {
  await ensureReady();
  await db.execute({
    sql: `INSERT INTO calls (${CALL_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: callArgs(call),
  });
  return call;
}

export async function listCalls(agentId?: string, limit = 25): Promise<Call[]> {
  await ensureReady();
  const rs = agentId
    ? await db.execute({
        sql: "SELECT * FROM calls WHERE agent_id = ? ORDER BY started_at DESC LIMIT ?",
        args: [agentId, limit],
      })
    : await db.execute({
        sql: "SELECT * FROM calls ORDER BY started_at DESC LIMIT ?",
        args: [limit],
      });
  return rs.rows.map((r) => rowToCall(r as Record<string, unknown>));
}

export function makeDay(iso: string): string {
  return localDay(new Date(iso));
}

// ---------- metrics & stats (computed from rows) ----------

export async function agentMetrics(agentId: string): Promise<AgentMetrics> {
  await ensureReady();
  const d = today();
  const rs = await db.execute({
    sql: `SELECT COUNT(*) AS calls,
                 SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) AS conv,
                 AVG(cost) AS avgcost
          FROM calls WHERE agent_id = ? AND day = ?`,
    args: [agentId, d],
  });
  const r = rs.rows[0] as Record<string, unknown>;
  const calls = num(r.calls);
  return {
    callsToday: calls,
    conversionRate: calls ? Math.round((num(r.conv) / calls) * 1000) / 10 : 0,
    avgCostPerCall: r.avgcost != null ? Math.round(num(r.avgcost) * 100) / 100 : 0,
  };
}

export async function listAgentsWithMetrics(): Promise<AgentWithMetrics[]> {
  const agents = await listAgents();
  return Promise.all(
    agents.map(async (a) => ({ ...a, ...(await agentMetrics(a.id)) }))
  );
}

async function dayStats(day: string) {
  const rs = await db.execute({
    sql: `SELECT COUNT(*) AS calls,
                 SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) AS conv,
                 AVG(cost) AS avgcost
          FROM calls WHERE day = ?`,
    args: [day],
  });
  const r = rs.rows[0] as Record<string, unknown>;
  return { calls: num(r.calls), conv: num(r.conv), avgcost: num(r.avgcost) };
}

function pctChange(now: number, prev: number): number {
  if (!prev) return now ? 100 : 0;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

export async function computeStats(): Promise<PlatformStats> {
  await ensureReady();
  const now = new Date();
  const d0 = localDay(now);
  const d1 = localDay(new Date(now.getTime() - 86400000));
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const t = await dayStats(d0);
  const y = await dayStats(d1);

  const active = num(
    (
      await db.execute("SELECT COUNT(*) AS c FROM agents WHERE status = 'active'")
    ).rows[0]?.c
  );
  const newThisWeek = num(
    (
      await db.execute({
        sql: "SELECT COUNT(*) AS c FROM agents WHERE created_at >= ?",
        args: [weekAgo.toISOString()],
      })
    ).rows[0]?.c
  );
  const liveCalls = num(
    (
      await db.execute("SELECT COUNT(*) AS c FROM calls WHERE status = 'in_progress'")
    ).rows[0]?.c
  );

  const convRate = t.calls ? Math.round((t.conv / t.calls) * 1000) / 10 : 0;
  const yConvRate = y.calls ? (y.conv / y.calls) * 100 : 0;

  return {
    activeAgents: active,
    activeAgentsDeltaWeek: newThisWeek,
    callsToday: t.calls,
    callsDeltaPct: pctChange(t.calls, y.calls),
    conversionRate: convRate,
    conversionDeltaPct: Math.round((convRate - yConvRate) * 10) / 10,
    avgCostPerCall: Math.round(t.avgcost * 100) / 100,
    costDeltaPct: pctChange(Math.round(t.avgcost * 100), Math.round(y.avgcost * 100)),
    liveCallsNow: liveCalls,
    agentsLive: active,
    conversionsToday: t.conv,
  };
}

export interface DaySeries {
  label: string;
  day: string;
  calls: number;
  conversions: number;
}

export async function analyticsSeries(days = 7): Promise<DaySeries[]> {
  await ensureReady();
  const out: DaySeries[] = [];
  const now = new Date();
  const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const day = localDay(d);
    const s = await dayStats(day);
    out.push({ label: WEEKDAY[d.getDay()], day, calls: s.calls, conversions: s.conv });
  }
  return out;
}

// ---------- seeding (creates real rows on first boot) ----------

function randomOutcome(convProbability: number): CallOutcome {
  const r = Math.random();
  if (r < convProbability) return "converted";
  const rest = ["rescheduled", "not_interested", "no_answer", "voicemail"] as CallOutcome[];
  return rest[Math.floor(Math.random() * rest.length)];
}

// Kept modest so first-boot seeding is fast even over a network database.
function buildCalls(
  agentId: string,
  direction: Direction,
  todayCount: number,
  convProbability: number,
  baseCost: number
): Call[] {
  const now = new Date();
  const shape = [1, 0.85, 0.95, 0.63, 0.9, 0.85, 0.72]; // today .. 6 days ago
  const rows: Call[] = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const count = Math.round(todayCount * shape[dayOffset]);
    const dayDate = new Date(now.getTime() - dayOffset * 86400000);
    const day = localDay(dayDate);
    for (let i = 0; i < count; i++) {
      const startedAt = new Date(
        dayDate.getTime() - Math.floor(Math.random() * 8 * 3600000)
      ).toISOString();
      const outcome = randomOutcome(convProbability);
      const cost = Math.max(
        0.05,
        Math.round((baseCost + (Math.random() - 0.5) * 0.1) * 100) / 100
      );
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
        cost,
        provider: "simulator",
        transcript: "",
        startedAt,
        day,
      });
    }
  }
  // A few live calls today for the Live Monitor.
  if (direction === "outbound") {
    for (let i = 0; i < 9; i++) {
      rows.push({
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
  }
  return rows;
}

async function insertCallsChunked(rows: Call[]) {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    await db.batch(
      slice.map((c) => ({
        sql: `INSERT INTO calls (${CALL_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: callArgs(c),
      })),
      "write"
    );
  }
}

async function seed() {
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
  await db.batch(
    seedAgents.map((a) => ({
      sql: `INSERT INTO agents (${AGENT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: agentArgs(a),
    })),
    "write"
  );

  await insertCallsChunked(buildCalls("agt_appt_reminders", "outbound", 120, 0.246, 0.36));
  await insertCallsChunked(buildCalls("agt_recruit_screen", "outbound", 48, 0.246, 0.5));
}
