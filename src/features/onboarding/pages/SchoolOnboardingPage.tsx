"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { SetupGuideContent } from "../components/SetupGuideContent";
import { markOnboardingSkipped } from "../components/OnboardingRedirectGuard";

export default function SchoolOnboardingPage() {
  const result = useSetupStatus();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const locale = params.lang ?? "en";
  const canSkip =
    result.evaluation.steps.academicContext.isComplete &&
    result.evaluation.steps.structure.isComplete;

  function handleSkip() {
    if (!canSkip) return;
    markOnboardingSkipped(result.schoolId);
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Add academic years, terms, and academic structure before skipping.
        </p>
        <Button
          disabled={!canSkip}
          onClick={handleSkip}
          type="button"
          variant="outline"
        >
          Skip setup
        </Button>
      </div>
      <SetupGuideContent result={result} title="School setup" />
    </div>
  );
}
