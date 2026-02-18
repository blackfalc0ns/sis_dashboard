// FILE: src/services/transfersWithdrawalsService.ts

import type {
  TransferApplication,
  WithdrawalApplication,
  TransfersFilters,
  WithdrawalsFilters,
} from "@/types/students/transfers-withdrawals";

// TODO: Replace with actual API integration

// Mock data for transfers
const mockTransfers: TransferApplication[] = [
  {
    id: "TRF-2024-001",
    studentId: "STU-001",
    studentName: "Omar Ali",
    studentNameAr: "عمر علي",
    stage: "preparatory",
    grade: "Grade 8",
    type: "internal",
    targetClass: "8-B",
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

// Mock data for withdrawals
const mockWithdrawals: WithdrawalApplication[] = [
  {
    id: "WTH-2024-001",
    studentId: "STU-003",
    studentName: "Ahmed Hassan",
    studentNameAr: "أحمد حسن",
    stage: "primary",
    grade: "Grade 5",
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
  return mockTransfers;
}

export function getAllWithdrawals(): WithdrawalApplication[] {
  return mockWithdrawals;
}

export function getTransferById(id: string): TransferApplication | undefined {
  return mockTransfers.find((t) => t.id === id);
}

export function getWithdrawalById(
  id: string,
): WithdrawalApplication | undefined {
  return mockWithdrawals.find((w) => w.id === id);
}

export function filterTransfers(
  filters: TransfersFilters,
): TransferApplication[] {
  let filtered = [...mockTransfers];

  if (filters.stage && filters.stage !== "all") {
    filtered = filtered.filter((t) => t.stage === filters.stage);
  }

  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((t) => t.type === filters.type);
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  if (filters.behaviorBand && filters.behaviorBand !== "all") {
    filtered = filtered.filter((t) => t.behaviorBand === filters.behaviorBand);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.studentName.toLowerCase().includes(query) ||
        t.studentNameAr.includes(query) ||
        t.id.toLowerCase().includes(query),
    );
  }

  return filtered;
}

export function filterWithdrawals(
  filters: WithdrawalsFilters,
): WithdrawalApplication[] {
  let filtered = [...mockWithdrawals];

  if (filters.stage && filters.stage !== "all") {
    filtered = filtered.filter((w) => w.stage === filters.stage);
  }

  if (filters.reason && filters.reason !== "all") {
    filtered = filtered.filter((w) => w.reason === filters.reason);
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((w) => w.status === filters.status);
  }

  if (filters.behaviorBand && filters.behaviorBand !== "all") {
    filtered = filtered.filter((w) => w.behaviorBand === filters.behaviorBand);
  }

  if (filters.financialClearance && filters.financialClearance !== "all") {
    filtered = filtered.filter(
      (w) => w.financialClearance === filters.financialClearance,
    );
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.studentName.toLowerCase().includes(query) ||
        w.studentNameAr.includes(query) ||
        w.id.toLowerCase().includes(query),
    );
  }

  return filtered;
}

// TODO: Implement API calls
export async function createTransfer(
  data: Partial<TransferApplication>,
): Promise<TransferApplication> {
  console.log("Creating transfer:", data);
  throw new Error("API not implemented");
}

export async function createWithdrawal(
  data: Partial<WithdrawalApplication>,
): Promise<WithdrawalApplication> {
  console.log("Creating withdrawal:", data);
  throw new Error("API not implemented");
}

export async function updateTransferStatus(
  id: string,
  status: string,
  rejectionReason?: string,
): Promise<void> {
  console.log("Updating transfer status:", id, status, rejectionReason);
  throw new Error("API not implemented");
}

export async function updateWithdrawalStatus(
  id: string,
  status: string,
  rejectionReason?: string,
): Promise<void> {
  console.log("Updating withdrawal status:", id, status, rejectionReason);
  throw new Error("API not implemented");
}
