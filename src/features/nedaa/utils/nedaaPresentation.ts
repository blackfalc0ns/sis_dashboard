import type {
  NedaaGate,
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

export function getNedaaOrderedGates(gates: NedaaGate[]): NedaaGate[] {
  return [...gates].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.nameEn.localeCompare(right.nameEn),
  );
}

export function getNedaaActivePickupGates(gates: NedaaGate[]): NedaaGate[] {
  return getNedaaOrderedGates(gates).filter(
    (gate) => gate.isActive && gate.supportsPickup,
  );
}

export function getNedaaDefaultGateOptions(gates: NedaaGate[]): NedaaGate[] {
  return getNedaaOrderedGates(gates).filter(
    (gate) => gate.isActive && gate.supportsPickup,
  );
}

export function humanizeNedaaGateId(gateId: NedaaGateId): string {
  const normalized = gateId.trim();

  if (!normalized) {
    return "Gate";
  }

  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getNedaaGateLabel(
  gateId: NedaaGateId,
  gates: NedaaGate[],
  locale: string,
): string {
  const gate = gates.find((item) => item.id === gateId);

  if (!gate) {
    return humanizeNedaaGateId(gateId);
  }

  return locale === "ar" ? gate.nameAr : gate.nameEn;
}

export function getNedaaGateOptionIds(
  gates: NedaaGate[],
  requestGateIds: NedaaGateId[] = [],
): NedaaGateId[] {
  const knownGateIds = getNedaaOrderedGates(gates).map((gate) => gate.id);
  const extras = requestGateIds.filter((gateId) => !knownGateIds.includes(gateId));

  return [...knownGateIds, ...extras];
}

export function createNedaaGateIdFromName(nameEn: string): string {
  return nameEn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}