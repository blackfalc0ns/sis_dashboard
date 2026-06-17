import { describe, expect, test } from "vitest";

import { normalizeDocument } from "@/features/admissions/shared/services/admissionsApiUtils";

describe("normalizeDocument", () => {
  test.each([
    ["pending_review", "pending_review"],
    ["PENDING_REVIEW", "pending_review"],
    ["pending-review", "pending_review"],
    ["pending review", "pending_review"],
    ["complete", "complete"],
    ["accepted", "complete"],
    ["approved", "complete"],
    ["missing", "missing"],
    ["rejected", "missing"],
    ["replacement_requested", "missing"],
    ["needs_replacement", "missing"],
    ["unexpected", "missing"],
    [null, "missing"],
  ] as const)("maps backend status %s to %s", (backendStatus, expectedStatus) => {
    expect(
      normalizeDocument({
        id: "doc-1",
        documentType: "Birth Certificate",
        status: backendStatus,
      }).status,
    ).toBe(expectedStatus);
  });
});
