import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SessionPickerPanel from "../SessionPickerPanel";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/attendance/policies/components/ScopePicker", () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>Scope control</button>
  ),
}));

vi.mock("@/components/ui/input/DatePicker", () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <button type="button" disabled={disabled}>Date control</button>
  ),
}));

const defaultProps = {
  scopeType: "CLASSROOM" as const,
  scopeIds: { classroomId: "classroom-1" },
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
  onScopeTypeChange: vi.fn(),
  onScopeIdsChange: vi.fn(),
  date: "2026-02-10",
  onDateChange: vi.fn(),
  termStartDate: "2026-01-01",
  termEndDate: "2026-06-30",
  mode: "PERIOD" as const,
  periods: [
    {
      id: "period-1",
      index: 1,
      nameAr: "الحصة الأولى",
      nameEn: "Period 1",
      startTime: "08:00",
      endTime: "08:45",
    },
  ],
  selectedPeriodId: "period-1",
  onPeriodChange: vi.fn(),
  sessionStatus: "DRAFT" as const,
};

describe("SessionPickerPanel", () => {
  it("disables every session-defining control while the workspace is busy", () => {
    render(<SessionPickerPanel {...defaultProps} variant="drawer" disabled />);

    expect(screen.getByRole("button", { name: "Scope control" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Date control" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "sessionPicker.prev" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "sessionPicker.next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Period 1/ })).toBeDisabled();
  });
});
