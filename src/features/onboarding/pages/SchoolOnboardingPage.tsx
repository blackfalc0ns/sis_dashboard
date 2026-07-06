"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { SetupGuideContent } from "../components/SetupGuideContent";
import { markOnboardingSkipped } from "../components/OnboardingRedirectGuard";

export default function SchoolOnboardingPage() {
  const result = useSetupStatus();
  const t = useTranslations("onboarding");
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
      <header className="onboarding-enter mx-auto mb-6 max-w-6xl text-center sm:mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("setup.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
          {t("setup.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          {t("setup.description")}
        </p>
      </header>

      <div className="onboarding-enter onboarding-enter-delay-1 mx-auto mb-4 flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("setup.skipRequirement")}</p>
        <Button
          disabled={!canSkip}
          onClick={handleSkip}
          type="button"
          variant="outline"
        >
          {t("setup.skip")}
        </Button>
      </div>
      <div className="onboarding-enter onboarding-enter-delay-2">
        <SetupGuideContent result={result} title={t("setup.guideTitle")} />
      </div>
    </div>
  );
}
