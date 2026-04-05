import type {
  NedaaGateId,
  NedaaStatus,
  NedaaTimelineEvent,
} from "@/features/nedaa/types/nedaa";

export const NEDAA_ACTIVE_STATUSES: NedaaStatus[] = [
  "pending",
  "acknowledged",
  "preparing",
  "ready",
];

export const NEDAA_ALL_STATUSES: NedaaStatus[] = [
  "pending",
  "acknowledged",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export const NEDAA_GATE_OPTIONS: NedaaGateId[] = [
  "main_gate",
  "north_gate",
  "south_gate",
  "staff_gate",
];

export function isNedaaActiveStatus(status: NedaaStatus): boolean {
  return NEDAA_ACTIVE_STATUSES.includes(status);
}

export function formatNedaaMinutes(minutes: number, locale: string): string {
  const rounded = Math.round(minutes);
  return locale === "ar" ? `${rounded} دقيقة` : `${rounded} min`;
}

export function getNedaaActionStatuses(status: NedaaStatus): NedaaStatus[] {
  switch (status) {
    case "pending":
      return ["acknowledged", "cancelled"];
    case "acknowledged":
      return ["preparing", "cancelled"];
    case "preparing":
      return ["ready", "cancelled"];
    case "ready":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}

export function getNedaaTimelineLabelKey(event: NedaaTimelineEvent): string {
  if (event.type === "status_changed" && event.status) {
    return `timeline.status_${event.status}`;
  }

  switch (event.type) {
    case "created":
      return "timeline.created";
    case "notification_sent":
      return "timeline.notification_sent";
    case "notification_skipped":
      return "timeline.notification_skipped";
    case "unauthorized_attempt":
      return "timeline.unauthorized_attempt";
    default:
      return "timeline.updated";
  }
}
