"use client";

import { useEffect, useState } from "react";
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
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            f.demoMode ? "bg-amber-400" : "bg-emerald-500"
          }`}
        />
        {f.demoMode ? "Demo mode" : "Live mode"}
      </span>
      <span className="text-xs text-slate-500">
        {f.demoMode
          ? "Calls are simulated. Add a VAPI_API_KEY in .env to place real calls."
          : "Placing real calls."}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Chip label="Database" on={f.database} detail="SQLite" />
        <Chip label="AI (Claude)" on={f.llm} detail={f.llm ? f.model : "built-in parser"} />
        <Chip label="Voice (Vapi)" on={f.voice} detail={f.voice ? "connected" : "simulated"} />
      </div>
    </div>
  );
}

function Chip({ label, on, detail }: { label: string; on: boolean; detail: string }) {
  return (
    <span
      className={`pill ${
        on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
      title={detail}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-slate-400"}`} />
      {label}: {on ? "on" : "off"}
    </span>
  );
}
