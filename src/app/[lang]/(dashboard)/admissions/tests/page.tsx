// FILE: src/app/[lang]/admissions/tests/page.tsx

import TestsList from "@/components/features/admissions/components/lists/TestsList";

export default function TestsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <TestsList />
    </main>
  );
}
