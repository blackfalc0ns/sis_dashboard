"use client";

import { useLocale, useTranslations } from "next-intl";
import { X, User, CalendarDays, Paperclip, Clock3, Check, Ban, MapPin } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { ExcuseRequest } from "../types";

interface ExcuseDetailsDrawerProps {
  request: ExcuseRequest | null;
  isReadOnly: boolean;
  onClose: () => void;
  onApprove: (request: ExcuseRequest) => void;
  onReject: (request: ExcuseRequest) => void;
  onEdit: (request: ExcuseRequest) => void;
}

export default function ExcuseDetailsDrawer({ request, isReadOnly, onClose, onApprove, onReject, onEdit }: ExcuseDetailsDrawerProps) {
  const t = useTranslations("attendance.excuses.details");
  const tTable = useTranslations("attendance.excuses.table");
  const locale = useLocale();

  if (!request) {
    return <div className="h-full flex items-center justify-center p-6" style={{ color: "var(--text-secondary)" }}>{t("selectRequest")}</div>;
  }

  const canMutate = request.status === "PENDING" && !isReadOnly;

  // Map status to translated label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return tTable("pending");
      case "APPROVED": return tTable("approved");
      case "REJECTED": return tTable("rejected");
      default: return status;
    }
  };

  // Map type to translated label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ABSENCE": return tTable("absence");
      case "LATE": return tTable("late");
      case "EARLY_LEAVE": return tTable("earlyLeave");
      default: return type;
    }
  };

  // Get scope label
  const getScopeLabel = () => {
    if (request.scopeType === "SCHOOL") {
      return tTable("school");
    }
    // For other scopes, we'd need the actual names passed as props
    // For now, just return the type
    return request.scopeType;
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--card-background)" }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("title")}</h3>
        <button onClick={onClose} className="p-1" style={{ color: "var(--text-secondary)" }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <User className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("student")}</span>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <div className="font-medium">{locale === "ar" ? request.studentNameAr : request.studentNameEn}</div>
            {request.studentNumber && <div style={{ color: "var(--text-secondary)" }}>{request.studentNumber}</div>}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("scope")}</span>
          </div>
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>
            {getScopeLabel()}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("requestInfo")}</span>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <div>{t("type")}: {getTypeLabel(request.type)}</div>
            <div>{t("range")}: {request.dateFrom} → {request.dateTo}</div>
            <div>{t("periods")}: {request.periodIndexes && request.periodIndexes.length > 0 ? request.periodIndexes.map((p) => `P${p}`).join(", ") : t("allPolicyPeriods")}</div>
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{t("reason")}</div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            {request.reasonAr && <div className="whitespace-pre-wrap">{request.reasonAr}</div>}
            {request.reasonEn && <div className="whitespace-pre-wrap">{request.reasonEn}</div>}
            {!request.reasonAr && !request.reasonEn && <div style={{ color: "var(--text-secondary)" }}>-</div>}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <Paperclip className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("attachments")}</span>
          </div>
          {request.attachments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("noAttachments")}</p>
          ) : (
            <div className="space-y-2">
              {request.attachments.map((attachment) => (
                <div key={attachment.id} className="text-sm p-2 rounded border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <Clock3 className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("timeline")}</span>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <div>{t("status")}: {getStatusLabel(request.status)}</div>
            {request.decidedBy && <div>{t("decidedBy")}: {request.decidedBy}</div>}
            {request.decidedAt && <div>{t("decidedAt")}: {request.decidedAt}</div>}
            {request.decisionNote && <div>{t("decisionNote")}: {request.decisionNote}</div>}
          </div>
        </section>
      </div>

      {canMutate && (
        <div className="p-4 border-t grid grid-cols-3 gap-2" style={{ borderColor: "var(--border-color)" }}>
          <Button variant="outline" size="sm" onClick={() => onEdit(request)}>{t("edit")}</Button>
          <Button variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={() => onApprove(request)}>{t("approve")}</Button>
          <Button variant="danger" size="sm" leftIcon={<Ban className="w-4 h-4" />} onClick={() => onReject(request)}>{t("reject")}</Button>
        </div>
      )}
    </div>
  );
}
