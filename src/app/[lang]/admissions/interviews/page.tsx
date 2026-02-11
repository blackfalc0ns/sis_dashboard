// FILE: src/app/[lang]/admissions/interviews/page.tsx

"use client";

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import InterviewsList from "@/components/admissions/InterviewsList";

export default function InterviewsPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <InterviewsList />
      </main>
    </SideBarTopNav>
  );
}
