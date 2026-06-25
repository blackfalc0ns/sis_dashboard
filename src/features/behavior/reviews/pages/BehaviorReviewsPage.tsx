"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DataTable from "@/components/ui/data-table/DataTable";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { listBehaviorReviewQueue } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import type {
  BehaviorRecord,
  BehaviorReviewQueueFilters,
  BehaviorReviewQueueItem,
} from "@/features/behavior/types";

function StatePanel({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

export default function BehaviorReviewsPage() {
  const t = useTranslations("behavior");
  const { yearId, termId, isReadOnly } = useBehaviorYearTermContext();

  const [reviewItems, setReviewItems] = useState<BehaviorReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  const loadReviewQueue = useCallback(async () => {
    if (!yearId || !termId) return;
    const filters: BehaviorReviewQueueFilters = { academicYearId: yearId, termId };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorReviewQueue(filters);
      setReviewItems(res.items);
    } catch (error) {
      setError(behaviorUiError(error, t("messages.loadError"), t).message);
    } finally {
      setLoading(false);
    }
  }, [yearId, termId, t]);

  useEffect(() => {
    void loadReviewQueue();
  }, [loadReviewQueue]);

  const handleApprove = (item: BehaviorReviewQueueItem) => {
    const rec: BehaviorRecord = {
      id: item.id,
      studentId: item.studentId ?? "",
      categoryId: item.categoryId ?? "",
      status: item.status,
      points: item.points ?? 0,
      occurredAt: item.occurredAt ?? "",
      type: item.type,
    };
    setModalTarget({ record: rec });
    setModalMode("approve-record");
  };

  const handleReject = (item: BehaviorReviewQueueItem) => {
    const rec: BehaviorRecord = {
      id: item.id,
      studentId: item.studentId ?? "",
      categoryId: item.categoryId ?? "",
      status: item.status,
      points: item.points ?? 0,
      occurredAt: item.occurredAt ?? "",
    };
    setModalTarget({ record: rec });
    setModalMode("reject-record");
  };

  if (loading) return <StatePanel title={t("states.loading.title")} />;
  if (error) return <StatePanel title={error} />;
  if (!reviewItems.length) return <StatePanel title={t("states.empty.title")} />;

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

  const columns = [
    {
      key: "student",
      label: t("table.student"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>
          {row.studentName ?? row.studentId ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      label: t("table.category"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>
          {row.categoryName ?? row.categoryId ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_: unknown, row: any) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border"
          style={{ backgroundColor: "#fef3c7", color: "#78350f", borderColor: "#fde68a" }}
        >
          {t(`status.${row.status}`)}
        </span>
      ),
    },
    {
      key: "occurredAt",
      label: t("table.occurredAt"),
      sortable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-muted)" }}>{fmt(row.occurredAt)}</span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_: unknown, row: any) => (
        <div className="flex items-center gap-2">
          {!isReadOnly && row.status === "submitted" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }}
              >
                {t("actions.approve")}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(row); }}
                className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
                style={{ backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}
              >
                {t("actions.reject")}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <DataTable
        columns={columns}
        data={reviewItems as unknown as Record<string, unknown>[]}
        showPagination={true}
        itemsPerPage={15}
      />

      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadReviewQueue()}
      />
    </div>
  );
}
