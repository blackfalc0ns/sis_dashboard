"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, ListChecks, PencilLine, Power, Search, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, DataTable, FilterPanel, Input, KPICardV2, Modal, Select } from "@/components/ui";
import type { Column } from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast/Toast";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { heroJourneySectionBanners } from "../config/heroJourneySectionBanners";
import useHeroJourneyOverlayMode from "../hooks/useHeroJourneyOverlayMode";
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
import HeroJourneyMobilePagination from "./HeroJourneyMobilePagination";
import HeroJourneyMissionDetailContent from "./HeroJourneyMissionDetailContent";
import HeroJourneyPageHeader from "./HeroJourneyPageHeader";
import HeroJourneyStatusPill from "./HeroJourneyStatusPill";

function getMissionCompletionRate(mission: HeroJourneyMission) {
  if (mission.studentsStarted === 0) {
    return 0;
  }

  return (mission.studentsCompleted / mission.studentsStarted) * 100;
}

export default function HeroJourneyMissionsPage() {
  const mobilePageSize = 5;
  const locale = useLocale();
  const t = useTranslations("heroJourney");
  const { showInfo, showSuccess } = useToast();
  const [showFilters, setShowFilters] = useState(true);
  const [missions, setMissions] = useState<HeroJourneyMission[]>([]);
  const [badges, setBadges] = useState<HeroJourneyBadge[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const isOverlayMode = useHeroJourneyOverlayMode();
  const queryState = useUrlQueryState({
    defaults: {
      q: "",
      status: "all",
      stage: "all",
      heroJourneyMissionsPage: "1",
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
    () => missions.find((mission) => mission.id === selectedMissionId) || null,
    [missions, selectedMissionId],
  );
  const detailMission = selectedMission || missions[0] || null;
  const mobileCurrentPage = Math.max(
    1,
    Number.parseInt(queryState.values.heroJourneyMissionsPage || "1", 10) || 1,
  );
  const mobileTotalPages = Math.max(1, Math.ceil(missions.length / mobilePageSize));
  const safeMobilePage = Math.min(mobileCurrentPage, mobileTotalPages);
  const mobileVisibleMissions = useMemo(() => {
    const startIndex = (safeMobilePage - 1) * mobilePageSize;
    return missions.slice(startIndex, startIndex + mobilePageSize);
  }, [missions, safeMobilePage]);

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

  const openMissionDetail = (missionId: string) => {
    setSelectedMissionId(missionId);

    if (isOverlayMode) {
      setIsMissionModalOpen(true);
    }
  };

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
            onClick={() => openMissionDetail(row.id)}
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
              onChange={(event) =>
                queryState.setValues({
                  q: event.target.value,
                  heroJourneyMissionsPage: "1",
                })
              }
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
              onChange={(value) =>
                queryState.setValues({
                  status: value,
                  heroJourneyMissionsPage: "1",
                })
              }
            />
            <Select
              value={queryState.values.stage}
              options={[
                { value: "all", label: t("filters.allStages") },
                { value: "Primary", label: t("stages.primary") },
                { value: "Middle", label: t("stages.middle") },
                { value: "Secondary", label: t("stages.secondary") },
              ]}
              onChange={(value) =>
                queryState.setValues({
                  stage: value,
                  heroJourneyMissionsPage: "1",
                })
              }
            />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {mobileVisibleMissions.map((mission) => (
              <button
                key={mission.id}
                type="button"
                onClick={() => openMissionDetail(mission.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">
                      {locale === "ar" ? mission.titleAr : mission.titleEn}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{mission.id}</p>
                  </div>
                  <HeroJourneyStatusPill kind="mission" value={mission.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-gray-500">{t("table.rewardXp")}</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {mission.rewardXp} XP
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-gray-500">{t("table.completionRate")}</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatHeroJourneyPercent(getMissionCompletionRate(mission))}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="truncate text-sm text-gray-600">
                    {locale === "ar" ? mission.stageNameAr : mission.stageNameEn}
                  </p>
                  <HeroJourneyBadgeThumb
                    badge={badgeMap.get(mission.badgeRewardSlug || "")}
                    showLabel
                  />
                </div>
              </button>
            ))}
          </div>

          <HeroJourneyMobilePagination
            currentPage={safeMobilePage}
            totalItems={missions.length}
            pageSize={mobilePageSize}
            onPageChange={(page) =>
              queryState.setValue("heroJourneyMissionsPage", String(page), "replace")
            }
          />

          <div className="hidden md:block">
            <DataTable
              columns={columns as unknown as Column<{ [key: string]: unknown }>[]}
              data={missions as unknown as Array<{ [key: string]: unknown }>}
              onRowClick={(row) =>
                openMissionDetail((row as unknown as HeroJourneyMission).id)
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
          </div>
        </div>

        <div className="hidden rounded-xl bg-white p-5 shadow-sm xl:block">
          <HeroJourneyMissionDetailContent
            mission={detailMission}
            badgeMap={badgeMap}
          />
        </div>
      </div>

      <Modal
        isOpen={isOverlayMode && isMissionModalOpen && Boolean(selectedMission)}
        onClose={() => setIsMissionModalOpen(false)}
        size="full"
        title={
          selectedMission
            ? locale === "ar"
              ? selectedMission.titleAr
              : selectedMission.titleEn
            : ""
        }
        description={selectedMission ? selectedMission.id : undefined}
        footer={
          selectedMission ? (
            <>
              <Button
                variant="secondary"
                onClick={() => showInfo(t("messages.editPlaceholder"))}
              >
                {t("actions.edit")}
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedMission) {
                    return;
                  }

                  setIsPublishing(selectedMission.id);
                  await toggleHeroJourneyMissionPublishState(selectedMission.id);
                  const refreshed = await getHeroJourneyMissions(filters);
                  setMissions(refreshed);
                  setIsPublishing(null);
                  showSuccess(t("messages.publishStateUpdated"));
                }}
                disabled={
                  isPublishing === selectedMission.id ||
                  !canToggleHeroJourneyMissionPublishStatus(selectedMission.status)
                }
              >
                {t("actions.togglePublish")}
              </Button>
            </>
          ) : undefined
        }
      >
        <HeroJourneyMissionDetailContent
          mission={selectedMission}
          badgeMap={badgeMap}
        />
      </Modal>
    </div>
  );
}
