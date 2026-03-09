"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Drawer, useMediaQuery } from "@mui/material";
import { AlertCircle, Filter, Plus } from "lucide-react";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import {
  fetchExcuseRequests,
  createExcuseRequest,
  updateExcuseRequest,
  deleteExcuseRequest,
  approveExcuseRequest,
  rejectExcuseRequest,
  validateExcuseRequest,
  resolveRequestPolicy,
} from "../services/attendanceExcusesService";
import type { ExcuseRequest, ExcuseRequestFilters, ExcusesKpis } from "../types";
import { exportExcuses } from "../utils/excusesExport";
import ExcusesKpisBar from "../components/ExcusesKpisBar";
import ExcusesFiltersBar from "../components/ExcusesFiltersBar";
import ExcusesFiltersDrawer from "../components/ExcusesFiltersDrawer";
import ExcusesTable from "../components/ExcusesTable";
import ExcuseDetailsDrawer from "../components/ExcuseDetailsDrawer";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import DecisionModal from "../components/DecisionModal";

function computeKpis(requests: ExcuseRequest[]): ExcusesKpis {
  return {
    total: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
    withAttachments: requests.filter((request) => request.attachments.length > 0).length,
  };
}

export default function AttendanceExcusesPage() {
  const t = useTranslations("attendance.excuses");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [term, setTerm] = useState<Term | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);

  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [periods, setPeriods] = useState<Array<{ index: number; nameAr: string; nameEn: string }>>([]);

  const [requests, setRequests] = useState<ExcuseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<ExcuseRequestFilters>({
    scopeType: "SCHOOL",
    scopeIds: {},
    status: "ALL",
    type: "ALL",
    search: "",
    hasAttachment: "ALL",
  });

  const [selectedRequest, setSelectedRequest] = useState<ExcuseRequest | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ExcuseRequest | null>(null);
  const [decisionRequest, setDecisionRequest] = useState<ExcuseRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [deleteTarget, setDeleteTarget] = useState<ExcuseRequest | null>(null);

  const isReadOnly = termStatus === "closed";
  const kpis = useMemo(() => computeKpis(requests), [requests]);

  const reloadRequests = useCallback(async () => {
    if (!academicYearId || !termId) return;

    setLoading(true);
    try {
      const data = await fetchExcuseRequests({ yearId: academicYearId, termId, ...filters });
      setRequests(data);

      if (selectedRequest) {
        const nextSelected = data.find((item) => item.id === selectedRequest.id) || null;
        setSelectedRequest(nextSelected);
      }
    } catch (error) {
      console.error("Failed to load excuse requests", error);
      showError(tCommon("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [academicYearId, filters, selectedRequest, showError, tCommon, termId]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const years = await fetchAcademicYears();
        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");
        const selectedYear = years.find((item) => item.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        const selectedTerm = yearTerms.find((item) => item.id === urlTerm) || yearTerms.find((item) => item.status === "open") || yearTerms[0];
        if (!selectedTerm) return;

        setAcademicYearId(selectedYear.id);
        setTermId(selectedTerm.id);
        setTermStatus(selectedTerm.status);
        setTerm(selectedTerm);

        setFilters((prev) => ({ ...prev, dateFrom: selectedTerm.startDate, dateTo: selectedTerm.endDate }));

        const params = new URLSearchParams();
        params.set("year", selectedYear.id);
        params.set("term", selectedTerm.id);
        router.replace(`?${params.toString()}`, { scroll: false });
      } catch (error) {
        console.error("Failed to initialize excuses page", error);
        showError(tCommon("error_loading"));
      } finally {
        setLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadStructure = async () => {
      const [structure, timetable] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchTimetableConfig(termId, "TERM"),
      ]);

      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);
      setPeriods(timetable?.periods || []);
    };

    loadStructure();
  }, [academicYearId, termId]);

  useEffect(() => {
    reloadRequests();
  }, [reloadRequests]);

  const updateURL = useCallback(
    (yearId: string, nextTermId: string) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", nextTermId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);
    const nextTerm = yearTerms.find((item) => item.status === "open") || yearTerms[0];
    if (!nextTerm) return;

    setTermId(nextTerm.id);
    setTermStatus(nextTerm.status);
    setTerm(nextTerm);
    setFilters((prev) => ({ ...prev, dateFrom: nextTerm.startDate, dateTo: nextTerm.endDate }));
    updateURL(yearId, nextTerm.id);
  };

  const handleTermChange = (nextTermId: string) => {
    const nextTerm = terms.find((item) => item.id === nextTermId);
    if (!nextTerm) return;

    setTermId(nextTermId);
    setTermStatus(nextTerm.status);
    setTerm(nextTerm);
    setFilters((prev) => ({ ...prev, dateFrom: nextTerm.startDate, dateTo: nextTerm.endDate }));
    updateURL(academicYearId, nextTermId);
  };

  const getScopeLabel = () => {
    if (filters.scopeType === "SCHOOL") return t("scopeSchool");
    if (filters.scopeType === "STAGE") {
      const stage = stages.find((item) => item.id === filters.scopeIds?.stageId);
      return (locale === "ar" ? stage?.nameAr : stage?.nameEn) || "-";
    }
    if (filters.scopeType === "GRADE") {
      const grade = grades.find((item) => item.id === filters.scopeIds?.gradeId);
      return (locale === "ar" ? grade?.nameAr : grade?.nameEn) || "-";
    }

    const section = sections.find((item) => item.id === filters.scopeIds?.sectionId);
    return (locale === "ar" ? section?.nameAr : section?.nameEn) || "-";
  };

  const handleExport = (format: "csv" | "excel") => {
    if (!term) return;

    exportExcuses(requests, locale, format, {
      yearName: academicYearId,
      termName: locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name,
      scopeName: getScopeLabel(),
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleSaveRequest = async (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => {
    if (!term) return;

    const effectivePolicy = await resolveRequestPolicy(
      academicYearId,
      termId,
      payload.scopeType,
      payload.scopeIds,
      payload.dateFrom
    );

    const errors = await validateExcuseRequest(
      {
        ...payload,
        yearId: academicYearId,
        termId,
      },
      effectivePolicy,
      { startDate: term.startDate, endDate: term.endDate }
    );

    if (Object.keys(errors).length > 0) {
      showError(Object.values(errors)[0]);
      throw new Error("Validation failed");
    }

    if (editingRequest) {
      await updateExcuseRequest(editingRequest.id, payload);
      showSuccess(t("updated"));
    } else {
      await createExcuseRequest({
        ...payload,
        yearId: academicYearId,
        termId,
      });
      showSuccess(t("created"));
    }

    setEditingRequest(null);
    await reloadRequests();
  };

  const handleApproveReject = async (note: string) => {
    if (!decisionRequest) return;

    try {
      if (decisionAction === "APPROVE") {
        await approveExcuseRequest(decisionRequest.id, note, "Attendance Admin");
        showSuccess(t("approved"));
      } else {
        await rejectExcuseRequest(decisionRequest.id, note, "Attendance Admin");
        showSuccess(t("rejected"));
      }

      setDecisionRequest(null);
      await reloadRequests();
    } catch (error) {
      console.error("Decision failed", error);
      showError(error instanceof Error ? error.message : tCommon("save_failed"));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteExcuseRequest(deleteTarget.id);
      showSuccess(t("deleted"));
      setDeleteTarget(null);
      await reloadRequests();
    } catch (error) {
      showError(error instanceof Error ? error.message : tCommon("error_deleting"));
    }
  };

  const openDecision = (request: ExcuseRequest, action: "APPROVE" | "REJECT") => {
    setDecisionRequest(request);
    setDecisionAction(action);
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
      scopeType: "SCHOOL",
      scopeIds: {},
      status: "ALL",
      type: "ALL",
      search: "",
      hasAttachment: "ALL",
    });
  };

  if (loading && !term) {
    return <div className="h-screen flex items-center justify-center">{tCommon("loading")}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleYearChange}
        onTermChange={handleTermChange}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {isReadOnly && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: "var(--color-warning-50)", color: "var(--color-warning-800)", borderBottom: "1px solid var(--color-warning-200)" }}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{t("readonlyBanner")}</span>
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex items-center justify-between">
          <ExcusesKpisBar kpis={kpis} />
          {!isMobile && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              disabled={isReadOnly}
              onClick={() => {
                setEditingRequest(null);
                setShowRequestModal(true);
              }}
            >
              {t("createRequest")}
            </Button>
          )}
        </div>

        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 min-h-0 flex-1">
            <div className="col-span-8 min-h-0 flex flex-col gap-4">
              <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
                <ExcusesFiltersBar
                  filters={filters}
                  stages={stages}
                  grades={grades}
                  sections={sections}
                  onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
                  onReset={resetFilters}
                  onExport={handleExport}
                />
              </div>

              <div className="rounded-xl border overflow-hidden min-h-0" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
                {loading ? (
                  <div className="h-full flex items-center justify-center">{tCommon("loading")}</div>
                ) : (
                  <ExcusesTable requests={requests} grades={grades} sections={sections} isReadOnly={isReadOnly}
                    onView={(request) => setSelectedRequest(request)}
                    onApprove={(request) => openDecision(request, "APPROVE")}
                    onReject={(request) => openDecision(request, "REJECT")}
                    onEdit={(request) => {
                      setEditingRequest(request);
                      setShowRequestModal(true);
                    }}
                    onDelete={(request) => setDeleteTarget(request)}
                  />
                )}
              </div>
            </div>

            <div className="col-span-4 min-h-0 rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
              <ExcuseDetailsDrawer
                request={selectedRequest}
                isReadOnly={isReadOnly}
                onClose={() => setSelectedRequest(null)}
                onApprove={(request) => openDecision(request, "APPROVE")}
                onReject={(request) => openDecision(request, "REJECT")}
                onEdit={(request) => {
                  setEditingRequest(request);
                  setShowRequestModal(true);
                }}
              />
            </div>
          </div>
        )}

        {isMobile && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} onClick={() => setShowFiltersDrawer(true)}>
                {t("filters.filters")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={isReadOnly}
                onClick={() => {
                  setEditingRequest(null);
                  setShowRequestModal(true);
                }}
              >
                {t("createRequest")}
              </Button>
            </div>

            <div className="rounded-xl border overflow-hidden min-h-0" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}>
              <ExcusesTable requests={requests} grades={grades} sections={sections} isReadOnly={isReadOnly}
                onView={(request) => {
                  setSelectedRequest(request);
                  setShowDetailsDrawer(true);
                }}
                onApprove={(request) => openDecision(request, "APPROVE")}
                onReject={(request) => openDecision(request, "REJECT")}
                onEdit={(request) => {
                  setEditingRequest(request);
                  setShowRequestModal(true);
                }}
                onDelete={(request) => setDeleteTarget(request)}
              />
            </div>
          </div>
        )}
      </div>

      <ExcusesFiltersDrawer
        isOpen={showFiltersDrawer}
        filters={filters}
        stages={stages}
        grades={grades}
        sections={sections}
        onClose={() => setShowFiltersDrawer(false)}
        onApply={() => setShowFiltersDrawer(false)}
        onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={resetFilters}
        onExport={handleExport}
      />

      <Drawer anchor="bottom" open={showDetailsDrawer} onClose={() => setShowDetailsDrawer(false)}>
        <div className="h-[85vh]">
          <ExcuseDetailsDrawer
            request={selectedRequest}
            isReadOnly={isReadOnly}
            onClose={() => setShowDetailsDrawer(false)}
            onApprove={(request) => openDecision(request, "APPROVE")}
            onReject={(request) => openDecision(request, "REJECT")}
            onEdit={(request) => {
              setEditingRequest(request);
              setShowRequestModal(true);
            }}
          />
        </div>
      </Drawer>

      <ExcuseRequestModal
        isOpen={showRequestModal}
        isReadOnly={isReadOnly}
        termRange={{ startDate: term?.startDate || "", endDate: term?.endDate || "" }}
        stages={stages}
        grades={grades}
        sections={sections}
        periods={periods}
        requireAttachment={false}
        initialRequest={editingRequest}
        onClose={() => {
          setShowRequestModal(false);
          setEditingRequest(null);
        }}
        onSave={handleSaveRequest}
      />

      <DecisionModal
        isOpen={!!decisionRequest}
        request={decisionRequest}
        action={decisionAction}
        onClose={() => setDecisionRequest(null)}
        onConfirm={handleApproveReject}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        severity="danger"
      />
    </div>
  );
}

