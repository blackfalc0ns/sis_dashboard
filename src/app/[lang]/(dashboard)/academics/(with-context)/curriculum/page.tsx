import AcademicsPermissionGuard from "@/features/academics/components/AcademicsPermissionGuard";
import CurriculumPage from "@/features/academics/curriculum/pages/CurriculumPageContent";

export default function Page() {
  return (
    <AcademicsPermissionGuard permission="academics.curriculum.view">
      <CurriculumPage />
    </AcademicsPermissionGuard>
  );
}
