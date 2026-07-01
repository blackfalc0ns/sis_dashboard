import { describe, expect, it } from "vitest";
import { mapApplicationDto, toLegacyApplication, toLegacyDocument } from "../mappers";

const applicationDto = {
  id: "app-1",
  leadId: null,
  studentName: "Omar Ahmed",
  requestedAcademicYearId: "year-1",
  requestedGradeId: "grade-1",
  source: "referral",
  status: "documents_pending",
  submittedAt: null,
  createdAt: "2026-06-30T09:00:00.000Z",
  updatedAt: "2026-06-30T09:00:00.000Z",
} as const;

describe("application mappers", () => {
  it("maps the backend application without inventing related resources", () => {
    const result = mapApplicationDto(applicationDto);

    expect(result).toMatchObject({
      id: "app-1",
      studentName: "Omar Ahmed",
      requestedGradeId: "grade-1",
      submittedAt: null,
      registrationState: { registered: false },
    });
    expect(toLegacyApplication(result)).toMatchObject({
      guardians: [],
      documents: [],
      tests: [],
      interviews: [],
      submittedAt: null,
    });
  });

  it("uses returned file metadata for the document display model", () => {
    expect(
      toLegacyDocument({
        id: "doc-1",
        applicationId: "app-1",
        fileId: "file-1",
        documentType: "Birth Certificate",
        status: "pending_review",
        notes: null,
        createdAt: "2026-06-30T09:00:00.000Z",
        updatedAt: "2026-06-30T09:00:00.000Z",
        file: {
          id: "file-1",
          originalName: "birth.pdf",
          mimeType: "application/pdf",
          sizeBytes: "100",
          visibility: "PRIVATE",
        },
      }),
    ).toMatchObject({
      name: "birth.pdf",
      fileType: "pdf",
      url: "/api/files/file-1/download",
    });
  });
});

