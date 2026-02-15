// FILE: src/app/[lang]/students-guardians/page.tsx

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import StudentsGuardiansDashboard from "@/components/students-guardians/StudentsGuardiansDashboard";

export default function StudentsGuardiansPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <StudentsGuardiansDashboard />
      </main>
    </SideBarTopNav>
  );
}
