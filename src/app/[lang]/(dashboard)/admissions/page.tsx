// FILE: src/app/[lang]/admissions/page.tsx

"use client";

import AdmissionsDashboard from "@/components/admissions/AdmissionsDashboard";

export default function AdmissionsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <AdmissionsDashboard />
    </main>
  );
}
