/**
 * Minimal demo authentication. This is a simple shared-login gate so you can
 * protect a public demo and share test credentials — NOT a full user system.
 *
 * Edge-safe: only reads environment variables (works inside middleware).
 * Credentials and the session secret are configurable via .env.
 */

export const AUTH_COOKIE = "va_session";

export function demoEmail(): string {
  return process.env.DEMO_EMAIL?.trim() || "demo@voiceagentos.dev";
}

export function demoPassword(): string {
  return process.env.DEMO_PASSWORD?.trim() || "demo1234";
}

/** The value stored in the session cookie. Change AUTH_SECRET in production. */
export function sessionToken(): string {
  return process.env.AUTH_SECRET?.trim() || "va-demo-session-change-me";
}

export function credentialsMatch(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === demoEmail().toLowerCase() &&
    password === demoPassword()
  );
}
