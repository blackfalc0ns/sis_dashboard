import { describe, it, expect } from "vitest";
import { conversationRedesignLabels } from "../conversations_redesign/labels";

describe("conversationRedesignLabels", () => {
  const requiredLabels = [
    "userType_platform_user",
    "userType_organization_user",
    "userType_school_user",
    "userType_teacher",
    "userType_parent",
    "userType_student",
    "userType_guardian",
    "userType_applicant",
    "userType_pickup_delegate",
    "userType_service_account",
  ] as const;

  it("should contain all required userType labels in English", () => {
    requiredLabels.forEach((label) => {
      expect(conversationRedesignLabels.en).toHaveProperty(label);
      expect(typeof conversationRedesignLabels.en[label as keyof typeof conversationRedesignLabels.en]).toBe("string");
    });
  });

  it("should contain all required userType labels in Arabic", () => {
    requiredLabels.forEach((label) => {
      expect(conversationRedesignLabels.ar).toHaveProperty(label);
      expect(typeof conversationRedesignLabels.ar[label as keyof typeof conversationRedesignLabels.ar]).toBe("string");
    });
  });
});
