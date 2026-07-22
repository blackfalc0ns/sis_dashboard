import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import CreateTeacherDialog from "../CreateTeacherDialog";
import EditTeacherDialog from "../EditTeacherDialog";

const { previewLoginIdentityUsername, checkUsernameAvailability } = vi.hoisted(() => ({
  previewLoginIdentityUsername: vi.fn().mockResolvedValue({
    loginEmail: "nour@school.example",
  }),
  checkUsernameAvailability: vi.fn().mockResolvedValue({
    username: "nour",
    available: true,
  }),
}));

vi.mock("@/features/settings/login-identity/services/loginIdentityService", () => ({
  previewLoginIdentityUsername,
  checkUsernameAvailability,
}));

describe("teacher form dialogs", () => {
  it("shows the generated login email and checks a new username", async () => {
    const user = userEvent.setup();
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/fields\.username/), "nour");
    await user.click(screen.getByRole("button", { name: "identity.check_availability" }));

    expect(await screen.findByText("nour@school.example")).toBeVisible();
    expect(await screen.findByText("identity.username_available")).toBeVisible();
  });

  it("serializes login-email identity without a conflicting username", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("form.identity_modes.loginEmail"));
    expect(screen.getByText("form.legacy_login_email_help")).toBeVisible();
    await user.type(screen.getByLabelText(/fields.login_email/), "nour@school.example");
    await user.type(screen.getByLabelText(/fields.code/), "tch 001");
    await user.type(screen.getByLabelText(/fields\.first_name \(arabic\)/), "نور");
    await user.type(screen.getByLabelText(/fields\.first_name \(english\)/), "Nour");
    await user.type(screen.getByLabelText(/fields\.last_name \(arabic\)/), "علي");
    await user.type(screen.getByLabelText(/fields\.last_name \(english\)/), "Ali");
    await user.click(screen.getByLabelText(/fields.gender/));
    await user.click(screen.getByRole("button", { name: "gender.female" }));
    await user.click(screen.getByRole("button", { name: "dialog.create_action" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      loginEmail: "nour@school.example",
      teacherCode: "TCH001",
      gender: "FEMALE",
    }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("username");
  });

  it("prevents an empty edit patch", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EditTeacherDialog isOpen teacher={teacherFixture} isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "dialog.save_action" }));
    expect(await screen.findByText("validation.no_changes")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
