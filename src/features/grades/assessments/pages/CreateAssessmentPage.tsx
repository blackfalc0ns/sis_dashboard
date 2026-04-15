"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Button from "@/components/ui/button/Button";
import { DatePicker, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/Toast";
import { fetchGradesFiltersData } from "../../gradebook/services/gradesGradebookService";
import { createAssessment } from "../services/gradesAssessmentsService";
import type { AssessmentDeliveryMode, AssessmentType, CreateAssessmentPayload, ExamScopeType, ScopeEntityOption } from "../../shared/types";
import { useGradesYearTermLayoutContext } from "@/features/grades/hooks/GradesYearTermLayoutContext";

const defaultDeliveryMode: AssessmentDeliveryMode = "SCORE_ONLY";

export default function CreateAssessmentPage() {
  const t = useTranslations("academics.grades");
  const tDialog = useTranslations("academics.grades.dialogs.createAssessment");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const {
    academicYearId,
    termId,
    isInitializing,
  } = useGradesYearTermLayoutContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeTypes, setScopeTypes] = useState<ExamScopeType[]>([]);
  const [scopeEntitiesByType, setScopeEntitiesByType] = useState<Record<ExamScopeType, ScopeEntityOption[]>>({
    school: [],
    stage: [],
    grade: [],
    section: [],
    classroom: [],
  });
  const [subjects, setSubjects] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [draft, setDraft] = useState<CreateAssessmentPayload | null>(null);

  const availableScopeEntities = useMemo(
    () => (draft ? scopeEntitiesByType[draft.scopeType] || [] : []),
    [draft, scopeEntitiesByType],
  );

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!academicYearId || !termId) {
      setIsLoading(false);
      return;
    }

    const loadFilters = async () => {
      setIsLoading(true);
      try {
        const data = await fetchGradesFiltersData(academicYearId, termId);
        setScopeTypes(data.scopeTypes);
        setScopeEntitiesByType(data.scopeEntities);
        setSubjects(data.subjects);

        const requestedScopeType = (searchParams.get("scopeType") as ExamScopeType) || data.scopeTypes[0] || "school";
        const scopeType = data.scopeTypes.includes(requestedScopeType) ? requestedScopeType : data.scopeTypes[0] || "school";
        const scopeEntities = data.scopeEntities[scopeType] || [];
        const requestedScopeId = searchParams.get("scopeId") || "";
        const scopeId = scopeEntities.some((entity) => entity.id === requestedScopeId) ? requestedScopeId : scopeEntities[0]?.id || "";
        const requestedSubjectId = searchParams.get("subjectId") || "";
        const subjectId = data.subjects.some((subject) => subject.id === requestedSubjectId) ? requestedSubjectId : data.subjects[0]?.id || "";

        setDraft({
          termId,
          scopeType,
          scopeId,
          subjectId,
          type: "QUIZ",
          deliveryMode: defaultDeliveryMode,
          title: "",
          titleAr: "",
          date: new Date().toISOString().slice(0, 10),
          weight: 15,
          maxScore: 20,
        });
      } catch {
        showError(tCommon("error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadFilters();
  }, [academicYearId, isInitializing, searchParams, showError, tCommon, termId]);

  const handleBack = () => {
    const params = new URLSearchParams();
    params.set("year", academicYearId);
    params.set("term", termId);
    if (draft?.scopeType) params.set("scopeType", draft.scopeType);
    if (draft?.scopeId) params.set("scopeId", draft.scopeId);
    if (draft?.subjectId) params.set("subjectId", draft.subjectId);
    router.push(`/${locale}/grades/assessments?${params.toString()}`);
  };

  const handleScopeTypeChange = (value: string) => {
    const nextScopeType = value as ExamScopeType;
    const nextScopeId = scopeEntitiesByType[nextScopeType]?.[0]?.id || "";
    setDraft((current) => (current ? { ...current, scopeType: nextScopeType, scopeId: nextScopeId } : current));
  };

  const handleSubmit = async () => {
    if (!draft) return;
    try {
      setIsSubmitting(true);
      if (draft.deliveryMode === "SCORE_ONLY") {
        await createAssessment(academicYearId, draft);
        showSuccess(t("messages.assessmentCreated"));
        handleBack();
        return;
      }

      const params = new URLSearchParams();
      params.set("year", academicYearId);
      params.set("term", termId);
      params.set("scopeType", draft.scopeType);
      params.set("scopeId", draft.scopeId);
      params.set("subjectId", draft.subjectId);
      params.set("type", draft.type);
      params.set("deliveryMode", draft.deliveryMode);
      params.set("title", draft.title);
      params.set("titleAr", draft.titleAr);
      params.set("date", draft.date);
      params.set("weight", String(draft.weight));
      params.set("maxScore", String(draft.maxScore));
      router.push(`/${locale}/grades/assessments/new/questions?${params.toString()}`);
    } catch (error) {
      showError(t(`errors.${error instanceof Error ? error.message : "generic"}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing || isLoading || !draft) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: "var(--surface-secondary)" }}
    >
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-6">
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{tDialog("title")}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{tDialog("description")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label={tDialog("scopeType")}
              value={draft.scopeType}
              onChange={handleScopeTypeChange}
              options={scopeTypes.map((scopeType) => ({
                value: scopeType,
                label: tDialog(`types.scopeTypes.${scopeType}`),
              }))}
            />
            <Select
              label={tDialog("scope")}
              value={draft.scopeId}
              onChange={(scopeId) => setDraft((current) => (current ? { ...current, scopeId } : current))}
              options={availableScopeEntities.map((entity) => ({
                value: entity.id,
                label: locale === "ar" ? entity.nameAr : entity.nameEn,
              }))}
            />
            <Select
              label={tDialog("subject")}
              value={draft.subjectId}
              onChange={(subjectId) => setDraft((current) => (current ? { ...current, subjectId } : current))}
              options={subjects.map((subject) => ({
                value: subject.id,
                label: locale === "ar" ? subject.nameAr : subject.nameEn,
              }))}
            />
            <Select
              label={tDialog("testMode")}
              value={draft.deliveryMode}
              onChange={(deliveryMode) => setDraft((current) => (current ? { ...current, deliveryMode: deliveryMode as AssessmentDeliveryMode } : current))}
              options={[
                { value: "SCORE_ONLY", label: tDialog("testModes.paper") },
                { value: "QUESTION_BASED", label: tDialog("testModes.electronic") },
              ]}
            />
            <Select
              label={tDialog("type")}
              value={draft.type}
              onChange={(type) => setDraft((current) => (current ? { ...current, type: type as AssessmentType } : current))}
              options={[
                { value: "QUIZ", label: tDialog("types.quiz") },
                { value: "MONTH_EXAM", label: tDialog("types.monthExam") },
                { value: "MIDTERM", label: tDialog("types.midterm") },
                { value: "TERM_EXAM", label: tDialog("types.termExam") },
              ]}
            />
            <DatePicker
              label={tDialog("date")}
              value={draft.date ? new Date(draft.date) : null}
              onChange={(date) => setDraft((current) => (current && date ? { ...current, date: date.toISOString().slice(0, 10) } : current))}
            />
            <Input label={tDialog("titleEn")} value={draft.title} onChange={(event) => setDraft((current) => (current ? { ...current, title: event.target.value } : current))} required />
            <Input label={tDialog("titleAr")} value={draft.titleAr} onChange={(event) => setDraft((current) => (current ? { ...current, titleAr: event.target.value } : current))} required />
            <Input
              label={tDialog("weight")}
              type="number"
              min="1"
              max="100"
              value={String(draft.weight)}
              onChange={(event) => setDraft((current) => (current ? { ...current, weight: Number(event.target.value) } : current))}
              required
            />
            <Input
              label={tDialog("maxScore")}
              type="number"
              min="1"
              value={String(draft.maxScore)}
              onChange={(event) => setDraft((current) => (current ? { ...current, maxScore: Number(event.target.value) } : current))}
              required
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
              {tCommon("cancel")}
            </Button>
            <Button variant="primary" onClick={() => void handleSubmit()} loading={isSubmitting}>
              {draft.deliveryMode === "QUESTION_BASED" ? tDialog("continueToBuilder") : tDialog("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
