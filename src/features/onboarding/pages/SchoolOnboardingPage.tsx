"use client";

import { useSetupStatus } from "../hooks/useSetupStatus";
import { SetupGuideContent } from "../components/SetupGuideContent";

export default function SchoolOnboardingPage() {
  const result = useSetupStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <SetupGuideContent result={result} title="School setup" />
    </div>
  );
}
