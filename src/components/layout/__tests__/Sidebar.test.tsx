import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import Sidebar from "../Sidebar";
import { groupMenuChildren, menuItems } from "@/config/navigation";

vi.mock("@/hooks/usePermissions", () => ({
  navigationPermissionByKey: {},
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock("@/components/navigation/GuardedLink", () => ({
  default: (props: PropsWithChildren<Record<string, unknown>>) => {
    const { children, ...linkProps } = props;
    delete linkProps.onNavigationStart;
    delete linkProps.prefetch;
    return createElement("a", linkProps, children);
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...imageProps } = props;
    void priority;
    return createElement("img", { alt: "", ...imageProps });
  },
}));

describe("Sidebar toggle control", () => {
  it("renders subgroup headings above related links", () => {
    render(<Sidebar isOpen onToggle={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Admissions & Registration" }),
    );

    expect(screen.getByText("Application Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Enrollment", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
  });

  it("omits subgroup headings when permission filtering removes every child", () => {
    const admissions = menuItems.find(
      (item) => item.key === "admissions-registration",
    );
    const visibleChildren = admissions!.children!.filter(
      (child) => child.subgroup !== "pipeline",
    );

    const groups = groupMenuChildren(admissions!, visibleChildren);

    expect(groups.map(({ subgroup }) => subgroup.key)).toEqual(["enrollment"]);
  });

  it("provides an accessible collapse action when expanded", () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen onToggle={onToggle} />);

    const toggle = screen.getByRole("button", { name: "collapse" });

    expect(toggle).toHaveAccessibleName("collapse");
    toggle.click();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("keeps the expand control available when collapsed", () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "expand" })).toHaveAccessibleName(
      "expand",
    );
  });
});
