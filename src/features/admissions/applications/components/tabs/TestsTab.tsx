"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Application, Test } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import { fetchPlacementTests } from "@/features/admissions/tests/services/testsApiService";

interface TestsTabProps {
  application: Application;
  onScheduleTest?: () => void;
}

export default function TestsTab({
  application,
  onScheduleTest,
}: TestsTabProps) {
  const t = useTranslations("admissions.application360");
  const { isReadOnly } = useAdmissionsYearTermContext();
  const [tests, setTests] = useState<Test[]>(application.tests);

  useEffect(() => {
    let cancelled = false;
    void fetchPlacementTests({
      applicationId: application.id,
      search: application.studentName,
    })
      .then((nextTests) => {
        if (!cancelled) {
          setTests(
            nextTests.filter(
              (test) => !test.applicationId || test.applicationId === application.id,
            ),
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load placement tests:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [application.id, application.studentName, application.tests]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("tests.title")}</h3>
        {onScheduleTest ? (
          <button
            onClick={onScheduleTest}
            disabled={isReadOnly}
            className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("tests.schedule_test")}
          </button>
        ) : null}
      </div>
      {tests.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {t("tests.no_tests")}
        </p>
      ) : (
        <div className="space-y-2">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {test.subject} - {test.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {test.date} {t("tests.at")} {test.time} • {test.location}
                  </p>
                  {test.score !== undefined && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {t("tests.score")}: {test.score}/{test.maxScore}
                    </p>
                  )}
                </div>
                <StatusBadge status={test.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
