"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, ListChecks, PencilLine, Power, Search, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, DataTable, FilterPanel, Input, KPICardV2, Select } from "@/components/ui";
import type { Column } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast/Toast";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { formatDate } from "@/utils/formatters/dateTime";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import {
  getHeroJourneyBadgeCatalog,
  getHeroJourneyMissions,
  toggleHeroJourneyMissionPublishState,
} from "../services/heroJourneyService";
import type {
  HeroJourneyBadge,
  HeroJourneyMission,
  HeroJourneyMissionFilters,
} from "../types";
import {
  canToggleHeroJourneyMissionPublishStatus,
  formatHeroJourneyPercent,
} from "../utils/heroJourneyPresentation";
import HeroJourneyBadgeThumb from "./HeroJourneyBadgeThumb";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

function getMissionCompletionRate(mission: HeroJourneyMission) {
  if (mission.studentsStarted === 0) {
    return 0;
  }

  return (mission.studentsCompleted / mission.studentsStarted) * 100;
}

export default function HeroJourneyMissionsPage() {
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const { showInfo, showSuccess } = useToast();
  const [showFilters, setShowFilters] = useState(true);
  const [missions, setMissions] = useState<HeroJourneyMission[]>([]);
  const [badges, setBadges] = useState<HeroJourneyBadge[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const queryState = useUrlQueryState({
    defaults: {
      q: "",
      status: "all",
      stage: "all",
    },
    debouncedKeys: ["q"],
    modeByKey: {
      q: "replace",
      status: "replace",
      stage: "replace",
    },
  });

  const filters = useMemo<HeroJourneyMissionFilters>(
    () => ({
      search: queryState.values.q || undefined,
      status: queryState.values.status as HeroJourneyMissionFilters["status"],
      stage: queryState.values.stage as HeroJourneyMissionFilters["stage"],
    }),
    [queryState.values.q, queryState.values.stage, queryState.values.status],
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

    void getHeroJourneyMissions(filters).then((result) => {
      if (!cancelled) {
        setMissions(result);
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

  const selectedMission = useMemo(
    () =>
      missions.find((mission) => mission.id === selectedMissionId) ||
      missions[0] ||
      null,
    [missions, selectedMissionId],
  );

  const averageCompletion = useMemo(() => {
    if (missions.length === 0) {
      return 0;
    }

    return (
      missions.reduce(
        (sum, mission) => sum + getMissionCompletionRate(mission),
        0,
      ) / missions.length
    );
  }, [missions]);

  const summaryCards = useMemo(
    () => [
      {
        key: "total",
        title: t("missionsSummary.totalMissions"),
        value: missions.length,
        icon: ListChecks,
        iconColor: "#0369a1",
        iconBgColor: "#f0f9ff",
      },
      {
        key: "published",
        title: t("missionsSummary.publishedMissions"),
        value: missions.filter((mission) => mission.status === "published").length,
        icon: Power,
        iconColor: "#047857",
        iconBgColor: "#ecfdf5",
      },
      {
        key: "average",
        title: t("missionsSummary.averageCompletion"),
        value: Number(averageCompletion.toFixed(1)),
        valueSuffix: "%",
        icon: Target,
        iconColor: "#b45309",
        iconBgColor: "#fffbeb",
      },
    ],
    [averageCompletion, missions, t],
  );

  const columns: Column<HeroJourneyMission>[] = [
    { key: "id", label: t("table.missionId"), searchable: true },
    {
      key: "titleEn",
      label: t("table.title"),
      searchable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900">
            {locale === "ar" ? row.titleAr : row.titleEn}
          </div>
          <div className="truncate text-xs text-gray-500">
            {locale === "ar" ? row.stageNameAr : row.stageNameEn}
          </div>
        </div>
      ),
    },
    { key: "requiredLevel", label: t("table.requiredLevel") },
    {
      key: "linkedLessonTitleEn",
      label: t("table.linkedLesson"),
      searchable: true,
      render: (_value, row) =>
        locale === "ar" ? row.linkedLessonTitleAr : row.linkedLessonTitleEn,
    },
    {
      key: "linkedQuizTitleEn",
      label: t("table.linkedQuiz"),
      searchable: true,
      render: (_value, row) =>
        locale === "ar" ? row.linkedQuizTitleAr : row.linkedQuizTitleEn,
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value) => (
        <HeroJourneyStatusPill
          kind="mission"
          value={value as HeroJourneyMission["status"]}
        />
      ),
    },
    {
      key: "rewardXp",
      label: t("table.rewardXp"),
      render: (value) => (
        <span className="font-semibold text-gray-900">{String(value)} XP</span>
      ),
    },
    {
      key: "badgeRewardSlug",
      label: t("table.badgeReward"),
      sortable: false,
      render: (value) => (
        <HeroJourneyBadgeThumb
          badge={badgeMap.get(String(value || ""))}
          showLabel
        />
      ),
    },
    { key: "studentsStarted", label: t("table.studentsStarted") },
    { key: "studentsCompleted", label: t("table.studentsCompleted") },
    {
      key: "completionRate",
      label: t("table.completionRate"),
      sortable: false,
      render: (_value, row) => (
        <span className="font-medium text-gray-700">
          {formatHeroJourneyPercent(getMissionCompletionRate(row))}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      sortable: false,
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => setSelectedMissionId(row.id)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary"
            title={t("actions.view")}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => showInfo(t("messages.editPlaceholder"))}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title={t("actions.edit")}
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              setIsPublishing(row.id);
              await toggleHeroJourneyMissionPublishState(row.id);
              const refreshed = await getHeroJourneyMissions(filters);
              setMissions(refreshed);
              setIsPublishing(null);
              showSuccess(t("messages.publishStateUpdated"));
            }}
            disabled={
              isPublishing === row.id ||
              !canToggleHeroJourneyMissionPublishStatus(row.status)
            }
            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={t("actions.togglePublish")}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 bg-gray-50">
      <HeroJourneyPageHeader
        title={t("missions")}
        description={t("missionsDescription")}
        bannerImageSrc={heroJourneySectionBanners.missions}
        actions={
          <Button variant="secondary" onClick={() => showInfo(t("messages.badgesReady"))}>
            {t("actions.badgesGuide")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            valueSuffix={card.valueSuffix}
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
        subtitle={t("filters.missionsSubtitle")}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        searchSlot={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={queryState.values.q}
              onChange={(event) => queryState.setValue("q", event.target.value)}
              className="pl-10"
              placeholder={t("filters.searchMissionsPlaceholder")}
            />
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              value={queryState.values.status}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "draft", label: t("status.draft") },
                { value: "published", label: t("status.published") },
                { value: "scheduled", label: t("status.scheduled") },
                { value: "archived", label: t("status.archived") },
              ]}
              onChange={(value) => queryState.setValue("status", value)}
            />
            <Select
              value={queryState.values.stage}
              options={[
                { value: "all", label: t("filters.allStages") },
                { value: "Primary", label: t("stages.primary") },
                { value: "Middle", label: t("stages.middle") },
                { value: "Secondary", label: t("stages.secondary") },
              ]}
              onChange={(value) => queryState.setValue("stage", value)}
            />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <DataTable
          columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
          data={missions as unknown as Array<{ [key: string]: unknown }>}
          onRowClick={(row) =>
            setSelectedMissionId(
              (row as unknown as HeroJourneyMission).id,
            )
          }
          searchQuery={queryState.values.q}
          itemsPerPage={8}
          showPagination={true}
          urlState={{
            keyPrefix: "heroJourneyMissions",
            syncPagination: true,
            syncSorting: true,
          }}
        />

        <div className="rounded-xl bg-white p-5 shadow-sm">
          {selectedMission ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {locale === "ar"
                      ? selectedMission.titleAr
                      : selectedMission.titleEn}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{selectedMission.id}</p>
                </div>
                <HeroJourneyStatusPill
                  kind="mission"
                  value={selectedMission.status}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">{t("detail.requiredLevel")}</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedMission.requiredLevel}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">{t("detail.lastUpdated")}</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDate(selectedMission.updatedAt, locale)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.linkedContent")}
                </p>
                <p className="mt-2 text-sm text-gray-900">
                  {locale === "ar"
                    ? selectedMission.linkedLessonTitleAr
                    : selectedMission.linkedLessonTitleEn}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {locale === "ar"
                    ? selectedMission.linkedQuizTitleAr
                    : selectedMission.linkedQuizTitleEn}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.rewardPreview")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">{t("table.rewardXp")}</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMission.rewardXp} XP
                    </p>
                  </div>
                  <HeroJourneyBadgeThumb
                    badge={badgeMap.get(selectedMission.badgeRewardSlug || "")}
                    size="md"
                    showLabel
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("detail.engagement")}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">{t("table.studentsStarted")}</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMission.studentsStarted}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t("table.studentsCompleted")}</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMission.studentsCompleted}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t("table.completionRate")}</p>
                    <p className="font-semibold text-gray-900">
                      {formatHeroJourneyPercent(
                        getMissionCompletionRate(selectedMission),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">{t("empty.missions")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
