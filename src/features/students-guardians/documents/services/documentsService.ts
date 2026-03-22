import { mockStudentDocuments, mockStudents } from "@/data/mockStudents";
import type {
  StudentDocumentCenterItem,
  StudentDocumentsAdapter,
  StudentDocumentsStats,
} from "./documentsAdapter";
import {
  createDocumentsApiAdapter,
  documentsApiAdapter,
} from "./documentsApiAdapter";

const buildDocuments = (): StudentDocumentCenterItem[] => {
  const students = mockStudents;

  return students.flatMap((student) =>
    mockStudentDocuments
      .filter((document) => document.studentId === student.id)
      .map((document) => ({
      ...document,
      studentName:
        student.full_name_en || student.name || student.full_name_ar || "Unknown",
      grade: student.grade || student.gradeRequested || "-",
      })),
  );
};

const calculateStats = (
  documents: StudentDocumentCenterItem[],
): StudentDocumentsStats => {
  const total = documents.length;
  const complete = documents.filter((document) => document.status === "complete").length;
  const missing = documents.filter((document) => document.status === "missing").length;

  return {
    total,
    complete,
    missing,
    completionRate: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
};

const mockDocumentsAdapter: StudentDocumentsAdapter = {
  getAllDocuments: () => buildDocuments(),
  getDocumentsStats: () => calculateStats(buildDocuments()),
  fetchAllDocuments: async () => Promise.resolve(buildDocuments()),
  fetchDocumentsStats: async () => Promise.resolve(calculateStats(buildDocuments())),
};

let currentDocumentsAdapter: StudentDocumentsAdapter = mockDocumentsAdapter;

if (process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_DOCUMENTS_API === "true") {
  currentDocumentsAdapter = documentsApiAdapter;
}

export function getDocumentsAdapter(): StudentDocumentsAdapter {
  return currentDocumentsAdapter;
}

export function setDocumentsAdapter(adapter: StudentDocumentsAdapter) {
  currentDocumentsAdapter = adapter;
}

export function resetDocumentsAdapter() {
  currentDocumentsAdapter =
    process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_DOCUMENTS_API === "true"
      ? createDocumentsApiAdapter()
      : mockDocumentsAdapter;
}

export function activateDocumentsAdapter(adapter: StudentDocumentsAdapter) {
  setDocumentsAdapter(adapter);
  return adapter;
}

export function getAllStudentDocumentsForCenter(): StudentDocumentCenterItem[] {
  return currentDocumentsAdapter.getAllDocuments();
}

export function getStudentDocumentsCenterStats(): StudentDocumentsStats {
  return currentDocumentsAdapter.getDocumentsStats();
}

export async function fetchAllStudentDocumentsForCenter(): Promise<
  StudentDocumentCenterItem[]
> {
  if (currentDocumentsAdapter.fetchAllDocuments) {
    return currentDocumentsAdapter.fetchAllDocuments();
  }

  return Promise.resolve(currentDocumentsAdapter.getAllDocuments());
}

export async function fetchStudentDocumentsCenterStats(): Promise<
  StudentDocumentsStats
> {
  if (currentDocumentsAdapter.fetchDocumentsStats) {
    return currentDocumentsAdapter.fetchDocumentsStats();
  }

  return Promise.resolve(currentDocumentsAdapter.getDocumentsStats());
}
