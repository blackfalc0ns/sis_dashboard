import type {
  TransferApplication,
  WithdrawalApplication,
  TransfersFilters,
  WithdrawalsFilters,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

// TODO: Replace with actual API integration

const mockTransfers: TransferApplication[] = [
  {
    id: "TRF-2024-001",
    studentId: "STU-001",
    studentName: "Omar Ali",
    studentNameAr: "??? ???",
    stage: "preparatory",
    grade: "Grade 8",
    section: "A",
    classroom: "Classroom 801",
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
    studentNameAr: "???? ???",
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
    studentNameAr: "???? ???",
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
    studentNameAr: "???? ????",
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
  return mockTransfers;
}

export function getAllWithdrawals(): WithdrawalApplication[] {
  return mockWithdrawals;
}

export function getTransferById(id: string): TransferApplication | undefined {
  return mockTransfers.find((transfer) => transfer.id === id);
}

export function getWithdrawalById(
  id: string,
): WithdrawalApplication | undefined {
  return mockWithdrawals.find((withdrawal) => withdrawal.id === id);
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
