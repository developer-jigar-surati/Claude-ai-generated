import {
  TrendingUp,
  CalendarClock,
  CreditCard,
  RefreshCw,
  ClipboardList,
  Ticket,
  UserSearch,
  Target,
  Headphones,
  BellRing,
  ShoppingCart,
  Inbox,
  PhoneOutgoing,
  PhoneIncoming,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { Direction } from "@/lib/types";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "sales-outreach": TrendingUp,
  "appointment-reminder": CalendarClock,
  "payment-collections": CreditCard,
  "winback-renewal": RefreshCw,
  "post-purchase-survey": ClipboardList,
  "event-invitation": Ticket,
  "recruiting-screener": UserSearch,
  "lead-qualification-bant": Target,
  "inbound-support": Headphones,
  "inbound-receptionist": BellRing,
  "inbound-order": ShoppingCart,
  "inbound-lead-capture": Inbox,
};

export function TemplateIcon({
  templateId,
  className = "h-5 w-5",
}: {
  templateId: string;
  className?: string;
}) {
  const Icon = TEMPLATE_ICONS[templateId] || Bot;
  return <Icon className={className} />;
}

export function DirectionIcon({
  direction,
  className = "h-5 w-5",
}: {
  direction: Direction;
  className?: string;
}) {
  const Icon = direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
  return <Icon className={className} />;
}
