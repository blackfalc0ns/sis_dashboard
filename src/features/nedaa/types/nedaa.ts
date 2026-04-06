export type NedaaStatus =
  | "pending"
  | "acknowledged"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type NedaaGateId = string;

export interface NedaaGate {
  id: NedaaGateId;
  nameEn: string;
  nameAr: string;
  locationHint?: string;
  sortOrder: number;
  isActive: boolean;
  supportsPickup: boolean;
  isStaffOnly?: boolean;
}

export type NedaaTimelineEventType =
  | "created"
  | "status_changed"
  | "notification_sent"
  | "notification_skipped"
  | "unauthorized_attempt";

export interface NedaaTimelineEvent {
  id: string;
  requestId: string;
  type: NedaaTimelineEventType;
  actor: string;
  timestamp: string;
  status?: NedaaStatus;
  note?: string;
}

export interface NedaaRequest {
  id: string;
  studentId: string;
  studentName: string;
  guardianId: string;
  guardianName: string;
  guardianRelation: string;
  gate: NedaaGateId;
  status: NedaaStatus;
  createdAt: string;
  updatedAt: string;
  canPickup: boolean;
  canReceiveNotifications: boolean;
  note?: string;
  distanceMeters?: number;
  insideZone?: boolean;
  timeline: NedaaTimelineEvent[];
}

export interface NedaaOverviewStats {
  activeRequests: number;
  avgPickupTimeMinutes: number;
  completedToday: number;
  cancelledToday: number;
  blockedAttempts: number;
}

export interface NedaaGateStats {
  gate: NedaaGate;
  waitingCount: number;
  preparingCount: number;
  readyCount: number;
  completedToday: number;
  avgHandlingTimeMinutes: number;
  activeRequests: number;
}

export interface NedaaSettings {
  allowedRadiusMeters: number;
  pickupStartTime: string;
  pickupEndTime: string;
  duplicateRequestCooldownMinutes: number;
  autoCancelTimeoutMinutes: number;
  gates: NedaaGate[];
  defaultGateId?: NedaaGateId | null;
  activeGates?: NedaaGateId[];
}

export interface NedaaOverviewData {
  stats: NedaaOverviewStats;
  latestRequests: NedaaRequest[];
  gates: NedaaGateStats[];
}

export interface NedaaContext {
  yearId?: string | null;
  termId?: string | null;
}