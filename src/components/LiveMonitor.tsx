"use client";

interface Props {
  liveCalls: number;
  agentsLive: number;
  conversions: number;
}

// A lightweight animated "equalizer" that reads as a live audio waveform.
const BARS = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 1, 0.8, 0.55, 0.95, 0.6, 0.85, 0.45, 1, 0.7, 0.9, 0.5, 0.8];

export default function LiveMonitor({ liveCalls, agentsLive, conversions }: Props) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-[#2a1f57] to-[#140f2e] p-5 text-white shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/90">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live Operations Monitor
        </span>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/60">
          System nominal
        </span>
      </div>

      <div className="my-4 flex h-14 items-center justify-center gap-[3px]">
        {BARS.map((h, i) => (
          <span
            key={i}
            className="w-1.5 origin-center rounded-full bg-white/80 animate-eq"
            style={{
              height: `${h * 100}%`,
              animationDelay: `${(i % 6) * 0.12}s`,
              animationDuration: `${0.8 + (i % 4) * 0.15}s`,
            }}
          />
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Active calls now" value={liveCalls} />
        <Row label="Agents live" value={agentsLive} />
        <Row label="Today's conversions" value={conversions} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
