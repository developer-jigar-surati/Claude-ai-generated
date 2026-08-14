import { Integration } from "./types";

/**
 * Enterprise integrations catalog. Connecting these is what makes a voice
 * agent "production-ready" — it can read/write records in your CRM/ERP,
 * check availability on calendars, and place calls over your telephony.
 */
export const INTEGRATIONS: Integration[] = [
  { id: "salesforce", name: "Salesforce", kind: "crm", connected: true },
  { id: "hubspot", name: "HubSpot", kind: "crm", connected: false },
  { id: "zoho", name: "Zoho CRM", kind: "crm", connected: false },
  { id: "sap", name: "SAP ERP", kind: "erp", connected: true },
  { id: "gcal", name: "Google Calendar", kind: "calendar", connected: true },
  { id: "outlook", name: "Outlook Calendar", kind: "calendar", connected: false },
  { id: "twilio", name: "Twilio", kind: "telephony", connected: true },
  { id: "zendesk", name: "Zendesk", kind: "helpdesk", connected: false },
];

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export const INTEGRATION_KIND_LABEL: Record<Integration["kind"], string> = {
  crm: "CRM",
  erp: "ERP",
  calendar: "Calendar",
  telephony: "Telephony",
  helpdesk: "Helpdesk",
};
