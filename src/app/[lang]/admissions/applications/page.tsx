// FILE: src/app/[lang]/admissions/applications/page.tsx

"use client";

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import ApplicationsList from "@/components/admissions/ApplicationsList";

export default function ApplicationsPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <ApplicationsList />
      </main>
    </SideBarTopNav>
  );
}
