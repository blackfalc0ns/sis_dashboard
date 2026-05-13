import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserEditorModal from "../UserEditorModal";

const loginIdentityMocks = vi.hoisted(() => ({
  previewLoginIdentityUsername: vi.fn(),
  checkUsernameAvailability: vi.fn(),
}));

vi.mock("@/features/settings/login-identity/services/loginIdentityService", () => loginIdentityMocks);

describe("UserEditorModal Sprint 11 behavior", () => {
  beforeEach(() => {
    loginIdentityMocks.previewLoginIdentityUsername.mockReset();
    loginIdentityMocks.checkUsernameAvailability.mockReset();
  });

  it("submits username and contactEmail without using personal email as login email", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    loginIdentityMocks.previewLoginIdentityUsername.mockResolvedValue({
      username: "amina",
      loginEmail: "amina@school.edu",
      email: "amina@school.edu",
    });
    loginIdentityMocks.checkUsernameAvailability.mockResolvedValue({
      username: "amina",
      available: true,
    });

    const { container } = render(
      <UserEditorModal
        isOpen
        mode="create"
        roles={[{ id: "role-1", name: "Teacher", permissions: [] }]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const inputs = container.querySelectorAll("input");
    await user.type(inputs[0], "Amina Teacher");
    await user.type(inputs[1], "amina");
    await user.type(inputs[2], "amina.personal@example.com");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: "Amina Teacher",
        username: "amina",
        contactEmail: "amina.personal@example.com",
        roleId: "role-1",
      });
    });
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("email");
  });
});
