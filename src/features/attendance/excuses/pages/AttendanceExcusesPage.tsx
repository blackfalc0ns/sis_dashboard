"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Drawer, useMediaQuery } from "@mui/material";
import { AlertCircle, Filter, Plus } from "lucide-react";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
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
import {
  resolveEffectiveExcusePolicy,
  type EffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import type { ExcuseRequest, ExcuseRequestFilters, ExcusesKpis } from "../types";
import { exportExcuses } from "../utils/excusesExport";
import ExcusesKpisBar from "../components/ExcusesKpisBar";
import ExcusesFiltersBar from "../components/ExcusesFiltersBar";
import ExcusesFiltersDrawer from "../components/ExcusesFiltersDrawer";
import ExcusesTable from "../components/ExcusesTable";
import ExcuseDetailsDrawer from "../components/ExcuseDetailsDrawer";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import DecisionModal from "../components/DecisionModal";
import ScopeBreadcrumb from "../../components/ScopeBreadcrumb";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import MainLoader from "@/components/ui/loaders/MainLoader";

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
  const { showSuccess, showError } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceTermContext();

  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [requests, setRequests] = useState<ExcuseRequest[]>([]);
  const [loading, setLoading] = useState(false);

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
  const [requestPolicy, setRequestPolicy] = useState<EffectiveExcusePolicy | null>(null);

  const isReadOnly = termContext.isReadOnly;
  const kpis = useMemo(() => computeKpis(requests), [requests]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  const reloadRequests = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;

    setLoading(true);
    try {
      const data = await fetchExcuseRequests({ yearId: termContext.yearId, termId: termContext.termId, ...filters });
      setRequests(data);

      // Update selected request if it exists in the new list
      setSelectedRequest((prev) => {
        if (!prev) return null;
        return data.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      console.error("Failed to load excuse requests", error);
      showError(tCommon("error_loading"));
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, filters, showError, tCommon]);

  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;

    const loadStructure = async () => {
      const structure = await fetchStructureTree(termContext.yearId!, termContext.termId!);

      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  useEffect(() => {
    reloadRequests();
  }, [reloadRequests]);

  // Update filters when term changes
  useEffect(() => {
    if (term) {
      setFilters((prev) => ({ ...prev, dateFrom: term.startDate, dateTo: term.endDate }));
    }
  }, [term]);

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
      yearName: termContext.yearId || "",
      termName: locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name,
      scopeName: getScopeLabel(),
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleSaveRequest = async (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => {
    if (!term) return;

    const effectivePolicy = await resolveRequestPolicy(
      termContext.yearId!,
      termContext.termId!,
      payload.scopeType,
      payload.scopeIds,
      payload.dateFrom
    );

    const errors = await validateExcuseRequest(
      {
        ...payload,
        yearId: termContext.yearId!,
        termId: termContext.termId!,
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
        yearId: termContext.yearId!,
        termId: termContext.termId!,
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

  const handleCreateRequest = async () => {
    if (isReadOnly) return;

    try {
      // Use current filters for scope and date
      const dateISO = filters.dateFrom || term?.startDate || new Date().toISOString().split('T')[0];
      
      const policy = await resolveEffectiveExcusePolicy(
        termContext.yearId!,
        termContext.termId!,
        filters.scopeType,
        filters.scopeIds,
        dateISO
      );

      if (!policy.allowExcuses) {
        showError(t("messages.excusesDisabledByPolicy"));
        return;
      }

      setRequestPolicy(policy);
      setEditingRequest(null);
      setShowRequestModal(true);
    } catch (error) {
      console.error("Failed to resolve excuse policy:", error);
      showError(tCommon("error_loading"));
    }
  };

  const handleEditRequest = async (request: ExcuseRequest) => {
    if (isReadOnly) return;

    try {
      const policy = await resolveEffectiveExcusePolicy(
        termContext.yearId!,
        termContext.termId!,
        request.scopeType,
        request.scopeIds,
        request.dateFrom
      );

      if (!policy.allowExcuses) {
        showError(t("messages.excusesDisabledByPolicy"));
        return;
      }

      setRequestPolicy(policy);
      setEditingRequest(request);
      setShowRequestModal(true);
    } catch (error) {
      console.error("Failed to resolve excuse policy:", error);
      showError(tCommon("error_loading"));
    }
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

  if (termContext.isLoading) {
    return (
      <MainLoader />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ContextBar
        academicYearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termStatus={termContext.termStatus || "open"}
        onAcademicYearChange={termContext.setYearId}
        onTermChange={termContext.setTermId}
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
                {(
                    
                      <ScopeBreadcrumb
                        scopeType={filters.scopeType}
                        scopeIds={filters.scopeIds}
                        stages={stages}
                        grades={grades}
                        sections={sections}
                      />
                   
                  )}
          <div>
          <ExcusesKpisBar kpis={kpis} />
          </div>
          {!isMobile && (
            <div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              disabled={isReadOnly}
              onClick={handleCreateRequest}
            >
              {t("createRequest")}
            </Button>
            </div>
          )}

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
                  <div className="h-full flex items-center justify-center py-4"><PartialLoader/></div>
                ) : (
                  <ExcusesTable requests={requests} grades={grades} sections={sections} isReadOnly={isReadOnly}
                    onView={(request) => setSelectedRequest(request)}
                    onApprove={(request) => openDecision(request, "APPROVE")}
                    onReject={(request) => openDecision(request, "REJECT")}
                    onEdit={handleEditRequest}
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
                onEdit={handleEditRequest}
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
                onClick={handleCreateRequest}
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
                onEdit={handleEditRequest}
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
        termId={termContext.termId || ""}
        termRange={{ startDate: term?.startDate || "", endDate: term?.endDate || "" }}
        stages={stages}
        grades={grades}
        sections={sections}
        effectivePolicy={requestPolicy}
        initialRequest={editingRequest}
        onClose={() => {
          setShowRequestModal(false);
          setEditingRequest(null);
          setRequestPolicy(null);
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

