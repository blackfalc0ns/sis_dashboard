"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import XpPolicyForm from "../components/XpPolicyForm";
import XpPolicyTable from "../components/XpPolicyTable";
import {
  createXpPolicy,
  getEffectiveXpPolicy,
  listXpPolicies,
  patchXpPolicy,
} from "../services/reinforcementXpService";
import type {
  CreateXpPolicyPayload,
  PatchXpPolicyPayload,
  XpPolicy,
  XpPolicyScopeType,
} from "../types";

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

export default function ReinforcementXpPoliciesPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [context, setContext] = useState<ReinforcementAcademicContextValue>({});
  const [scopeType, setScopeType] = useState<XpPolicyScopeType | "">("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [policies, setPolicies] = useState<XpPolicy[]>([]);
  const [effectivePolicy, setEffectivePolicy] = useState<XpPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canView = hasPermission("reinforcement.xp.view");
  const canManage = hasPermission("reinforcement.xp.manage");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
      scopeType: scopeType || undefined,
      scopeKey: context.studentId,
      isActive:
        activeFilter === "all" ? undefined : activeFilter === "active",
    }),
    [
      activeFilter,
      context.academicYearId,
      context.scopeKey,
      context.termId,
      scopeType,
    ],
  );

  const refreshPolicies = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listXpPolicies(params);
      setPolicies(response.items);
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
    void Promise.resolve().then(refreshPolicies);
  }, [refreshPolicies]);

  const handleCreate = async (payload: CreateXpPolicyPayload) => {
    try {
      await createXpPolicy(payload);
      showSuccess(t("xp.messages.policyCreated"));
      setIsCreateOpen(false);
      await refreshPolicies();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const handlePatchCaps = async (
    policyId: string,
    payload: PatchXpPolicyPayload,
  ) => {
    try {
      await patchXpPolicy(policyId, payload);
      showSuccess(t("xp.messages.policyPatched"));
      await refreshPolicies();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const lookupEffectivePolicy = async () => {
    if (!context.studentId || !context.enrollmentId) {
      showError(t("xp.validation.studentEnrollmentRequired"));
      return;
    }
    try {
      setEffectivePolicy(
        await getEffectiveXpPolicy({
          academicYearId: context.academicYearId,
          termId: context.termId,
          studentId: context.studentId,
          enrollmentId: context.enrollmentId,
        }),
      );
      showSuccess(t("xp.messages.effectiveLoaded"));
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("xp.validation.missingEffectivePolicy");
      showError(message);
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("xp.policiesTitle")}
        description={t("xp.policiesDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshPolicies}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                {t("xp.createPolicy")}
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {t("xp.policyFilters")}
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
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Select
            label={t("xp.scopeType")}
            value={scopeType}
            onChange={(value) => setScopeType(value as XpPolicyScopeType | "")}
            options={[
              { value: "", label: t("xp.allScopes") },
              { value: "school", label: t("assignmentScope.school") },
              { value: "stage", label: t("assignmentScope.stage") },
              { value: "grade", label: t("assignmentScope.grade") },
              { value: "section", label: t("assignmentScope.section") },
              { value: "classroom", label: t("assignmentScope.classroom") },
              { value: "student", label: t("assignmentScope.student") },
            ]}
          />
          <Select
            label={t("xp.activeStatus")}
            value={activeFilter}
            onChange={(value) =>
              setActiveFilter(value as "all" | "active" | "inactive")
            }
            options={[
              { value: "all", label: t("xp.allStatuses") },
              { value: "active", label: t("activeState.active") },
              { value: "inactive", label: t("activeState.inactive") },
            ]}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={lookupEffectivePolicy}
            >
              {t("xp.lookupEffectivePolicy")}
            </Button>
          </div>
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

      {effectivePolicy ? (
        <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <strong>{t("xp.effectivePolicy")}:</strong>{" "}
          {t(`assignmentScope.${effectivePolicy.scopeType}`)}
          {effectivePolicy.scopeId ? ` / ${effectivePolicy.scopeId}` : ""}
        </section>
      ) : null}

      <XpPolicyTable
        policies={policies}
        loading={loading}
        canManage={canManage}
        onPatchCaps={handlePatchCaps}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("xp.createPolicy")}
        description={t("xp.createPolicyDescription")}
        size="xl"
      >
        <XpPolicyForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
