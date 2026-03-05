// Students & Guardians Feature Module
// Organized by sub-features matching academics structure

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
export { default as ChartFilter, type ChartFilterValues } from './shared/ChartFilter';

// ============================================================================
// DASHBOARD
// ============================================================================
export * from './dashboard/components/charts/AbsenceHeatmap';
export * from './dashboard/components/charts/PassFailRatioChart';
export * from './dashboard/components/charts/RetentionCohortChart';
export * from './dashboard/components/charts/StudentsByGradeChart';
export * from './dashboard/components/charts/StudentsByStatusChart';
export * from './dashboard/pages/StudentsGuardiansDashboard';
export * from './dashboard/pages/StudentsGuardiansDashboardView';
export * from './dashboard/container/StudentsGuardiansDashboardContainer';
export { type StudentFilterValues, filterStudents, type DateRangeValue } from './dashboard/utils/studentFilters';
export * from './dashboard/utils/studentStatsCalculator';

// ============================================================================
// STUDENTS
// ============================================================================
export * from './students/pages/StudentsList';
export * from './students/pages/StudentProfilePage';
export * from './students/components/modals/AddNoteModal';
export * from './students/components/modals/BulkUploadModal';
export * from './students/components/modals/ChangePasswordModal';
export * from './students/components/modals/UploadDocumentModal';
export * from './students/utils/studentsListFilters';

// ============================================================================
// GUARDIANS
// ============================================================================
export * from './guardians/pages/GuardiansList';
export * from './guardians/pages/GuardianProfilePage';

// ============================================================================
// DOCUMENTS
// ============================================================================
export * from './documents/pages/DocumentsCenter';

// ============================================================================
// TRANSFERS & WITHDRAWALS
// ============================================================================
export * from './transfers-withdrawals/pages/TransfersWithdrawalsPage';
export * from './transfers-withdrawals/components/tables/TransfersWithdrawalsTable';
export * from './transfers-withdrawals/components/TransfersTab';
export * from './transfers-withdrawals/components/WithdrawalsTab';
export * from './transfers-withdrawals/components/TransfersTable';
export * from './transfers-withdrawals/components/WithdrawalsTable';
