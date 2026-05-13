import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type {
  PermissionDefinition,
  RoleDefinition,
  SettingsPermissionApiDto,
  SettingsPaginationApiDto,
  SettingsRoleApiDto,
  SettingsRolesListApiDto,
  SettingsRolePayloadDto,
  SettingsRolePermissionsPayloadDto,
} from "@/features/settings/types";

function mapRole(payload: SettingsRoleApiDto): RoleDefinition {
  return {
    id: payload.id,
    key: payload.key ?? undefined,
    name: payload.name,
    description: payload.description,
    isSystem: payload.isSystem ?? false,
    memberCount: payload.memberCount ?? 0,
    permissions: payload.permissions ?? [],
  };
}

function mapPermission(
  payload: SettingsPermissionApiDto,
): PermissionDefinition {
  return {
    key: payload.key,
    module: payload.module,
    action: payload.action,
    label: payload.label,
    description: payload.description,
  };
}

export interface FetchSettingsRolesParams {
  page?: number;
  limit?: number;
}

export interface FetchSettingsRolesResult {
  items: RoleDefinition[];
  pagination: SettingsPaginationApiDto;
}

function toQueryString(params: FetchSettingsRolesParams): string {
  const query = new URLSearchParams();
  if (params.page && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    query.set("limit", String(params.limit));
  }
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

export async function fetchSettingsRoles(
  params: FetchSettingsRolesParams = {},
): Promise<FetchSettingsRolesResult> {
  const query = toQueryString(params);
  const response = await apiGet<SettingsRolesListApiDto | SettingsRoleApiDto[]>(
    `/settings/roles${query}`,
  );
  const items = Array.isArray(response) ? response : response.items;
  const pagination = Array.isArray(response)
    ? {
        page: params.page || 1,
        limit: params.limit || items.length || 10,
        total: items.length,
      }
    : {
        page: response.pagination?.page || params.page || 1,
        limit: response.pagination?.limit || params.limit || items.length || 10,
        total: response.pagination?.total || items.length,
      };

  return {
    items: items.map(mapRole),
    pagination,
  };
}

export async function fetchSettingsPermissions(): Promise<
  PermissionDefinition[]
> {
  const response = await apiGet<SettingsPermissionApiDto[]>(
    "/settings/permissions",
  );
  return response.map(mapPermission);
}

export async function createSettingsRole(
  payload: SettingsRolePayloadDto,
): Promise<RoleDefinition> {
  const response = await apiPost<SettingsRoleApiDto>("/settings/roles", payload);
  return mapRole(response);
}

export async function updateSettingsRole(
  roleId: string,
  payload: SettingsRolePayloadDto,
): Promise<RoleDefinition> {
  const response = await apiPatch<SettingsRoleApiDto>(
    `/settings/roles/${roleId}`,
    payload,
  );
  return mapRole(response);
}

export async function replaceSettingsRolePermissions(
  roleId: string,
  permissions: string[],
): Promise<RoleDefinition> {
  const payload: SettingsRolePermissionsPayloadDto = { permissions };
  const response = await apiPut<SettingsRoleApiDto>(
    `/settings/roles/${roleId}/permissions`,
    payload,
  );
  return mapRole(response);
}

export async function cloneSettingsRole(
  roleId: string,
  name: string,
): Promise<RoleDefinition> {
  const response = await apiPost<SettingsRoleApiDto>(
    `/settings/roles/${roleId}/clone`,
    { name },
  );
  return mapRole(response);
}

export async function deleteSettingsRole(roleId: string): Promise<void> {
  await apiDelete<unknown>(`/settings/roles/${roleId}`);
}
