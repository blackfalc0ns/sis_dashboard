import type {
  TransferApplication,
  WithdrawalApplication,
  TransfersFilters,
  WithdrawalsFilters,
  ApplicationStatus,
  Stage,
  WithdrawalReason,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  getCurrentActiveEnrollment,
  getEnrollmentHistory,
  transferStudent,
  withdrawStudent,
} from "@/features/students-guardians/students/services/enrollmentService";
import { mockStudents } from "@/data/mockStudents";
import type {
  BehaviorBreakdownPoint,
  ReasonBreakdownPoint,
  StageBreakdownPoint,
  TransferWithdrawalRequestRow,
  TransfersWithdrawalsAdapter,
  TransfersWithdrawalsOverviewMetrics,
  TransfersWithdrawalsTrendPoint,
} from "./transfersWithdrawalsAdapter";

export type {
  BehaviorBreakdownPoint,
  ReasonBreakdownPoint,
  StageBreakdownPoint,
  TransferWithdrawalRequestRow,
  TransfersWithdrawalsOverviewMetrics,
  TransfersWithdrawalsTrendPoint,
} from "./transfersWithdrawalsAdapter";
import {
  createTransfersWithdrawalsApiAdapter,
  transfersWithdrawalsApiAdapter,
} from "./transfersWithdrawalsApiAdapter";

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const transfersWithdrawalsListeners = new Set<() => void>();
let transfersWithdrawalsVersion = 0;

const notifyTransfersWithdrawalsChange = () => {
  transfersWithdrawalsVersion += 1;
  transfersWithdrawalsListeners.forEach((listener) => listener());
};

const getStageFromGrade = (
  grade: string,
): "primary" | "preparatory" | "secondary" => {
  const gradeNumber = parseInt(grade.replace(/\D/g, ""), 10);
  if (gradeNumber >= 1 && gradeNumber <= 5) return "primary";
  if (gradeNumber >= 6 && gradeNumber <= 9) return "preparatory";
  return "secondary";
};

const resolveInternalStudentId = (studentId: string) => {
  const enrollment = getCurrentActiveEnrollment(studentId);
  if (enrollment) return enrollment.studentId;
  return (
    mockStudents.find(
      (student) => student.id === studentId || student.student_id === studentId,
    )?.id || studentId
  );
};

const getMockStudentRecord = (studentId: string) =>
  mockStudents.find((student) => student.id === studentId);

const buildBehaviorBand = (score: number): "low" | "medium" | "high" => {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
};

const getMonthKey = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "short" });

const createTransferId = () =>
  `TRF-${new Date().getFullYear()}-${String(mockTransfers.length + 1).padStart(3, "0")}`;
const createWithdrawalId = () =>
  `WTH-${new Date().getFullYear()}-${String(mockWithdrawals.length + 1).padStart(3, "0")}`;

const mockTransfers: TransferApplication[] = [
  {
    id: "TRF-2024-001",
    studentId: "STU-001",
    studentName: "Omar Ali",
    studentNameAr: "عمر علي",
    stage: "preparatory",
    grade: "Grade 8",
    section: "A",
    classroom: "Classroom 801",
    type: "internal",
    targetSection: "B",
    targetSectionId: "section-4",
    targetClassroom: "Classroom 802",
    targetClassroomId: "classroom-4",
    targetClass: "B • Classroom 802",
    reason: "Better academic fit",
    behaviorScore: 90,
    behaviorBand: "high",
    status: "approved",
    requestDate: "2024-02-13",
    effectiveDate: "2024-03-01",
    createdBy: "admin",
  },
  {
    id: "TRF-2024-002",
    studentId: "STU-002",
    studentName: "Layla Hassan",
    studentNameAr: "ليلى حسن",
    stage: "secondary",
    grade: "Grade 10",
    section: "B",
    classroom: "Innovation Hall 10B",
    type: "external",
    externalSchool: "International School",
    reason: "Family relocation",
    behaviorScore: 85,
    behaviorBand: "high",
    status: "under_review",
    requestDate: "2024-02-15",
    effectiveDate: "2024-03-15",
    createdBy: "admin",
  },
];

