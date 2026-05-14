"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ManualXpGrantModal from "../components/ManualXpGrantModal";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import XpLedgerTable from "../components/XpLedgerTable";
import {
  getXpSummary,
  grantManualXp,
  listXpLedger,
} from "../services/reinforcementXpService";
import type { ManualXpGrantPayload, XpLedgerEntry, XpSummary } from "../types";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReinforcementXpLedgerPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [context, setContext] = useState<ReinforcementAcademicContextValue>({});
  const [entries, setEntries] = useState<XpLedgerEntry[]>([]);
  const [summary, setSummary] = useState<XpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);

  const canView = hasPermission("reinforcement.xp.view");
  const canManage = hasPermission("reinforcement.xp.manage");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      yearId: context.academicYearId,
      termId: context.termId,
      studentId: context.studentId,
      enrollmentId: context.enrollmentId,
      classroomId: context.classroomId,
      limit: 50,
    }),
    [
      context.academicYearId,
      context.classroomId,
      context.enrollmentId,
      context.studentId,
      context.termId,
    ],
  );

  const refreshLedger = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const [ledgerResponse, nextSummary] = await Promise.all([
        listXpLedger(params),
        getXpSummary(params),
      ]);
      setEntries(ledgerResponse.items);
      setSummary(nextSummary);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshLedger);
  }, [refreshLedger]);

  const handleGrant = async (payload: ManualXpGrantPayload) => {
    try {
      await grantManualXp(payload);
      showSuccess(t("xp.messages.granted"));
      setGrantOpen(false);
      await refreshLedger();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("xp.ledgerTitle")}
        description={t("xp.ledgerDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshLedger}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setGrantOpen(true)}
              >
                {t("actions.grantXp")}
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("xp.ledgerFilters")}
        </h2>
        <div className="mt-4">
          <ReinforcementAcademicContextFilter
            value={context}
            showSubject={false}
            showStudent
            onChange={(selection: ReinforcementAcademicContextSelection) =>
              setContext({
                academicYearId: selection.academicYearId,
                termId: selection.termId,
                stageId: selection.stageId,
                gradeId: selection.gradeId,
                sectionId: selection.sectionId,
                classroomId: selection.classroomId,
                studentId: selection.studentId,
                enrollmentId: selection.enrollmentId,
              })
            }
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["totalXp", summary?.totalXp],
          ["earnedXp", summary?.earnedXp],
          ["spentXp", summary?.spentXp],
          ["balance", summary?.balance],
        ].map(([key, value]) => (
          <article
            key={key as string}
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">
              {t(`xp.summary.${key}`)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {typeof value === "number" ? value : 0}
            </p>
          </article>
        ))}
      </section>

      <XpLedgerTable entries={entries} loading={loading} />

      <ManualXpGrantModal
        isOpen={grantOpen}
        context={context}
        onClose={() => setGrantOpen(false)}
        onSubmit={handleGrant}
      />
    </div>
  );
}
