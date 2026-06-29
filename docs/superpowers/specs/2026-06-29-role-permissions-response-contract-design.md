# Role Permissions Response Contract Design

## Goal

Align the frontend with `PUT /settings/roles/:id/permissions`, which returns only the updated role ID and permission codes, without replacing a complete local role with a partial API response.

## Contract

The frontend transport contract for this endpoint is separate from `SettingsRoleApiDto`:

```ts
interface SettingsRolePermissionsResponseDto {
  id: string;
  permissions: string[];
}
```

`replaceSettingsRolePermissions` sends `SettingsRolePermissionsPayloadDto` and returns `SettingsRolePermissionsResponseDto` directly. It must not pass this response through `mapRole`, because the backend response does not contain `name`, `description`, `isSystem`, or `memberCount`.

## State Update

After a successful save, the roles page finds the local role whose ID matches the response and replaces only its `permissions` property. All other local role fields remain unchanged. Roles with different IDs remain unchanged.

The service does not accept local role state or perform the merge. Keeping transport mapping separate from UI state preserves the service boundary and avoids coupling the API client to the roles page.

The page does not refetch the roles list after saving. The response already contains the authoritative persisted permission codes, so an additional request would add latency and could unnecessarily disturb the current page or selection.

## Error Handling

If the request fails, the existing save error remains visible through the current toast behavior. The page keeps its current permission selections so the administrator can retry without repeating the edits.

## Verification

Focused tests cover:

- The service returns the backend `{ id, permissions }` response without treating it as a full role.
- A successful save updates only the matching role's permissions.
- The matching role retains its name, description, key, system flag, and member count.
- Non-matching roles remain unchanged.
