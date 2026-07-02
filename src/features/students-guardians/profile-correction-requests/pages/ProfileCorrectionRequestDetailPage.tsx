"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getStudentsGuardiansCapabilities } from "@/features/students-guardians/shared/permissions/studentsGuardiansCapabilities";
import type { ProfileCorrectionRequestDetail } from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";
import {
  approveProfileCorrectionRequest,
  fetchProfileCorrectionRequestById,
  rejectProfileCorrectionRequest,
} from "@/features/students-guardians/profile-correction-requests/services/profileCorrectionRequestsApiService";
import { Button, TextArea } from "@/components/ui";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileCorrectionRequestDetailPageProps {
  requestId: string;
}

export default function ProfileCorrectionRequestDetailPage({
  requestId,
}: ProfileCorrectionRequestDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const t = useTranslations("students_guardians.profile_correction_requests");
  const permissions = usePermissions();
  const {
    canViewProfileCorrectionRequests,
    canReviewProfileCorrectionRequests,
  } = getStudentsGuardiansCapabilities(permissions);
  const [request, setRequest] =
    useState<ProfileCorrectionRequestDetail | null>(null);
  const [reviewerNote, setReviewerNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (!canViewProfileCorrectionRequests || !requestId) return;

    let isCancelled = false;

    const reloadRequest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProfileCorrectionRequestById(requestId);
        if (!isCancelled) setRequest(data);
      } catch (loadError) {
        if (!isCancelled) {
          setRequest(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load profile correction request.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void reloadRequest();

    return () => {
      isCancelled = true;
    };
  }, [canViewProfileCorrectionRequests, requestId]);

  const handleReview = async (action: "approve" | "reject") => {
    const confirmMessage = action === "approve" ? t("confirm_approve") : t("confirm_reject");
    if (!request || !window.confirm(confirmMessage)) return;

    setIsReviewing(true);
    setError(null);
    try {
      const nextRequest =
        action === "approve"
          ? await approveProfileCorrectionRequest(request.id, {
              reviewerNote: reviewerNote.trim() || undefined,
            })
          : await rejectProfileCorrectionRequest(request.id, {
              reviewerNote: reviewerNote.trim() || undefined,
            });
      setRequest(nextRequest);
      setReviewerNote("");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : `Failed to ${action} profile correction request.`,
      );
    } finally {
      setIsReviewing(false);
    }
  };

  if (!canViewProfileCorrectionRequests) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-600">
          {t("no_view_permission")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          router.push(`/${lang}/students-guardians/profile-correction-requests`)
        }
        leftIcon={<ChevronLeft className="h-4 w-4" />}
        className="w-fit"
      >
        {t("action_back")}
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("loading")}
        </div>
      ) : !request ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("request_not_found")}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">
              {t("detail_title")}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {request.studentName || request.studentId}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t("status")}: <span>{t(`status_${request.status.toLowerCase()}`)}</span>
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t("table_field")}</th>
                  <th className="px-4 py-3">{t("table_current")}</th>
                  <th className="px-4 py-3">{t("table_requested")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {request.changes.map((change) => (
                  <tr key={change.field}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {change.label}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {change.currentValue}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {change.requestedValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <TextArea
              label={t("detail_reviewer_note")}
              rows={3}
              value={reviewerNote}
              onChange={(event) => setReviewerNote(event.target.value)}
              disabled={!canReviewProfileCorrectionRequests || isReviewing || request.status !== "PENDING"}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="success"
                disabled={!canReviewProfileCorrectionRequests || isReviewing || request.status !== "PENDING"}
                loading={isReviewing}
                onClick={() => void handleReview("approve")}
              >
                {t("action_approve")}
              </Button>
              <Button
                variant="danger"
                disabled={!canReviewProfileCorrectionRequests || isReviewing || request.status !== "PENDING"}
                loading={isReviewing}
                onClick={() => void handleReview("reject")}
              >
                {t("action_reject")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
