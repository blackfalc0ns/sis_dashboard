// FILE: src/app/[lang]/admissions/leads/page.tsx

"use client";

import LeadsList from "@/components/leads/LeadsList";

export default function LeadsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <LeadsList />
    </main>
  );
}
