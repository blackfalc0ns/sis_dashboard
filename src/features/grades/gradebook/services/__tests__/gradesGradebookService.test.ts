import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/api", () => ({
  ...apiMocks,
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

import { fetchGradesFiltersData } from "../gradesGradebookService";

describe("grades bootstrap endpoint contract", () => {
  beforeEach(() => apiMocks.apiGet.mockReset());

  it("supports the backend bootstrap request without optional selectors", async () => {
    apiMocks.apiGet.mockResolvedValue({
      academicYears: [], terms: [], stages: [], grades: [], sections: [],
      classrooms: [], subjects: [],
      defaults: { academicYearId: null, termId: null },
      supportedScopes: ["school", "stage", "grade", "section", "classroom"],
      assessmentTypes: [], deliveryModes: [], approvalStatuses: [],
    });

    await fetchGradesFiltersData();

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/bootstrap", expect.any(Object));
    expect(Object.keys(apiMocks.apiGet.mock.calls[0][1].params)).toEqual([]);
  });
});
