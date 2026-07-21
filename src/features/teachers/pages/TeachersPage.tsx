"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Users } from "lucide-react";
import { useDebounce } from "use-debounce";
import { AccessDenied, Button, EmptyState } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import CreateTeacherDialog from "@/features/teachers/components/CreateTeacherDialog";
import RehireTeacherDialog from "@/features/teachers/components/RehireTeacherDialog";
import TeacherFilterBar, { type TeacherFilterValues } from "@/features/teachers/components/TeacherFilterBar";
import TeacherListTable from "@/features/teachers/components/TeacherListTable";
import { useTeacherActions } from "@/features/teachers/hooks/useTeacherActions";
import { useTeacherList } from "@/features/teachers/hooks/useTeacherList";
import type { CreateTeacherRequest, RehireTeacherRequest, TeacherListQuery } from "@/features/teachers/types/index";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { usePermissions } from "@/hooks/usePermissions";

const defaults: TeacherFilterValues & { page: string; limit: string } = {
  search: "",
  employmentStatus: "",
  accountStatus: "",
  membershipStatus: "",
  gender: "",
  profileCompleteness: "",
  page: "1",
  limit: "20",
};

const allowedValues = {
  employmentStatus: ["", "ACTIVE", "INACTIVE", "TERMINATED"],
  accountStatus: ["", "ACTIVE", "INVITED", "SUSPENDED", "DISABLED"],
  membershipStatus: ["", "ACTIVE", "INACTIVE", "TRANSFERRED", "SUSPENDED"],
  gender: ["", "MALE", "FEMALE"],
  profileCompleteness: ["", "complete", "incomplete"],
};

function normalizeQuery(values: typeof defaults) {
  const normalized: Partial<Record<keyof typeof defaults, string | null>> = {};
  for (const key of Object.keys(allowedValues) as Array<keyof typeof allowedValues>) {
    if (!allowedValues[key].includes(values[key])) normalized[key] = null;
  }
  if (!/^\d+$/.test(values.page) || Number(values.page) < 1) normalized.page = null;
  if (!["10", "20", "50", "100"].includes(values.limit)) normalized.limit = null;
  return Object.keys(normalized).length ? normalized : null;
}

function teacherQuery(values: typeof defaults, debouncedSearch: string): TeacherListQuery {
  return {
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(values.employmentStatus ? { employmentStatus: values.employmentStatus as TeacherListQuery["employmentStatus"] } : {}),
    ...(values.accountStatus ? { accountStatus: values.accountStatus as TeacherListQuery["accountStatus"] } : {}),
    ...(values.membershipStatus ? { membershipStatus: values.membershipStatus as TeacherListQuery["membershipStatus"] } : {}),
    ...(values.gender ? { gender: values.gender as TeacherListQuery["gender"] } : {}),
    ...(values.profileCompleteness ? { profileCompleteness: values.profileCompleteness as TeacherListQuery["profileCompleteness"] } : {}),
    page: Number(values.page),
    limit: Number(values.limit),
  };
}

