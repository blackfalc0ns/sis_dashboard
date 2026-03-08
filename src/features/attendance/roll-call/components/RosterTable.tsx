"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { User, FileText, AlertCircle } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/button/Button";
import AttendanceStatusPill from "./AttendanceStatusPill";
import ExcuseModal from "./ExcuseModal";
import type { RosterStudent, AttendanceEntry, AttendanceStatus, AttachmentMeta } from "../types";
import type { AttendancePolicy } from "@/features/attendance/policies/types";

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
  const locale = useLocale();

  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const allowExcuses = policy?.allowExcuses ?? false;
  const requireAttachment = policy?.requireAttachmentForExcuse ?? false;
  const earlyLeaveThreshold = policy?.earlyLeaveThresholdMinutes ?? 0;

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
      // Show warning - this shouldn't happen if UI is correct, but safety check
      alert(t("excuse.notAllowed"));
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
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {locale === "ar" ? row.nameAr : row.nameEn}
            </div>
            <div className="text-xs text-gray-500">{row.studentNumber}</div>
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

        // EXCUSED - show excuse button/indicator
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
                <span className="text-xs text-green-600">{tExcuse("added")}</span>
              )}
              {missingRequired && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {tExcuse("requiredAttachment")}
                </span>
              )}
            </div>
          );
        }

        // LATE - show minutes late input
        if (entry?.status === "LATE") {
          return (
            <div className="w-24">
              <Input
                type="number"
                value={entry?.minutesLate?.toString() || ""}
                onChange={(e) =>
                  onEntryChange(row.id, {
                    minutesLate: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
                min="0"
                disabled={isReadOnly}
                className="text-sm"
              />
            </div>
          );
        }

        // EARLY_LEAVE - show minutes early leave input with validation
        if (entry?.status === "EARLY_LEAVE") {
          const minutes = entry?.minutesEarlyLeave;
          const isBelowThreshold = minutes !== undefined && earlyLeaveThreshold > 0 && minutes < earlyLeaveThreshold;

          return (
            <div className="space-y-1">
              <div className="w-24">
                <Input
                  type="number"
                  value={minutes?.toString() || ""}
                  onChange={(e) =>
                    onEntryChange(row.id, {
                      minutesEarlyLeave: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                  min="1"
                  disabled={isReadOnly}
                  className="text-sm"
                  error={!minutes ? t("earlyLeave.required") : undefined}
                />
              </div>
              {isBelowThreshold && (
                <p className="text-xs text-orange-600">
                  {t("earlyLeave.belowThreshold", { threshold: earlyLeaveThreshold })}
                </p>
              )}
            </div>
          );
        }

        return <span className="text-sm text-gray-400">—</span>;
      },
    },
    {
      key: "note",
      label: t("table.note"),
      render: (_: unknown, row: RosterStudent) => {
        const entry = entries.find((e) => e.studentId === row.id);

        if (isReadOnly) {
          return <span className="text-sm text-gray-600">{entry?.note || "—"}</span>;
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

      {/* Excuse Modal */}
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
