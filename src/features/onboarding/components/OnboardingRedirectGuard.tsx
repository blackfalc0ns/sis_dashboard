"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSetupStatus } from "../hooks/useSetupStatus";
import { isSetupSnapshotLoading } from "../utils/setupStatus";

function skippedStorageKey(schoolId: string) {
  return `sis:onboarding:skipped:${schoolId}`;
}

function localeFromPathname(pathname: string | null) {
  return pathname?.split("/").filter(Boolean)[0] || "en";
}

function isOnboardingPath(pathname: string | null) {
  return Boolean(pathname?.match(/^\/[^/]+\/settings\/onboarding(?:\/)?$/));
}

export function markOnboardingSkipped(schoolId: string) {
  if (!schoolId) return;
  sessionStorage.setItem(skippedStorageKey(schoolId), "true");
}

export function hasSkippedOnboarding(schoolId: string) {
  if (!schoolId) return false;
  return sessionStorage.getItem(skippedStorageKey(schoolId)) === "true";
}

export function OnboardingRedirectGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { evaluation, schoolId, snapshot } = useSetupStatus();

  useEffect(() => {
    if (!schoolId || evaluation.isComplete || isOnboardingPath(pathname)) {
      return;
    }

    if (isSetupSnapshotLoading(snapshot) || hasSkippedOnboarding(schoolId)) {
      return;
    }

    router.replace(`/${localeFromPathname(pathname)}/settings/onboarding`);
  }, [evaluation.isComplete, pathname, router, schoolId, snapshot]);

  return <>{children}</>;
}
