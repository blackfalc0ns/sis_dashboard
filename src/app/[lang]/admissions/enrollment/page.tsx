// FILE: src/app/[lang]/admissions/enrollment/page.tsx

"use client";

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import EnrollmentList from "@/components/admissions/EnrollmentList";

export default function EnrollmentPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <EnrollmentList />
      </main>
    </SideBarTopNav>
  );
}
