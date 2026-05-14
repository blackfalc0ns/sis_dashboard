import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReinforcementTaskTable from "@/features/reinforcement/components/ReinforcementTaskTable";
import ReinforcementTemplateTable from "@/features/reinforcement/components/ReinforcementTemplateTable";
import { buildReinforcementTemplatePayload } from "@/features/reinforcement/components/ReinforcementTemplateForm";
import {
  buildReinforcementTaskPayload,
  getDefaultReinforcementDueDate,
} from "@/features/reinforcement/components/ReinforcementTaskForm";
import {
  createEmptyTaskStage,
  mapTaskStagesToPayload,
} from "@/features/reinforcement/components/ReinforcementTaskStagesEditor";
import { makeManualXpDedupeKey } from "@/features/reinforcement/components/ManualXpGrantModal";
import type { ReinforcementTask, ReinforcementTemplate } from "@/features/reinforcement/types";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "teacher-1",
      firstName: "Teacher",
      lastName: "One",
      email: "teacher@example.com",
      activeMembership: { schoolId: "school-1" },
    },
  }),
}));

describe("Sprint 5A reinforcement frontend hardening", () => {
  it("uses a dynamic default due date of today plus seven days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T09:00:00.000Z"));

    expect(getDefaultReinforcementDueDate()).toBe("2026-05-21");

    vi.useRealTimers();
  });

  it("maps template payload fields without inventing backend fields", () => {
    const payload = buildReinforcementTemplatePayload({
      nameEn: "  Helper ",
      nameAr: "",
      descriptionEn: "Lead peers",
      descriptionAr: "",
      source: "teacher",
      rewardType: "xp",
      rewardValue: "10",
      rewardLabelEn: "XP",
      rewardLabelAr: "نقاط",
      stages: [
        {
          titleEn: "",
          titleAr: "مرحلة",
          descriptionEn: "",
          descriptionAr: "وصف",
          proofType: "image",
          requiresApproval: true,
        },
      ],
    });

    expect(payload).toMatchObject({
      nameEn: "Helper",
      nameAr: "Helper",
      source: "teacher",
      reward: {
        type: "xp",
        value: "10",
        labelAr: "نقاط",
      },
    });
    expect(payload.stages).toEqual([
      {
        sortOrder: 1,
        titleEn: "مرحلة",
        titleAr: "مرحلة",
        descriptionAr: "وصف",
        proofType: "image",
        requiresApproval: true,
      },
    ]);
    expect(payload).not.toHaveProperty("rewardCatalogId");
  });

  it("maps task payload targets and stages without fake assignment IDs", () => {
    const payload = buildReinforcementTaskPayload(
      {
        context: {
          academicYearId: "year-1",
          termId: "term-1",
          subjectId: "subject-1",
        },
        titleEn: "Read",
        titleAr: "",
        descriptionEn: "",
        descriptionAr: "",
        source: "teacher",
        rewardType: "xp",
        rewardValue: "5",
        rewardLabelEn: "",
        rewardLabelAr: "",
        dueDate: "2026-05-21",
        targets: [
          {
            scopeType: "student",
            scopeId: "student-1",
            label: "Student One",
            enrollmentId: "enrollment-1",
          },
        ],
        stages: [
          {
            ...createEmptyTaskStage(),
            titleEn: "Submit proof",
            proofType: "document",
          },
        ],
      },
    );

    expect(payload).not.toHaveProperty("yearId");
    expect(payload).not.toHaveProperty("assignedById");
    expect(payload).not.toHaveProperty("assignedByName");
    expect(payload).not.toHaveProperty("classroomId");
    expect(payload).not.toHaveProperty("studentId");
    expect(payload).not.toHaveProperty("stageId");
    expect(payload).not.toHaveProperty("gradeId");
    expect(payload).not.toHaveProperty("sectionId");
    expect(payload).not.toHaveProperty("enrollmentId");
    expect(payload.targets).toEqual([
      { scopeType: "student", scopeId: "student-1" },
    ]);
    expect(payload.stages[0]).toMatchObject({
      sortOrder: 1,
      titleEn: "Submit proof",
      titleAr: "Submit proof",
      proofType: "document",
    });
    expect(payload.targets[0]).not.toHaveProperty("assignmentId");
  });

  it("maps task stages with stable sort order", () => {
    expect(
      mapTaskStagesToPayload([
        { ...createEmptyTaskStage(), titleEn: "First" },
        { ...createEmptyTaskStage(), titleAr: "الثانية", requiresApproval: true },
      ]),
    ).toEqual([
      expect.objectContaining({ sortOrder: 1, titleEn: "First", titleAr: "First" }),
      expect.objectContaining({
        sortOrder: 2,
        titleEn: "الثانية",
        titleAr: "الثانية",
        requiresApproval: true,
      }),
    ]);
  });

  it("renders task enums and hides manage actions without permissions", () => {
    const task: ReinforcementTask = {
      id: "task-1",
      titleEn: "Leadership",
      titleAr: "قيادة",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 10,
      status: "in_progress",
      targets: [],
      stages: [],
    };

    render(
      <ReinforcementTaskTable
        tasks={[task]}
        canManage={false}
        onDuplicate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Leadership")).toBeInTheDocument();
    expect(screen.getByText("source.teacher")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("rewardType.xp / 10")).toBeInTheDocument();
    expect(screen.queryByText("actions.duplicate")).not.toBeInTheDocument();
  });

  it("does not render cancel for already-cancelled tasks", () => {
    const task: ReinforcementTask = {
      id: "task-1",
      titleEn: "Cancelled task",
      titleAr: "ملغاة",
      source: "teacher",
      rewardType: "xp",
      status: "cancelled",
      targets: [],
      stages: [],
    };

    render(
      <ReinforcementTaskTable
        tasks={[task]}
        canManage
        onDuplicate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Cancelled task")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.queryByText("actions.cancel")).not.toBeInTheDocument();
  });

  it("renders template enum labels and empty state", () => {
    const template: ReinforcementTemplate = {
      id: "template-1",
      nameEn: "Helper",
      nameAr: "مساعد",
      source: "parent",
      reward: { type: "badge" },
      stages: [],
    };

    const { rerender } = render(
      <ReinforcementTemplateTable templates={[template]} />,
    );
    expect(screen.getAllByText("Helper")).not.toHaveLength(0);
    expect(screen.getAllByText("source.parent")).not.toHaveLength(0);
    expect(screen.getAllByText("rewardType.badge")).not.toHaveLength(0);

    rerender(<ReinforcementTemplateTable templates={[]} />);
    expect(screen.getByText("emptyStates.templates")).toBeInTheDocument();
  });

  it("generates manual XP dedupe keys client-side", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T09:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(makeManualXpDedupeKey()).toMatch(/^manual-xp-\d+-[a-z0-9]+$/);

    vi.mocked(Math.random).mockRestore();
    vi.useRealTimers();
  });
});
