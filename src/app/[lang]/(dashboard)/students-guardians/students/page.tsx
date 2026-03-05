// FILE: src/app/[lang]/students-guardians/students/page.tsx

import StudentsList from "@/features/students-guardians/students/pages/StudentsList";

// Students list page
export default function StudentsListPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <StudentsList />
    </main>
  );
}
