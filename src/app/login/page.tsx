"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<{ email: string; password: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/demo")
      .then((r) => r.json())
      .then((d) => setHint({ email: d.email, password: d.password }))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Sign in failed.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    if (hint) {
      setEmail(hint.email);
      if (hint.password) setPassword(hint.password);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg shadow-pop">
            🎙️
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">Voice Agent OS</span>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back — sign in to your dashboard.</p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {hint?.password && (
            <div className="mt-5 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-3 text-sm">
              <div className="font-semibold text-brand-700">🔑 Demo credentials</div>
              <div className="mt-1 text-slate-600">
                <div>
                  Email: <code className="text-slate-800">{hint.email}</code>
                </div>
                <div>
                  Password: <code className="text-slate-800">{hint.password}</code>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
              >
                Fill these in →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
