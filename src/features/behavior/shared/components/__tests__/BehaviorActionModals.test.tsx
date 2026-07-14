import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BehaviorActionModals from "../BehaviorActionModals";
import type { BehaviorCategory } from "@/features/behavior/types";
import type { ModalProps } from "@/components/ui/modal/Modal";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock("@/components/ui/modal/Modal", () => ({
  default: ({ isOpen, children, footer }: ModalProps) =>
    isOpen ? (
      <div>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock("@/features/behavior/services/behaviorApiService", () => ({
  createBehaviorCategory: vi.fn(),
  updateBehaviorCategory: vi.fn(),
}));

describe("BehaviorActionModals category editor", () => {
  it("keeps identity fields editable and offers critical severity", () => {
    const category: BehaviorCategory & { inUse: boolean } = {
      id: "category-1",
      code: "CONDUCT",
      nameEn: "Conduct",
      nameAr: "السلوك",
      type: "positive",
      defaultSeverity: "high",
      defaultPoints: 5,
      isActive: true,
      sortOrder: 10,
      inUse: true,
    };

    render(
      <BehaviorActionModals
        mode="edit-category"
        target={{ category }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/category\.code/)).toBeEnabled();
    expect(screen.getByLabelText("category.type")).toBeEnabled();

    fireEvent.click(screen.getByLabelText("category.severity"));
    expect(screen.getByRole("button", { name: "Critical" })).toBeInTheDocument();
  });
});
