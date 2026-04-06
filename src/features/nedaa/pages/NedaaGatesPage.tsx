"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { usePermissions } from "@/hooks/usePermissions";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import {
  fetchNedaaGateBoard,
  fetchNedaaRequests,
  fetchNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import type {
  NedaaGateStats,
  NedaaRequest,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import { isNedaaActiveStatus } from "@/features/nedaa/utils/nedaaPresentation";
import NedaaGatesView from "@/features/nedaa/views/NedaaGatesView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaGatesPage() {
  const t = useTranslations("nedaa");
  const { hasPermission } = usePermissions();
  const { yearId, termId, isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const canViewRequests = hasPermission("nedaa.requests.view");
  const [gates, setGates] = useState<NedaaGateStats[]>([]);
  const [requests, setRequests] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canViewRequests || isContextLoading || !yearId || !termId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [nextGates, nextRequests, nextSettings] = await Promise.all([
          fetchNedaaGateBoard({ yearId, termId }),
          fetchNedaaRequests({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setGates(nextGates);
          setRequests(nextRequests);
          setSettings(nextSettings);
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
  }, [canViewRequests, isContextLoading, t, termId, yearId]);

  const activeRequests = useMemo(
    () => requests.filter((request) => isNedaaActiveStatus(request.status)),
    [requests],
  );

  if (!canViewRequests) {
    return <NedaaAccessNotice />;
  }

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings) {
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
      requestGates={settings.gates}
      isReadOnly={isReadOnly}
    />
  );
}