// FILE: src/app/[lang]/students-guardians/page.tsx

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import StudentsGuardiansDashboard from "@/components/students-guardians/StudentsGuardiansDashboard";

export default function StudentsGuardiansPage() {
  return (
    <SideBarTopNav>
      <StudentsGuardiansDashboard />
    </SideBarTopNav>
  );
}