export default function TeachersPage() {
  const locale = useLocale();
  const t = useTranslations("teachers");
  const router = useRouter();
  const { showSuccess } = useToast();
  const permissions = usePermissions();
  const canView = permissions.hasPermission("teachers.records.view");
  const canManage = permissions.hasPermission("teachers.records.manage");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showRehire, setShowRehire] = useState(false);
  const { values, setValues, reset } = useUrlQueryState<typeof defaults>({
    defaults,
    debouncedKeys: ["search"],
    modeByKey: { search: "replace" },
    normalize: normalizeQuery,
    debounceMs: 300,
  });
  const [debouncedSearch] = useDebounce(values.search, 300);
  const query = useMemo(() => teacherQuery(values, debouncedSearch), [debouncedSearch, values]);
  const teachers = useTeacherList(query, permissions.isPermissionsReady && canView);
  const actions = useTeacherActions();

  if (permissions.isLoading) return <MainLoader />;
  if (!canView) return <AccessDenied />;

  const filterValues: TeacherFilterValues = {
    search: values.search,
    employmentStatus: values.employmentStatus,
    accountStatus: values.accountStatus,
    membershipStatus: values.membershipStatus,
    gender: values.gender,
    profileCompleteness: values.profileCompleteness,
  };
  const changeFilter = (key: keyof TeacherFilterValues, nextValue: string) =>
    setValues({ [key]: nextValue, page: "1" }, key === "search" ? "replace" : "push");
  const openTeacher = (teacherId: string) => router.push(`/${locale}/teachers/${teacherId}`);
  const createTeacher = async (input: CreateTeacherRequest) => {
    await actions.createTeacher(input);
    await teachers.refresh();
    setShowCreate(false);
    showSuccess(t("messages.create_success"));
  };
  const rehireTeacher = async (teacherId: string, input: RehireTeacherRequest) => {
    await actions.rehireTeacher(teacherId, input);
    await teachers.refresh();
    setShowRehire(false);
    showSuccess(t("rehire.success"));
  };

  return (
    <main className="min-h-0 flex-1 overflow-x-hidden p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1><p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p></div>
          {canManage ? <div className="flex flex-wrap gap-2"><Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setShowRehire(true)}>{t("actions.rehire")}</Button><Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t("actions.add_teacher")}</Button></div> : null}
        </div>
        <TeacherFilterBar values={filterValues} showFilters={showFilters} onToggleFilters={() => setShowFilters((visible) => !visible)} onChange={changeFilter} onClear={() => reset(undefined, "replace")} labels={{ search: t("filters.search_placeholder"), filters: t("filters.title"), clear: t("filters.clear"), employment: t("filters.employment"), account: t("filters.account"), membership: t("filters.membership"), gender: t("filters.gender"), completeness: t("filters.completeness"), all: t("filters.all"), active: t("statuses.active"), inactive: t("statuses.inactive"), terminated: t("statuses.terminated"), invited: t("statuses.invited"), suspended: t("statuses.suspended"), disabled: t("statuses.disabled"), transferred: t("statuses.transferred"), male: t("gender.male"), female: t("gender.female"), complete: t("completeness.complete"), incomplete: t("completeness.incomplete") }} />
        {teachers.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5"><p className="text-sm text-red-700">{t("messages.load_failed")}</p><Button className="mt-3" variant="secondary" onClick={() => void teachers.refresh()}>{t("states.retry")}</Button></div> : null}
        {!teachers.error && !teachers.isLoading && teachers.response?.items.length === 0 ? <EmptyState icon={<Users className="h-12 w-12" />} title={values.search || Object.values(filterValues).some(Boolean) ? t("empty.filtered_title") : t("empty.title")} message={values.search || Object.values(filterValues).some(Boolean) ? t("empty.filtered_description") : t("empty.description")} /> : null}
        {!teachers.error && (teachers.isLoading || teachers.response?.items.length) ? <TeacherListTable teachers={teachers.response?.items ?? []} page={Number(values.page)} pageSize={Number(values.limit)} total={teachers.response?.pagination.total ?? 0} isLoading={teachers.isLoading || teachers.isRefreshing} searchQuery={debouncedSearch} canManage={canManage} onPageChange={(page) => setValues({ page: String(page) })} onPageSizeChange={(limit) => setValues({ limit: String(limit), page: "1" })} onView={(teacher) => openTeacher(teacher.id)} onEdit={(teacher) => openTeacher(teacher.id)} /> : null}
      </div>
      {showCreate ? <CreateTeacherDialog isOpen isSubmitting={actions.activeAction === "create"} onClose={() => setShowCreate(false)} onSubmit={createTeacher} /> : null}
      {showRehire ? <RehireTeacherDialog isOpen isSubmitting={actions.activeAction === "rehire"} onClose={() => setShowRehire(false)} onSubmit={rehireTeacher} /> : null}
    </main>
  );
}
