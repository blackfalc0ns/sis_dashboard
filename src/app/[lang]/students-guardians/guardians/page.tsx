// FILE: src/app/[lang]/students-guardians/guardians/page.tsx

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import GuardiansList from "@/components/students-guardians/GuardiansList";

// Guardians list page
export default function GuardiansListPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <GuardiansList />
      </main>
    </SideBarTopNav>
  );
}
