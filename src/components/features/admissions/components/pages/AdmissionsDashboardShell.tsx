"use client";

import { Suspense } from "react";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AdmissionsDashboardContent from "./AdmissionsDashboardContent";

/**
 * Shell component that renders immediately
 * Shows MainLoader while heavy content loads
 */
export default function AdmissionsDashboardShell() {
  return (
    <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-x-hidden">
      <Suspense fallback={<MainLoader />}>
        <AdmissionsDashboardContent />
      </Suspense>
    </main>
  );
}
