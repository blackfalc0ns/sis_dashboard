import * as studentsService from "@/features/students-guardians/students/services/studentsService";
import type { StudentGuardian } from "@/features/students-guardians/students/types";
import type { StudentWithEnrollmentContext } from "@/features/students-guardians/students/services/studentsService";
import type {
  NedaaContext,
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
  NEDAA_GATE_OPTIONS,
  isNedaaActiveStatus,
} from "@/features/nedaa/utils/nedaaPresentation";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

let nedaaSettingsStore: NedaaSettings = {
  allowedRadiusMeters: 250,
  pickupStartTime: "13:15",
  pickupEndTime: "15:30",
  duplicateRequestCooldownMinutes: 7,
  autoCancelTimeoutMinutes: 25,
  activeGates: ["main_gate", "north_gate", "south_gate"],
};

let nedaaRequestsStore: NedaaRequest[] | null = null;

const statusSeed: NedaaStatus[] = [
  "pending",
  "acknowledged",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const gateSeed: NedaaGateId[] = ["main_gate", "north_gate", "south_gate"];

function toIsoMinutesAgo(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function normalizeRelation(relation: string): string {
  return relation.toLowerCase() || "guardian";
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

function cloneSettings(settings: NedaaSettings): NedaaSettings {
  return {
    ...settings,
    activeGates: [...settings.activeGates],
  };
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
): Promise<NedaaRequest> {
  const id = `NED-${(1001 + index).toString()}`;
  const baseStatus = statusSeed[index % statusSeed.length];
  const gate = gateSeed[index % gateSeed.length];
  const distanceMeters = 80 + (index % 5) * 55;
  const insideZone = distanceMeters <= nedaaSettingsStore.allowedRadiusMeters;
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

      return buildSeedRequest(student, guardian, index);
    }),
  );

  nedaaRequestsStore = requests
    .filter((request): request is NedaaRequest => request !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  return nedaaRequestsStore;
}

async function getScopedRequests(
  context?: NedaaContext,
): Promise<NedaaRequest[]> {
  const requests = await ensureSeededRequests();

  if (!context?.yearId && !context?.termId) {
    return requests.map(cloneRequest);
  }

  const scopedStudents = await studentsService.fetchStudentsWithEnrollmentForContext(
    context?.yearId,
    context?.termId,
  );
  const scopedIds = new Set(scopedStudents.map((student) => student.id));

  return requests
    .filter((request) => scopedIds.has(request.studentId))
    .map(cloneRequest);
}

function buildGateStats(requests: NedaaRequest[]): NedaaGateStats[] {
  const today = new Date();

  return nedaaSettingsStore.activeGates.map((gate) => {
    const gateRequests = requests.filter((request) => request.gate === gate);
    const completedTodayRequests = gateRequests.filter(
      (request) =>
        request.status === "completed" && isSameDay(request.updatedAt, today),
    );

    return {
      gate,
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

export async function seedNedaaRequestsFromGuardians(): Promise<NedaaRequest[]> {
  const requests = await ensureSeededRequests();
  return requests.map(cloneRequest);
}

export async function fetchNedaaOverview(
  context?: NedaaContext,
): Promise<NedaaOverviewData> {
  await delay();

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
    gates: buildGateStats(requests),
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
  const requests = await getScopedRequests(context);
  return buildGateStats(requests);
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
  return cloneSettings(nedaaSettingsStore);
}

export async function saveNedaaSettings(
  settings: NedaaSettings,
): Promise<NedaaSettings> {
  await delay();

  nedaaSettingsStore = cloneSettings({
    ...settings,
    activeGates:
      settings.activeGates.length > 0 ? settings.activeGates : NEDAA_GATE_OPTIONS,
  });

  // TODO: Replace this mock in-memory settings persistence with Nedaa settings API wiring.
  return cloneSettings(nedaaSettingsStore);
}

export async function updateNedaaRequestStatus(
  requestId: string,
  status: NedaaStatus,
): Promise<NedaaRequest> {
  await delay();

  const requests = await ensureSeededRequests();
  const requestIndex = requests.findIndex((request) => request.id === requestId);

  if (requestIndex === -1) {
    throw new Error("nedaa_request_not_found");
  }

  const currentRequest = requests[requestIndex];
  if (currentRequest.status === status) {
    return cloneRequest(currentRequest);
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
        note:
          status === "cancelled"
            ? "pickup_request_cancelled"
            : undefined,
      },
    ],
  };

  requests[requestIndex] = updatedRequest;
  nedaaRequestsStore = [...requests].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  // TODO: Replace mock in-memory mutation with real Nedaa request status API.
  return cloneRequest(updatedRequest);
}
