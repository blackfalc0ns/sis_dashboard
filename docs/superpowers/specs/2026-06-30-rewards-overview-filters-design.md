# Rewards Overview Filters Design

Allow administrators to filter the rewards overview dashboard page by academic context, student, and date range, reusing the existing filter components and URL synchronization hooks.

## Goal

Provide a local filter bar on the Rewards Overview page that reuses `ReinforcementAcademicContextFilter` and URL filter state management to filter overview statistics and lists by student, academic contexts, and date ranges.

## User Interface

A new filters section will be displayed below the page-level action bar and navigation, using the existing layout patterns:
1. **Academic Context & Student Filter**: Render `ReinforcementAcademicContextFilter` with `showStudent` enabled. This automatically loads academic context selectors (Year, Term, Class, Section, Grade) and the searchable student selector inside a single unified component.
2. **Date Range Filters**: Below the context filter, render a date range filter bar containing:
   - **Date From**: A `<Input type="date">` component.
   - **Date To**: A `<Input type="date">` component.
   - **Clear Filters Button**: A button to reset date and local filter inputs.

## Data Fetching & Integration

1. **State Management**:
   The page integrates `useReinforcementUrlFilters` to synchronize selection params across:
   - `academicYearId`
   - `termId`
   - `stageId`
   - `gradeId`
   - `sectionId`
   - `classroomId`
   - `studentId`
   - `enrollmentId`
   - `dateFrom`
   - `dateTo`
2. **Filter Options Endpoint**:
   `ReinforcementAcademicContextFilter` internally uses the `/reinforcement/filter-options` endpoint via `getReinforcementFilterOptions` to fetch the list of academic context records and active students, mapping options using `mapStudentOption` automatically.
3. **Overview Fetching**:
   The page fetches overview dashboard data using `getRewardsOverview({ academicYearId, termId, studentId, dateFrom, dateTo })`.
   - Any change to URL filters (including context changes, student selection, or dates) triggers a refetch of `getRewardsOverview`.
   - The catalog summary stats fetched via `getRewardCatalogSummary` are updated based on context (`academicYearId` and `termId`) only, as the backend endpoint does not support student or date filtering.
4. **Date Validation**:
   When both `dateFrom` and `dateTo` are provided, the page validates that `dateFrom <= dateTo`. If invalid, fetching is skipped, and a localized validation error is displayed.

## Verification Plan

### Automated Tests
- **Filter Component Rendering**: Verify that `ReinforcementAcademicContextFilter` is rendered with `showStudent` enabled.
- **URL Synchronization**: Verify that changes to the context filter, student selector, or date inputs update the URL query parameters using `useReinforcementUrlFilters`.
- **Data Fetching with Filters**: Verify that `getRewardsOverview` is called with the selected context IDs, student ID, and date ranges when they change.
- **Date Range Validation**: Verify that an error message is displayed and API calls are blocked if `dateFrom` is after `dateTo`.
- **Clear Filters**: Verify that resetting date filters triggers a refetch with empty parameters.
