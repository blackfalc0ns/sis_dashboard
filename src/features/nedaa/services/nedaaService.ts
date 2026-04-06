import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";
import type {
  NedaaContext,
  NedaaGate,
  NedaaGateId,
  NedaaGateStats,
  NedaaOverviewData,
  NedaaRequest,
  NedaaSettings,
  NedaaStatus,
  NedaaTimelineEvent,
} from "@/features/nedaa/types/nedaa";
import {
  NEDAA_ACTIVE_STATUSES,
  createNedaaGateIdFromName,
  getNedaaActivePickupGates,
  getNedaaOrderedGates,
  isNedaaActiveStatus,
} from "@/features/nedaa/utils/nedaaPresentation";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_NEDAA_GATES: NedaaGate[] = [
  {
    id: "main_gate",
    nameEn: "Main Gate",
    nameAr: "البوابة الرئيسية",
    locationHint: "Front reception entrance",
    sortOrder: 0,
    isActive: true,
    supportsPickup: true,
    isStaffOnly: false,
  },
  {
    id: "north_gate",
    nameEn: "North Gate",
    nameAr: "البوابة الشمالية",
    locationHint: "North parking drop-off lane",
    sortOrder: 1,
    isActive: true,
    supportsPickup: true,
    isStaffOnly: false,
  },
  {
    id: "south_gate",
    nameEn: "South Gate",
    nameAr: "البوابة الجنوبية",
    locationHint: "Bus lane exit",
    sortOrder: 2,
    isActive: true,
    supportsPickup: true,
    isStaffOnly: false,
  },
  {
    id: "staff_gate",
    nameEn: "Staff Gate",
    nameAr: "البوابة للموظفين",
    locationHint: "Administration block access",
    sortOrder: 3,
    isActive: false,
    supportsPickup: false,
    isStaffOnly: true,
  },
];

const DEFAULT_NEDAA_SETTINGS: NedaaSettings = {
  allowedRadiusMeters: 250,
  pickupStartTime: "13:15",
  pickupEndTime: "15:30",
  duplicateRequestCooldownMinutes: 7,
  autoCancelTimeoutMinutes: 25,
  gates: DEFAULT_NEDAA_GATES,
  defaultGateId: "main_gate",
  activeGates: DEFAULT_NEDAA_GATES.filter(
    (gate) => gate.isActive && gate.supportsPickup,
  ).map((gate) => gate.id),
};

type LegacyNedaaSettings = Omit<NedaaSettings, "gates"> & {
  gates?: NedaaGate[];
  activeGates?: NedaaGateId[];
};

type NedaaGatePayload = Omit<NedaaGate, "sortOrder"> & {
  sortOrder?: number;
};

let nedaaSettingsStore: LegacyNedaaSettings = cloneSettings(
  DEFAULT_NEDAA_SETTINGS,
);
let nedaaRequestsStore: NedaaRequest[] | null = null;

