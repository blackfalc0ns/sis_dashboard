// FILE: src/app/[lang]/admissions/decisions/page.tsx

"use client";

import SideBarTopNav from "@/components/layout/SideBarTopNav";
import DecisionsList from "@/components/admissions/DecisionsList";

export default function DecisionsPage() {
  return (
    <SideBarTopNav>
      <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <DecisionsList />
      </main>
    </SideBarTopNav>
  );
}
