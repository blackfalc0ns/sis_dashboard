import { describe, expect, it } from "vitest";
import { navigationPermissionByKey } from "../usePermissions";

describe("behavior navigation permissions", () => {
  it("maps each behavior destination to its backend view permission", () => {
    expect(navigationPermissionByKey).toMatchObject({
      "behavior-overview": "behavior.overview.view",
      "behavior-reviews": "behavior.records.view",
      "behavior-records": "behavior.records.view",
      "behavior-categories": "behavior.categories.view",
    });
  });
});
