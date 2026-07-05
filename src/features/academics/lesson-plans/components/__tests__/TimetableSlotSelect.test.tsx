import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConfig, listEntries } from "@/features/academics/timetable/services/timetableApiAdapter";
import TimetableSlotSelect from "../TimetableSlotSelect";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  listEntries: vi.fn(),
}));

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  teacherUserId: "teacher-1",
  subjectId: "subject-1",
  teacherSubjectAllocationId: "allocation-1",
};

const entry = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  timetableConfigId: "config-1",
  periodId: "period-1",
  dayOfWeek: 3,
  period: { id: "period-1", index: 1, label: "Period 2", startTime: "08:45", endTime: "09:30" },
  classroom: { id: "classroom-1", nameAr: "فصل", nameEn: "Class A" },
  subject: { id: "subject-1", nameAr: "رياضيات", nameEn: "Mathematics" },
  teacher: { userId: "teacher-1", fullName: "Teacher One" },
  teacherSubjectAllocationId: "allocation-1",
  status: "draft",
  ...overrides,
});

const renderSelect = (onChange = vi.fn()) =>
  render(
    <TimetableSlotSelect
      {...scope}
      plannedDate="2026-09-16"
      value=""
      onChange={onChange}
      label="Timetable slot"
      emptyOptionLabel="Without slot"
      noSlotsMessage="No slots"
      loadingMessage="Loading slots"
    />,
  );

describe("TimetableSlotSelect", () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReset().mockResolvedValue({ id: "config-1" } as never);
    vi.mocked(listEntries).mockReset().mockResolvedValue([]);
  });

  it("queries the selected day and classroom and displays draft entries with useful labels", async () => {
    vi.mocked(listEntries).mockResolvedValue([entry()] as never);
    const user = userEvent.setup();
    renderSelect();

    await waitFor(() => expect(listEntries).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Timetable slot" }));
    expect(
      screen.getByText(
        "Period 2 · 08:45 - 09:30 · Mathematics · Teacher One",
      ),
    ).toBeInTheDocument();
    expect(listEntries).toHaveBeenCalledWith({
      timetableConfigId: "config-1",
      classroomId: "classroom-1",
      dayOfWeek: 3,
    });
  });

  it("excludes cancelled entries and shows the optional no-slots helper", async () => {
    vi.mocked(listEntries).mockResolvedValue([entry({ status: "cancelled" })] as never);
    renderSelect();

    expect(await screen.findByText("No slots")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Period 2 · 08:45 - 09:30 · Mathematics · Teacher One",
      ),
    ).not.toBeInTheDocument();
  });

  it("continues through SECTION GRADE and TERM configs until valid entries are found", async () => {
    vi.mocked(getConfig)
      .mockResolvedValueOnce({ id: "classroom-config" } as never)
      .mockResolvedValueOnce({ id: "section-config" } as never)
      .mockResolvedValueOnce({ id: "grade-config" } as never)
      .mockResolvedValueOnce({ id: "term-config" } as never);
    vi.mocked(listEntries)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry({ status: "cancelled" })] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry({ id: "term-entry" })] as never);

    const user = userEvent.setup();
    renderSelect();

    await waitFor(() => expect(listEntries).toHaveBeenCalledTimes(4));
    await user.click(screen.getByRole("button", { name: "Timetable slot" }));
    expect(
      screen.getByText(
        "Period 2 · 08:45 - 09:30 · Mathematics · Teacher One",
      ),
    ).toBeInTheDocument();
    expect(getConfig).toHaveBeenCalledTimes(4);
    expect(listEntries).toHaveBeenCalledTimes(4);
  });

  it("accepts a defensive flat-id teacher subject and classroom fallback match", async () => {
    vi.mocked(listEntries).mockResolvedValue([
      entry({
        teacherSubjectAllocationId: null,
        classroom: null,
        subject: null,
        teacher: null,
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherUserId: "teacher-1",
      }),
    ] as never);
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSelect(onChange);

    await user.click(await screen.findByRole("button", { name: "Timetable slot" }));
    await user.click(screen.getByRole("button", { name: /Period 2/ }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: "entry-1" })));
  });

  it("does not load slots until subject and classroom scope are complete", async () => {
    render(
      <TimetableSlotSelect
        {...scope}
        classroomId=""
        plannedDate="2026-09-16"
        value=""
        onChange={vi.fn()}
        label="Timetable slot"
        emptyOptionLabel="Without slot"
        noSlotsMessage="No slots"
        loadingMessage="Loading slots"
      />,
    );

    expect(getConfig).not.toHaveBeenCalled();
    expect(listEntries).not.toHaveBeenCalled();
  });
});
