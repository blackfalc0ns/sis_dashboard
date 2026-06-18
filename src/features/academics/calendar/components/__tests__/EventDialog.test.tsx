import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EventDialog from "../EventDialog";
import type { AcademicEvent } from "../../services/calendarService";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(
    () => new Promise(() => undefined)
  ),
}));

describe("EventDialog", () => {
  const existingEvent: AcademicEvent = {
    id: "e1",
    termId: "t1",
    title: "Event",
    type: "OTHER",
    allDay: true,
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    scopeType: "SCHOOL",
    createdAt: "2024-01-01T00:00:00Z",
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    event: null,
    term: { id: "t1", yearId: "y1", name: "Term 1", status: "active" as const, startDate: "2024-01-01", endDate: "2024-06-01", isCurrent: true, type: "MAIN" as const, ordinal: 1, _count: { grades: 0 } },
    academicYearId: "y1",
    termId: "t1",
    prefilledDate: null,
    isReadOnly: false,
  };

  const renderComponent = (props = {}) => {
    return render(
      <EventDialog {...defaultProps} {...props} />
    );
  };

  it("Read-only disables create/update/delete", () => {
    renderComponent({ isReadOnly: true, event: existingEvent });
    // Save button should not be present
    expect(screen.queryByText("save")).not.toBeInTheDocument();
    // Delete button should not be present
    expect(screen.queryByText("delete")).not.toBeInTheDocument();
  });

  it("Create event renders Add Event", () => {
    renderComponent();
    expect(screen.getByText("add_event")).toBeInTheDocument();
  });
});
