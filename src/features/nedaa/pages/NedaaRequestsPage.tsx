"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchNedaaRequests,
  fetchNedaaSettings,
  updateNedaaRequestStatus,
} from "@/features/nedaa/services/nedaaService";
import type {
  NedaaGateId,
  NedaaRequest,
  NedaaSettings,
  NedaaStatus,
} from "@/features/nedaa/types/nedaa";
import NedaaRequestsView from "@/features/nedaa/views/NedaaRequestsView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaRequestsPage() {
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
  const { yearId, termId, isLoading: isContextLoading, error, isReadOnly } =
    useStudentsGuardiansYearTermContext();
  const [requests, setRequests] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gate, setGate] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

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
        const [nextRequests, nextSettings] = await Promise.all([
          fetchNedaaRequests({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setRequests(nextRequests);
          setSettings(nextSettings);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_requests_failed"),
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

  const visibleRequests = useMemo(
    () =>
      requests.filter((request) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch === "" ||
          request.id.toLowerCase().includes(normalizedSearch) ||
          request.studentName.toLowerCase().includes(normalizedSearch) ||
          request.guardianName.toLowerCase().includes(normalizedSearch);
        const matchesStatus = status === "all" || request.status === status;
        const matchesGate = gate === "all" || request.gate === gate;

        return matchesSearch && matchesStatus && matchesGate;
      }),
    [gate, requests, search, status],
  );

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || gate !== "all";

  const gateOptions = useMemo<NedaaGateId[]>(() => {
    const values = new Set<NedaaGateId>(settings?.activeGates || []);
    requests.forEach((request) => values.add(request.gate));
    return Array.from(values);
  }, [requests, settings?.activeGates]);

  const handleStatusUpdate = async (
    requestId: string,
    nextStatus: NedaaStatus,
  ) => {
    setPendingRequestId(requestId);
    try {
      const updatedRequest = await updateNedaaRequestStatus(requestId, nextStatus);
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updatedRequest : request,
        ),
      );
      showSuccess(t("messages.request_updated"));
    } catch {
      showError(t("messages.request_update_failed"));
    } finally {
      setPendingRequestId(null);
    }
  };

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_requests_failed")}
        </p>
      </div>
    );
  }

  return (
    <NedaaRequestsView
      requests={visibleRequests}
      search={search}
      status={status}
      gate={gate}
      gateOptions={gateOptions}
      showFilters={showFilters}
      hasActiveFilters={hasActiveFilters}
      onSearchChange={setSearch}
      onStatusChange={setStatus}
      onGateChange={setGate}
      onToggleFilters={() => setShowFilters((current) => !current)}
      onClearFilters={() => {
        setSearch("");
        setStatus("all");
        setGate("all");
      }}
      onStatusUpdate={handleStatusUpdate}
      pendingRequestId={pendingRequestId}
      isReadOnly={isReadOnly}
    />
  );
}
