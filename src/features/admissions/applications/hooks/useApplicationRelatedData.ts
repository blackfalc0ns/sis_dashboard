"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  fetchStructureTree,
  type Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { getApplicationRegistrationHandoff } from "@/features/admissions/applications/api/applicationRegistrationApi";
import type {
  RegistrationHandoffResponseDto,
  RegistrationStudentRequest,
} from "@/features/admissions/applications/api/registrationDtos";
import type { Guardian } from "@/features/admissions/applications/types/guardian";
import type { Document } from "@/features/admissions/applications/types/document";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";

interface ApplicationRelatedData {
  handoff: RegistrationHandoffResponseDto | null;
  guardians: Guardian[];
  documents: Document[];
  studentDraft: Partial<RegistrationStudentRequest> | null;
  gradeLabel: string | null;
  academicYearLabel: string | null;
  previousSchool: string | null;
  isLoadingHandoff: boolean;
  handoffError: string | null;
  reloadHandoff: () => Promise<void>;
}

export function useApplicationRelatedData(
  applicationId: string | null | undefined,
  requestedGradeId?: string | null,
  enabled = true,
): ApplicationRelatedData {
  const locale = useLocale();
  const { yearId, termId } = useAdmissionsYearTermContext();
  const [handoff, setHandoff] = useState<RegistrationHandoffResponseDto | null>(
    null,
  );
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [isLoadingHandoff, setIsLoadingHandoff] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);

  const reloadHandoff = useCallback(async () => {
    if (!enabled || !applicationId) {
      setHandoff(null);
      setHandoffError(null);
      setIsLoadingHandoff(false);
      return;
    }

    setIsLoadingHandoff(true);
    setHandoffError(null);
    try {
      setHandoff(await getApplicationRegistrationHandoff(applicationId));
    } catch (error) {
      console.error("Failed to load application registration handoff:", error);
      setHandoff(null);
      setHandoffError("Unable to load registration draft data.");
    } finally {
      setIsLoadingHandoff(false);
    }
  }, [applicationId, enabled]);

  useEffect(() => {
    void reloadHandoff();
  }, [reloadHandoff]);

  useEffect(() => {
    if (!enabled || !yearId || !termId) {
      setGrades([]);
      return;
    }

    let isMounted = true;

    async function loadGrades() {
      try {
        const tree = await fetchStructureTree(yearId as string, termId as string);
        if (isMounted) {
          setGrades(tree.grades);
        }
      } catch (error) {
        console.error("Failed to load application grade labels:", error);
        if (isMounted) {
          setGrades([]);
        }
      }
    }

    void loadGrades();

    return () => {
      isMounted = false;
    };
  }, [enabled, termId, yearId]);

  const gradeLabel = useMemo(() => {
    const handoffGradeName =
      handoff?.wizardDraft?.enrollment?.gradeId === requestedGradeId
        ? handoff?.source?.application?.requestedGradeName
        : handoff?.source?.application?.requestedGradeName ??
          handoff?.source?.applicantRequest?.requestedGradeName;

    if (handoffGradeName) return handoffGradeName;

    const gradeId =
      requestedGradeId ??
      handoff?.wizardDraft?.enrollment?.gradeId ??
      handoff?.source?.application?.requestedGradeId ??
      handoff?.source?.applicantRequest?.requestedGradeId;

    if (!gradeId) return null;
    const grade = grades.find((item) => item.id === gradeId);
    if (!grade) return null;
    return locale === "ar" ? grade.nameAr || grade.name : grade.nameEn || grade.name;
  }, [grades, handoff, locale, requestedGradeId]);

  const academicYearLabel =
    handoff?.source?.application?.requestedAcademicYearName ??
    handoff?.source?.applicantRequest?.requestedAcademicYearName ??
    null;

  const studentDraft = handoff?.wizardDraft?.student ?? null;
  const previousSchool = handoff?.source?.applicantRequest?.previousSchool ?? null;

  const guardians = useMemo(() => {
    return (handoff?.wizardDraft?.guardians ?? []).map(
      (guardian, index): Guardian => ({
        id: `handoff-guardian-${index}`,
        full_name: guardian.profile.full_name ?? "",
        relation: guardian.profile.relation ?? "",
        phone_primary: guardian.profile.phone_primary ?? "",
        phone_secondary: guardian.profile.phone_secondary ?? "",
        email: guardian.profile.email ?? "",
        national_id: guardian.profile.national_id ?? "",
        job_title: guardian.profile.job_title ?? "",
        workplace: guardian.profile.workplace ?? "",
        is_primary: guardian.relationship?.is_primary ?? index === 0,
        can_pickup: guardian.profile.can_pickup ?? false,
        can_receive_notifications:
          guardian.profile.can_receive_notifications ?? false,
      }),
    );
  }, [handoff]);

  const documents = useMemo(() => {
    return (handoff?.documents ?? []).map(
      (document): Document => ({
        id: document.applicationDocumentId,
        type: document.documentType,
        name: document.file.originalName,
        status: document.status,
        uploadedDate: undefined,
        url: document.file.id ? `/api/files/${document.file.id}/download` : undefined,
        fileType: document.file.mimeType.includes("pdf")
          ? "pdf"
          : document.file.mimeType.startsWith("image/")
            ? "image"
            : undefined,
        fileId: document.file.id,
        labelEn: document.documentType,
        notes: document.notes ?? undefined,
      }),
    );
  }, [handoff]);

  return {
    handoff,
    guardians,
    documents,
    studentDraft,
    gradeLabel,
    academicYearLabel,
    previousSchool,
    isLoadingHandoff,
    handoffError,
    reloadHandoff,
  };
}
