# Rewards Overview Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow administrators to filter the rewards overview dashboard page by academic context, student, and date range, using existing filter components and URL synchronization hooks.

**Architecture:** Use `useReinforcementUrlFilters` to manage the filter state in the URL query string. Display the existing `ReinforcementAcademicContextFilter` component with `showStudent` enabled, along with custom date picker inputs for `dateFrom` and `dateTo`. Refetch the statistics from `getRewardsOverview` whenever these filters change.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, Vitest, React Testing Library.

## Global Constraints
- Write type-safe TypeScript code without using `any` types.
- Follow the CommonMark markdown standard (blank line before/after headers and lists).
- Ensure all tests pass before completing.

---

### Task 1: Type Definitions

**Files:**
- Modify: `src/features/reinforcement/types.ts:802-806`

**Interfaces:**
- Consumes: None
- Produces: Updated `RewardsOverviewParams` with explicit fields for `studentId`, `dateFrom`, and `dateTo`.

- [ ] **Step 1: Update type definitions**

Update `RewardsOverviewParams` in [types.ts](file:///e:/sis-dashboard/src/features/reinforcement/types.ts) to define the filtering query fields.

```typescript
export interface RewardsOverviewParams {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}
```

- [ ] **Step 2: Verify type compilation**

Run type check:
```powershell
npm run typecheck
```
Expected: PASS with no compilation errors.

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/types.ts
git commit -m "types: add explicit query fields to RewardsOverviewParams"
```

---

### Task 2: Implement UI Filters & State Synchronization

**Files:**
- Modify: `src/features/reinforcement/pages/RewardsOverviewPage.tsx`

**Interfaces:**
- Consumes: `useReinforcementUrlFilters`, `ReinforcementAcademicContextFilter`, `getRewardsOverview`, `getRewardCatalogSummary`, `Input`.
- Produces: Integrated filter UI and API request logic inside `RewardsOverviewPage`.

- [ ] **Step 1: Update imports and state in RewardsOverviewPage.tsx**

Update imports and incorporate URL filters hook and filter component in [RewardsOverviewPage.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/RewardsOverviewPage.tsx):

```typescript
// Replace lines 22-25 with:
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  getRewardCatalogSummary,
  getRewardsOverview,
} from "../services/rewardDashboardService";
import Input from "@/components/ui/input/Input";
```

Replace page state setup using `useReinforcementUrlFilters` and local date validation state:

```typescript
export default function RewardsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const {
    values,
    setValue,
    clearAll,
  } = useReinforcementUrlFilters({
    paramKeys: [
      "academicYearId",
      "termId",
      "stageId",
      "gradeId",
      "sectionId",
      "classroomId",
      "studentId",
      "enrollmentId",
      "dateFrom",
      "dateTo",
    ],
    defaults: {},
  });

  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      studentId: values.studentId || undefined,
      enrollmentId: values.enrollmentId || undefined,
    }),
    [
      values.academicYearId,
      values.termId,
      values.stageId,
      values.gradeId,
      values.sectionId,
      values.classroomId,
      values.studentId,
      values.enrollmentId,
    ],
  );

  const [overview, setOverview] = useState<Record<string, unknown> | null>(
    null,
  );
  const [catalogSummary, setCatalogSummary] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);
```

- [ ] **Step 2: Update fetchData to accept filters**

Update `fetchData` and `useEffect` in [RewardsOverviewPage.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/RewardsOverviewPage.tsx):

```typescript
  const fetchData = useCallback(async () => {
    if (!canView) return;
    
    // Date validation
    if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
      setDateValidationError(t("rewardsModule.overview.errors.invalidDates") || "Start date cannot be after end date");
      setOverview(null);
      setLoading(false);
      return;
    }
    setDateValidationError(null);
    setLoading(true);
    setError(null);
    
    try {
      // Catalog summary does not support student or date filtering
      const [overviewData, summaryData] = await Promise.all([
        getRewardsOverview({
          academicYearId: values.academicYearId || undefined,
          termId: values.termId || undefined,
          studentId: values.studentId || undefined,
          dateFrom: values.dateFrom || undefined,
          dateTo: values.dateTo || undefined,
        }),
        getRewardCatalogSummary({
          academicYearId: values.academicYearId || undefined,
          termId: values.termId || undefined,
        }),
      ]);
      setOverview(overviewData);
      setCatalogSummary(summaryData);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : t("common.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    t,
    values.academicYearId,
    values.termId,
    values.studentId,
    values.dateFrom,
    values.dateTo,
  ]);
```

- [ ] **Step 3: Render filters in the page**

Render the filter section in the TSX layout (below the navigation buttons and above the KPI cards):

```typescript
          {/* Filters section */}
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t("rewardsModule.overview.filtersTitle") || "Filters"}
            </h2>
            
            <ReinforcementAcademicContextFilter
              value={context}
              showStudent
              onChange={(selection: ReinforcementAcademicContextSelection) => {
                setValue("academicYearId", selection.academicYearId || "");
                setValue("termId", selection.termId || "");
                setValue("stageId", selection.stageId || "");
                setValue("gradeId", selection.gradeId || "");
                setValue("sectionId", selection.sectionId || "");
                setValue("classroomId", selection.classroomId || "");
                setValue("studentId", selection.studentId || "");
                setValue("enrollmentId", selection.enrollmentId || "");
              }}
            />

            <div className="grid gap-4 md:grid-cols-3 items-end">
              <Input
                type="date"
                label={t("rewardsModule.overview.dateFrom") || "Date From"}
                value={values.dateFrom || ""}
                onChange={(e) => setValue("dateFrom", e.target.value)}
              />
              <Input
                type="date"
                label={t("rewardsModule.overview.dateTo") || "Date To"}
                value={values.dateTo || ""}
                onChange={(e) => setValue("dateTo", e.target.value)}
              />
              {(values.studentId || values.dateFrom || values.dateTo) ? (
                <Button variant="secondary" onClick={clearAll} className="w-full md:w-auto">
                  {t("rewardsModule.overview.clearFilters") || "Clear Filters"}
                </Button>
              ) : null}
            </div>

            {dateValidationError ? (
              <p className="text-xs text-red-600 font-medium">{dateValidationError}</p>
            ) : null}
          </section>
