"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { EnrollmentDto } from "../api/enrollmentDtos";
import {
  fetchCurrentEnrollment,
  fetchEnrollment,
  fetchEnrollmentHistory,
} from "../api/enrollmentApi";
import type { EnrollmentRecord } from "../model/enrollment";

interface Props {
  enrollment: EnrollmentRecord | null;
  onClose: () => void;
  canManage: boolean;
  canManageLifecycle: boolean;
  onEdit: (enrollment: EnrollmentRecord) => void;
  onLifecycle: (
    action: "transfer" | "withdraw" | "promote",
    enrollment: EnrollmentRecord,
  ) => void;
}

export default function EnrollmentDetailsDrawer({
  enrollment,
  onClose,
  canManage,
  canManageLifecycle,
  onEdit,
  onLifecycle,
}: Props) {
  const locale = useLocale();
  const [detail, setDetail] = useState<EnrollmentDto | null>(null);
  const [current, setCurrent] = useState<EnrollmentDto | null>(null);
  const [history, setHistory] = useState<EnrollmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enrollment) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setDetail(null);
        setCurrent(null);
        setHistory([]);
        setError(false);
        setIsLoading(true);
        return Promise.all([
          fetchEnrollment(enrollment.id),
          fetchCurrentEnrollment(enrollment.studentId),
          fetchEnrollmentHistory(enrollment.studentId),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [nextDetail, nextCurrent, nextHistory] = result;
        if (!active) return;
        setDetail(nextDetail);
        setCurrent(nextCurrent);
        setHistory(nextHistory);
        setError(false);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [enrollment]);

  useEffect(() => {
    if (!enrollment) return;
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [enrollment, onClose]);

  if (!enrollment) return null;
  const shown = detail ?? enrollment;

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Enrollment details"
        dir={locale === "ar" ? "rtl" : "ltr"}
        onClick={(event) => event.stopPropagation()}
        className={`absolute inset-y-0 flex w-full max-w-xl flex-col bg-white shadow-2xl ${locale === "ar" ? "left-0" : "right-0"}`}
      >
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm text-gray-500">Enrollment details</p>
            <h2 className="text-xl font-bold">{enrollment.studentName}</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {isLoading && (
            <div className="py-10" role="status">
              <PartialLoader />
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
              Unable to load enrollment details.
            </p>
          )}
          {!isLoading && (
            <>
              <Section title="Overview" enrollment={shown} />
              <Section
                title="Current enrollment"
                enrollment={current}
                empty="No active enrollment"
              />
              <section>
                <h3 className="mb-3 font-semibold">History</h3>
                <div className="space-y-3">
                  {history.length ? (
                    history.map((item) => (
                      <Section
                        key={item.enrollmentId}
                        enrollment={item}
                        compact
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No enrollment history
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-border p-4">
          {canManage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(enrollment)}
            >
              Edit placement
            </Button>
          )}
          {canManageLifecycle && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onLifecycle("transfer", enrollment)}
              >
                Transfer
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onLifecycle("promote", enrollment)}
              >
                Promote
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onLifecycle("withdraw", enrollment)}
              >
                Withdraw
              </Button>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

function Section({
  title,
  enrollment,
  empty,
  compact,
}: {
  title?: string;
  enrollment: EnrollmentDto | EnrollmentRecord | null;
  empty?: string;
  compact?: boolean;
}) {
  if (!enrollment)
    return (
      <section>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{empty}</p>
      </section>
    );
  const date = "enrollmentDate" in enrollment ? enrollment.enrollmentDate : "";
  return (
    <section
      className={
        compact
          ? "rounded-lg border border-border p-3"
          : "rounded-xl bg-gray-50 p-4"
      }
    >
      {title && <h3 className="mb-3 font-semibold">{title}</h3>}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Status" value={enrollment.status} />
        <Field label="Academic year" value={enrollment.academicYear} />
        <Field label="Grade" value={enrollment.grade} />
        <Field label="Section" value={enrollment.section} />
        <Field label="Classroom" value={enrollment.classroom} />
        <Field
          label="Enrollment date"
          value={new Date(date).toLocaleDateString()}
        />
      </dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value || "—"}</dd>
    </div>
  );
}
