// FILE: src/types/admissions/document.ts
// Document model

import type { DocumentStatus } from "@/features/admissions/types/enums";

export interface Document {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  uploadedDate?: string;
  url?: string; // URL to the document file
  fileType?: "pdf" | "image" | "doc"; // Type of file for preview
}
