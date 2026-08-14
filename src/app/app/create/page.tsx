import { Suspense } from "react";
import CreateAgentWizard from "@/components/CreateAgentWizard";

export default function CreatePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create Agent
        </h1>
        <p className="text-sm text-slate-500">
          Pick a template, configure it, set your rules, and deploy — no code required.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
        <CreateAgentWizard />
      </Suspense>
    </div>
  );
}
