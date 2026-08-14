"use client";

import { useState } from "react";

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0f0e17]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {lang ?? "code"}
        </span>
        <button
          onClick={copy}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
