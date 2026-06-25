"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import DataTable from "@/components/ui/data-table/DataTable";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { listBehaviorCategories } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import type { BehaviorCategory, BehaviorCategoryListFilters } from "@/features/behavior/types";

function StatePanel({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

export default function BehaviorCategoriesPage() {
  const t = useTranslations("behavior");
  const { isReadOnly } = useBehaviorYearTermContext();
  const { showError } = useToast();

  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  const loadCategories = useCallback(async () => {
    const filters: BehaviorCategoryListFilters = {};
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorCategories(filters);
      setCategories(res.items);
    } catch (error) {
      const msg = behaviorUiError(error, t("messages.loadError"), t).message;
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  if (loading) return <StatePanel title={t("states.loading.title")} />;
  if (error) return <StatePanel title={error} />;

  const columns = [
    {
      key: "code",
      label: t("category.code"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {row.code}
        </span>
      ),
    },
    {
      key: "nameEn",
      label: t("category.nameEn"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <span style={{ color: "var(--text-primary)" }}>{row.nameEn}</span>
      ),
    },
    {
      key: "nameAr",
      label: t("category.nameAr"),
      searchable: true,
      render: (_: unknown, row: any) => (
        <div dir="rtl" className="text-right" style={{ color: "var(--text-primary)" }}>
          {row.nameAr}
        </div>
      ),
    },
    {
      key: "type",
      label: t("category.type"),
      render: (_: unknown, row: any) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border font-medium"
          style={
            row.type === "positive"
              ? { backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }
              : { backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }
          }
        >
          {t(`type.${row.type}`)}
        </span>
      ),
    },
    {
      key: "severity",
      label: t("category.severity"),
      render: (_: unknown, row: any) => (
        <span className="capitalize" style={{ color: "var(--text-primary)" }}>
          {row.defaultSeverity}
        </span>
      ),
    },
    {
      key: "points",
      label: t("category.points"),
      sortable: true,
      render: (_: unknown, row: any) => (
        <span className="font-semibold" style={{ color: row.defaultPoints >= 0 ? "#16a34a" : "#dc2626" }}>
          {row.defaultPoints > 0 ? `+${row.defaultPoints}` : row.defaultPoints}
        </span>
      ),
    },
    {
      key: "active",
      label: t("category.active"),
      render: (_: unknown, row: any) => (
        <span className={`text-xs font-medium ${row.isActive ? "text-green-700" : "text-red-700"}`}>
          {row.isActive ? "✓" : "✗"}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("category.actions"),
      sortable: false,
      render: (_: unknown, row: any) => (
        <div className="flex items-center justify-end">
          {!isReadOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalTarget({ category: row });
                setModalMode("edit-category");
              }}
              className="text-xs px-2 py-1 rounded border hover:bg-[var(--color-neutral-100)] transition-colors"
              style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
            >
              {t("actions.edit")}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header + new button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("sections.categories")}
        </h2>
        {!isReadOnly && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setModalTarget({});
              setModalMode("create-category");
            }}
          >
            {t("actions.newCategory")}
          </Button>
        )}
      </div>

      {/* Table */}
      {!categories.length ? (
        <StatePanel title={t("states.empty.title")} />
      ) : (
        <DataTable
          columns={columns}
          data={categories as unknown as Record<string, unknown>[]}
          showPagination={true}
          itemsPerPage={15}
        />
      )}

      {/* Action modals */}
      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadCategories()}
      />
    </div>
  );
}
