# Rewards Overview Filters Design

Allow administrators to filter the rewards overview dashboard page by academic year, term, student, and date range.

## Goal

Provide a local filter bar on the Rewards Overview page that dynamically fetches student options from the `filter-options` endpoint based on the selected academic context, allowing comprehensive filtering of dashboard stats and lists by student and date ranges.

## User Interface

A new local filters section will be displayed below the page-level action bar and navigation:
1. **Student Dropdown**: A searchable `Select` component displaying student options fetched dynamically using `getReinforcementFilterOptions`.
2. **Date From Picker**: A date input field for the start date (`dateFrom`).
3. **Date To Picker**: A date input field for the end date (`dateTo`).
4. **Clear Filters Button**: A button that resets the local selections (student, dateFrom, dateTo) to their default empty states, shown only when at least one filter is active.

## Data Fetching & Integration

1. **Academic Context**: The page consumes `AcademicYearTermLayoutContext` to obtain `selectedAcademicYear` and `selectedTerm`.
2. **Dynamic Student Fetching**:
   Whenever `selectedAcademicYear?.id` or `selectedTerm?.id` changes, the page triggers `getReinforcementFilterOptions({ academicYearId, termId })` to load the current list of active students.
   The list of students is mapped using `mapStudentOption` and set in local state. If the currently selected `studentId` is not found in the new list, it is reset.
3. **Overview Fetching**:
   The page fetches overview dashboard data using `getRewardsOverview({ academicYearId, termId, studentId, dateFrom, dateTo })`.
   - Any change to the academic context, student selection, or dates triggers a refetch of `getRewardsOverview`.
   - The catalog summary stats fetched via `getRewardCatalogSummary` are updated based on context (`academicYearId` and `termId`) only, as the backend endpoint does not support student or date filtering.
4. **Date Validation**:
   When both `dateFrom` and `dateTo` are provided, the page validates that `dateFrom <= dateTo`. If invalid, fetching is skipped, and a localized validation error is displayed.

## Verification Plan

### Automated Tests
- **Filter Loading**: Verify that `getReinforcementFilterOptions` is called with the selected academic context IDs on mount and context changes.
- **Student Options rendering**: Verify that returned student options are correctly rendered in the searchable selector.
- **Data Fetching with Filters**: Verify that `getRewardsOverview` is called with correct query parameters including `studentId`, `dateFrom`, and `dateTo`.
- **Date Range Validation**: Verify that an error message is displayed and API calls are blocked if `dateFrom` is after `dateTo`.
- **Reset Filters**: Verify that clicking the "Clear Filters" button resets the local state and triggers a refresh with cleared parameters.
