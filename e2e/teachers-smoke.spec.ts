import { test, expect } from "@playwright/test";
import {
  chooseSelectOption,
  expectNoPageErrors,
  expectSharedAcademicsContextBar,
  expandContextBar,
  trackPageErrors,
  withTeachersQuery,
} from "./teachers-test-helpers";

test.describe("Teachers Migrated Smoke", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1700, height: 1100 } });

  test("teachers page renders under the shared academics layout and preserves academic context", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(withTeachersQuery("/en/teachers"));
    await page.waitForLoadState("networkidle");

    await expectSharedAcademicsContextBar(page);
    await expect(page.getByRole("heading", { name: "Teachers Management" })).toBeVisible();
    await expect(
      page.getByText(
        "Manage teacher profiles, assignments, passwords, and activation status.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Teacher" })).toBeVisible();
    await expect(page).toHaveURL(/yearId=year-2/);
    await expect(page).toHaveURL(/termId=term-2-1/);

    await expandContextBar(page);
    await chooseSelectOption(page, "Term", "Term 2");
    await expect(page).toHaveURL(/termId=term-2-2/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expectSharedAcademicsContextBar(page);
    await expect(page).toHaveURL(/termId=term-2-2/);
    await expect(page.getByRole("button", { name: "Add Teacher" })).toBeVisible();

    await expectNoPageErrors(pageErrors);
  });

  test("teachers filter query params hydrate, normalize, and keep dependent filters consistent", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(
      withTeachersQuery("/en/teachers", {
        search: "Ahmed",
        status: "BOGUS",
        gender: "INVALID",
        stageId: "stage-1",
        gradeId: "grade-7",
      }),
    );
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/search=Ahmed/);
    await expect(page).not.toHaveURL(/status=BOGUS/);
    await expect(page).not.toHaveURL(/gender=INVALID/);
    await expect(page).toHaveURL(/stageId=stage-1/);
    await expect(page).not.toHaveURL(/gradeId=grade-7/);

    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await chooseSelectOption(page, "Status", "Active");
    await chooseSelectOption(page, "Gender", "Male");
    await expect(page).toHaveURL(/status=ACTIVE/);
    await expect(page).toHaveURL(/gender=MALE/);

    await page.getByPlaceholder("Search by code, name, email, or phone").fill("Sara");
    await expect(page).toHaveURL(/search=Sara/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/search=Sara/);
    await expect(page).toHaveURL(/status=ACTIVE/);
    await expect(page).toHaveURL(/gender=MALE/);

    await expectNoPageErrors(pageErrors);
  });

  test("teachers page key dialogs, drawer, and export entry points open safely", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);

    await page.goto(withTeachersQuery("/en/teachers"));
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Add Teacher" }).click();
    await expect(page.getByRole("dialog", { name: "Add Teacher" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "General Information" })).toBeVisible();
    await expect(page.getByText("Teacher Code*")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog", { name: "Add Teacher" })).toHaveCount(0);

    await page.getByRole("button", { name: "View details" }).first().click();
    await expect(page.getByRole("dialog", { name: "Teacher Details" })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Change password" }).first().click();
    await expect(page.getByRole("heading", { name: "Change Password" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByRole("heading", { name: "Delete Teacher" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByText("CSV", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("CSV", { exact: true })).toHaveCount(0);

    await expectNoPageErrors(pageErrors);
  });
});
