import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Select from "../Select";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("Select", () => {
  it("renders the open menu outside the component container", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-testid="clipping-container" className="overflow-hidden">
        <Select
          value=""
          onChange={vi.fn()}
          options={[
            { value: "", label: "All statuses" },
            { value: "published", label: "Published outside" },
          ]}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /All statuses/i }));

    const option = screen.getByRole("button", { name: "Published outside" });

    expect(document.body.contains(option)).toBe(true);
    expect(container.contains(option)).toBe(false);
  });

  it("opens the menu above the trigger when there is not enough viewport space below", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        value=""
        onChange={vi.fn()}
        options={[
          { value: "", label: "All modes" },
          { value: "quiz", label: "Quiz" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: /All modes/i });
    vi.spyOn(trigger.parentElement as HTMLElement, "getBoundingClientRect")
      .mockReturnValue({
        bottom: 760,
        height: 40,
        left: 24,
        right: 204,
        top: 720,
        width: 180,
        x: 24,
        y: 720,
        toJSON: () => ({}),
      });
    vi.stubGlobal("innerHeight", 800);

    await user.click(trigger);

    const option = screen.getByRole("button", { name: "Quiz" });
    const menu = option.closest("div");

    expect(Number.parseFloat(menu?.style.top || "0")).toBeLessThan(720);

    vi.unstubAllGlobals();
    container.remove();
  });
});
