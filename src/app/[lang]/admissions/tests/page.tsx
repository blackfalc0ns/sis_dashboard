// FILE: src/app/[lang]/admissions/tests/page.tsx

"use client";

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import TestsList from "@/components/admissions/TestsList";

export default function TestsPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <TestsList />
      </main>
    </SideBarTopNav>
  );
}
