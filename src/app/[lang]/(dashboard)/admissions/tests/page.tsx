// FILE: src/app/[lang]/admissions/tests/page.tsx

"use client";

import TestsList from "@/components/admissions/TestsList";

export default function TestsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <TestsList />
    </main>
  );
}
