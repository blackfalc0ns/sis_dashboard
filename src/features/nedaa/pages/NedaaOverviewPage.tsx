"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { fetchNedaaOverview } from "@/features/nedaa/services/nedaaService";
import type { NedaaOverviewData } from "@/features/nedaa/types/nedaa";
import NedaaOverviewView from "@/features/nedaa/views/NedaaOverviewView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaOverviewPage() {
  const t = useTranslations("nedaa");
  const { yearId, termId, isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const [overview, setOverview] = useState<NedaaOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isContextLoading || !yearId || !termId) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const nextOverview = await fetchNedaaOverview({ yearId, termId });
        if (!cancelled) {
          setOverview(nextOverview);
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
  }, [isContextLoading, t, termId, yearId]);

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !overview) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_overview_failed")}
        </p>
      </div>
    );
  }

  return <NedaaOverviewView overview={overview} isReadOnly={isReadOnly} />;
}
