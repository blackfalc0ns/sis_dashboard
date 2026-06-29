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

  it("searches options by visible label and supplemental search text", async () => {
    const user = userEvent.setup();
    render(
      <Select
        value="all"
        onChange={vi.fn()}
        searchable
        searchPlaceholder="Search roles"
        options={[
          { value: "all", label: "All roles" },
          {
            value: "teacher",
            label: "Educators",
            searchText: "Educators teacher",
          },
          {
            value: "finance",
            label: "Finance Team",
            searchText: "Finance Team finance",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "All roles" }));
    const searchInput = screen.getByPlaceholderText("Search roles");

    await user.type(searchInput, "teacher");
    expect(screen.getByText("Educators")).toBeInTheDocument();
    expect(screen.queryByText("Finance Team")).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "Finance Team");
    expect(screen.getByText("Finance Team")).toBeInTheDocument();
    expect(screen.queryByText("Educators")).not.toBeInTheDocument();
  });
});
