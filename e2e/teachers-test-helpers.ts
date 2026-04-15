import { expect, type Page } from "@playwright/test";

export const openTeachersContext = {
  yearId: "year-2",
  termId: "term-2-1",
} as const;

export function withTeachersQuery(
  pathname: string,
  overrides: Partial<Record<string, string>> = {},
) {
  const params = new URLSearchParams({
    ...openTeachersContext,
    ...overrides,
  });

  return `${pathname}?${params.toString()}`;
}

export function trackPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
}

export async function expectNoPageErrors(errors: string[]) {
  const unexpectedErrors = errors.filter(
    (message) =>
      !message.includes(
        "Hydration failed because the server rendered HTML didn't match the client.",
      ),
  );

  expect(
    unexpectedErrors,
    `Unexpected page errors:\n${unexpectedErrors.join("\n")}`,
  ).toEqual([]);
}

export async function expectSharedAcademicsContextBar(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Academic Context" }),
  ).toHaveCount(1);
}

export async function expandContextBar(page: Page) {
  const termLabel = page.locator("label").filter({ hasText: "Term" }).first();
  if ((await termLabel.count()) > 0 && (await termLabel.isVisible())) {
    return;
  }

  const toggle = page
    .locator("button")
    .filter({
      has: page.getByRole("heading", { name: "Academic Context" }),
    })
    .first();
  await toggle.click();
  await expect(
    page.locator("label").filter({ hasText: "Term" }).first(),
  ).toBeVisible();
}

export async function chooseSelectOption(
  page: Page,
  label: string,
  optionLabel: string,
) {
  const field = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..");
  await field.getByRole("button").click();
  await page
    .getByRole("button", { name: optionLabel, exact: true })
    .last()
    .click();
}

export async function fillInputByLabel(
  page: Page,
  label: string,
  value: string,
) {
  const field = page
    .locator("label")
    .filter({ hasText: label })
    .first()
    .locator("..");
  const input = field.locator("input").first();
  await input.fill("");
  await input.fill(value);
}
