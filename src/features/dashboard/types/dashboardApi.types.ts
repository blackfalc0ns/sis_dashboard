export type DashboardSource =
  | "admissions"
  | "students"
  | "academics"
  | "attendance"
  | "grades"
  | "homework"
  | "behavior"
  | "reinforcement"
  | "communication"
  | "settings";

export type DashboardAlertSeverity = "info" | "warning" | "critical";

export type DashboardActorType =
  | "system"
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "unknown";

export interface DashboardAcademicReference {
  id: string;
  name: string;
}

export interface DashboardSummaryResponse {
  generatedAt: string;
  school: {
    name: string;
    timezone: string;
    locale: string | null;
  };
  academicContext: {
    academicYear: DashboardAcademicReference | null;
    term: DashboardAcademicReference | null;
  };
  cards: DashboardSummaryCards;
  alertsPreview: DashboardAlertPreview[];
  deferred: Record<string, string>;
}

export interface DashboardSummaryCards {
  admissions?: DashboardAdmissionsCard;
  students?: DashboardStudentsCard;
  academics?: DashboardAcademicsCard;
  attendance?: DashboardAttendanceCard;
  grades?: DashboardGradesCard;
  homework?: DashboardHomeworkCard;
  behavior?: DashboardBehaviorCard;
  reinforcement?: DashboardReinforcementCard;
  communication?: DashboardCommunicationCard;
}

export interface DashboardAdmissionsCard {
  totalLeads: number;
  openApplications: number;
  submittedApplications: number;
  acceptedApplications: number;
  pendingTests: number;
  pendingInterviews: number;
  recentDecisions: number;
}

export interface DashboardStudentsCard {
  activeStudents: number;
  activeEnrollments: number;
  guardians: number;
  newEnrollmentsLast30Days: number;
  withdrawnEnrollments: number;
}

export interface DashboardAcademicsCard {
  activeAcademicYears: number;
  hasCurrentAcademicYear: boolean;
  terms: number;
  stages: number;
  grades: number;
  sections: number;
  classrooms: number;
  subjects: number;
  rooms: number;
  teacherAllocations: number;
  curricula: number;
  lessonPlans: number;
  timetableEntries: number;
  publishedTimetablePublications: number;
}

export interface DashboardAttendanceCard {
  todaySessions: number;
  submittedSessionsToday: number;
  pendingSessionsToday: number;
  absentEntriesToday: number;
  lateEntriesToday: number;
  pendingExcuses: number;
}

export interface DashboardGradesCard {
  activeAssessments: number;
  draftAssessments: number;
  publishedAssessments: number;
  approvedAssessments: number;
  lockedAssessments: number;
  gradeItems: number;
  pendingSubmissions: number;
  pendingAnswerReviews: number;
}

export interface DashboardHomeworkCard {
  draftAssignments: number;
  publishedAssignments: number;
  closedAssignments: number;
  submissionsWaitingReview: number;
  reviewedSubmissions: number;
  gradeSyncLinkedAssignments: number;
  gradeSyncPendingAssignments: number;
}

export interface DashboardBehaviorCard {
  recentRecords: number;
  pendingReviewRecords: number;
  positiveRecords: number;
  negativeRecords: number;
}

export interface DashboardReinforcementCard {
  activeTasks: number;
  pendingReviews: number;
  completedAssignments: number;
  recentXpLedgerEntries: number;
  rewardsPending: number;
}

export interface DashboardCommunicationCard {
  activeAnnouncements: number;
  recentMessages: number;
  activeConversations: number;
  pendingModerationReports: number;
}

export interface DashboardAlertPreview {
  key: string;
  source: DashboardSource;
  severity: DashboardAlertSeverity;
  title: string;
  description: string;
  count: number;
  action?: DashboardAlertAction;
}

export interface DashboardAlertsResponse {
  generatedAt: string;
  alerts: DashboardAlert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    bySource: Partial<Record<DashboardSource, number>>;
  };
  deferred: Record<string, string>;
}

export interface DashboardAlert {
  key: string;
  source: DashboardSource;
  severity: DashboardAlertSeverity;
  title: string;
  description: string;
  count: number;
  action?: DashboardAlertAction;
}

export interface DashboardAlertAction {
  label: string;
  target: string;
}

export interface DashboardAlertsQuery {
  source?: DashboardSource;
  severity?: DashboardAlertSeverity;
  limit?: number;
  includeZeroCount?: boolean;
}

