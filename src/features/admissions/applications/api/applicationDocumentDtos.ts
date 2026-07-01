export type ApplicationDocumentStatusDto = "complete" | "missing" | "pending_review";

export interface ApplicationDocumentFileDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
}

export interface ApplicationDocumentResponseDto {
  id: string;
  applicationId: string;
  fileId: string;
  documentType: string;
  status: ApplicationDocumentStatusDto;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  file?: ApplicationDocumentFileDto;
}

export interface LinkApplicationDocumentRequest {
  fileId: string;
  documentType: string;
  status?: ApplicationDocumentStatusDto;
  notes?: string;
}

export interface ReviewApplicationDocumentRequest {
  note?: string;
}

