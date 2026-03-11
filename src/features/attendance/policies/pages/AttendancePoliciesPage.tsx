"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import PoliciesListPanel from "../components/PoliciesListPanel";
import PolicyWizardDialog from "../components/PolicyWizardDialog";
import PoliciesKpiPanel from "../components/PoliciesKpiPanel";
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../services/attendancePolicyService";
import { computePolicyKpis } from "../utils/policyKpis";
import type { AttendancePolicy, PolicyFormData } from "../types";
import MainLoader from "@/components/ui/loaders/MainLoader";

export default function AttendancePoliciesPage() {
  const t = useTranslations("attendance.policies");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();

  // Use unified term context
  const termContext = useAttendanceTermContext();

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Policies data
  const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Editor state
  const [selectedPolicy, setSelectedPolicy] = useState<AttendancePolicy | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isReadOnly = termContext.isReadOnly;

  // Compute KPIs
  const kpis = useMemo(() => {
    if (policies.length === 0 && sections.length === 0) {
      return null;
    }
    return computePolicyKpis(policies, sections);
  }, [policies, sections]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  // Load structure and policies when term changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termContext.yearId, termContext.termId]);

  const loadData = async () => {
    if (!termContext.yearId || !termContext.termId) return;

    try {
      setIsLoading(true);
      // Load structure
      const structure = await fetchStructureTree(termContext.yearId, termContext.termId);
      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);

      // Load policies
      const policiesData = await fetchPolicies(termContext.yearId, termContext.termId);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError(tCommon("error_loading"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setIsEditorOpen(true);
  };

  const handleEditPolicy = (policy: AttendancePolicy) => {
    setSelectedPolicy(policy);
    setIsEditorOpen(true);
  };

  const handleSavePolicy = async (data: PolicyFormData) => {
    if (!termContext.yearId || !termContext.termId) return;

    try {
      // Add year and term IDs
      const payload = {
        ...data,
        yearId: termContext.yearId,
        termId: termContext.termId,
      };

      if (selectedPolicy) {
        // Update existing policy
        await updatePolicy(selectedPolicy.id, payload);
        showSuccess(t("policyUpdated"));
      } else {
        // Create new policy
        await createPolicy(payload);
        showSuccess(t("policyCreated"));
      }

      // Reload policies
      await loadData();

      // Close editor
      setIsEditorOpen(false);
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Failed to save policy:", error);
      showError(tCommon("error_saving"));
      throw error;
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId);
      showSuccess(t("policyDeleted"));
      await loadData();
    } catch (error) {
      console.error("Failed to delete policy:", error);
      showError(tCommon("error_deleting"));
      throw error;
    }
  };

  const handleToggleActive = async (policyId: string, isActive: boolean) => {
    try {
      await updatePolicy(policyId, { isActive });
      showSuccess(isActive ? t("policyActivated") : t("policyDeactivated"));
      await loadData();
    } catch (error) {
      console.error("Failed to toggle policy status:", error);
      showError(tCommon("error_saving"));
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setSelectedPolicy(null);
  };

  if (termContext.isLoading || isLoading) {
    return <MainLoader />;
  }

  return (
    <div style={{ backgroundColor: "var(--color-neutral-50)" }} className="flex flex-col">
      {/* Context Bar */}
      <ContextBar
        academicYearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termStatus={termContext.termStatus || "open"}
        onAcademicYearChange={termContext.setYearId}
        onTermChange={termContext.setTermId}
        onPromoteCarryOver={() => {}}
        isReadOnly={isReadOnly}
        showPromoteCarryOver={false}
      />

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner")}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          {/* KPI Panel */}
          <PoliciesKpiPanel kpis={kpis} isLoading={false} />

          {/* Policies List */}
          <PoliciesListPanel
            policies={policies}
            stages={stages}
            grades={grades}
            sections={sections}
            isReadOnly={isReadOnly}
            onCreatePolicy={handleCreatePolicy}
            onEditPolicy={handleEditPolicy}
            onDeletePolicy={handleDeletePolicy}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>

      {/* Policy Wizard Dialog */}
      {isEditorOpen && (
        <PolicyWizardDialog
          isOpen={isEditorOpen}
          policy={selectedPolicy}
          term={term}
          stages={stages}
          grades={grades}
          sections={sections}
          isReadOnly={isReadOnly}
          onSave={handleSavePolicy}
          onClose={handleCancelEdit}
        />
      )}
    </div>
  );
}