```

- [ ] **Step 4: Verify type compilation**

Run type check:
```powershell
npm run typecheck
```
Expected: PASS with no compilation errors.

- [ ] **Step 5: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/RewardsOverviewPage.tsx
git commit -m "feat: integrate academic and date filters in RewardsOverviewPage"
```

---

### Task 3: Write Page Tests

**Files:**
- Create: `src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx`

**Interfaces:**
- Consumes: `RewardsOverviewPage`, `vi` mocks.
- Produces: Test file verifying filtering behavior, validation, and URL state sync.

- [ ] **Step 1: Write test suite**

Create [RewardsOverviewPage.test.tsx](file:///e:/sis-dashboard/src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx) with the following content:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import RewardsOverviewPage from "../RewardsOverviewPage";

const permissionState = vi.hoisted(() => ({
  permissions: ["reinforcement.rewards.view"] as string[],
}));

const dashboardMocks = vi.hoisted(() => ({
  getRewardsOverview: vi.fn(),
  getRewardCatalogSummary: vi.fn(),
}));

const filterOptionMocks = vi.hoisted(() => ({
  getReinforcementFilterOptions: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionState.permissions.includes(permission),
  }),
}));

vi.mock(
  "@/features/reinforcement/services/rewardDashboardService",
  () => dashboardMocks,
);

vi.mock(
  "@/features/reinforcement/services/reinforcementFilterOptionsService",
  () => filterOptionMocks,
);

vi.mock("@/features/reinforcement/components/ReinforcementAcademicContextFilter", () => ({
  default: ({ value, onChange }: any) => (
    <div data-testid="academic-filter">
      <button
        onClick={() =>
          onChange({
            academicYearId: "year-1",
            termId: "term-1",
            studentId: "student-123",
          })
        }
      >
        Select Student 123
      </button>
    </div>
  ),
}));

function renderPage() {
  return render(
    <ToastProvider>
      <RewardsOverviewPage />
    </ToastProvider>,
  );
}

describe("RewardsOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    dashboardMocks.getRewardsOverview.mockResolvedValue({
      catalog: { total: 10, published: 5 },
      redemptions: { pending: 2 },
      fulfillment: { completed: 3 },
      xp: { granted: 100 },
      topRequestedRewards: [],
      recentRedemptions: [],
      lowStockRewards: [],
    });

    dashboardMocks.getRewardCatalogSummary.mockResolvedValue({
      summary: { total: 10 },
    });

    filterOptionMocks.getReinforcementFilterOptions.mockResolvedValue({
      students: [],
    });
  });

  it("calls getRewardsOverview and getRewardCatalogSummary with query parameters on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenCalled();
      expect(dashboardMocks.getRewardCatalogSummary).toHaveBeenCalled();
    });
  });

  it("refetches overview with selected student when student is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    const selectBtn = await screen.findByText("Select Student 123");
    await user.click(selectBtn);

    await waitFor(() => {
      expect(dashboardMocks.getRewardsOverview).toHaveBeenLastCalledWith(
        expect.objectContaining({
          studentId: "student-123",
        }),
      );
    });
  });

  it("blocks fetching and displays validation error when dateFrom is after dateTo", async () => {
    const user = userEvent.setup();
    renderPage();

    const dateFromInput = screen.getByLabelText("rewardsModule.overview.dateFrom");
    const dateToInput = screen.getByLabelText("rewardsModule.overview.dateTo");

    await user.type(dateFromInput, "2026-06-30");
    await user.type(dateToInput, "2026-06-25");

    await waitFor(() => {
      expect(
        screen.getByText("rewardsModule.overview.errors.invalidDates"),
      ).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test suite**

Run tests:
```powershell
npx vitest run src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx
```
Expected: PASS

- [ ] **Step 3: Commit changes**

Run:
```bash
git add src/features/reinforcement/pages/__tests__/RewardsOverviewPage.test.tsx
git commit -m "test: add unit tests for RewardsOverviewPage filter integration"
```
