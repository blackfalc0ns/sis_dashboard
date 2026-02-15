// FILE: src/app/[lang]/students-guardians/students/page.tsx

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import StudentsList from "@/components/students-guardians/StudentsList";

// Students list page
export default function StudentsListPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <StudentsList />
      </main>
    </SideBarTopNav>
  );
}
