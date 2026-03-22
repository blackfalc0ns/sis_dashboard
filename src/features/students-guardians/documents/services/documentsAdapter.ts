import type { StudentDocument } from "@/features/students-guardians/students/types";

export interface StudentDocumentCenterItem extends StudentDocument {
  studentName: string;
  grade: string;
}

export interface StudentDocumentsStats {
  total: number;
  complete: number;
  missing: number;
  completionRate: number;
}

export interface StudentDocumentsAdapter {
  getAllDocuments(): StudentDocumentCenterItem[];
  getDocumentsStats(): StudentDocumentsStats;
  fetchAllDocuments?(): Promise<StudentDocumentCenterItem[]>;
  fetchDocumentsStats?(): Promise<StudentDocumentsStats>;
}
