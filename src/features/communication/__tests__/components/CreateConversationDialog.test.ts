import { describe, expect, it } from "vitest";
import {
  getConversationTypeOptions,
  shouldShowConversationSelector,
} from "@/features/communication/components/conversations/CreateConversationDialog";
import type { CreateConversationDialogLabels } from "@/features/communication/components/conversations/CreateConversationDialog";

const labels: CreateConversationDialogLabels = {
  createTitle: "Create Conversation",
  editTitle: "Edit Conversation",
  title: "Title",
  type: "Type",
  description: "Description",
  academicYearId: "Academic year",
  termId: "Term",
  stageId: "Stage",
  gradeId: "Grade",
  sectionId: "Section",
  classroomId: "Classroom",
  subjectId: "Subject",
  avatarFileId: "Avatar",
  isReadOnly: "Read only",
  isPinned: "Pinned",
  group: "Group",
  classroom: "Classroom",
  direct: "Direct",
  grade: "Grade",
  section: "Section",
  stage: "Stage",
  schoolWide: "School-wide",
  support: "Support",
  system: "System",
  cancel: "Cancel",
  create: "Create",
  save: "Save",
  titleRequired: "Enter a title.",
};

describe("CreateConversationDialog helpers", () => {
  it("exposes every backend-supported conversation type", () => {
    expect(getConversationTypeOptions(labels).map((option) => option.value)).toEqual([
      "group",
      "classroom",
      "direct",
      "grade",
      "section",
      "stage",
      "school_wide",
      "support",
      "system",
    ]);
  });

  it("shows only the selectors that match the selected conversation type", () => {
    expect(shouldShowConversationSelector("stage", "stageId")).toBe(true);
    expect(shouldShowConversationSelector("stage", "gradeId")).toBe(false);
    expect(shouldShowConversationSelector("section", "gradeId")).toBe(true);
    expect(shouldShowConversationSelector("section", "sectionId")).toBe(true);
    expect(shouldShowConversationSelector("school_wide", "academicYearId")).toBe(
      false,
    );
  });
});
