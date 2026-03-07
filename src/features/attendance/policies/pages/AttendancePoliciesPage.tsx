"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "@/features/academics/components/shared/ContextBar";
import PoliciesListPanel from "../components/PoliciesListPanel";
import PolicyEditorPanel from "../components/PolicyEditorPanel";
import PoliciesKpiPanel from "../components/PoliciesKpiPanel";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  Term,
  Stage,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../services/attendancePolicyService";
import { computePolicyKpis } from "../utils/policyKpis";
import type { AttendancePolicy, PolicyFormData } from "../types";

export default function AttendancePoliciesPage() {
  const t = useTranslations("attendance.policies");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();

  // Context state
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [term, setTerm] = useState<Term | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Policies data
  const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editor state
  const [selectedPolicy, setSelectedPolicy] = useState<AttendancePolicy | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isReadOnly = termStatus === "closed";

  // Compute KPIs
  const kpis = useMemo(() => {
    if (policies.length === 0 && sections.length === 0) {
      return null;
    }
    return computePolicyKpis(policies, sections);
  }, [policies, sections]);

  // Initialize from URL
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);
          setTerm(selectedTerm);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        showError(tCommon("error_loading"));
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load structure and policies when term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId, termId]);

  const loadData = async () => {
    if (!academicYearId || !termId) return;

    try {
      // Load structure
      const structure = await fetchStructureTree(academicYearId, termId);
      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);

      // Load policies
      const policiesData = await fetchPolicies(academicYearId, termId);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError(tCommon("error_loading"));
    }
  };

  const updateURL = useCallback(
    (yearId: string, tId: string) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleAcademicYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      setTerm(defaultTerm);
      updateURL(yearId, defaultTerm.id);
    }
  };

  const handleTermChange = (tId: string) => {
    const selectedTerm = terms.find((t) => t.id === tId);
    if (selectedTerm) {
      setTermId(tId);
      setTermStatus(selectedTerm.status);
      setTerm(selectedTerm);
      updateURL(academicYearId, tId);
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
    try {
      // Add year and term IDs
      const payload = {
        ...data,
        yearId: academicYearId,
        termId: termId,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">{tCommon("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
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
        <div className="max-w-[1400px] mx-auto p-4 md:p-6">
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

      {/* Policy Editor Modal */}
      {isEditorOpen && (
        <PolicyEditorPanel
          policy={selectedPolicy}
          term={term}
          stages={stages}
          grades={grades}
          sections={sections}
          isReadOnly={isReadOnly}
          onSave={handleSavePolicy}
          onCancel={handleCancelEdit}
          onClose={handleCancelEdit}
        />
      )}
    </div>
  );
}
