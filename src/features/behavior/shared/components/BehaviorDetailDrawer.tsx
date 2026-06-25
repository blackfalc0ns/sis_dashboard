"use client";

import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { Ban, X, Send, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { BehaviorRecord, BehaviorStatus, BehaviorType } from "../../types";
import type { BehaviorTableAction } from "./BehaviorTable";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canSubmitBehaviorRecord,
} from "../utils/behaviorUiRules";

// ─── Status / Type badge helpers ───────────────────────────────────────────
const STATUS_STYLES: Record<BehaviorStatus, { bg: string; fg: string; border: string }> = {
  draft:     { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-800)", border: "var(--color-neutral-200)" },
  submitted: { bg: "#fef3c7", fg: "#78350f",                 border: "#fde68a" },
  approved:  { bg: "#dcfce7", fg: "#14532d",                 border: "#bbf7d0" },
  rejected:  { bg: "#fef2f2", fg: "#991b1b",                 border: "#fecaca" },
  cancelled: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-500)", border: "var(--color-neutral-200)" },
};
const TYPE_STYLES: Record<BehaviorType, { bg: string; fg: string; border: string }> = {
  positive: { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  negative:  { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
};

function Chip({
  label,
  style,
}: {
  label: string;
  style: { bg: string; fg: string; border: string };
}) {
  return (
    <span
      className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border"
      style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
    >
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
interface BehaviorDetailDrawerProps {
  record: BehaviorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: BehaviorTableAction, record: BehaviorRecord) => void;
  isReadOnly?: boolean;
}

export default function BehaviorDetailDrawer({
  record,
  isOpen,
  onClose,
  onAction,
  isReadOnly,
}: BehaviorDetailDrawerProps) {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(isRTL ? "ar-SA" : "en-SA") : "—";

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 440 }, p: 0 },
      }}
    >
      {record && (
        <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {t("drawer.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label={isRTL ? "إغلاق" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-6">
              {record.type && (
                <Chip
                  label={t(`type.${record.type}`)}
                  style={TYPE_STYLES[record.type]}
                />
              )}
              <Chip
                label={t(`status.${record.status}`)}
                style={STATUS_STYLES[record.status]}
              />
              {record.points !== undefined && (
                <span
                  className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full border"
                  style={{
                    backgroundColor: record.points >= 0 ? "#dcfce7" : "#fef2f2",
                    color: record.points >= 0 ? "#14532d" : "#991b1b",
                    borderColor: record.points >= 0 ? "#bbf7d0" : "#fecaca",
                  }}
                >
                  {record.points > 0 ? `+${record.points}` : record.points} pts
                </span>
              )}
            </div>

            {/* Details */}
            <dl className="space-y-4">
              <DetailRow
                label={t("record.title")}
                value={isRTL ? record.titleAr : record.titleEn}
              />
              <DetailRow label={t("table.occurredAt")} value={fmt(record.occurredAt)} />
              <DetailRow label={t("table.student")} value={record.studentId} />
              <DetailRow label={t("table.category")} value={record.categoryName ?? record.categoryId} />
              <DetailRow
                label={t("record.note")}
                value={isRTL ? record.noteAr : record.noteEn}
              />
              {record.reviewNoteEn && (
                <DetailRow label={t("modal.reviewerNote")} value={record.reviewNoteEn} />
              )}
              {record.submittedAt && (
                <DetailRow
                  label={t("drawer.submittedAt")}
                  value={fmt(record.submittedAt)}
                />
              )}
              {record.approvedAt && (
                <DetailRow
                  label={t("drawer.approvedAt")}
                  value={fmt(record.approvedAt)}
                />
              )}
            </dl>
          </div>

          {/* Footer actions */}
          {!isReadOnly && (
            <div
              className="flex items-center gap-2 px-6 py-4 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              {canSubmitBehaviorRecord(record) && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => onAction?.("submit", record)}
                >
                  {t("actions.submit")}
                </Button>
              )}
              {canCancelBehaviorRecord(record) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Ban className="w-4 h-4" />}
                  onClick={() => onAction?.("cancel", record)}
                >
                  {t("actions.cancel")}
                </Button>
              )}
              {canApproveOrRejectBehaviorRecord(record) && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => onAction?.("approve", record)}
                  >
                    {t("actions.approve")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => onAction?.("reject", record)}
                  >
                    {t("actions.reject")}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
