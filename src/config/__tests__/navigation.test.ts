import { describe, expect, it } from "vitest";
import { menuItems } from "@/config/navigation";

describe("Admissions navigation", () => {
  it("uses Applications as the Admissions entry point without an Overview child", () => {
    const admissions = menuItems.find(
      (menuItem) => menuItem.key === "admissions-registration",
    );

    expect(admissions).toBeDefined();
    expect(admissions?.href_en).toBe("/en/admissions/applications");
    expect(admissions?.href_ar).toBe("/ar/admissions/applications");
    expect(admissions?.children?.[0]?.key).toBe("admissions-applications");
    expect(admissions?.children).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "admissions-dashboard" }),
      ]),
    );
  });
});