const mockWithdrawals: WithdrawalApplication[] = [
  {
    id: "WTH-2024-001",
    studentId: "STU-003",
    studentName: "Ahmed Hassan",
    studentNameAr: "أحمد حسن",
    stage: "primary",
    grade: "Grade 5",
    section: "A",
    classroom: "Classroom 501",
    reason: "relocation",
    behaviorAvg: 85,
    behaviorBand: "high",
    attendancePercent: 92,
    financialClearance: "cleared",
    status: "submitted",
    requestDate: "2024-02-15",
    effectiveDate: "2024-03-01",
    createdBy: "admin",
  },
  {
    id: "WTH-2024-002",
    studentId: "STU-004",
    studentName: "Sara Mohamed",
    studentNameAr: "سارة محمد",
    stage: "secondary",
    grade: "Grade 11",
    section: "B",
    classroom: "Classroom 1102",
    reason: "behavior",
    behaviorAvg: 45,
    behaviorBand: "low",
    attendancePercent: 78,
    financialClearance: "pending",
    status: "behavior_review",
    requestDate: "2024-02-14",
    effectiveDate: "2024-02-28",
    createdBy: "admin",
  },
];

const filterTransfersImpl = (
  filters: TransfersFilters,
): TransferApplication[] => {
  let filtered = [...mockTransfers];

  if (filters.stage && filters.stage !== "all") {
    filtered = filtered.filter((transfer) => transfer.stage === filters.stage);
  }

  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((transfer) => transfer.type === filters.type);
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((transfer) => transfer.status === filters.status);
  }

  if (filters.behaviorBand && filters.behaviorBand !== "all") {
    filtered = filtered.filter(
      (transfer) => transfer.behaviorBand === filters.behaviorBand,
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (transfer) =>
        transfer.studentName.toLowerCase().includes(query) ||
        transfer.studentNameAr.includes(filters.searchQuery || "") ||
        transfer.id.toLowerCase().includes(query) ||
        transfer.grade.toLowerCase().includes(query) ||
        transfer.section?.toLowerCase().includes(query) ||
        transfer.classroom?.toLowerCase().includes(query),
    );
  }

  return filtered;
};

const filterWithdrawalsImpl = (
  filters: WithdrawalsFilters,
): WithdrawalApplication[] => {
  let filtered = [...mockWithdrawals];

  if (filters.stage && filters.stage !== "all") {
    filtered = filtered.filter((withdrawal) => withdrawal.stage === filters.stage);
  }

  if (filters.reason && filters.reason !== "all") {
    filtered = filtered.filter((withdrawal) => withdrawal.reason === filters.reason);
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((withdrawal) => withdrawal.status === filters.status);
  }

  if (filters.behaviorBand && filters.behaviorBand !== "all") {
    filtered = filtered.filter(
      (withdrawal) => withdrawal.behaviorBand === filters.behaviorBand,
    );
  }

  if (filters.financialClearance && filters.financialClearance !== "all") {
    filtered = filtered.filter(
      (withdrawal) => withdrawal.financialClearance === filters.financialClearance,
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (withdrawal) =>
        withdrawal.studentName.toLowerCase().includes(query) ||
        withdrawal.studentNameAr.includes(filters.searchQuery || "") ||
        withdrawal.id.toLowerCase().includes(query) ||
        withdrawal.grade.toLowerCase().includes(query) ||
        withdrawal.section?.toLowerCase().includes(query) ||
        withdrawal.classroom?.toLowerCase().includes(query),
    );
  }

  return filtered;
};

