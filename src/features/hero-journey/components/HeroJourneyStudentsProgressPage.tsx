"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Search, ShieldAlert, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DataTable,
  FilterPanel,
  Input,
  KPICardV2,
  Select,
} from "@/components/ui";
import type { Column } from "@/components/ui/data-table";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { formatDate } from "@/utils/formatters/dateTime";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import {
  getHeroJourneyBadgeCatalog,
  getHeroJourneyStudentProgress,
} from "../services/heroJourneyService";
import type {
  HeroJourneyBadge,
  HeroJourneyStudentProgress,
  HeroJourneyStudentProgressFilters,
} from "../types";
import { formatHeroJourneyPercent } from "../utils/heroJourneyPresentation";
import HeroJourneyBadgeThumb from "./HeroJourneyBadgeThumb";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

export default function HeroJourneyStudentsProgressPage() {
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const [showFilters, setShowFilters] = useState(true);
  const [students, setStudents] = useState<HeroJourneyStudentProgress[]>([]);
  const [badges, setBadges] = useState<HeroJourneyBadge[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const queryState = useUrlQueryState({
    defaults: {
      q: "",
      grade: "all",
      section: "all",
      status: "all",
    },
    debouncedKeys: ["q"],
    modeByKey: {
      q: "replace",
      grade: "replace",
      section: "replace",
      status: "replace",
    },
  });

  const filters = useMemo<HeroJourneyStudentProgressFilters>(
    () => ({
      search: queryState.values.q || undefined,
      grade: queryState.values.grade as HeroJourneyStudentProgressFilters["grade"],
      section: queryState.values.section as HeroJourneyStudentProgressFilters["section"],
      status: queryState.values.status as HeroJourneyStudentProgressFilters["status"],
    }),
    [
      queryState.values.grade,
      queryState.values.q,
      queryState.values.section,
      queryState.values.status,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    void getHeroJourneyBadgeCatalog().then((result) => {
      if (!cancelled) {
        setBadges(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getHeroJourneyStudentProgress(filters).then((result) => {
      if (!cancelled) {
        setStudents(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const badgeMap = useMemo(
    () => new Map(badges.map((badge) => [badge.slug, badge])),
    [badges],
  );

  const selectedStudent = useMemo(
    () =>
      students.find((student) => student.id === selectedStudentId) ||
      students[0] ||
      null,
    [students, selectedStudentId],
  );

  const filteredStats = useMemo(
    () => ({
      onTrack: students.filter(
        (student) => student.progressStatus === "on_track",
      ).length,
      atRisk: students.filter((student) => student.progressStatus === "at_risk")
        .length,
      inactive: students.filter(
        (student) => student.progressStatus === "inactive",
      ).length,
    }),
    [students],
  );

  const summaryCards = useMemo(
    () => [
      {
        key: "on-track",
        title: t("progressSummary.onTrack"),
        value: filteredStats.onTrack,
        icon: Target,
        iconColor: "#047857",
        iconBgColor: "#ecfdf5",
      },
      {
        key: "at-risk",
        title: t("progressSummary.atRisk"),
        value: filteredStats.atRisk,
        icon: ShieldAlert,
        iconColor: "#b45309",
        iconBgColor: "#fffbeb",
      },
      {
        key: "inactive",
        title: t("progressSummary.inactive"),
        value: filteredStats.inactive,
        icon: Activity,
        iconColor: "#334155",
        iconBgColor: "#f1f5f9",
      },
    ],
    [filteredStats, t],
  );

  const columns: Column<HeroJourneyStudentProgress>[] = [
    {
      key: "studentName",
      label: t("studentsTable.studentName"),
      searchable: true,
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: "gradeNameEn",
      label: t("studentsTable.gradeSection"),
      render: (_value, row) => (
        <div>
          <div className="font-medium text-gray-900">
            {locale === "ar" ? row.gradeNameAr : row.gradeNameEn}
          </div>
          <div className="text-xs text-gray-500">
            {t("studentsTable.sectionLabel", {
              section: locale === "ar" ? row.sectionNameAr : row.sectionNameEn,
            })}
          </div>
        </div>
      ),
    },
    { key: "currentLevel", label: t("studentsTable.currentLevel") },
    {
      key: "currentMissionTitleEn",
      label: t("studentsTable.currentMission"),
      searchable: true,
      render: (_value, row) =>
        locale === "ar" ? row.currentMissionTitleAr : row.currentMissionTitleEn,
    },
    {
      key: "xpCurrent",
      label: t("studentsTable.xpProgress"),
      sortable: false,
      render: (_value, row) => (
        <div className="min-w-[160px]">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              {row.xpCurrent}/{row.xpTarget}
            </span>
            <span>{formatHeroJourneyPercent(row.progressPercent)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(row.progressPercent, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "rankTitleEn",
      label: t("studentsTable.rankTitle"),
      render: (_value, row) => (
        <span className="font-medium text-gray-700">
          {locale === "ar" ? row.rankTitleAr : row.rankTitleEn}
        </span>
      ),
    },
    {
      key: "badgeSlugs",
      label: t("studentsTable.badgesCollected"),
      sortable: false,
      render: (_value, row) => (
        <div className="flex items-center gap-1">
          {row.badgeSlugs.slice(0, 2).map((slug) => (
            <HeroJourneyBadgeThumb key={slug} badge={badgeMap.get(slug)} />
          ))}
          {row.badgeSlugs.length > 2 ? (
            <span className="text-xs text-gray-500">
              +{row.badgeSlugs.length - 2}
            </span>
          ) : null}
        </div>
      ),
    },
    { key: "streakDays", label: t("studentsTable.streakDays") },
    {
      key: "lastActivityAt",
      label: t("studentsTable.lastActivity"),
      render: (value) => formatDate(String(value), locale),
    },
    {
      key: "progressStatus",
      label: t("studentsTable.progressStatus"),
      render: (value) => (
        <HeroJourneyStatusPill
          kind="progress"
          value={value as HeroJourneyStudentProgress["progressStatus"]}
        />
      ),
    },
    {
      key: "actions",
      label: t("studentsTable.actions"),
      sortable: false,
      render: (_value, row) => (
        <button
          onClick={(event) => {
            event.stopPropagation();
            setSelectedStudentId(row.id);
          }}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
          title={t("actions.view")}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-gray-50">
      <HeroJourneyPageHeader
        title={t("studentsProgress")}
        description={t("studentsProgressDescription")}
        bannerImageSrc={heroJourneySectionBanners.studentsProgress}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
            iconBgColor={card.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <FilterPanel
        title={t("filters.title")}
        subtitle={t("filters.studentsSubtitle")}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        searchSlot={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={queryState.values.q}
              onChange={(event) => queryState.setValue("q", event.target.value)}
              className="pl-10"
              placeholder={t("filters.searchStudentsPlaceholder")}
            />
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              value={queryState.values.grade}
              options={[
                { value: "all", label: t("filters.allGrades") },
                { value: "Grade 4", label: "Grade 4" },
                { value: "Grade 5", label: "Grade 5" },
                { value: "Grade 6", label: "Grade 6" },
                { value: "Grade 7", label: "Grade 7" },
                { value: "Grade 8", label: "Grade 8" },
                { value: "Grade 9", label: "Grade 9" },
              ]}
              onChange={(value) => queryState.setValue("grade", value)}
            />
            <Select
              value={queryState.values.section}
              options={[
                { value: "all", label: t("filters.allSections") },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
              ]}
              onChange={(value) => queryState.setValue("section", value)}
            />
            <Select
              value={queryState.values.status}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "on_track", label: t("progressStatus.on_track") },
                { value: "at_risk", label: t("progressStatus.at_risk") },
                { value: "inactive", label: t("progressStatus.inactive") },
              ]}
              onChange={(value) => queryState.setValue("status", value)}
            />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <DataTable
          columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
          data={students as unknown as Array<{ [key: string]: unknown }>}
          onRowClick={(row) =>
            setSelectedStudentId(
              (row as unknown as HeroJourneyStudentProgress).id,
            )
          }
          searchQuery={queryState.values.q}
          itemsPerPage={8}
          showPagination={true}
          urlState={{
            keyPrefix: "heroJourneyStudents",
            syncPagination: true,
            syncSorting: true,
          }}
        />

        <div className="rounded-xl bg-white p-5 shadow-sm">
          {selectedStudent ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedStudent.studentName}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {locale === "ar"
                    ? `${selectedStudent.gradeNameAr} - ${selectedStudent.sectionNameAr}`
                    : `${selectedStudent.gradeNameEn} - ${selectedStudent.sectionNameEn}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">{t("detail.currentLevel")}</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedStudent.currentLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">
                    {t("detail.completedMissions")}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedStudent.completedMissionsCount}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {t("detail.currentMission")}
                  </p>
                  <HeroJourneyStatusPill
                    kind="progress"
                    value={selectedStudent.progressStatus}
                  />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {locale === "ar"
                    ? selectedStudent.currentMissionTitleAr
                    : selectedStudent.currentMissionTitleEn}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedStudent.xpCurrent}/{selectedStudent.xpTarget} XP
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.currentObjectives")}
                </p>
                <div className="mt-3 space-y-2">
                  {selectedStudent.currentObjectives.map((objective) => (
                    <div
                      key={objective.id}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                          objective.isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {objective.isCompleted ? "✓" : "•"}
                      </span>
                      <span className="text-gray-700">
                        {locale === "ar"
                          ? objective.titleAr
                          : objective.titleEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.recentBadges")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedStudent.recentBadgeSlugs.length > 0 ? (
                    selectedStudent.recentBadgeSlugs.map((slug) => (
                      <HeroJourneyBadgeThumb
                        key={slug}
                        badge={badgeMap.get(slug)}
                        showLabel
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t("empty.badges")}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.coachNote")}
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {locale === "ar"
                    ? selectedStudent.coachNoteAr
                    : selectedStudent.coachNoteEn}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {t("detail.lastActivityLabel", {
                    date: formatDate(selectedStudent.lastActivityAt, locale),
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">{t("empty.students")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
