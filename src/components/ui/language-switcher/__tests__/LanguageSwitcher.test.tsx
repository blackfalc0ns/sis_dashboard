import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LanguageSwitcher from "@/components/ui/language-switcher/LanguageSwitcher";

const push = vi.fn();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/academics/timetable",
  useRouter: () => ({ push }),
  useSearchParams: () =>
    new URLSearchParams(
      "tab=timetable&stage=stage-1&grade=grade-1&section=section-1&classroom=classroom-1",
    ),
}));

describe("LanguageSwitcher", () => {
  it("preserves query params when switching locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: /ar/i }));

    expect(push).toHaveBeenCalledWith(
      "/ar/academics/timetable?tab=timetable&stage=stage-1&grade=grade-1&section=section-1&classroom=classroom-1",
    );
  });
});