const getOverviewMetricsImpl = (): TransfersWithdrawalsOverviewMetrics => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const transfersThisMonth = mockTransfers.filter((transfer) => {
    const date = new Date(transfer.requestDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const withdrawalsThisMonth = mockWithdrawals.filter((withdrawal) => {
    const date = new Date(withdrawal.requestDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const pendingRequests =
    mockTransfers.filter((transfer) =>
      ["submitted", "under_review"].includes(transfer.status),
    ).length +
    mockWithdrawals.filter((withdrawal) =>
      ["submitted", "under_review", "behavior_review", "finance_clearance"].includes(
        withdrawal.status,
      ),
    ).length;
  const behaviorRelatedCount = mockWithdrawals.filter(
    (withdrawal) => withdrawal.reason === "behavior",
  ).length;
  const behaviorRelatedWithdrawals =
    mockWithdrawals.length > 0
      ? Math.round((behaviorRelatedCount / mockWithdrawals.length) * 100)
      : 0;
  const dropoutRate =
    mockWithdrawals.length > 0
      ? Number(((mockWithdrawals.length / Math.max(mockTransfers.length + mockWithdrawals.length, 1)) * 100).toFixed(1))
      : 0;

  return {
    transfersThisMonth,
    withdrawalsThisMonth,
    pendingRequests,
    dropoutRate,
    behaviorRelatedWithdrawals,
  };
};

const getTrendDataImpl = (
  stage: Stage | "all" = "all",
): TransfersWithdrawalsTrendPoint[] => {
  const trendMap = new Map<string, TransfersWithdrawalsTrendPoint>();
  const filteredTransfers =
    stage === "all"
      ? mockTransfers
      : mockTransfers.filter((transfer) => transfer.stage === stage);
  const filteredWithdrawals =
    stage === "all"
      ? mockWithdrawals
      : mockWithdrawals.filter((withdrawal) => withdrawal.stage === stage);

  [...filteredTransfers, ...filteredWithdrawals].forEach((item) => {
    const month = getMonthKey(item.requestDate);
    if (!trendMap.has(month)) {
      trendMap.set(month, { month, transfers: 0, withdrawals: 0 });
    }
  });

  filteredTransfers.forEach((transfer) => {
    const point = trendMap.get(getMonthKey(transfer.requestDate));
    if (point) point.transfers += 1;
  });

  filteredWithdrawals.forEach((withdrawal) => {
    const point = trendMap.get(getMonthKey(withdrawal.requestDate));
    if (point) point.withdrawals += 1;
  });

  return Array.from(trendMap.values());
};

const getStageBreakdownImpl = (): StageBreakdownPoint[] =>
  ["primary", "preparatory", "secondary"].map((stage) => ({
    stage: stage as Stage,
    transfers: mockTransfers.filter((transfer) => transfer.stage === stage).length,
    withdrawals: mockWithdrawals.filter((withdrawal) => withdrawal.stage === stage).length,
  }));

const getWithdrawalReasonsImpl = (
  stage: Stage | "all" = "all",
): ReasonBreakdownPoint[] => {
  const filtered =
    stage === "all"
      ? mockWithdrawals
      : mockWithdrawals.filter((withdrawal) => withdrawal.stage === stage);
  const counts = new Map<string, number>();

  filtered.forEach((withdrawal) => {
    counts.set(withdrawal.reason, (counts.get(withdrawal.reason) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([reason, value]) => ({ reason, value }));
};

const getWithdrawalsByBehaviorBandImpl = (): BehaviorBreakdownPoint[] => {
  const buckets = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];

  return buckets.map((bucket) => ({
    range: bucket.range,
    label: bucket.range,
    withdrawals: mockWithdrawals.filter(
      (withdrawal) =>
        withdrawal.behaviorAvg >= bucket.min &&
        withdrawal.behaviorAvg <= bucket.max,
    ).length,
  }));
};

const getRequestsTableRowsImpl = (): TransferWithdrawalRequestRow[] => [
  ...mockWithdrawals.map((withdrawal) => ({
    id: withdrawal.id,
    studentName: withdrawal.studentName,
    studentNameAr: withdrawal.studentNameAr,
    stage:
      withdrawal.stage.charAt(0).toUpperCase() + withdrawal.stage.slice(1),
    grade: withdrawal.grade,
    behaviorAvg: withdrawal.behaviorAvg,
    attendancePercent: withdrawal.attendancePercent,
    reason: withdrawal.reason,
    status: withdrawal.status,
    requestDate: withdrawal.requestDate,
    type: "Withdrawal",
  })),
  ...mockTransfers.map((transfer) => ({
    id: transfer.id,
    studentName: transfer.studentName,
    studentNameAr: transfer.studentNameAr,
    stage: transfer.stage.charAt(0).toUpperCase() + transfer.stage.slice(1),
    grade: transfer.grade,
    behaviorAvg: transfer.behaviorScore,
    attendancePercent: 0,
    reason: transfer.type === "internal" ? "Transfer In" : transfer.reason,
    status: transfer.status,
    requestDate: transfer.requestDate,
    type: "Transfer",
  })),
].sort((left, right) => new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime());

const mockTransfersWithdrawalsAdapter: TransfersWithdrawalsAdapter = {
  getAllTransfers: () => [...mockTransfers],
  getAllWithdrawals: () => [...mockWithdrawals],
  subscribe: (listener) => {
    transfersWithdrawalsListeners.add(listener);
    return () => {
      transfersWithdrawalsListeners.delete(listener);
    };
  },
  getSnapshot: () => transfersWithdrawalsVersion,
  getTransferById: (id) => mockTransfers.find((transfer) => transfer.id === id),
  getWithdrawalById: (id) => mockWithdrawals.find((withdrawal) => withdrawal.id === id),
  getTransfersByStudentId: (studentId) => {
    const resolvedStudentId = resolveInternalStudentId(studentId);
    return mockTransfers
      .filter((transfer) => transfer.studentId === resolvedStudentId)
      .sort((left, right) => new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime());
  },
  getWithdrawalsByStudentId: (studentId) => {
    const resolvedStudentId = resolveInternalStudentId(studentId);
    return mockWithdrawals
      .filter((withdrawal) => withdrawal.studentId === resolvedStudentId)
      .sort((left, right) => new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime());
  },
  filterTransfers: filterTransfersImpl,
  filterWithdrawals: filterWithdrawalsImpl,
  createTransfer: async (data) => {
    await delay();
    if (!data.studentId || !data.reason || !data.effectiveDate || !data.type) {
      throw new Error("transfer_invalid");
    }

    const resolvedStudentId = resolveInternalStudentId(data.studentId);
    const enrollment = getCurrentActiveEnrollment(resolvedStudentId);
    const history = getEnrollmentHistory(resolvedStudentId);
    if (!enrollment && history.length === 0) {
      throw new Error("active_enrollment_not_found");
    }

    const baseEnrollment = enrollment || history[history.length - 1];
    if (!baseEnrollment) {
      throw new Error("active_enrollment_not_found");
    }

    const nextTransfer: TransferApplication = {
      id: createTransferId(),
      studentId: resolvedStudentId,
      studentName:
        data.studentName || getMockStudentRecord(resolvedStudentId)?.full_name_en || "",
      studentNameAr:
        data.studentNameAr || getMockStudentRecord(resolvedStudentId)?.full_name_ar || "",
      stage: data.stage || getStageFromGrade(baseEnrollment.grade),
      grade: data.grade || baseEnrollment.grade,
      section: data.section || baseEnrollment.section,
      classroom: data.classroom || baseEnrollment.classroom,
      type: data.type,
      targetSection: data.targetSection,
      targetSectionId: data.targetSectionId,
      targetClassroom: data.targetClassroom,
      targetClassroomId: data.targetClassroomId,
      targetClass: data.targetClass,
      externalSchool: data.externalSchool,
      reason: data.reason,
      behaviorScore: data.behaviorScore || 75,
      behaviorBand: data.behaviorBand || buildBehaviorBand(data.behaviorScore || 75),
      status: "under_review",
      requestDate: new Date().toISOString().slice(0, 10),
      effectiveDate: data.effectiveDate,
      notes: data.notes,
      attachments: data.attachments,
      createdBy: data.createdBy || "system",
    };

    mockTransfers.unshift(nextTransfer);
    notifyTransfersWithdrawalsChange();
    return nextTransfer;
  },
  createWithdrawal: async (data) => {
    await delay();
    if (!data.studentId || !data.reason || !data.effectiveDate) {
      throw new Error("withdrawal_invalid");
    }

    const resolvedStudentId = resolveInternalStudentId(data.studentId);
    const enrollment = getCurrentActiveEnrollment(resolvedStudentId);
    const history = getEnrollmentHistory(resolvedStudentId);
    const baseEnrollment = enrollment || history[history.length - 1];
    if (!baseEnrollment) {
      throw new Error("active_enrollment_not_found");
    }

    const nextWithdrawal: WithdrawalApplication = {
      id: createWithdrawalId(),
      studentId: resolvedStudentId,
      studentName:
        data.studentName || getMockStudentRecord(resolvedStudentId)?.full_name_en || "",
      studentNameAr:
        data.studentNameAr || getMockStudentRecord(resolvedStudentId)?.full_name_ar || "",
      stage: data.stage || getStageFromGrade(baseEnrollment.grade),
      grade: data.grade || baseEnrollment.grade,
      section: data.section || baseEnrollment.section,
      classroom: data.classroom || baseEnrollment.classroom,
      reason: data.reason as WithdrawalReason,
      behaviorAvg: data.behaviorAvg || 75,
      behaviorBand: data.behaviorBand || buildBehaviorBand(data.behaviorAvg || 75),
      attendancePercent: data.attendancePercent || 85,
      financialClearance: data.financialClearance || "pending",
      status: "under_review",
      requestDate: new Date().toISOString().slice(0, 10),
      effectiveDate: data.effectiveDate,
      notes: data.notes,
      attachments: data.attachments,
      createdBy: data.createdBy || "system",
    };

    mockWithdrawals.unshift(nextWithdrawal);
    notifyTransfersWithdrawalsChange();
    return nextWithdrawal;
  },
  updateTransferStatus: async (id, status, rejectionReason) => {
    await delay();
    const transfer = mockTransfers.find((item) => item.id === id);
    if (!transfer) {
      throw new Error("transfer_not_found");
    }
    if (transfer.status === "executed") {
      throw new Error("transfer_already_executed");
    }

    if (status === "executed") {
      if (transfer.type === "internal") {
        if (!transfer.targetSectionId) {
          throw new Error("target_section_required");
        }
        await transferStudent({
          studentId: transfer.studentId,
          targetSectionId: transfer.targetSectionId,
          targetClassroomId: transfer.targetClassroomId,
          effectiveDate: transfer.effectiveDate,
          reason: transfer.reason,
          notes: transfer.notes,
          sourceRequestId: transfer.id,
        });
      } else {
        await withdrawStudent({
          studentId: transfer.studentId,
          effectiveDate: transfer.effectiveDate,
          reason: transfer.reason,
          notes: transfer.externalSchool || transfer.notes,
          actionType: "transferred_external",
          sourceRequestId: transfer.id,
        });
      }
    }

    transfer.status = status;
    transfer.rejectionReason = rejectionReason;
    if (status === "approved" || status === "executed") {
      transfer.approvedBy = "system";
    }
    notifyTransfersWithdrawalsChange();
    return transfer;
  },
  updateWithdrawalStatus: async (id, status, rejectionReason) => {
    await delay();
    const withdrawal = mockWithdrawals.find((item) => item.id === id);
    if (!withdrawal) {
      throw new Error("withdrawal_not_found");
    }
    if (withdrawal.status === "executed") {
      throw new Error("withdrawal_already_executed");
    }

    if (status === "executed") {
      await withdrawStudent({
        studentId: withdrawal.studentId,
        effectiveDate: withdrawal.effectiveDate,
        reason: withdrawal.reason,
        notes: withdrawal.notes,
        actionType: "withdrawn",
        sourceRequestId: withdrawal.id,
      });
    }

    withdrawal.status = status;
    withdrawal.rejectionReason = rejectionReason;
    if (status === "approved" || status === "executed") {
      withdrawal.approvedBy = "system";
    }
    notifyTransfersWithdrawalsChange();
    return withdrawal;
  },
  getOverviewMetrics: getOverviewMetricsImpl,
  getTrendData: getTrendDataImpl,
  getStageBreakdown: getStageBreakdownImpl,
  getWithdrawalReasons: getWithdrawalReasonsImpl,
  getWithdrawalsByBehaviorBand: getWithdrawalsByBehaviorBandImpl,
  getRequestsTableRows: getRequestsTableRowsImpl,
  fetchOverviewMetrics: async () => Promise.resolve(getOverviewMetricsImpl()),
  fetchTrendData: async (stage) => Promise.resolve(getTrendDataImpl(stage)),
  fetchStageBreakdown: async () => Promise.resolve(getStageBreakdownImpl()),
  fetchWithdrawalReasons: async (stage) =>
    Promise.resolve(getWithdrawalReasonsImpl(stage)),
  fetchWithdrawalsByBehaviorBand: async () =>
    Promise.resolve(getWithdrawalsByBehaviorBandImpl()),
  fetchRequestsTableRows: async () => Promise.resolve(getRequestsTableRowsImpl()),
};

let currentTransfersWithdrawalsAdapter: TransfersWithdrawalsAdapter =
  mockTransfersWithdrawalsAdapter;

if (process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_TRANSFERS_API === "true") {
  currentTransfersWithdrawalsAdapter = transfersWithdrawalsApiAdapter;
}

export function getTransfersWithdrawalsAdapter(): TransfersWithdrawalsAdapter {
  return currentTransfersWithdrawalsAdapter;
}

export function setTransfersWithdrawalsAdapter(
  adapter: TransfersWithdrawalsAdapter,
) {
  currentTransfersWithdrawalsAdapter = adapter;
}

export function resetTransfersWithdrawalsAdapter() {
  currentTransfersWithdrawalsAdapter =
    process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_TRANSFERS_API === "true"
      ? createTransfersWithdrawalsApiAdapter()
      : mockTransfersWithdrawalsAdapter;
}

export function activateTransfersWithdrawalsAdapter(
  adapter: TransfersWithdrawalsAdapter,
) {
  setTransfersWithdrawalsAdapter(adapter);
  return adapter;
}

export function getAllTransfers(): TransferApplication[] {
  return currentTransfersWithdrawalsAdapter.getAllTransfers();
}

export function getAllWithdrawals(): WithdrawalApplication[] {
  return currentTransfersWithdrawalsAdapter.getAllWithdrawals();
}

export function subscribeTransfersWithdrawals(
  listener: () => void,
): () => void {
  return currentTransfersWithdrawalsAdapter.subscribe(listener);
}

export function getTransfersWithdrawalsSnapshot(): number {
  return currentTransfersWithdrawalsAdapter.getSnapshot();
}

export function getTransferById(id: string): TransferApplication | undefined {
  return currentTransfersWithdrawalsAdapter.getTransferById(id);
}

export function getWithdrawalById(
  id: string,
): WithdrawalApplication | undefined {
  return currentTransfersWithdrawalsAdapter.getWithdrawalById(id);
}

export function getTransfersByStudentId(studentId: string): TransferApplication[] {
  return currentTransfersWithdrawalsAdapter.getTransfersByStudentId(studentId);
}

export function getWithdrawalsByStudentId(studentId: string): WithdrawalApplication[] {
  return currentTransfersWithdrawalsAdapter.getWithdrawalsByStudentId(studentId);
}

export function filterTransfers(
  filters: TransfersFilters,
): TransferApplication[] {
  return currentTransfersWithdrawalsAdapter.filterTransfers(filters);
}

export function filterWithdrawals(
  filters: WithdrawalsFilters,
): WithdrawalApplication[] {
  return currentTransfersWithdrawalsAdapter.filterWithdrawals(filters);
}

export async function createTransfer(
  data: Partial<TransferApplication>,
): Promise<TransferApplication> {
  return currentTransfersWithdrawalsAdapter.createTransfer(data);
}

export async function createWithdrawal(
  data: Partial<WithdrawalApplication>,
): Promise<WithdrawalApplication> {
  return currentTransfersWithdrawalsAdapter.createWithdrawal(data);
}

export async function updateTransferStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<TransferApplication> {
  return currentTransfersWithdrawalsAdapter.updateTransferStatus(
    id,
    status,
    rejectionReason,
  );
}

export async function updateWithdrawalStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<WithdrawalApplication> {
  return currentTransfersWithdrawalsAdapter.updateWithdrawalStatus(
    id,
    status,
    rejectionReason,
  );
}

export function getTransfersWithdrawalsOverviewMetrics(): TransfersWithdrawalsOverviewMetrics {
  return currentTransfersWithdrawalsAdapter.getOverviewMetrics();
}

export async function fetchTransfersWithdrawalsOverviewMetrics(): Promise<
  TransfersWithdrawalsOverviewMetrics
> {
  if (currentTransfersWithdrawalsAdapter.fetchOverviewMetrics) {
    return currentTransfersWithdrawalsAdapter.fetchOverviewMetrics();
  }

  return Promise.resolve(currentTransfersWithdrawalsAdapter.getOverviewMetrics());
}

export function getTransfersWithdrawalsTrendData(
  stage: Stage | "all" = "all",
): TransfersWithdrawalsTrendPoint[] {
  return currentTransfersWithdrawalsAdapter.getTrendData(stage);
}

export async function fetchTransfersWithdrawalsTrendData(
  stage: Stage | "all" = "all",
): Promise<TransfersWithdrawalsTrendPoint[]> {
  if (currentTransfersWithdrawalsAdapter.fetchTrendData) {
    return currentTransfersWithdrawalsAdapter.fetchTrendData(stage);
  }

  return Promise.resolve(currentTransfersWithdrawalsAdapter.getTrendData(stage));
}

export function getTransfersWithdrawalsStageBreakdown(): StageBreakdownPoint[] {
  return currentTransfersWithdrawalsAdapter.getStageBreakdown();
}

export async function fetchTransfersWithdrawalsStageBreakdown(): Promise<
  StageBreakdownPoint[]
> {
  if (currentTransfersWithdrawalsAdapter.fetchStageBreakdown) {
    return currentTransfersWithdrawalsAdapter.fetchStageBreakdown();
  }

  return Promise.resolve(currentTransfersWithdrawalsAdapter.getStageBreakdown());
}

export function getWithdrawalReasonsBreakdown(
  stage: Stage | "all" = "all",
): ReasonBreakdownPoint[] {
  return currentTransfersWithdrawalsAdapter.getWithdrawalReasons(stage);
}

export async function fetchWithdrawalReasonsBreakdown(
  stage: Stage | "all" = "all",
): Promise<ReasonBreakdownPoint[]> {
  if (currentTransfersWithdrawalsAdapter.fetchWithdrawalReasons) {
    return currentTransfersWithdrawalsAdapter.fetchWithdrawalReasons(stage);
  }

  return Promise.resolve(currentTransfersWithdrawalsAdapter.getWithdrawalReasons(stage));
}

export function getWithdrawalsBehaviorBreakdown(): BehaviorBreakdownPoint[] {
  return currentTransfersWithdrawalsAdapter.getWithdrawalsByBehaviorBand();
}

export async function fetchWithdrawalsBehaviorBreakdown(): Promise<
  BehaviorBreakdownPoint[]
> {
  if (currentTransfersWithdrawalsAdapter.fetchWithdrawalsByBehaviorBand) {
    return currentTransfersWithdrawalsAdapter.fetchWithdrawalsByBehaviorBand();
  }

  return Promise.resolve(
    currentTransfersWithdrawalsAdapter.getWithdrawalsByBehaviorBand(),
  );
}

export function getTransfersWithdrawalsRequestRows(): TransferWithdrawalRequestRow[] {
  return currentTransfersWithdrawalsAdapter.getRequestsTableRows();
}

export async function fetchTransfersWithdrawalsRequestRows(): Promise<
  TransferWithdrawalRequestRow[]
> {
  if (currentTransfersWithdrawalsAdapter.fetchRequestsTableRows) {
    return currentTransfersWithdrawalsAdapter.fetchRequestsTableRows();
  }

  return Promise.resolve(currentTransfersWithdrawalsAdapter.getRequestsTableRows());
}
