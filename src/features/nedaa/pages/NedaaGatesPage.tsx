"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  fetchNedaaGateBoard,
  fetchNedaaRequests,
} from "@/features/nedaa/services/nedaaService";
import type { NedaaGateStats, NedaaRequest } from "@/features/nedaa/types/nedaa";
import { isNedaaActiveStatus } from "@/features/nedaa/utils/nedaaPresentation";
import NedaaGatesView from "@/features/nedaa/views/NedaaGatesView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaGatesPage() {
  const t = useTranslations("nedaa");
  const { yearId, termId, isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const [gates, setGates] = useState<NedaaGateStats[]>([]);
  const [requests, setRequests] = useState<NedaaRequest[]>([]);
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
        const [nextGates, nextRequests] = await Promise.all([
          fetchNedaaGateBoard({ yearId, termId }),
          fetchNedaaRequests({ yearId, termId }),
        ]);
        if (!cancelled) {
          setGates(nextGates);
          setRequests(nextRequests);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_gates_failed"),
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

  const activeRequests = useMemo(
    () => requests.filter((request) => isNedaaActiveStatus(request.status)),
    [requests],
  );

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_gates_failed")}
        </p>
      </div>
    );
  }

  return (
    <NedaaGatesView
      gates={gates}
      activeRequests={activeRequests}
      isReadOnly={isReadOnly}
    />
  );
}
