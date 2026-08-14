import { INTEGRATIONS, INTEGRATION_KIND_LABEL } from "@/lib/integrations";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-slate-500">Workspace, defaults, and connected systems.</p>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Workspace</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Workspace name</label>
            <input className="input" defaultValue="Acme Corp" />
          </div>
          <div>
            <label className="label">Default caller ID</label>
            <input className="input" defaultValue="+1 (415) 555-0100" />
          </div>
          <div>
            <label className="label">Default business hours</label>
            <input className="input" defaultValue="09:00 – 18:00" />
          </div>
          <div>
            <label className="label">Default timezone handling</label>
            <input className="input" defaultValue="Respect customer timezone" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
          Connected systems
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          CRM, ERP, calendars, and telephony that your agents can read from and write to.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {INTEGRATIONS.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-white/10">
                {it.name.slice(0, 2)}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {it.name}
                </div>
                <div className="text-xs text-slate-500">{INTEGRATION_KIND_LABEL[it.kind]}</div>
              </div>
              <span
                className={`pill ${
                  it.connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {it.connected ? "Connected" : "Connect"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
