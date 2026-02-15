// FILE: src/app/[lang]/admissions/decisions/page.tsx

"use client";

import DecisionsList from "@/components/admissions/DecisionsList";

export default function DecisionsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <DecisionsList />
    </main>
  );
}
