"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { User, FileText, AlertCircle } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import AttendanceStatusPill from "./AttendanceStatusPill";
import ExcuseModal from "./ExcuseModal";
import type { RosterStudent, AttendanceEntry, AttendanceStatus, AttachmentMeta } from "../types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";

interface RosterTableProps {
  roster: RosterStudent[];
  entries: AttendanceEntry[];
  policy: AttendancePolicy | null;
  onEntryChange: (studentId: string, updates: Partial<AttendanceEntry>) => void;
  isReadOnly: boolean;
  searchQuery?: string;
}

export default function RosterTable({
  roster,
  entries,
  policy,
  onEntryChange,
  isReadOnly,
  searchQuery = "",
}: RosterTableProps) {
  const t = useTranslations("attendance.rollCall");
  const tStatus = useTranslations("attendance.rollCall.status");
  const tExcuse = useTranslations("attendance.rollCall.excuse");
  const tForm = useTranslations("attendance.policies.form");
  const locale = useLocale();
  const { showError } = useToast();

  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const allowExcuses = policy?.allowExcuses ?? false;
  const requireAttachment = policy?.requireAttachmentForExcuse ?? false;

  const statusOptions = [
    { value: "", label: "—" },
    { value: "PRESENT", label: tStatus("present") },
    { value: "ABSENT", label: tStatus("absent") },
    { value: "LATE", label: tStatus("late") },
    ...(allowExcuses ? [{ value: "EXCUSED", label: tStatus("excused") }] : []),
    { value: "EARLY_LEAVE", label: tStatus("earlyLeave") },
  ];

  const handleStatusChange = (studentId: string, newStatus: string) => {
    if (newStatus === "EXCUSED" && !allowExcuses) {
      showError(t("excuse.notAllowed"));
      return;
    }

    onEntryChange(studentId, { status: newStatus as AttendanceStatus });
  };

  const handleOpenExcuseModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setExcuseModalOpen(true);
  };

  const handleSaveExcuse = (reason: string, attachments: AttachmentMeta[]) => {
    if (selectedStudentId) {
      onEntryChange(selectedStudentId, {
        excuseReason: reason,
        excuseAttachments: attachments,
      });
    }
  };

  const selectedEntry = selectedStudentId
    ? entries.find((e) => e.studentId === selectedStudentId)
    : null;

  const columns = [
    {
      key: "student",
      label: t("table.student"),
      render: (_: unknown, row: RosterStudent) => (
        <div className="flex items-center gap-3">
          {row.photoUrl ? (
            <img
              src={row.photoUrl}
              alt={locale === "ar" ? row.nameAr : row.nameEn}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div style={{ backgroundColor: "var(--color-neutral-200)" }} className="w-8 h-8 rounded-full flex items-center justify-center">
              <User style={{ color: "var(--color-neutral-500)" }} className="w-4 h-4" />
            </div>
          )}
          <div>
            <div style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {locale === "ar" ? row.nameAr : row.nameEn}
            </div>
            <div style={{ color: "var(--color-neutral-500)" }} className="text-xs">{row.studentNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (_: unknown, row: RosterStudent) => {
        const entry = entries.find((e) => e.studentId === row.id);

        if (isReadOnly) {
          return <AttendanceStatusPill status={entry?.status || null} size="sm" />;
        }

        return (
          <div className="w-40">
            <Select
              value={entry?.status || ""}
              onChange={(value) => handleStatusChange(row.id, value)}
              options={statusOptions}
              selectSize="sm"
            />
          </div>
        );
      },
    },
    {
      key: "details",
      label: t("table.details"),
      render: (_: unknown, row: RosterStudent) => {
        const entry = entries.find((e) => e.studentId === row.id);

        if (entry?.status === "EXCUSED") {
          const hasExcuse = entry.excuseReason || (entry.excuseAttachments?.length ?? 0) > 0;
          const missingRequired = requireAttachment && (!entry.excuseAttachments || entry.excuseAttachments.length === 0);

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenExcuseModal(row.id)}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                {hasExcuse ? tExcuse("edit") : tExcuse("add")}
              </Button>
              {hasExcuse && !missingRequired && (
                <span className="text-xs" style={{ color: "var(--color-success-700)" }}>{tExcuse("added")}</span>
              )}
              {missingRequired && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-accent-700)" }}>
                  <AlertCircle className="w-3 h-3" />
                  {tExcuse("requiredAttachment")}
                </span>
              )}
            </div>
          );
        }

        if (entry?.status === "LATE") {
          const minutes = entry.minutesLate;
          const thresholdState = getThresholdState("LATE", minutes, policy);

          return (
            <div className="space-y-1">
              <div className="w-24 relative">
                <Input
                  type="number"
                  value={minutes?.toString() || ""}
                  onChange={(e) =>
                    onEntryChange(row.id, {
                      minutesLate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="0"
                  min="0"
                  disabled={isReadOnly}
                  className={`text-sm ${locale === "ar" ? "pl-12" : "pr-12"}`}
                />
                <div className={`absolute inset-y-0 ${locale === "ar" ? "left-0 pl-2" : "right-0 pr-2"} flex items-center pointer-events-none`}>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{tForm("minutes")}</span>
                </div>
              </div>
              {thresholdState.isReached && typeof thresholdState.threshold === "number" && (
                <p className="text-xs" style={{ color: "var(--color-warning-700)" }}>
                  {t("thresholdReached", { threshold: thresholdState.threshold })}
                </p>
              )}
            </div>
          );
        }

        if (entry?.status === "EARLY_LEAVE") {
          const minutes = entry.minutesEarlyLeave;
          const thresholdState = getThresholdState("EARLY_LEAVE", minutes, policy);

          return (
            <div className="space-y-1">
              <div className="w-24 relative">
                <Input
                  type="number"
                  value={minutes?.toString() || ""}
                  onChange={(e) =>
                    onEntryChange(row.id, {
                      minutesEarlyLeave: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="0"
                  min="0"
                  disabled={isReadOnly}
                  className={`text-sm ${locale === "ar" ? "pl-12" : "pr-12"}`}
                  error={!minutes ? t("earlyLeave.required") : undefined}
                />
                <div className={`absolute inset-y-0 ${locale === "ar" ? "left-0 pl-2" : "right-0 pr-2"} flex items-center pointer-events-none`}>
                  <span style={{ color: "var(--color-neutral-500)" }} className="text-xs">{tForm("minutes")}</span>
                </div>
              </div>
              {thresholdState.isReached && typeof thresholdState.threshold === "number" && (
                <p className="text-xs" style={{ color: "var(--color-warning-700)" }}>
                  {t("thresholdReached", { threshold: thresholdState.threshold })}
                </p>
              )}
            </div>
          );
        }

        return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">—</span>;
      },
    },
    {
      key: "note",
      label: t("table.note"),
      render: (_: unknown, row: RosterStudent) => {
        const entry = entries.find((e) => e.studentId === row.id);

        if (isReadOnly) {
          return <span style={{ color: "var(--color-gray-600)" }} className="text-sm">{entry?.note || "—"}</span>;
        }

        return (
          <div className="w-48">
            <Input
              type="text"
              value={entry?.note || ""}
              onChange={(e) => onEntryChange(row.id, { note: e.target.value })}
              placeholder={t("table.notePlaceholder")}
              className="text-sm"
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns as unknown as { key: string; label: string; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
          data={roster as unknown as { [key: string]: unknown }[]}
          searchQuery={searchQuery}
          itemsPerPage={50}
          showPagination={roster.length > 50}
        />
      </div>

      <ExcuseModal
        isOpen={excuseModalOpen}
        onClose={() => {
          setExcuseModalOpen(false);
          setSelectedStudentId(null);
        }}
        onSave={handleSaveExcuse}
        initialReason={selectedEntry?.excuseReason}
        initialAttachments={selectedEntry?.excuseAttachments}
        requireAttachment={requireAttachment}
        isReadOnly={isReadOnly}
      />
    </>
  );
}

