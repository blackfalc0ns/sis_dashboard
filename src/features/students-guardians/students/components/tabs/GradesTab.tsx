"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp, Award, BookOpen, Target } from "lucide-react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { fetchStudentGradesSnapshot } from "@/features/grades/overview/services/gradesOverviewService";
import type { StudentGradesSnapshot } from "@/features/grades/overview/types";

interface GradesTabProps {
  student: Student;
}

export default function GradesTab({ student }: GradesTabProps) {
  const t = useTranslations("students_guardians.profile.grades");
  const locale = useLocale();
  const [snapshot, setSnapshot] = useState<StudentGradesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSnapshot = async () => {
      setIsLoading(true);
      try {
        const nextSnapshot = await fetchStudentGradesSnapshot(student.id);
        setSnapshot(nextSnapshot);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSnapshot();
  }, [student.id]);

  const subjectRows = snapshot?.subjectRows || [];
  const columns = useMemo(
    () => [
      {
        key: "subject",
        label: t("table.subject"),
      },
      {
        key: "average",
        label: t("table.average"),
        render: (value: unknown) => <span className="font-semibold">{Number(value || 0).toFixed(1)}%</span>,
      },
      {
        key: "last_assessment",
        label: t("table.last_assessment"),
        render: (value: unknown) => (value == null ? "-" : `${Number(value).toFixed(1)}%`),
      },
      {
        key: "assessments_count",
        label: t("table.assessments"),
        render: (value: unknown) => `${value as number} ${t("total_assessments_suffix")}`,
      },
      {
        key: "trend",
        label: t("table.trend"),
      },
    ],
    [t],
  );

  const tableData = subjectRows.map((row) => ({
    id: row.subjectId,
    subject: locale === "ar" ? row.subjectNameAr : row.subjectName,
    average: row.average,
    last_assessment: row.lastAssessmentScore,
    assessments_count: row.assessmentsCount,
    trend: row.trend,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <PartialLoader />
      </div>
    );
  }

  if (!snapshot || subjectRows.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)", backgroundColor: "var(--surface-color)" }}>
        {t("empty_state")}
      </div>
    );
  }

  const topSubject = subjectRows[0];
  const lowestSubject = subjectRows[subjectRows.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardV2
          title={t("kpis.term_average")}
          value={`${snapshot.currentAverage.toFixed(1)}%`}
          subtitle={t("overall_gpa")}
          icon={Award}
          iconColor="var(--primary-color)"
          iconBgColor="var(--color-primary-100)"
          chartData={snapshot.performanceTrend.map((point, index) => ({ label: `P${index + 1}`, value: point.average }))}
          chartColor="var(--primary-color)"
        />
        <KPICardV2
          title={t("kpis.highest_grade")}
          value={`${snapshot.highestAverage.toFixed(1)}%`}
          subtitle={locale === "ar" ? topSubject.subjectNameAr : topSubject.subjectName}
          icon={Target}
          iconColor="var(--success-text)"
          iconBgColor="var(--success-bg)"
          showChart={false}
        />
        <KPICardV2
          title={t("kpis.lowest_grade")}
          value={`${snapshot.lowestAverage.toFixed(1)}%`}
          subtitle={locale === "ar" ? lowestSubject.subjectNameAr : lowestSubject.subjectName}
          icon={BookOpen}
          iconColor="var(--warning-text)"
          iconBgColor="var(--warning-bg)"
          showChart={false}
        />
        <KPICardV2
          title={t("total_assessments")}
          value={snapshot.totalAssessments}
          subtitle={t("this_semester")}
          icon={TrendingUp}
          iconColor="var(--accent-color)"
          iconBgColor="var(--color-primary-50)"
          showChart={false}
        />
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {t("performance_over_time")}
        </h3>
        <div className="h-80">
          <LineChart
            xAxis={[{ scaleType: "point", data: snapshot.performanceTrend.map((point) => point.label) }]}
            series={[
              {
                data: snapshot.performanceTrend.map((point) => point.average),
                label: t("average_grade"),
                color: "var(--primary-color)",
                curve: "linear",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          />
        </div>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <div className="mb-4 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("subject_grades")}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subject_grades_subtitle")}</p>
        </div>
        <DataTable columns={columns} data={tableData} showPagination={false} />
      </div>
    </div>
  );
}
