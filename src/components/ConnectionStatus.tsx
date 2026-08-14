"use client";

import { useEffect, useState } from "react";
import { Database, Sparkles, Mic, PhoneCall } from "lucide-react";
import type { FeatureFlags } from "@/lib/config";

export default function ConnectionStatus() {
  const [f, setF] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setF(d.features))
      .catch(() => {});
  }, []);

  if (!f) return null;

  return (
    <div className="card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        {f.voice ? "Live phone calls enabled" : "Live in-browser voice"}
      </span>
      <span className="text-xs text-slate-500">
        {f.voice
          ? "Placing real calls via your voice provider."
          : "Open any agent and press “Start voice call” to talk to it live. Add a Vapi key to also dial real phones."}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Chip icon={<Database className="h-3.5 w-3.5" />} label="Database" on={f.database} detail="SQLite / Turso" />
        <Chip icon={<Sparkles className="h-3.5 w-3.5" />} label="AI" on={f.llm} detail={f.llm ? f.model : "built-in parser"} />
        <Chip icon={<Mic className="h-3.5 w-3.5" />} label="Browser voice" on detail="ready" />
        <Chip icon={<PhoneCall className="h-3.5 w-3.5" />} label="Phone calls" on={f.voice} detail={f.voice ? "Vapi connected" : "add Vapi key"} />
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  on,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  detail: string;
}) {
  return (
    <span
      className={`pill ${on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
      title={detail}
    >
      {icon}
      {label}
    </span>
  );
}
