import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

const mockPush = vi.fn();
const mockLogin = vi.fn();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/en/login",
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginForm Sprint 11 behavior", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLogin.mockReset();
  });

  it("redirects mustChangePassword users to the change-password route", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ id: "u1", mustChangePassword: true });

    const { container } = render(<LoginForm currentYear={2026} />);

    await user.type(screen.getByRole("textbox"), "user@example.edu");
    await user.type(
      container.querySelector('input[name="password"]') as HTMLInputElement,
      "valid-password",
    );
    await user.click(screen.getByRole("button", { name: "submit" }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: "user@example.edu",
      password: "valid-password",
    });
    expect(mockPush).toHaveBeenCalledWith("/en/change-password");
  });
});
