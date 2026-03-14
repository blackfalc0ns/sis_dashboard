import type {
  TransferApplication,
  WithdrawalApplication,
  TransfersFilters,
  WithdrawalsFilters,
  ApplicationStatus,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import {
  getCurrentActiveEnrollment,
  getEnrollmentHistory,
  transferStudent,
  withdrawStudent,
} from "@/features/students-guardians/students/services/enrollmentService";
import { getStudentById } from "@/features/students-guardians/students/services/studentsService";

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
  return getStudentById(studentId)?.id || studentId;
};

const buildBehaviorBand = (score: number): "low" | "medium" | "high" => {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
};

const createTransferId = () => `TRF-${new Date().getFullYear()}-${String(mockTransfers.length + 1).padStart(3, "0")}`;
const createWithdrawalId = () => `WTH-${new Date().getFullYear()}-${String(mockWithdrawals.length + 1).padStart(3, "0")}`;

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

export function getAllTransfers(): TransferApplication[] {
  return [...mockTransfers];
}

export function getAllWithdrawals(): WithdrawalApplication[] {
  return [...mockWithdrawals];
}

export function subscribeTransfersWithdrawals(
  listener: () => void,
): () => void {
  transfersWithdrawalsListeners.add(listener);
  return () => {
    transfersWithdrawalsListeners.delete(listener);
  };
}

export function getTransfersWithdrawalsSnapshot(): number {
  return transfersWithdrawalsVersion;
}

export function getTransferById(id: string): TransferApplication | undefined {
  return mockTransfers.find((transfer) => transfer.id === id);
}

export function getWithdrawalById(
  id: string,
): WithdrawalApplication | undefined {
  return mockWithdrawals.find((withdrawal) => withdrawal.id === id);
}

export function getTransfersByStudentId(studentId: string): TransferApplication[] {
  const resolvedStudentId = resolveInternalStudentId(studentId);
  return mockTransfers
    .filter((transfer) => transfer.studentId === resolvedStudentId)
    .sort((left, right) => new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime());
}

export function getWithdrawalsByStudentId(studentId: string): WithdrawalApplication[] {
  const resolvedStudentId = resolveInternalStudentId(studentId);
  return mockWithdrawals
    .filter((withdrawal) => withdrawal.studentId === resolvedStudentId)
    .sort((left, right) => new Date(right.requestDate).getTime() - new Date(left.requestDate).getTime());
}

export function filterTransfers(
  filters: TransfersFilters,
): TransferApplication[] {
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
}

export function filterWithdrawals(
  filters: WithdrawalsFilters,
): WithdrawalApplication[] {
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
}

export async function createTransfer(
  data: Partial<TransferApplication>,
): Promise<TransferApplication> {
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
    studentName: data.studentName || getStudentById(resolvedStudentId)?.full_name_en || "",
    studentNameAr: data.studentNameAr || getStudentById(resolvedStudentId)?.full_name_ar || "",
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
}

export async function createWithdrawal(
  data: Partial<WithdrawalApplication>,
): Promise<WithdrawalApplication> {
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
    studentName: data.studentName || getStudentById(resolvedStudentId)?.full_name_en || "",
    studentNameAr: data.studentNameAr || getStudentById(resolvedStudentId)?.full_name_ar || "",
    stage: data.stage || getStageFromGrade(baseEnrollment.grade),
    grade: data.grade || baseEnrollment.grade,
    section: data.section || baseEnrollment.section,
    classroom: data.classroom || baseEnrollment.classroom,
    reason: data.reason,
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
}

export async function updateTransferStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<TransferApplication> {
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
}

export async function updateWithdrawalStatus(
  id: string,
  status: ApplicationStatus,
  rejectionReason?: string,
): Promise<WithdrawalApplication> {
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
}
