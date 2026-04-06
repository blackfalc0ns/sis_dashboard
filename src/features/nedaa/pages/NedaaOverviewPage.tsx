"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import {
  fetchNedaaOverview,
  fetchNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import type {
  NedaaOverviewData,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaOverviewView from "@/features/nedaa/views/NedaaOverviewView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaOverviewPage() {
  const t = useTranslations("nedaa");
  const { hasPermission } = usePermissions();
  const { yearId, termId, isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const canViewOverview = hasPermission("nedaa.overview.view");
  const [overview, setOverview] = useState<NedaaOverviewData | null>(null);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canViewOverview || isContextLoading || !yearId || !termId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [nextOverview, nextSettings] = await Promise.all([
          fetchNedaaOverview({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setOverview(nextOverview);
          setSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_overview_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canViewOverview, isContextLoading, t, termId, yearId]);

  if (!canViewOverview) {
    return <NedaaAccessNotice />;
  }

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !overview || !settings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_overview_failed")}
        </p>
      </div>
    );
  }

  return (
    <NedaaOverviewView
      overview={overview}
      gates={settings.gates}
      isReadOnly={isReadOnly}
    />
  );
}