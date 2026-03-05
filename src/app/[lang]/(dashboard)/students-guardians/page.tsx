// FILE: src/app/[lang]/students-guardians/page.tsx

import StudentsGuardiansDashboard from "@/features/students-guardians/dashboard/pages/StudentsGuardiansDashboard";

export default function StudentsGuardiansPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <StudentsGuardiansDashboard />
    </main>
  );
}
