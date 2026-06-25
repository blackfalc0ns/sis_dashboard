"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Filter, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { listBehaviorRecords } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import BehaviorTable, { type BehaviorTableAction } from "@/features/behavior/shared/components/BehaviorTable";
import BehaviorDetailDrawer from "@/features/behavior/shared/components/BehaviorDetailDrawer";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import BehaviorFiltersBar from "@/features/behavior/shared/components/BehaviorFiltersBar";
import type {
  BehaviorFilters,
  BehaviorRecord,
  BehaviorRecordListFilters,
} from "@/features/behavior/types";

const DEFAULT_FILTERS: BehaviorFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
};

export default function BehaviorRecordsPage() {
  const t = useTranslations("behavior");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { yearId, termId, terms, isReadOnly } = useBehaviorYearTermContext();
  const { showSuccess, showError } = useToast();

  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uiFilters, setUiFilters] = useState<BehaviorFilters>(DEFAULT_FILTERS);

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  // Filters drawer (mobile)
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  const term = useMemo(
    () => terms.find((item) => item.id === termId) || null,
    [termId, terms],
  );

  const loadRecords = useCallback(async () => {
    if (!yearId || !termId) return;
    const filters: BehaviorRecordListFilters = {
      academicYearId: yearId,
      termId,
      status: uiFilters.status,
      type: uiFilters.type,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorRecords(filters);
      setRecords(res.items);
    } catch (error) {
      const msg = behaviorUiError(error, t("messages.loadError"), t).message;
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [yearId, termId, uiFilters.status, uiFilters.type, showError, t]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleTableAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    if (action === "view") {
      setSelectedRecord(record);
      return;
    }
    const modeMap: Record<string, BehaviorModalMode> = {
      edit: "edit-record",
      submit: "submit-record",
      cancel: "cancel-record",
      approve: "approve-record",
      reject: "reject-record",
    };
    setModalTarget({
      record,
      academicYearId: yearId ?? undefined,
      termId: termId ?? undefined,
    });
    setModalMode(modeMap[action] ?? null);
  };

  const handleDrawerAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    setSelectedRecord(null);
    handleTableAction(action, record);
  };

  const openNewModal = () => {
    setModalTarget({
      academicYearId: yearId ?? undefined,
      termId: termId ?? undefined,
    });
    setModalMode("create-record");
  };

  const clearFilters = () => {
    setUiFilters({
      scopeType: "SCHOOL",
      scopeIds: {},
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      {!isMobile && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
          <BehaviorFiltersBar
            filters={uiFilters}
            onChange={(patch) => setUiFilters((prev) => ({ ...prev, ...patch }))}
            onClear={clearFilters}
          />
        </div>
      )}

      {/* Header + new button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("sections.records")}
        </h2>
        {!isReadOnly && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openNewModal}
          >
            {t("actions.newRecord")}
          </Button>
        )}
      </div>

      {/* Table */}
      <BehaviorTable
        records={records}
        loading={loading}
        error={error}
        onRowClick={setSelectedRecord}
        onAction={handleTableAction}
        isReadOnly={isReadOnly}
      />

      {/* Detail drawer */}
      <BehaviorDetailDrawer
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onAction={handleDrawerAction}
        isReadOnly={isReadOnly}
      />

      {/* Action modals */}
      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadRecords()}
      />
    </div>
  );
}
