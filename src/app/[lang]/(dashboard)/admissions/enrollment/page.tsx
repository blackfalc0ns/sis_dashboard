// FILE: src/app/[lang]/admissions/enrollment/page.tsx

"use client";

import EnrollmentList from "@/components/admissions/EnrollmentList";

export default function EnrollmentPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <EnrollmentList />
    </main>
  );
}
