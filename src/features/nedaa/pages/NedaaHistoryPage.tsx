"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import {
  fetchNedaaHistory,
  fetchNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import type {
  NedaaGateId,
  NedaaRequest,
  NedaaSettings,
} from "@/features/nedaa/types/nedaa";
import NedaaHistoryView from "@/features/nedaa/views/NedaaHistoryView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";

export default function NedaaHistoryPage() {
  const t = useTranslations("nedaa");
  const { yearId, termId, isLoading: isContextLoading, error } =
    useStudentsGuardiansYearTermContext();
  const [history, setHistory] = useState<NedaaRequest[]>([]);
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gate, setGate] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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
        const [nextHistory, nextSettings] = await Promise.all([
          fetchNedaaHistory({ yearId, termId }),
          fetchNedaaSettings(),
        ]);
        if (!cancelled) {
          setHistory(nextHistory);
          setSettings(nextSettings);
          setSelectedRequestId(nextHistory[0]?.id || null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_history_failed"),
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

  const gateOptions = useMemo<NedaaGateId[]>(() => {
    const values = new Set<NedaaGateId>(settings?.activeGates || []);
    history.forEach((request) => values.add(request.gate));
    return Array.from(values);
  }, [history, settings?.activeGates]);

  const filteredHistory = useMemo(
    () =>
      history.filter((request) => {
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
    [gate, history, search, status],
  );

  const selectedRequest = useMemo(
    () =>
      filteredHistory.find((request) => request.id === selectedRequestId) ||
      filteredHistory[0] ||
      null,
    [filteredHistory, selectedRequestId],
  );

  useEffect(() => {
    if (selectedRequest && selectedRequest.id !== selectedRequestId) {
      setSelectedRequestId(selectedRequest.id);
    }
  }, [selectedRequest, selectedRequestId]);

  const hasActiveFilters =
    search.trim() !== "" || status !== "all" || gate !== "all";

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_history_failed")}
        </p>
      </div>
    );
  }

  return (
    <NedaaHistoryView
      requests={filteredHistory}
      selectedRequest={selectedRequest}
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
      onSelectRequest={(request) => setSelectedRequestId(request.id)}
    />
  );
}
