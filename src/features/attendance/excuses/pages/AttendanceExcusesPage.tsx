"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Filter, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import AttendanceStatePanel from "@/features/attendance/shared/components/AttendanceStatePanel";
import AttendanceScopeHeader from "@/features/attendance/shared/components/AttendanceScopeHeader";
import AttendanceDataPanel from "@/features/attendance/shared/components/AttendanceDataPanel";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceMobileActions from "@/features/attendance/shared/components/AttendanceMobileActions";
import AttendanceDetailsCard from "@/features/attendance/shared/components/AttendanceDetailsCard";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import { isScopeSelectionComplete } from "@/features/attendance/shared/attendanceScope";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
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
  validateExcusePolicyRange,
} from "../services/attendanceExcusesService";
import { ExcusePolicyValidationError, type ExcusePolicyIssue } from "../utils/excusePolicyValidation";
import {
  resolveEffectiveExcusePolicy,
  type EffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import type { ExcuseRequest, ExcuseRequestFilters, ExcusesKpis } from "../types";
import { exportExcuses } from "../utils/excusesExport";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import ExcusesKpisBar from "../components/ExcusesKpisBar";
import ExcusesFiltersBar from "../components/ExcusesFiltersBar";
import ExcusesFiltersDrawer from "../components/ExcusesFiltersDrawer";
import ExcusesTable from "../components/ExcusesTable";
import ExcuseDetailsDrawer from "../components/ExcuseDetailsDrawer";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import DecisionModal from "../components/DecisionModal";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
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
  const termContext = useAttendanceYearTermLayoutContext();

  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

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
  const [selectedRequestPolicy, setSelectedRequestPolicy] = useState<EffectiveExcusePolicy | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

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
      setClassrooms(structure.classrooms);
    };

    loadStructure();
  }, [termContext.yearId, termContext.termId]);

  useEffect(() => {
    reloadRequests();
  }, [reloadRequests]);

  useEffect(() => {
    if (!selectedRequest || !termContext.yearId || !termContext.termId) {
      setSelectedRequestPolicy(null);
      return;
    }

    let cancelled = false;

    const loadSelectedRequestPolicy = async () => {
      try {
        const policy = await resolveEffectiveExcusePolicy(
          termContext.yearId!,
          termContext.termId!,
          selectedRequest.scopeType,
          selectedRequest.scopeIds,
          selectedRequest.dateFrom
        );

        if (!cancelled) {
          setSelectedRequestPolicy(policy);
        }
      } catch (error) {
        console.error("Failed to resolve selected request policy:", error);
        if (!cancelled) {
          setSelectedRequestPolicy(null);
        }
      }
    };

    loadSelectedRequestPolicy();

    return () => {
      cancelled = true;
    };
  }, [selectedRequest, termContext.yearId, termContext.termId]);

  // Update filters when term changes
  useEffect(() => {
    if (term) {
      setFilters((prev) => ({ ...prev, dateFrom: term.startDate, dateTo: term.endDate }));
    }
  }, [term]);


  const getPolicyIssueMessage = (issue: ExcusePolicyIssue) => {
    if (issue.code === "NO_ACTIVE_POLICY") {
      return t("messages.noActivePolicyOnDate", { date: issue.date });
    }
    if (issue.code === "REASON_REQUIRED") {
      return t("messages.reasonRequiredOnDate", { date: issue.date });
    }
    if (issue.code === "ATTACHMENT_REQUIRED") {
      return t("messages.attachmentRequiredOnDate", { date: issue.date });
    }
    return t("messages.excusesDisabledOnDate", { date: issue.date });
  };

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.yearId ||
    "";

  const selectedTermName = term
    ? locale === "ar"
      ? term.nameAr || term.name
      : term.nameEn || term.name
    : "";

  const handleLegacyExport = (format: "csv" | "excel") => {
    if (!term) return;

    exportExcuses(requests, locale, format, {
      yearName: selectedYearName,
      termName: selectedTermName || "",
      scopeName: getAttendanceScopeLabel({
        scopeType: filters.scopeType,
        scopeIds: filters.scopeIds,
        stages,
        grades,
        sections,
        classrooms,
        locale,
        schoolLabel: t("scopeSchool"),
      }),
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleExport = async (format: AttendanceExportFormat) => {
    if (!term) return;

    const scopeName = getAttendanceScopeLabel({
      scopeType: filters.scopeType,
      scopeIds: filters.scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
      schoolLabel: t("scopeSchool"),
    });

    if (format === "excel") {
      handleLegacyExport("excel");
      return;
    }

    const columns: ExportColumn[] = [
      { key: "submittedAt", label: locale === "ar" ? "تاريخ الإرسال" : "Submitted At" },
      { key: "studentNumber", label: locale === "ar" ? "رقم الطالب" : "Student Number" },
      { key: "studentName", label: locale === "ar" ? "الطالب" : "Student" },
      { key: "studentNameEn", label: locale === "ar" ? "الطالب (بالإنجليزية)" : "Student (English)" },
      { key: "studentNameAr", label: locale === "ar" ? "الطالب (بالعربية)" : "Student (Arabic)" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "range", label: locale === "ar" ? "الفترة" : "Range" },
      { key: "attachments", label: locale === "ar" ? "المرفقات" : "Attachments" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "decisionBy", label: locale === "ar" ? "اتخذ القرار بواسطة" : "Decided By" },
      { key: "decisionAt", label: locale === "ar" ? "تاريخ القرار" : "Decided At" },
    ];

    const rowsForExport = requests.map((request) => ({
      submittedAt: request.createdAt.split("T")[0],
      studentNumber: request.studentNumber || "-",
      studentName: locale === "ar" ? request.studentNameAr : request.studentNameEn,
      studentNameEn: request.studentNameEn,
      studentNameAr: request.studentNameAr,
      type: request.type,
      range: `${request.dateFrom} -> ${request.dateTo}`,
      attachments: request.attachments.length,
      status: request.status,
      decisionBy: request.decidedBy || "",
      decisionAt: request.decidedAt || "",
    }));

    exportAttendanceData({
      title: locale === "ar" ? "الأعذار" : "Excuses",
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        scopeTypeName: filters.scopeType,
        scopeName,
        dateLabel:
          filters.dateFrom && filters.dateTo
            ? `${filters.dateFrom} - ${filters.dateTo}`
            : t("allDates"),
        viewName: locale === "ar" ? "الأعذار" : "Excuses",
        exportDate: formatAttendanceExportDate(locale),
      },
      filename: generateAttendanceExportFilename(
        "attendance-excuses",
        termContext.termId || undefined,
        filters.scopeType.toLowerCase(),
      ),
      format,
      columns,
      rows: rowsForExport,
      jsonData: {
        title: "Attendance Excuses",
        metadata: {
          yearName:
            termContext.academicYears.find((item) => item.id === termContext.yearId)
              ?.nameEn || termContext.yearId || "",
          termName: term.nameEn || term.name,
          scopeTypeName: filters.scopeType,
          scopeName: getAttendanceScopeLabel({
            scopeType: filters.scopeType,
            scopeIds: filters.scopeIds,
            stages,
            grades,
            sections,
            classrooms,
            locale: "en",
            schoolLabel: "School",
          }),
          dateLabel:
            filters.dateFrom && filters.dateTo
              ? `${filters.dateFrom} - ${filters.dateTo}`
              : "All dates",
          viewName: "Excuses",
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        requests,
      },
      locale,
      emptyMessage: t("emptyStates.noRecords.description"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleSaveRequest = async (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => {
    if (!term) return;

    const policyIssue = await validateExcusePolicyRange({
      ...payload,
      yearId: termContext.yearId!,
      termId: termContext.termId!,
    });
    if (policyIssue) {
      showError(getPolicyIssueMessage(policyIssue));
      throw new Error("Validation failed");
    }

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
      if (error instanceof ExcusePolicyValidationError) {
        showError(getPolicyIssueMessage(error.issue));
      } else {
        showError(error instanceof Error ? error.message : tCommon("save_failed"));
      }
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

    setEditingRequest(null);
    setShowRequestModal(true);
  };

  const handleEditRequest = async (request: ExcuseRequest) => {
    if (isReadOnly) return;

    setEditingRequest(request);
    setShowRequestModal(true);
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

  if (!termContext.yearId || !termContext.termId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 flex items-center justify-center">
          <AttendanceStatePanel
            title={t("emptyStates.noYearTerm.title")}
            description={t("emptyStates.noYearTerm.description")}
          />
        </div>
      </div>
    );
  }

  const isScopeSelectionIncomplete = !isScopeSelectionComplete(filters.scopeType, filters.scopeIds);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0" style={{ backgroundColor: "var(--background)" }}>
        <AttendanceScopeHeader
          isReadOnly={isReadOnly}
          readOnlyMessage={t("readonlyBanner")}
          scopeType={filters.scopeType}
          scopeIds={filters.scopeIds}
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
        />
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
              <AttendanceFiltersPanel>
                <ExcusesFiltersBar
                  filters={filters}
                  stages={stages}
                  grades={grades}
                  sections={sections}
                  classrooms={classrooms}
                  onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
                  onReset={resetFilters}
                  onOpenExport={() => setShowExportModal(true)}
                />
              </AttendanceFiltersPanel>

              <AttendanceDataPanel loading={loading}>
                {isScopeSelectionIncomplete ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.selectScope.title")}
                    description={t("emptyStates.selectScope.description")}
                  />
                ) : requests.length === 0 ? (
                  <AttendanceStatePanel
                    title={t("emptyStates.noRecords.title")}
                    description={t("emptyStates.noRecords.description")}
                  />
                ) : (
                  <ExcusesTable requests={requests} grades={grades} sections={sections} classrooms={classrooms} isReadOnly={isReadOnly}
                    onView={(request) => setSelectedRequest(request)}
                    onApprove={(request) => openDecision(request, "APPROVE")}
                    onReject={(request) => openDecision(request, "REJECT")}
                    onEdit={handleEditRequest}
                    onDelete={(request) => setDeleteTarget(request)}
                  />
                )}
              </AttendanceDataPanel>
            </div>

            <AttendanceDetailsCard>
              <ExcuseDetailsDrawer
                request={selectedRequest}
                effectivePolicy={selectedRequestPolicy}
                isReadOnly={isReadOnly}
                onClose={() => setSelectedRequest(null)}
                onApprove={(request) => openDecision(request, "APPROVE")}
                onReject={(request) => openDecision(request, "REJECT")}
                onEdit={handleEditRequest}
              />
            </AttendanceDetailsCard>
          </div>
        )}

        {isMobile && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <AttendanceMobileActions columns={2}>
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
            </AttendanceMobileActions>

            <AttendanceDataPanel loading={loading}>
              {isScopeSelectionIncomplete ? (
                <AttendanceStatePanel
                  title={t("emptyStates.selectScope.title")}
                  description={t("emptyStates.selectScope.description")}
                />
              ) : requests.length === 0 ? (
                <AttendanceStatePanel
                  title={t("emptyStates.noRecords.title")}
                  description={t("emptyStates.noRecords.description")}
                />
              ) : (
                <ExcusesTable requests={requests} grades={grades} sections={sections} classrooms={classrooms} isReadOnly={isReadOnly}
                  onView={(request) => {
                    setSelectedRequest(request);
                    setShowDetailsDrawer(true);
                  }}
                  onApprove={(request) => openDecision(request, "APPROVE")}
                  onReject={(request) => openDecision(request, "REJECT")}
                  onEdit={handleEditRequest}
                  onDelete={(request) => setDeleteTarget(request)}
                />
              )}
            </AttendanceDataPanel>
          </div>
        )}
      </div>

      <ExcusesFiltersDrawer
        isOpen={showFiltersDrawer}
        filters={filters}
        stages={stages}
        grades={grades}
        sections={sections}
        classrooms={classrooms}
        onClose={() => setShowFiltersDrawer(false)}
        onApply={() => setShowFiltersDrawer(false)}
        onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={resetFilters}
        onOpenExport={() => setShowExportModal(true)}
      />

      <AttendanceBottomDrawer isOpen={showDetailsDrawer} onClose={() => setShowDetailsDrawer(false)} heightClassName="h-[85vh]">
        <ExcuseDetailsDrawer
          request={selectedRequest}
          effectivePolicy={selectedRequestPolicy}
          isReadOnly={isReadOnly}
          onClose={() => setShowDetailsDrawer(false)}
          onApprove={(request) => openDecision(request, "APPROVE")}
          onReject={(request) => openDecision(request, "REJECT")}
          onEdit={(request) => {
            setEditingRequest(request);
            setShowRequestModal(true);
          }}
        />
      </AttendanceBottomDrawer>

      <ExcuseRequestModal
        isOpen={showRequestModal}
        isReadOnly={isReadOnly}
        yearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termRange={{ startDate: term?.startDate || "", endDate: term?.endDate || "" }}
        stages={stages}
        grades={grades}
        sections={sections}
        classrooms={classrooms}
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

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={requests.length}
        emptyStateMessage={t("emptyStates.noRecords.description")}
      />
    </div>
  );
}








