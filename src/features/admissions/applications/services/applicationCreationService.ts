import { mockApplications } from "@/data/mockAdmissions";
import type {
  Application,
  ApplicationStatus,
  Document,
} from "@/features/admissions/types/admissions";

export interface UploadedApplicationDocumentInput {
  configId: string;
  labelEn: string;
  labelAr: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  fileType?: "pdf" | "image" | "doc";
}

export interface ApplicationCreationPayload {
  student: {
    first_name_ar: string;
    father_name_ar: string;
    grandfather_name_ar: string;
    family_name_ar: string;
    first_name_en: string;
    father_name_en: string;
    grandfather_name_en: string;
    family_name_en: string;
    full_name_ar: string;
    full_name_en: string;
    gender: string;
    date_of_birth: string;
    nationality: string;
    stage: string;
    grade_requested: string;
    section?: string;
    address_line: string;
    city: string;
    district: string;
    status: string;
    join_date: string;
    notes: string;
    previous_school: string;
    medical_conditions: string;
  };
  guardians: Array<{
    full_name: string;
    relation: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    national_id: string;
    job_title: string;
    workplace: string;
    is_primary: boolean;
    can_pickup: boolean;
    can_receive_notifications: boolean;
  }>;
  documents: UploadedApplicationDocumentInput[];
}

function resolveDocumentFileType(
  fileName?: string,
): "pdf" | "image" | "doc" | undefined {
  if (!fileName) return undefined;
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
    return "image";
  }
  if (["doc", "docx"].includes(extension || "")) {
    return "doc";
  }
  return undefined;
}

function buildApplicationDocuments(
  input: UploadedApplicationDocumentInput[],
): Document[] {
  const today = new Date().toISOString();

  return input.flatMap((document, index) => {
    if (!document.uploaded && !document.required) {
      return [];
    }

    return [
      {
        id: "DOC-" + Date.now() + "-" + (index + 1),
        type: document.labelEn,
        name: document.uploaded ? document.fileName || document.labelEn : "",
        status: document.uploaded ? "complete" : "missing",
        configId: document.configId,
        labelEn: document.labelEn,
        labelAr: document.labelAr,
        required: document.required,
        uploadedDate: document.uploaded ? today : undefined,
        fileType:
          document.fileType || resolveDocumentFileType(document.fileName),
      },
    ];
  });
}

function buildApplicationId() {
  const year = new Date().getFullYear();
  const matching = mockApplications.filter((application) =>
    application.id.startsWith("APP-" + year + "-"),
  ).length;
  return "APP-" + year + "-" + String(matching + 1).padStart(3, "0");
}

function resolveApplicationStatus(documents: Document[]): ApplicationStatus {
  const hasMissingRequiredDocuments = documents.some(
    (document) => document.required && document.status === "missing",
  );
  return hasMissingRequiredDocuments ? "documents_pending" : "submitted";
}

export function createApplication(
  payload: ApplicationCreationPayload,
): Application {
  const id = buildApplicationId();
  const documents = buildApplicationDocuments(payload.documents);
  const primaryGuardian = payload.guardians.find(
    (guardian) => guardian.is_primary,
  );
  const status = resolveApplicationStatus(documents);
  const submittedDate = new Date().toISOString();

  const application: Application = {
    id,
    source: "walk_in",
    status,
    submittedDate,
    first_name_ar: payload.student.first_name_ar,
    father_name_ar: payload.student.father_name_ar,
    grandfather_name_ar: payload.student.grandfather_name_ar,
    family_name_ar: payload.student.family_name_ar,
    first_name_en: payload.student.first_name_en,
    father_name_en: payload.student.father_name_en,
    grandfather_name_en: payload.student.grandfather_name_en,
    family_name_en: payload.student.family_name_en,
    full_name_ar: payload.student.full_name_ar,
    full_name_en: payload.student.full_name_en,
    studentName: payload.student.full_name_en,
    studentNameArabic: payload.student.full_name_ar,
    gender: payload.student.gender,
    date_of_birth: payload.student.date_of_birth,
    dateOfBirth: payload.student.date_of_birth,
    nationality: payload.student.nationality,
    address_line: payload.student.address_line,
    city: payload.student.city,
    district: payload.student.district,
    grade_requested: payload.student.grade_requested,
    gradeRequested: payload.student.grade_requested,
    stage: payload.student.stage,
    previous_school: payload.student.previous_school,
    previousSchool: payload.student.previous_school,
    join_date: payload.student.join_date,
    medical_conditions: payload.student.medical_conditions,
    notes: payload.student.notes,
    guardians: payload.guardians.map((guardian, index) => ({
      ...guardian,
      id: "G-" + id + "-" + (index + 1),
    })),
    guardianName:
      primaryGuardian?.full_name || payload.guardians[0]?.full_name || "",
    guardianPhone:
      primaryGuardian?.phone_primary ||
      payload.guardians[0]?.phone_primary ||
      "",
    guardianEmail: primaryGuardian?.email || payload.guardians[0]?.email || "",
    documents,
    tests: [],
    interviews: [],
  };

  mockApplications.unshift(application);
  return application;
}
