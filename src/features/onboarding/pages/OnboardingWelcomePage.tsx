"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarRange,
  DoorOpen,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { isSetupSnapshotLoading } from "../utils/setupStatus";

const welcomeStages = [
  {
    title: "Organization",
    description: "Add your school profile and core details.",
    icon: Building2,
  },
  {
    title: "Academic year and terms",
    description: "Define the calendar used across academics.",
    icon: CalendarRange,
  },
  {
    title: "Academic structure",
    description: "Create stages, grades, and sections.",
    icon: Network,
  },
  {
    title: "Subjects and allocations",
    description: "Connect subjects to grades and weekly hours.",
    icon: BookOpen,
  },
  {
    title: "Rooms",
    description: "Add rooms used by schedules and assignments.",
    icon: DoorOpen,
  },
] as const;

export default function OnboardingWelcomePage() {
  const { evaluation, snapshot } = useSetupStatus();
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const locale = params.lang ?? "en";
  const isLoading = isSetupSnapshotLoading(snapshot);

  useEffect(() => {
    if (!isLoading && evaluation.isComplete) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [evaluation.isComplete, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p
          aria-live="polite"
          className="text-sm font-medium text-white motion-safe:animate-pulse"
        >
          Preparing your setup…
        </p>
      </div>
    );
  }

  if (evaluation.isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <header className="onboarding-enter max-w-2xl text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            School onboarding
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Welcome to your school workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/80 sm:text-base">
            Follow the guided setup to add the essential data your dashboard
            needs and avoid missing-data errors.
          </p>
        </header>

        <section
          aria-label="Setup stages"
          className="onboarding-enter onboarding-enter-delay-1 mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {welcomeStages.map(({ title, description, icon: StageIcon }) => (
            <article
              className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-sm"
              key={title}
            >
              <StageIcon aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-sm font-semibold text-gray-950">
                {title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                {description}
              </p>
            </article>
          ))}
        </section>

        <div className="onboarding-enter onboarding-enter-delay-2 mt-8">
          <Button
            onClick={() =>
              router.push(`/${locale}/settings/onboarding/setup`)
            }
            rightIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
            size="lg"
            type="button"
            variant="secondary"
          >
            Start setup
          </Button>
        </div>
      </div>
    </div>
  );
}
