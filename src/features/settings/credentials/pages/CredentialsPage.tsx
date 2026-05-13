"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCcw, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { FilterPanel } from "@/components/ui";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import {
  fetchSettingsRoles,
} from "@/features/settings/services/settingsRolesService";
import {
  fetchCredentialStatuses,
  generateBulkCredentials,
  generateUserCredential,
  previewBulkCredentials,
  regenerateUserCredential,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import BulkGenerateCredentialsModal from "@/features/settings/credentials/components/BulkGenerateCredentialsModal";
import CredentialStatusTable from "@/features/settings/credentials/components/CredentialStatusTable";
import GenerateCredentialModal from "@/features/settings/credentials/components/GenerateCredentialModal";
import SetPasswordModal from "@/features/settings/credentials/components/SetPasswordModal";
import TemporaryPasswordRevealModal, {
  type RevealedCredential,
} from "@/features/settings/credentials/components/TemporaryPasswordRevealModal";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
  CredentialStatusRecord,
  FetchCredentialStatusParams,
} from "@/features/settings/credentials/types";
import type { RoleDefinition, UserAdminStatus } from "@/features/settings/types";

type GenerateModalMode = "generate" | "regenerate";

export default function CredentialsPage() {
  const t = useTranslations("settings.credentials");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const canManage = hasPermission("settings.users.manage");
  const [records, setRecords] = useState<CredentialStatusRecord[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<UserAdminStatus | "all">(
    "all",
  );
  const [hasPasswordFilter, setHasPasswordFilter] = useState("all");
  const [mustChangePasswordFilter, setMustChangePasswordFilter] =
    useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] =
    useState<CredentialStatusRecord | null>(null);
  const [generateMode, setGenerateMode] = useState<GenerateModalMode | null>(
    null,
  );
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPreview, setBulkPreview] =
    useState<BulkCredentialPreviewResponse | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkPreviewing, setIsBulkPreviewing] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [revealedCredentials, setRevealedCredentials] = useState<
    RevealedCredential[]
  >([]);

  const hasActiveFilters = useMemo(
    () =>
      search.trim() ||
      roleFilter !== "all" ||
      statusFilter !== "all" ||
      hasPasswordFilter !== "all" ||
      mustChangePasswordFilter !== "all",
    [
      hasPasswordFilter,
      mustChangePasswordFilter,
      roleFilter,
      search,
      statusFilter,
    ],
  );

  const buildFetchParams = useCallback(
    (): FetchCredentialStatusParams => {
      const credentialStatus =
        mustChangePasswordFilter === "yes"
          ? "must_change"
          : hasPasswordFilter === "yes"
            ? "set"
            : hasPasswordFilter === "no"
              ? "missing"
              : undefined;

      return {
        search,
        page,
        limit,
        roleKey: roleFilter === "all" ? undefined : roleFilter,
        credentialStatus,
      };
    },
    [
      hasPasswordFilter,
      limit,
      mustChangePasswordFilter,
      page,
      roleFilter,
      search,
    ],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }
      setPageError(null);
      try {
        const [statusResult, rolesResult] = await Promise.all([
          fetchCredentialStatuses(buildFetchParams()),
          fetchSettingsRoles(),
        ]);
        setRecords(statusResult.items);
        setTotal(statusResult.pagination?.total || statusResult.items.length);
        setPage(statusResult.pagination?.page || page);
        setLimit(statusResult.pagination?.limit || limit);
        setRoles(rolesResult.items);
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t("messages.load_failed");
        setPageError(message);
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [buildFetchParams, limit, page, showError, t],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setPage(1);
  }, [hasPasswordFilter, mustChangePasswordFilter, roleFilter, search, statusFilter]);

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters, showFilters]);

  const enrichCredential = (
    credential: RevealedCredential,
  ): RevealedCredential => {
    const record = records.find((item) => item.userId === credential.userId);
    return {
      ...credential,
      fullName: record?.fullName,
      username: record?.username ?? credential.username,
      loginEmail: record?.loginEmail || record?.email || credential.loginEmail,
    };
  };

  const handleSingleGenerate = async (mustChangePassword: boolean) => {
    if (!selectedUser || !generateMode) {
      return;
    }
    setIsSingleSubmitting(true);
    try {
      const credential =
        generateMode === "generate"
          ? await generateUserCredential(selectedUser.userId, {
              mustChangePassword,
            })
          : await regenerateUserCredential(selectedUser.userId, {
              mustChangePassword,
            });
      setRevealedCredentials([enrichCredential(credential)]);
      setGenerateMode(null);
      setSelectedUser(null);
      await hydrate("refresh");
      showSuccess(t("messages.generated"));
    } catch (error) {
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  const handleSetPassword = async (
    password: string,
    mustChangePassword: boolean,
  ) => {
    if (!selectedUser) {
      return;
    }
    setIsSingleSubmitting(true);
    setSetPasswordError(null);
    try {
      await setUserCredentialPassword(selectedUser.userId, {
        password,
        forceResetOnLogin: mustChangePassword,
      });
      setIsSetPasswordOpen(false);
      setSelectedUser(null);
      await hydrate("refresh");
      showSuccess(t("messages.password_set"));
    } catch (error) {
      const message = isApiError(error) ? error.message : tCommon("save_failed");
      setSetPasswordError(message);
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  const handleBulkPreview = async (payload: BulkCredentialPreviewRequest) => {
    setIsBulkPreviewing(true);
    setBulkError(null);
    try {
      const response = await previewBulkCredentials(payload);
      setBulkPreview(response);
    } catch (error) {
      setBulkError(isApiError(error) ? error.message : t("messages.preview_failed"));
    } finally {
      setIsBulkPreviewing(false);
    }
  };

  const handleBulkGenerate = async (payload: BulkCredentialPreviewRequest) => {
    setIsBulkGenerating(true);
    setBulkError(null);
    try {
      const response = await generateBulkCredentials(payload);
      setRevealedCredentials(response.credentials.map(enrichCredential));
      setBulkPreview(null);
      setIsBulkOpen(false);
      await hydrate("refresh");
      showSuccess(t("messages.bulk_generated"));
    } catch (error) {
      setBulkError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setHasPasswordFilter("all");
    setMustChangePasswordFilter("all");
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isFetching}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
              {canManage ? (
                <Button
                  variant="primary"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  onClick={() => {
                    setBulkPreview(null);
                    setBulkError(null);
                    setIsBulkOpen(true);
                  }}
                >
                  {t("bulk.open")}
                </Button>
              ) : null}
            </div>
          }
        />

        <SettingsSectionCard
          title={t("table.title")}
          description={t("table.description")}
        >
          {pageError ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {pageError}
            </p>
          ) : null}
          <div className="mb-4">
            <FilterPanel
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters((current) => !current)}
              hasActiveFilters={Boolean(hasActiveFilters)}
              toggleTitle={t("filters.button")}
              toggleAriaLabel={t("filters.button")}
              className="bg-transparent p-0 shadow-none"
              clearAction={null}
              searchSlot={
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1">
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("filters.search")}
                    />
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={resetFilters}
                    >
                      {t("filters.clear")}
                    </Button>
                  ) : null}
                </div>
              }
              filtersSlot={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Select
                    label={t("filters.role")}
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={[
                      { value: "all", label: tCommon("all") },
                      ...roles.filter((role) => role.key).map((role) => ({
                        value: role.key as string,
                        label: role.name,
                      })),
                    ]}
                  />
                  <Select
                    label={t("filters.status")}
                    value={statusFilter}
                    onChange={(value) =>
                      setStatusFilter(value as UserAdminStatus | "all")
                    }
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "active", label: t("statuses.active") },
                      { value: "invited", label: t("statuses.invited") },
                      { value: "inactive", label: t("statuses.inactive") },
                    ]}
                  />
                  <Select
                    label={t("filters.has_password")}
                    value={hasPasswordFilter}
                    onChange={setHasPasswordFilter}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "yes", label: t("yes") },
                      { value: "no", label: t("no") },
                    ]}
                  />
                  <Select
                    label={t("filters.must_change")}
                    value={mustChangePasswordFilter}
                    onChange={setMustChangePasswordFilter}
                    options={[
                      { value: "all", label: tCommon("all") },
                      { value: "yes", label: t("yes") },
                      { value: "no", label: t("no") },
                    ]}
                  />
                </div>
              }
            />
          </div>

          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <CredentialStatusTable
              records={records}
              searchQuery={search}
              page={page}
              limit={limit}
              total={total}
              canManage={canManage}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              onGenerate={(record) => {
                setSelectedUser(record);
                setGenerateMode("generate");
              }}
              onSetPassword={(record) => {
                setSelectedUser(record);
                setSetPasswordError(null);
                setIsSetPasswordOpen(true);
              }}
              onRegenerate={(record) => {
                setSelectedUser(record);
                setGenerateMode("regenerate");
              }}
              labels={{
                name: t("table.name"),
                usernameLogin: t("table.username_login"),
                contactEmail: t("table.contact_email"),
                role: t("table.role"),
                status: t("table.status"),
                hasPassword: t("table.has_password"),
                mustChangePassword: t("table.must_change_password"),
                provisionedAt: t("table.provisioned_at"),
                changedAt: t("table.changed_at"),
                version: t("table.version"),
                actions: t("table.actions"),
                yes: t("yes"),
                no: t("no"),
                notAvailable: t("not_available"),
                generate: t("actions.generate"),
                setPassword: t("actions.set_password"),
                regenerate: t("actions.regenerate"),
              }}
            />
          )}
        </SettingsSectionCard>

        {generateMode ? (
          <GenerateCredentialModal
            isOpen
            mode={generateMode}
            user={selectedUser}
            isSubmitting={isSingleSubmitting}
            onClose={() => {
              setGenerateMode(null);
              setSelectedUser(null);
            }}
            onSubmit={handleSingleGenerate}
            labels={{
              generateTitle: t("generate.title"),
              regenerateTitle: t("generate.regenerate_title"),
              description: t("generate.description"),
              mustChangePassword: t("generate.must_change_password"),
              cancel: tCommon("cancel"),
              generate: t("actions.generate"),
              regenerate: t("actions.regenerate"),
              generating: t("generate.generating"),
            }}
          />
        ) : null}
        {isSetPasswordOpen ? (
          <SetPasswordModal
            isOpen
            user={selectedUser}
            isSubmitting={isSingleSubmitting}
            error={setPasswordError}
            onClose={() => {
              setIsSetPasswordOpen(false);
              setSelectedUser(null);
              setSetPasswordError(null);
            }}
            onSubmit={handleSetPassword}
            labels={{
              title: t("set.title"),
              description: t("set.description"),
              password: t("set.password"),
              confirmPassword: t("set.confirm_password"),
              mustChangePassword: t("set.must_change_password"),
              cancel: tCommon("cancel"),
              save: tCommon("save"),
              saving: tCommon("saving"),
              required: t("set.errors.required"),
              mismatch: t("set.errors.mismatch"),
              minLength: t("set.errors.min_length"),
              show: t("set.show"),
              hide: t("set.hide"),
            }}
          />
        ) : null}
        {isBulkOpen ? (
          <BulkGenerateCredentialsModal
            isOpen
            roles={roles}
            preview={bulkPreview}
            isPreviewing={isBulkPreviewing}
            isGenerating={isBulkGenerating}
            error={bulkError}
            onClose={() => {
              setIsBulkOpen(false);
              setBulkPreview(null);
              setBulkError(null);
            }}
            onPreview={handleBulkPreview}
            onGenerate={handleBulkGenerate}
            labels={{
              title: t("bulk.title"),
              description: t("bulk.description"),
              role: t("filters.role"),
              status: t("filters.status"),
              all: tCommon("all"),
              active: t("statuses.active"),
              invited: t("statuses.invited"),
              inactive: t("statuses.inactive"),
              missingOnly: t("bulk.missing_only"),
              mustChangeOnly: t("bulk.must_change_only"),
              forceChange: t("bulk.force_change"),
              preview: t("bulk.preview"),
              previewing: t("bulk.previewing"),
              generate: t("bulk.generate"),
              generating: t("bulk.generating"),
              cancel: tCommon("cancel"),
              eligible: t("bulk.eligible"),
              skipped: t("bulk.skipped"),
            }}
          />
        ) : null}
        <TemporaryPasswordRevealModal
          isOpen={revealedCredentials.length > 0}
          credentials={revealedCredentials}
          onClose={() => setRevealedCredentials([])}
          labels={{
            title: t("reveal.title"),
            warning: t("reveal.warning"),
            noPassword: t("reveal.no_password"),
            copy: t("reveal.copy"),
            copied: t("reveal.copied"),
            close: tCommon("close"),
            user: t("reveal.user"),
            password: t("reveal.password"),
            show: t("reveal.show"),
            hide: t("reveal.hide"),
          }}
        />
      </main>
    </SettingsAccessGuard>
  );
}
