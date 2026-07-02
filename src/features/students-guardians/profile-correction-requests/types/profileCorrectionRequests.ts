export type ProfileCorrectionRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface ProfileCorrectionRequestedChange {
  field: string;
  label: string;
  currentValue: string;
  requestedValue: string;
}

export interface ProfileCorrectionRequestListItem {
  id: string;
  studentId: string;
  studentName: string;
  status: ProfileCorrectionRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
  changeCount: number;
}

export interface ProfileCorrectionRequestDetail
  extends ProfileCorrectionRequestListItem {
  changes: ProfileCorrectionRequestedChange[];
}

export interface FetchProfileCorrectionRequestsParams {
  status?: ProfileCorrectionRequestStatus | "all";
  studentId?: string;
}

export interface ReviewProfileCorrectionRequestPayload {
  reviewerNote?: string;
}
