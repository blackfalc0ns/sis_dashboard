"use client";

import { useLocale, useTranslations } from "next-intl";
import { X, User, CalendarDays, AlarmClockPlus, TriangleAlert, Link2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { Incident } from "../types";

interface IncidentDetailsDrawerProps {
  incident: Incident | null;
  isReadOnly: boolean;
  onClose: () => void;
  onEditMinutes: (incident: Incident) => void;
  onOpenSession?: (incident: Incident) => void;
}

export default function IncidentDetailsDrawer({
  incident,
  isReadOnly,
  onClose,
  onEditMinutes,
  onOpenSession,
}: IncidentDetailsDrawerProps) {
  const t = useTranslations("attendance.lateEarly.details");
  const locale = useLocale();

  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: "var(--card-background)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("selectIncident")}
        </p>
      </div>
    );
  }

  const typeLabel = incident.type === "LATE" ? t("late") : t("earlyLeave");
  const relationLabel =
    typeof incident.threshold === "number"
      ? incident.isViolation
        ? t("aboveOrEqualThreshold", { threshold: incident.threshold })
        : t("belowThreshold", { threshold: incident.threshold })
      : t("noThreshold");

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--card-background)" }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h3>
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
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>
            <div>{locale === "ar" ? incident.studentNameAr : incident.studentNameEn}</div>
            <div style={{ color: "var(--text-secondary)" }}>{incident.studentNumber || "-"}</div>
            <div style={{ color: "var(--text-secondary)" }}>
              {(locale === "ar" ? incident.gradeNameAr : incident.gradeNameEn) || incident.gradeNameEn || incident.gradeNameAr || "-"}
              {" / "}
              {(locale === "ar" ? incident.sectionNameAr : incident.sectionNameEn) || incident.sectionNameEn || incident.sectionNameAr || "-"}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("incidentInfo")}</span>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <div>{t("date")}: {incident.date}</div>
            <div>{t("period")}: P{incident.periodIndex}</div>
            <div>{t("type")}: {typeLabel}</div>
            <div>{t("minutes")}: {incident.minutes}</div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            <TriangleAlert className="w-4 h-4" />
            <span className="text-sm font-semibold">{t("policy")}</span>
          </div>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <div>{t("threshold")}: {typeof incident.threshold === "number" ? incident.threshold : "-"}</div>
            <div>{t("comparison")}: {relationLabel}</div>
            <div title={incident.policyScopeSummary}>{t("policySource")}: {incident.policyScopeSummary}</div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border-color)" }}>
        {onOpenSession && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Link2 className="w-4 h-4" />}
            onClick={() => onOpenSession(incident)}
            className="w-full"
          >
            {t("openSession")}
          </Button>
        )}

        {!isReadOnly && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<AlarmClockPlus className="w-4 h-4" />}
            onClick={() => onEditMinutes(incident)}
            className="w-full"
          >
            {t("editMinutes")}
          </Button>
        )}
      </div>
    </div>
  );
}
