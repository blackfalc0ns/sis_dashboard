import { describe, expect, it } from "vitest";
import { menuItems } from "@/config/navigation";
import en from "../en.json";
import ar from "../ar.json";

function keysOf(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("onboarding translations and navigation", () => {
  it("keeps onboarding translation keys identical in both locales", () => {
    expect(ar.onboarding).toBeDefined();
    expect(en.onboarding).toBeDefined();
    expect(keysOf(ar.onboarding).sort()).toEqual(keysOf(en.onboarding).sort());
  });

  it("adds school setup under settings after branding", () => {
    const settings = menuItems.find((item) => item.key === "settings");
    const keys = settings?.children?.map((item) => item.key) ?? [];

    expect(keys.slice(keys.indexOf("settings-branding"), keys.indexOf("settings-branding") + 2)).toEqual([
      "settings-branding",
      "settings-onboarding",
    ]);
    expect(settings?.children?.find((item) => item.key === "settings-onboarding")).toEqual(
      expect.objectContaining({
        label_en: "School setup",
        label_ar: "إعداد المدرسة",
        href_en: "/en/settings/onboarding",
        href_ar: "/ar/settings/onboarding",
      }),
    );
  });
});
