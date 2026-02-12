// FILE: src/app/[lang]/students-guardians/students/page.tsx

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import StudentsList from "@/components/students-guardians/StudentsList";

// Students list page
export default function StudentsListPage() {
  return (
    <SideBarTopNav>
      <StudentsList />;
    </SideBarTopNav>
  );
}
