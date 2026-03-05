// FILE: src/app/[lang]/admissions/decisions/page.tsx

import DecisionsList from "@/features/admissions/decisions/pages/DecisionsList";

export default function DecisionsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <DecisionsList />
    </main>
  );
}
