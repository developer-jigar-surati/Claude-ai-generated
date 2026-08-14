/**
 * A tiny, dependency-free intent parser that demonstrates the
 * "Intelligent Call Rescheduling" capability. In production this is the
 * LLM's structured output; here we approximate it so the demo is tangible.
 */

export interface RescheduleIntent {
  intent: "reschedule" | "not_interested" | "confirm" | "callback_unspecified" | "unknown";
  /** minutes from now to call back, when determinable */
  delayMinutes?: number;
  reason: string;
}

const UNIT_MINUTES: Record<string, number> = {
  min: 1,
  minute: 1,
  minutes: 1,
  hour: 60,
  hours: 60,
  hr: 60,
  hrs: 60,
  day: 60 * 24,
  days: 60 * 24,
};

export function detectIntent(raw: string): RescheduleIntent {
  const text = raw.toLowerCase().trim();
  if (!text) return { intent: "unknown", reason: "No speech detected." };

  if (/\b(not interested|stop calling|remove me|do not call|don'?t call)\b/.test(text)) {
    return { intent: "not_interested", reason: "Customer opted out — added to Do-Not-Call." };
  }

  if (/\b(yes|confirmed?|that works|sounds good|sure|okay|ok)\b/.test(text) && !/\b(later|after|call)\b/.test(text)) {
    return { intent: "confirm", reason: "Customer confirmed." };
  }

  // "call me after 30 minutes", "try again in 2 hours", "ring me back tomorrow"
  const m = text.match(/(?:after|in)\s+(\d+)\s*(minutes?|mins?|hours?|hrs?|days?)/);
  if (m) {
    const qty = parseInt(m[1], 10);
    const unitKey = m[2].replace(/s$/, "");
    const perUnit = UNIT_MINUTES[unitKey] ?? UNIT_MINUTES[m[2]] ?? 60;
    const delay = qty * perUnit;
    return {
      intent: "reschedule",
      delayMinutes: delay,
      reason: `Detected "call back in ${qty} ${m[2]}". Rescheduling the call.`,
    };
  }

  if (/\btomorrow\b/.test(text)) {
    return { intent: "reschedule", delayMinutes: 60 * 24, reason: 'Detected "tomorrow". Rescheduling ~24h out.' };
  }

  if (/\b(busy|later|call me back|call back|not now|another time)\b/.test(text)) {
    return {
      intent: "callback_unspecified",
      reason: "Customer wants a callback but gave no time — using the agent's default reschedule window.",
    };
  }

  return { intent: "unknown", reason: "Could not classify — routing to a human." };
}

export function formatDelay(minutes?: number): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) return `${Math.round((minutes / 60) * 10) / 10} h`;
  return `${Math.round((minutes / (60 * 24)) * 10) / 10} d`;
}