export interface DashboardActivityFeedResponse {
  generatedAt: string;
  items: DashboardActivityFeedItem[];
  pageInfo: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  filters: {
    source: DashboardSource | null;
    eventType: string | null;
    actorType: DashboardActorType | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
  deferred: Record<string, string>;
}

export interface DashboardActivityFeedItem {
  activityId: string;
  source: DashboardSource;
  eventType: string;
  title: string;
  description: string;
  actor: {
    id: string | null;
    displayName: string;
    type: DashboardActorType;
  };
  subject: {
    type: string;
    id: string | null;
    label: string;
  };
  occurredAt: string;
}

export interface DashboardActivityFeedQuery {
  source?: DashboardSource;
  eventType?: string;
  actorType?: DashboardActorType;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

export interface DashboardModuleListItem {
  moduleKey: string;
  source: string;
  title: string;
  description: string;
  status: string;
  iconKey: string;
  tone: string;
  frontendRoute: string;
  sourceRoute: string;
  summary: {
    widgetCount: number;
    chartCount: number;
    availableChartDataCount: number;
    riskCount: number;
    actionCount: number;
  };
  capabilities: {
    widgets: string;
    analyticsDefinitions: string;
    analyticsData: string;
    drilldowns: string;
    exports: string;
    realtime: string;
  };
}

export interface DashboardModuleAction {
  label: string;
  target: string;
  kind: string;
}

export interface DashboardModuleQuickStat {
  key: string;
  label: string;
  value: number | string;
  unit: string | null;
  tone: string;
  iconKey: string;
  source: string;
  action: DashboardModuleAction | null;
}

export interface DashboardModuleRisk {
  key: string;
  severity: "info" | "warning" | "critical";
  title: string;
  count: number;
  source: string;
  action: DashboardModuleAction;
}

export interface DashboardModuleNextAction {
  key: string;
  priority: "low" | "medium" | "high" | "critical";
  label: string;
  description: string;
  source: string;
  action: DashboardModuleAction;
}

export interface DashboardAnalyticsChartSeries {
  name: string;
  data: number[];
  labels: string[];
}

export interface DashboardAnalyticsChart {
  chartKey: string;
  chartType: string;
  title: string;
  subtitle: string;
  source: string;
  series: string[];
}

export interface DashboardAnalyticsChartDataResponse {
  chartKey: string;
  series: DashboardAnalyticsChartSeries[];
  totals: Record<string, number>;
  summary: {
    label: string;
    value: number;
    deltaPercent: number | null;
    precision: number;
  } | null;
  empty: boolean;
}

export interface DashboardWidget {
  widgetKey: string;
  type: "stat-card" | "progress-card" | "risk-card" | "action-card" | "timeline-card" | "mini-chart-card" | "calendar-card" | "todo-card";
  source: string;
  title: string;
  subtitle: string | null;
  iconKey: string;
  tone: "neutral" | "info" | "success" | "warning" | "critical";
  data: Record<string, any>;
  action: DashboardModuleAction | null;
  emptyState: {
    title: string;
    description: string | null;
    action: DashboardModuleAction | null;
  } | null;
  meta: {
    freshness: string;
    freshnessDetails: any;
    analytics: any;
  };
}

export interface DashboardModulePage {
  generatedAt: string;
  module: {
    moduleKey: string;
    source: string;
    title: string;
    description: string;
    status: string;
    iconKey: string;
    tone: string;
    frontendRoute: string;
    sourceRoute: string;
  };
  overview: {
    quickStats: DashboardModuleQuickStat[];
    risks: DashboardModuleRisk[];
    actions: DashboardModuleNextAction[];
  };
  widgets: DashboardWidget[];
  analytics: {
    charts: DashboardAnalyticsChart[];
    availableData: DashboardAnalyticsChartDataResponse[];
    plannedCharts: DashboardAnalyticsChart[];
  };
  sections: {
    sectionKey: string;
    title: string;
    status: string;
    items: string[];
  }[];
  capabilities: {
    widgets: string;
    analyticsDefinitions: string;
    analyticsData: string;
    drilldowns: string;
    exports: string;
    realtime: string;
  };
  emptyState: {
    reason: string;
    message: string;
  } | null;
  meta: {
    source: string;
    version: string;
    dataFreshness: string;
  };
}