const statusSeed: NedaaStatus[] = [
  "pending",
  "acknowledged",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

function toIsoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function normalizeRelation(relation: string): string {
  return relation.toLowerCase() || "guardian";
}

function cloneGate(gate: NedaaGate): NedaaGate {
  return { ...gate };
}

function cloneTimelineEvent(event: NedaaTimelineEvent): NedaaTimelineEvent {
  return { ...event };
}

function cloneRequest(request: NedaaRequest): NedaaRequest {
  return {
    ...request,
    timeline: request.timeline.map(cloneTimelineEvent),
  };
}

function deriveActiveGateIds(gates: NedaaGate[]): NedaaGateId[] {
  return gates
    .filter((gate) => gate.isActive && gate.supportsPickup)
    .map((gate) => gate.id);
}

function cloneSettings(settings: NedaaSettings): NedaaSettings {
  const orderedGates = getNedaaOrderedGates(settings.gates).map(cloneGate);

  return {
    ...settings,
    gates: orderedGates,
    defaultGateId: settings.defaultGateId ?? null,
    activeGates: deriveActiveGateIds(orderedGates),
  };
}

function normalizeGate(gate: Partial<NedaaGate>, index: number): NedaaGate {
  const generatedId =
    gate.id?.trim() ||
    createNedaaGateIdFromName(gate.nameEn || "") ||
    `gate_${index + 1}`;
  const locationHint = gate.locationHint?.trim();

  return {
    id: generatedId,
    nameEn: gate.nameEn?.trim() || `Gate ${index + 1}`,
    nameAr: gate.nameAr?.trim() || `Ø¨ÙˆØ§Ø¨Ø© ${index + 1}`,
    locationHint: locationHint || undefined,
    sortOrder: typeof gate.sortOrder === "number" ? gate.sortOrder : index,
    isActive: Boolean(gate.isActive),
    supportsPickup:
      typeof gate.supportsPickup === "boolean" ? gate.supportsPickup : true,
    isStaffOnly: Boolean(gate.isStaffOnly),
  };
}

function resolveDefaultGateId(
  gates: NedaaGate[],
  preferred?: NedaaGateId | null,
): NedaaGateId | null {
  const activePickupGateIds = getNedaaActivePickupGates(gates).map(
    (gate) => gate.id,
  );

  if (preferred === null) {
    return null;
  }

  if (preferred && activePickupGateIds.includes(preferred)) {
    return preferred;
  }

  return activePickupGateIds[0] || null;
}

function normalizeSettings(
  settings?: LegacyNedaaSettings | null,
): NedaaSettings {
  const source = settings ?? DEFAULT_NEDAA_SETTINGS;
  const defaultGateMap = new Map(
    DEFAULT_NEDAA_GATES.map((gate) => [gate.id, gate] as const),
  );
  const sourceGates =
    Array.isArray(source.gates) && source.gates.length > 0
      ? source.gates
      : DEFAULT_NEDAA_GATES;
  const legacyActiveGates = Array.isArray(source.activeGates)
    ? new Set(source.activeGates)
    : null;
  const hasExplicitDefaultGate = Object.prototype.hasOwnProperty.call(
    source,
    "defaultGateId",
  );
  const gateMap = new Map<NedaaGateId, NedaaGate>();

  sourceGates.forEach((gate, index) => {
    const defaultGate = defaultGateMap.get(gate.id || "");
    const normalized = normalizeGate(
      {
        ...defaultGate,
        ...gate,
        isActive: legacyActiveGates
          ? legacyActiveGates.has(gate.id || defaultGate?.id || "")
          : (gate.isActive ?? defaultGate?.isActive),
        supportsPickup: gate.supportsPickup ?? defaultGate?.supportsPickup,
        isStaffOnly: gate.isStaffOnly ?? defaultGate?.isStaffOnly,
      },
      index,
    );

    gateMap.set(normalized.id, normalized);
  });

  const gates = getNedaaOrderedGates(Array.from(gateMap.values())).map(
    (gate, index) => ({
      ...gate,
      sortOrder: index,
    }),
  );

  return {
    allowedRadiusMeters:
      typeof source.allowedRadiusMeters === "number"
        ? source.allowedRadiusMeters
        : DEFAULT_NEDAA_SETTINGS.allowedRadiusMeters,
    pickupStartTime:
      source.pickupStartTime || DEFAULT_NEDAA_SETTINGS.pickupStartTime,
    pickupEndTime: source.pickupEndTime || DEFAULT_NEDAA_SETTINGS.pickupEndTime,
    duplicateRequestCooldownMinutes:
      typeof source.duplicateRequestCooldownMinutes === "number"
        ? source.duplicateRequestCooldownMinutes
        : DEFAULT_NEDAA_SETTINGS.duplicateRequestCooldownMinutes,
    autoCancelTimeoutMinutes:
      typeof source.autoCancelTimeoutMinutes === "number"
        ? source.autoCancelTimeoutMinutes
        : DEFAULT_NEDAA_SETTINGS.autoCancelTimeoutMinutes,
    gates,
    defaultGateId: resolveDefaultGateId(
      gates,
      hasExplicitDefaultGate ? (source.defaultGateId ?? null) : undefined,
    ),
    activeGates: deriveActiveGateIds(gates),
  };
}

function persistSettings(
  settings: LegacyNedaaSettings | NedaaSettings,
): NedaaSettings {
  const normalized = normalizeSettings(settings);
  nedaaSettingsStore = cloneSettings(normalized);
  return cloneSettings(normalized);
}

function getCurrentSettings(): NedaaSettings {
  return normalizeSettings(nedaaSettingsStore);
}

function getSeedGateIds(settings: NedaaSettings): NedaaGateId[] {
  const activePickupGateIds = getNedaaActivePickupGates(settings.gates).map(
    (gate) => gate.id,
  );

  if (activePickupGateIds.length > 0) {
    return activePickupGateIds;
  }

  const pickupGateIds = getNedaaOrderedGates(settings.gates)
    .filter((gate) => gate.supportsPickup)
    .map((gate) => gate.id);

  if (pickupGateIds.length > 0) {
    return pickupGateIds;
  }

  if (settings.defaultGateId) {
    return [settings.defaultGateId];
  }

  return DEFAULT_NEDAA_GATES.map((gate) => gate.id);
}

function resolveFallbackGateId(
  settings: NedaaSettings,
  preferred?: NedaaGateId | null,
): NedaaGateId | null {
  const configuredGateIds = new Set(settings.gates.map((gate) => gate.id));

  if (preferred && configuredGateIds.has(preferred)) {
    return preferred;
  }

  if (settings.defaultGateId && configuredGateIds.has(settings.defaultGateId)) {
    return settings.defaultGateId;
  }

  return getSeedGateIds(settings)[0] || null;
}

function normalizeRequestGateId(
  gateId: NedaaGateId,
  settings: NedaaSettings,
): NedaaGateId {
  if (settings.gates.some((gate) => gate.id === gateId)) {
    return gateId;
  }

  return resolveFallbackGateId(settings, null) || gateId;
}

function isSameDay(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function calculateAverageHandlingTime(requests: NedaaRequest[]): number {
  if (requests.length === 0) {
    return 0;
  }

  const totalMinutes = requests.reduce((sum, request) => {
    const createdAt = new Date(request.createdAt).getTime();
    const updatedAt = new Date(request.updatedAt).getTime();
    return sum + Math.max(0, updatedAt - createdAt) / (1000 * 60);
  }, 0);

  return Math.round(totalMinutes / requests.length);
}

function buildTimeline(
  requestId: string,
  status: NedaaStatus,
  guardian: StudentGuardian,
  note?: string,
): NedaaTimelineEvent[] {
  const timeline: NedaaTimelineEvent[] = [
    {
      id: `${requestId}-created`,
      requestId,
      type: "created",
      actor: "Guardian App",
      timestamp: toIsoMinutesAgo(5),
      note,
    },
  ];

  timeline.push({
    id: `${requestId}-notification`,
    requestId,
    type: guardian.can_receive_notifications
      ? "notification_sent"
      : "notification_skipped",
    actor: "Nedaa System",
    timestamp: toIsoMinutesAgo(4),
    note: guardian.can_receive_notifications
      ? undefined
      : "guardian_notifications_disabled",
  });

  const pushStatusEvent = (
    eventStatus: NedaaStatus,
    minutesAgo: number,
    nextNote?: string,
  ) => {
    timeline.push({
      id: `${requestId}-${eventStatus}`,
      requestId,
      type: "status_changed",
      status: eventStatus,
      actor: eventStatus === "completed" ? "Gate Operator" : "Front Desk",
      timestamp: toIsoMinutesAgo(minutesAgo),
      note: nextNote,
    });
  };

  if (!guardian.can_pickup) {
    timeline.push({
      id: `${requestId}-blocked`,
      requestId,
      type: "unauthorized_attempt",
      actor: "Security Desk",
      timestamp: toIsoMinutesAgo(3),
      note: "guardian_not_authorized_for_pickup",
    });
  }

  switch (status) {
    case "acknowledged":
      pushStatusEvent("acknowledged", 3);
      break;
    case "preparing":
      pushStatusEvent("acknowledged", 4);
      pushStatusEvent("preparing", 3);
      break;
    case "ready":
      pushStatusEvent("acknowledged", 6);
      pushStatusEvent("preparing", 5);
      pushStatusEvent("ready", 2);
      break;
    case "completed":
      pushStatusEvent("acknowledged", 14);
      pushStatusEvent("preparing", 11);
      pushStatusEvent("ready", 6);
      pushStatusEvent("completed", 1);
      break;
    case "cancelled":
      pushStatusEvent(
        "cancelled",
        2,
        guardian.can_pickup
          ? "pickup_request_cancelled"
          : "blocked_unauthorized_attempt",
      );
      break;
    default:
      break;
  }

  return timeline.sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

async function buildSeedRequest(
  student: StudentWithEnrollmentContext,
  guardian: StudentGuardian,
  index: number,
  settings: NedaaSettings,
): Promise<NedaaRequest> {
  const id = `NED-${(1001 + index).toString()}`;
  const baseStatus = statusSeed[index % statusSeed.length];
  const gateIds = getSeedGateIds(settings);
  const gate =
    gateIds[index % Math.max(gateIds.length, 1)] ||
    resolveFallbackGateId(settings) ||
    settings.gates[0]?.id ||
    "gate_1";
  const distanceMeters = 80 + (index % 5) * 55;
  const insideZone = distanceMeters <= settings.allowedRadiusMeters;
  const canPickup = index % 7 === 0 ? false : guardian.can_pickup;
  const note = !canPickup
    ? "Guardian attempted pickup without permission."
    : insideZone
      ? undefined
      : "Guardian is still outside the configured pickup radius.";

  const status =
    !canPickup && baseStatus !== "completed" ? "cancelled" : baseStatus;
  const createdAt = toIsoMinutesAgo(12 + index * 9);
  const updatedAt =
    status === "completed" || status === "cancelled"
      ? toIsoMinutesAgo(Math.max(1, index * 2))
      : toIsoMinutesAgo(Math.max(1, 6 - (index % 4)));

  return {
    id,
    studentId: student.id,
    studentName: student.full_name_en,
    guardianId: guardian.guardianId,
    guardianName: guardian.full_name,
    guardianRelation: normalizeRelation(guardian.relation),
    gate,
    status,
    createdAt,
    updatedAt,
    canPickup,
    canReceiveNotifications: guardian.can_receive_notifications,
    note,
    distanceMeters,
    insideZone,
    timeline: buildTimeline(
      id,
      status,
      { ...guardian, can_pickup: canPickup },
      note,
    ),
  };
}

async function ensureSeededRequests(): Promise<NedaaRequest[]> {
  if (nedaaRequestsStore) {
    return nedaaRequestsStore;
  }

  const settings = getCurrentSettings();
  const students = await studentsService.fetchStudentsWithEnrollment();
  const candidateStudents = students.slice(0, 18);

  const requests = await Promise.all(
    candidateStudents.map(async (student, index) => {
      const guardians = await studentsService.fetchStudentGuardians(student.id);
      const guardian =
        guardians[index % Math.max(guardians.length, 1)] ??
        (await studentsService.fetchPrimaryGuardian(student.id));

      if (!guardian) {
        return null;
      }

      return buildSeedRequest(student, guardian, index, settings);
    }),
  );

  nedaaRequestsStore = requests
    .filter((request): request is NedaaRequest => request !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );

  return nedaaRequestsStore;
}

function withNormalizedGate(
  request: NedaaRequest,
  settings: NedaaSettings,
): NedaaRequest {
  return cloneRequest({
    ...request,
    gate: normalizeRequestGateId(request.gate, settings),
  });
}

async function getScopedRequests(
  context?: NedaaContext,
): Promise<NedaaRequest[]> {
  const settings = getCurrentSettings();
  const requests = (await ensureSeededRequests()).map((request) =>
    withNormalizedGate(request, settings),
  );

  if (!context?.yearId && !context?.termId) {
    return requests;
  }

  const scopedStudents =
    await studentsService.fetchStudentsWithEnrollmentForContext(
      context?.yearId,
      context?.termId,
    );
  const scopedIds = new Set(scopedStudents.map((student) => student.id));

  return requests.filter((request) => scopedIds.has(request.studentId));
}

function buildGateStats(
  requests: NedaaRequest[],
  settings: NedaaSettings,
): NedaaGateStats[] {
  const today = new Date();

  return getNedaaActivePickupGates(settings.gates).map((gate) => {
    const gateRequests = requests.filter((request) => request.gate === gate.id);
    const completedTodayRequests = gateRequests.filter(
      (request) =>
        request.status === "completed" && isSameDay(request.updatedAt, today),
    );

    return {
      gate: cloneGate(gate),
      waitingCount: gateRequests.filter((request) =>
        ["pending", "acknowledged"].includes(request.status),
      ).length,
      preparingCount: gateRequests.filter(
        (request) => request.status === "preparing",
      ).length,
      readyCount: gateRequests.filter((request) => request.status === "ready")
        .length,
      completedToday: completedTodayRequests.length,
      avgHandlingTimeMinutes: calculateAverageHandlingTime(
        gateRequests.filter((request) => request.status === "completed"),
      ),
      activeRequests: gateRequests.filter((request) =>
        isNedaaActiveStatus(request.status),
      ).length,
    };
  });
}

function syncRequestsWithDeletedGate(
  deletedGateId: NedaaGateId,
  settings: NedaaSettings,
) {
  if (!nedaaRequestsStore) {
    return;
  }

  const fallbackGateId = resolveFallbackGateId(settings, null);

  nedaaRequestsStore = nedaaRequestsStore.map((request) => {
    if (request.gate !== deletedGateId) {
      return request;
    }

    return {
      ...request,
      gate: fallbackGateId || request.gate,
    };
  });
}

export async function seedNedaaRequestsFromGuardians(): Promise<
  NedaaRequest[]
> {
  const settings = getCurrentSettings();
  const requests = await ensureSeededRequests();
  return requests.map((request) => withNormalizedGate(request, settings));
}

export async function fetchNedaaOverview(
  context?: NedaaContext,
): Promise<NedaaOverviewData> {
  await delay();

  const settings = getCurrentSettings();
  const requests = await getScopedRequests(context);
  const today = new Date();
  const activeRequests = requests.filter((request) =>
    NEDAA_ACTIVE_STATUSES.includes(request.status),
  );
  const completedToday = requests.filter(
    (request) =>
      request.status === "completed" && isSameDay(request.updatedAt, today),
  );
  const cancelledToday = requests.filter(
    (request) =>
      request.status === "cancelled" && isSameDay(request.updatedAt, today),
  );
  const blockedAttempts = requests.filter(
    (request) => !request.canPickup || request.insideZone === false,
  );

  return {
    stats: {
      activeRequests: activeRequests.length,
      avgPickupTimeMinutes: calculateAverageHandlingTime(
        requests.filter((request) => request.status === "completed"),
      ),
      completedToday: completedToday.length,
      cancelledToday: cancelledToday.length,
      blockedAttempts: blockedAttempts.length,
    },
    latestRequests: requests.slice(0, 5),
    gates: buildGateStats(requests, settings),
  };
}

export async function fetchNedaaRequests(
  context?: NedaaContext,
): Promise<NedaaRequest[]> {
  await delay();
  return getScopedRequests(context);
}

export async function fetchNedaaGateBoard(
  context?: NedaaContext,
): Promise<NedaaGateStats[]> {
  await delay();
  const settings = getCurrentSettings();
  const requests = await getScopedRequests(context);
  return buildGateStats(requests, settings);
}

export async function fetchNedaaHistory(
  context?: NedaaContext,
): Promise<NedaaRequest[]> {
  await delay();
  const requests = await getScopedRequests(context);
  return requests.filter((request) =>
    ["completed", "cancelled"].includes(request.status),
  );
}

export async function fetchNedaaSettings(): Promise<NedaaSettings> {
  await delay();
  return cloneSettings(getCurrentSettings());
}

export async function saveNedaaSettings(
  settings: NedaaSettings,
): Promise<NedaaSettings> {
  await delay();

  const savedSettings = persistSettings(settings);

  // TODO: Replace this mock in-memory settings persistence with Nedaa settings API wiring.
  return cloneSettings(savedSettings);
}

export async function createNedaaGate(
  payload: NedaaGatePayload,
): Promise<NedaaGate> {
  await delay();

  const current = getCurrentSettings();
  const nextId =
    payload.id.trim() || createNedaaGateIdFromName(payload.nameEn) || "gate";

  if (current.gates.some((gate) => gate.id === nextId)) {
    throw new Error("nedaa_gate_duplicate_id");
  }

  const nextGate = normalizeGate(
    {
      ...payload,
      id: nextId,
      sortOrder: current.gates.length,
    },
    current.gates.length,
  );

  const savedSettings = persistSettings({
    ...current,
    gates: [...current.gates, nextGate],
    defaultGateId:
      current.defaultGateId === undefined
        ? nextGate.isActive && nextGate.supportsPickup
          ? nextGate.id
          : null
        : (current.defaultGateId ?? null),
  });

  // TODO: Replace this mock gate creation with a dedicated Nedaa gates API endpoint.
  return cloneGate(
    savedSettings.gates.find((gate) => gate.id === nextGate.id) || nextGate,
  );
}

export async function updateNedaaGate(
  gateId: NedaaGateId,
  payload: Partial<Omit<NedaaGate, "id">>,
): Promise<NedaaGate> {
  await delay();

  const current = getCurrentSettings();
  const currentGate = current.gates.find((gate) => gate.id === gateId);

  if (!currentGate) {
    throw new Error("nedaa_gate_not_found");
  }

  const savedSettings = persistSettings({
    ...current,
    gates: current.gates.map((gate) =>
      gate.id === gateId
        ? normalizeGate(
            {
              ...gate,
              ...payload,
              id: gate.id,
              sortOrder: gate.sortOrder,
            },
            gate.sortOrder,
          )
        : gate,
    ),
  });

  // TODO: Replace this mock gate update with a dedicated Nedaa gates API endpoint.
  return cloneGate(
    savedSettings.gates.find((gate) => gate.id === gateId) || currentGate,
  );
}

export async function deleteNedaaGate(
  gateId: NedaaGateId,
): Promise<NedaaSettings> {
  await delay();

  const current = getCurrentSettings();
  const nextGates = current.gates.filter((gate) => gate.id !== gateId);

  if (nextGates.length === current.gates.length) {
    throw new Error("nedaa_gate_not_found");
  }

  const savedSettings = persistSettings({
    ...current,
    gates: nextGates,
    defaultGateId:
      current.defaultGateId === gateId ? null : (current.defaultGateId ?? null),
  });

  syncRequestsWithDeletedGate(gateId, savedSettings);

  // TODO: Replace this mock gate deletion with a dedicated Nedaa gates API endpoint.
  return cloneSettings(savedSettings);
}

export async function toggleNedaaGateActive(
  gateId: NedaaGateId,
): Promise<NedaaGate> {
  await delay();

  const current = getCurrentSettings();
  const currentGate = current.gates.find((gate) => gate.id === gateId);

  if (!currentGate) {
    throw new Error("nedaa_gate_not_found");
  }

  const updatedGate = await updateNedaaGate(gateId, {
    isActive: !currentGate.isActive,
  });

  // TODO: Replace this mock gate activation toggle with a dedicated Nedaa gates API endpoint.
  return updatedGate;
}

export async function reorderNedaaGates(
  gateIds: NedaaGateId[],
): Promise<NedaaSettings> {
  await delay();

  const current = getCurrentSettings();
  const orderedIds = gateIds.filter((gateId) =>
    current.gates.some((gate) => gate.id === gateId),
  );
  const remainingIds = current.gates
    .map((gate) => gate.id)
    .filter((gateId) => !orderedIds.includes(gateId));
  const finalIds = [...orderedIds, ...remainingIds];

  const savedSettings = persistSettings({
    ...current,
    gates: finalIds
      .map((gateId, index) => {
        const gate = current.gates.find((item) => item.id === gateId);
        return gate ? { ...gate, sortOrder: index } : null;
      })
      .filter((gate): gate is NedaaGate => gate !== null),
  });

  // TODO: Replace this mock gate ordering with a dedicated Nedaa gates ordering API endpoint.
  return cloneSettings(savedSettings);
}

export async function updateNedaaRequestStatus(
  requestId: string,
  status: NedaaStatus,
): Promise<NedaaRequest> {
  await delay();

  const requests = await ensureSeededRequests();
  const requestIndex = requests.findIndex(
    (request) => request.id === requestId,
  );

  if (requestIndex === -1) {
    throw new Error("nedaa_request_not_found");
  }

  const currentRequest = requests[requestIndex];
  if (currentRequest.status === status) {
    return withNormalizedGate(currentRequest, getCurrentSettings());
  }

  const updatedRequest: NedaaRequest = {
    ...currentRequest,
    status,
    updatedAt: new Date().toISOString(),
    timeline: [
      ...currentRequest.timeline,
      {
        id: `${currentRequest.id}-${status}-${Date.now()}`,
        requestId: currentRequest.id,
        type: "status_changed",
        status,
        actor: status === "cancelled" ? "Security Desk" : "Front Desk",
        timestamp: new Date().toISOString(),
        note: status === "cancelled" ? "pickup_request_cancelled" : undefined,
      },
    ],
  };

  requests[requestIndex] = updatedRequest;
  nedaaRequestsStore = [...requests].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  // TODO: Replace mock in-memory mutation with real Nedaa request status API.
  return withNormalizedGate(updatedRequest, getCurrentSettings());
}
