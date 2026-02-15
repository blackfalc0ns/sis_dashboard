// FILE: src/types/admissions/document.ts
// Document model

import type { DocumentStatus } from "./enums";

export interface Document {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  uploadedDate?: string;
}
