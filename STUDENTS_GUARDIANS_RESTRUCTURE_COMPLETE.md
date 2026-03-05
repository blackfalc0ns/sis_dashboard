# Students & Guardians Feature Restructure - Complete

## Overview
Successfully restructured the students-guardians feature to match the academics and admissions architecture. Each sub-feature now has a consistent internal structure with dedicated folders for components, services, types, utils, and more.

## New Structure

```
src/features/students-guardians/
├── shared/                          # Shared components
│   └── ChartFilter.tsx
├── dashboard/                       # Students & Guardians overview
│   ├── components/
│   │   └── charts/                  # Dashboard charts
│   │       ├── AbsenceHeatmap.tsx
│   │       ├── PassFailRatioChart.tsx
│   │       ├── RetentionCohortChart.tsx
│   │       ├── StudentsByGradeChart.tsx
│   │       └── StudentsByStatusChart.tsx
│   ├── config/
│   ├── container/
│   │   └── StudentsGuardiansDashboardContainer.tsx
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   │   ├── StudentsGuardiansDashboard.tsx
│   │   └── StudentsGuardiansDashboardView.tsx
│   ├── services/
│   ├── types/
│   ├── utils/
│   │   ├── studentFilters.ts
│   │   └── studentStatsCalculator.ts
│   └── views/
├── students/                        # Student management
│   ├── components/
│   │   ├── modals/                  # Student modals
│   │   │   ├── AddNoteModal.tsx
│   │   │   ├── BulkUploadModal.tsx
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   └── UploadDocumentModal.tsx
│   │   └── tabs/                    # Student profile tabs
│   ├── config/
│   ├── container/
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   │   ├── StudentsList.tsx
│   │   └── StudentProfilePage.tsx
│   ├── services/
│   ├── types/
│   ├── utils/
│   │   └── studentsListFilters.ts
│   └── views/
├── guardians/                       # Guardian management
│   ├── components/
│   │   └── tabs/                    # Guardian profile tabs
│   ├── config/
│   ├── container/
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   │   ├── GuardiansList.tsx
│   │   └── GuardianProfilePage.tsx
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── views/
├── documents/                       # Document center
│   ├── components/
│   ├── config/
│   ├── container/
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   │   └── DocumentsCenter.tsx
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── views/
├── transfers-withdrawals/           # Transfers & Withdrawals
│   ├── components/
│   │   ├── charts/                  # T&W charts
│   │   │   ├── TransfersByStageChart.tsx
│   │   │   ├── TransfersWithdrawalsTrendChart.tsx
│   │   │   ├── WithdrawalReasonsChart.tsx
│   │   │   └── WithdrawalsByBehaviorChart.tsx
│   │   ├── details/                 # Detail components
│   │   ├── modals/                  # T&W modals
│   │   ├── tables/
│   │   │   └── TransfersWithdrawalsTable.tsx
│   │   ├── TransfersTab.tsx
│   │   ├── TransfersTable.tsx
│   │   ├── WithdrawalsTab.tsx
│   │   └── WithdrawalsTable.tsx
│   ├── config/
│   ├── container/
│   ├── hooks/
│   ├── libs/
│   ├── pages/
│   │   ├── TransfersWithdrawalsPage.tsx
│   │   ├── TransfersOverviewPage.tsx
│   │   ├── TransfersApplicationsPage.tsx
│   │   ├── WithdrawalsOverviewPage.tsx
│   │   └── WithdrawalsApplicationsPage.tsx
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── views/
└── index.ts                         # Feature exports
```

## Standard Sub-Feature Structure

Each sub-feature (dashboard, students, guardians, documents, transfers-withdrawals) follows this consistent structure:

- **components/** - React components specific to this sub-feature
- **config/** - Configuration files and constants
- **container/** - Container components (state management)
- **hooks/** - Custom React hooks
- **libs/** - Third-party library integrations
- **pages/** - Page-level components
- **services/** - API calls and business logic
- **types/** - TypeScript type definitions
- **utils/** - Utility functions
- **views/** - View components (presentational)

## Files Moved

### Dashboard
- Components: All dashboard charts (9 charts)
- Container: `StudentsGuardiansDashboardContainer.tsx`
- Pages: `StudentsGuardiansDashboard.tsx`, `StudentsGuardiansDashboardView.tsx`
- Utils: `studentFilters.ts`, `studentStatsCalculator.ts`

### Students
- Components: Student modals (4 modals), student profile tabs
- Pages: `StudentsList.tsx`, `StudentProfilePage.tsx`
- Utils: `studentsListFilters.ts`

### Guardians
- Components: Guardian profile tabs
- Pages: `GuardiansList.tsx`, `GuardianProfilePage.tsx`

### Documents
- Pages: `DocumentsCenter.tsx`

### Transfers & Withdrawals
- Components: Charts (4 charts), details, modals, tables, tabs
- Pages: All transfers and withdrawals pages (5 pages)

### Shared
- `ChartFilter.tsx` - Shared chart filtering component

## Benefits

1. **Consistent Architecture**: Matches academics and admissions structure exactly
2. **Clear Boundaries**: Each sub-feature is self-contained
3. **Scalability**: Easy to add new sub-features or expand existing ones
4. **Discoverability**: Developers know exactly where to find files
5. **Maintainability**: Related code is grouped together
6. **Type Safety**: Types are co-located with their features
7. **Reusability**: Shared components in dedicated folder

## Import Updates

All imports have been automatically updated by smartRelocate to point to the new locations. The main entry point (`src/features/students-guardians/index.ts`) exports everything needed from each sub-feature.

## Comparison with Other Features

All three main features now follow the same structure:

- **academics**: Sub-features like subjects, teacher-allocation, curriculum, etc.
- **admissions**: Sub-features like dashboard, applications, leads, interviews, etc.
- **students-guardians**: Sub-features like dashboard, students, guardians, documents, transfers-withdrawals

This consistency makes it easy for developers to navigate between features and understand the codebase architecture.

## Next Steps

The students-guardians feature is now fully restructured and ready for development. All sub-features follow the same pattern as academics and admissions, making it easy for developers to navigate and contribute to the codebase.
