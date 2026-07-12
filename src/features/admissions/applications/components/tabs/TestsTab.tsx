"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Application, Test } from "@/features/admissions/types/admissions";
import StatusBadge from "../../../shared/StatusBadge";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import {
  fetchPlacementTests,
  completePlacementTest,
} from "@/features/admissions/tests/services/testsApiService";
import TestScoreModal from "@/features/admissions/tests/components/TestScoreModal";
import { useToast } from "@/components/ui/toast/Toast";

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
  const { showToast } = useToast();
  const [tests, setTests] = useState<Test[]>(application.tests);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const loadTests = useCallback(async () => {
    try {
      const nextTests = await fetchPlacementTests({});
      setTests(
        nextTests.filter((test) => test.applicationId === application.id),
      );
    } catch (error) {
      console.error("Failed to load placement tests:", error);
    }
  }, [application.id]);

  useEffect(() => {
    void Promise.resolve().then(loadTests);
  }, [loadTests]);

  const handleScoreSubmit = async (
    testId: string,
    score: number,
    result?: string,
  ) => {
    try {
      await completePlacementTest(testId, { score, result });
      showToast(t("tests.score_saved"), "success");
      setSelectedTest(null);
      await loadTests();
    } catch (err) {
      console.error("Failed to save test score:", err);
      showToast(t("tests.score_save_failed"), "error");
    }
  };

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
              onClick={() => {
                if (!isReadOnly && test.status !== "cancelled") {
                  setSelectedTest(test);
                }
              }}
              className={`p-4 border border-gray-200 rounded-lg transition-colors ${
                !isReadOnly && test.status !== "cancelled"
                  ? "cursor-pointer hover:border-primary hover:bg-gray-50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {test.type}
                    {test.subjectName ? ` - ${test.subjectName}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {test.scheduledAt
                      ? new Date(test.scheduledAt).toLocaleString()
                      : `${test.date} ${test.time}`}
                  </p>
                  {test.score !== undefined && test.score !== null && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {t("tests.score")}: {test.score}
                    </p>
                  )}
                </div>
                <StatusBadge status={test.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTest && (
        <TestScoreModal
          test={{
            ...selectedTest,
            studentName: application.studentName,
          }}
          isOpen={true}
          onClose={() => setSelectedTest(null)}
          onSubmit={handleScoreSubmit}
        />
      )}
    </div>
  );
}
