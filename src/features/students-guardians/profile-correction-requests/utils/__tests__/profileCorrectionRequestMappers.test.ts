import { describe, expect, it } from "vitest";
import { normalizeProfileCorrectionRequestDetail } from "@/features/students-guardians/profile-correction-requests/utils/profileCorrectionRequestMappers";

describe("profileCorrectionRequestMappers", () => {
  it("normalizes explicit current vs requested changes", () => {
    expect(
      normalizeProfileCorrectionRequestDetail({
        id: "request-1",
        studentId: "student-1",
        studentName: "Student One",
        status: "PENDING",
        changes: [
          {
            field: "firstName",
            label: "First name",
            currentValue: "Old",
            requestedValue: "New",
          },
        ],
      }),
    ).toMatchObject({
      id: "request-1",
      studentId: "student-1",
      studentName: "Student One",
      status: "PENDING",
      changeCount: 1,
      changes: [
        {
          field: "firstName",
          label: "First name",
          currentValue: "Old",
          requestedValue: "New",
        },
      ],
    });
  });

  it("normalizes current/requested object maps into comparison rows", () => {
    const detail = normalizeProfileCorrectionRequestDetail({
      requestId: "request-1",
      student_id: "student-1",
      currentValues: {
        phone: "111",
      },
      requestedValues: {
        phone: "222",
      },
    });

    expect(detail.changes).toEqual([
      {
        field: "phone",
        label: "phone",
        currentValue: "111",
        requestedValue: "222",
      },
    ]);
  });
});
