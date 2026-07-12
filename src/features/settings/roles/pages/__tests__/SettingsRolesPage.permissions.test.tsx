import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import SettingsRolesPage from "../SettingsRolesPage";

const authState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      id: "admin-1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      activeMembership: {
        roleKey: "custom_admin",
        permissions: authState.permissions,
      },
    },
  }),
}));

const role = {
  id: "role-1",
  key: "custom_admin",
  name: "Custom Admin",
  description: "Custom administration role",
  isSystem: false,
  memberCount: 2,
  permissions: ["settings.users.view"],
};

function renderPage() {
  return render(
    <UnsavedChangesProvider>
      <ToastProvider>
        <SettingsRolesPage />
      </ToastProvider>
    </UnsavedChangesProvider>,
  );
}

describe("SettingsRolesPage permission catalog access", () => {
  beforeEach(() => {
    authState.permissions = ["settings.roles.view"];
    Object.values(apiMocks).forEach((apiMock) => apiMock.mockReset());
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([role]);
      }
      if (path === "/settings/permissions") {
        return Promise.resolve([
          {
            key: "settings.users.view",
            module: "users",
            action: "view",
            label: "View users",
            description: "View users in the school",
          },
        ]);
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
  });

  it("keeps the role list available without requesting a forbidden catalog", async () => {
    renderPage();

    expect(await screen.findByText("Custom Admin")).toBeInTheDocument();
    expect(
      screen.getByText("permission_matrix_access_required"),
    ).toBeInTheDocument();
    expect(screen.queryByText("save_permissions")).not.toBeInTheDocument();
    expect(apiMocks.apiGet).not.toHaveBeenCalledWith("/settings/permissions");
  });

  it("loads the permission matrix when catalog access is granted", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.permissions.view",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", { name: "users" }),
    ).toBeInTheDocument();
    expect(apiMocks.apiGet).toHaveBeenCalledWith("/settings/permissions");
  });

  it("keeps loaded roles visible when the catalog request fails", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.permissions.view",
    ];
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([role]);
      }
      return Promise.reject(new Error("catalog unavailable"));
    });

    renderPage();

    expect(await screen.findByText("Custom Admin")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("permission_matrix_load_failed"),
      ).toBeInTheDocument(),
    );
  });
});
