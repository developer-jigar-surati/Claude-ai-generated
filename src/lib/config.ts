/**
 * Central configuration — reads everything from environment variables so a
 * non-technical user only ever edits a `.env` file (see `.env.example`).
 *
 * The app is fully functional with NO keys set (demo mode): calls are
 * simulated and intent detection uses a built-in parser. Add keys to switch
 * individual capabilities to "live".
 */
export const config = {
  // Brain — Anthropic (Claude) for intent detection & call analysis.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY?.trim() || "",
  anthropicModel: process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5",

  // Voice — Vapi handles the actual phone call (STT + TTS + telephony).
  vapiApiKey: process.env.VAPI_API_KEY?.trim() || "",
  vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID?.trim() || "",
  vapiBaseUrl: process.env.VAPI_BASE_URL?.trim() || "https://api.vapi.ai",

  // Telephony — Twilio (optional; Vapi can also manage numbers for you).
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN?.trim() || "",

  // Branding shown in the dashboard.
  workspaceName: process.env.WORKSPACE_NAME?.trim() || "Acme Corp",
};

export interface FeatureFlags {
  database: boolean;
  llm: boolean;
  voice: boolean;
  telephony: boolean;
  demoMode: boolean;
  workspaceName: string;
  model: string;
}

/** Non-secret capability flags — safe to expose to the browser. */
export function features(): FeatureFlags {
  const llm = !!config.anthropicApiKey;
  const voice = !!config.vapiApiKey;
  return {
    database: true, // SQLite is always available
    llm,
    voice,
    telephony: !!(config.twilioAccountSid && config.twilioAuthToken) || voice,
    // If no voice provider is configured, calls are simulated (still real DB rows).
    demoMode: !voice,
    workspaceName: config.workspaceName,
    model: config.anthropicModel,
  };
}
