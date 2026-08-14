import { AgentTemplate, CampaignRules } from "./types";

/**
 * The pre-configured agent catalog. Picking one of these is what lets a
 * business launch a production-style voice agent in under two minutes —
 * the prompt, greeting, objective and data-collection are all filled in.
 */
export const OUTBOUND_TEMPLATES: AgentTemplate[] = [
  {
    id: "sales-outreach",
    name: "Sales Outreach & Lead Gen",
    direction: "outbound",
    category: "Sales",
    description: "Warms up cold and warm leads, qualifies interest, and books meetings.",
    icon: "📈",
    greeting: "Hi, this is Aria from {company}. Do you have a quick minute to chat?",
    objective: "Qualify interest and book a discovery meeting.",
    collects: ["Interest level", "Budget range", "Preferred meeting slot"],
  },
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    direction: "outbound",
    category: "Operations",
    description: "Confirms, reschedules, or cancels upcoming appointments automatically.",
    icon: "📅",
    greeting: "Hello, this is a reminder about your appointment with {company} tomorrow.",
    objective: "Confirm or reschedule the upcoming appointment.",
    collects: ["Confirmation", "New preferred time", "Reason for change"],
  },
  {
    id: "payment-collections",
    name: "Payment / Collections Recovery",
    direction: "outbound",
    category: "Finance",
    description: "Reminds customers of overdue payments and offers repayment options.",
    icon: "💳",
    greeting: "Hi, this is {company} calling about your account. Is now a good time?",
    objective: "Recover overdue payment or set up a payment plan.",
    collects: ["Payment intent", "Repayment date", "Dispute reason"],
  },
  {
    id: "winback-renewal",
    name: "Customer Win-back & Renewal",
    direction: "outbound",
    category: "Retention",
    description: "Re-engages lapsed customers or drives contract/subscription renewals.",
    icon: "🔄",
    greeting: "Hi, this is {company}. We noticed your plan is up for renewal soon.",
    objective: "Renew the subscription or win back a lapsed customer.",
    collects: ["Renewal intent", "Objections", "Discount acceptance"],
  },
  {
    id: "post-purchase-survey",
    name: "Post-Purchase Survey & Feedback",
    direction: "outbound",
    category: "CX",
    description: "Collects satisfaction scores and open feedback after a purchase.",
    icon: "🗒️",
    greeting: "Hi, thanks for your recent purchase from {company}! Got a moment for two quick questions?",
    objective: "Capture CSAT score and qualitative feedback.",
    collects: ["CSAT score", "NPS", "Open feedback"],
  },
  {
    id: "event-invitation",
    name: "Event / Webinar Invitation",
    direction: "outbound",
    category: "Marketing",
    description: "Invites contacts to an event and captures RSVPs in real time.",
    icon: "🎟️",
    greeting: "Hi, this is {company} inviting you to our upcoming event. Interested?",
    objective: "Capture RSVP and send calendar invite.",
    collects: ["RSVP status", "Number of attendees", "Dietary/notes"],
  },
  {
    id: "recruiting-screener",
    name: "Recruiting Screener",
    direction: "outbound",
    category: "HR",
    description: "Runs a first-round phone screen and scores candidates against criteria.",
    icon: "🧑‍💼",
    greeting: "Hi, this is the recruiting team at {company}. Ready for a quick screening call?",
    objective: "Screen the candidate and score against role criteria.",
    collects: ["Experience", "Notice period", "Salary expectation", "Availability"],
  },
  {
    id: "lead-qualification-bant",
    name: "Lead Qualification (BANT)",
    direction: "outbound",
    category: "Sales",
    description: "Qualifies inbound leads on budget, authority, need, and timeline.",
    icon: "🎯",
    greeting: "Hi, thanks for reaching out to {company}. Let me ask a few quick questions.",
    objective: "Qualify the lead across Budget, Authority, Need, Timeline.",
    collects: ["Budget", "Authority", "Need", "Timeline"],
  },
];

export const INBOUND_TEMPLATES: AgentTemplate[] = [
  {
    id: "inbound-support",
    name: "24/7 Support Line",
    direction: "inbound",
    category: "Support",
    description: "Answers inbound support calls, resolves FAQs, and escalates when needed.",
    icon: "🎧",
    greeting: "Thanks for calling {company} support. How can I help you today?",
    objective: "Resolve the caller's issue or route to the right team.",
    collects: ["Issue type", "Account ID", "Urgency"],
  },
  {
    id: "inbound-receptionist",
    name: "AI Receptionist",
    direction: "inbound",
    category: "Operations",
    description: "Greets callers, answers questions, and books appointments.",
    icon: "🛎️",
    greeting: "Hello, you've reached {company}. How may I direct your call?",
    objective: "Answer questions and book or route the caller.",
    collects: ["Purpose", "Preferred time", "Contact details"],
  },
  {
    id: "inbound-order",
    name: "Order & Booking Desk",
    direction: "inbound",
    category: "Sales",
    description: "Takes orders and bookings over the phone and confirms details.",
    icon: "🛒",
    greeting: "Hi, welcome to {company}. Would you like to place an order or booking?",
    objective: "Capture the order/booking and confirm it.",
    collects: ["Items", "Delivery time", "Payment method"],
  },
  {
    id: "inbound-lead-capture",
    name: "Inbound Lead Capture",
    direction: "inbound",
    category: "Marketing",
    description: "Captures details from inbound marketing calls and qualifies them.",
    icon: "📥",
    greeting: "Thanks for calling {company}! Can I grab a few details to help you?",
    objective: "Capture and qualify the inbound lead.",
    collects: ["Name", "Interest", "Budget", "Timeline"],
  },
];

export const ALL_TEMPLATES = [...OUTBOUND_TEMPLATES, ...INBOUND_TEMPLATES];

export function getTemplate(id: string): AgentTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/** Sensible defaults for the rule-based scheduler, tuned per template. */
export function defaultRulesFor(templateId: string): CampaignRules {
  const base: CampaignRules = {
    businessHoursOnly: true,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    respectCustomerTimezone: true,
    reminderHoursBefore: 8,
    feedbackHoursAfter: 24,
    maxRetries: 2,
    rescheduleMinutes: 30,
  };
  if (templateId === "appointment-reminder") return { ...base, reminderHoursBefore: 8 };
  if (templateId === "post-purchase-survey") return { ...base, feedbackHoursAfter: 24, businessHoursOnly: true };
  if (templateId === "payment-collections") return { ...base, maxRetries: 3 };
  return base;
}
