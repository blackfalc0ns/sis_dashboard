// FILE: src/features/academics/index.ts
// Main exports for academics feature

// ============================================================================
// PAGES
// ============================================================================
export { default as AcademicCalendarPage } from "./components/pages/AcademicCalendarPage";
export { default as AcademicStructurePage } from "./components/pages/AcademicStructurePage";
export { default as AssignmentBuilderPage } from "./components/pages/AssignmentBuilderPage";
export { default as CurriculumPage } from "./components/pages/CurriculumPage";
export { default as CurriculumPageResizable } from "./components/pages/CurriculumPageResizable";
export { default as LessonPlansPage } from "./components/pages/LessonPlansPage";
export { default as SubjectsAllocationPage } from "./components/pages/SubjectsAllocationPage";
export { default as SubjectsAllocationView } from "./components/pages/SubjectsAllocationView";
export { default as TeacherAllocationPage } from "./components/pages/TeacherAllocationPage";
export { default as TeacherAllocationView } from "./components/pages/TeacherAllocationView";
export { default as TimetablePage } from "./components/pages/TimetablePage";

// ============================================================================
// CONTAINERS
// ============================================================================
export { default as SubjectsAllocationContainer } from "./containers/SubjectsAllocationContainer";
export { default as TeacherAllocationContainer } from "./containers/TeacherAllocationContainer";

// ============================================================================
// UTILITIES
// ============================================================================
// Note: Utilities are not re-exported to avoid naming conflicts
// Import directly from specific utility files when needed
