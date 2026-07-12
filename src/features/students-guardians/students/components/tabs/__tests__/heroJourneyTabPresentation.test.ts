import { describe, expect, it } from "vitest";
import {
  getMissionTitle,
  isAwaitingMissionCompletion,
  normalizeHeroJourneyProgress,
} from "../heroJourneyTabPresentation";

describe("hero journey tab presentation", () => {
  it("identifies missions awaiting final completion", () => {
    const progress = normalizeHeroJourneyProgress({
      summary: {
        missionsTotal: 2,
        inProgress: 2,
        completionRate: 0,
      },
      missions: [
        {
          missionId: "mission-2",
          status: "in_progress",
          progressPercent: 100,
          titleEn: "Test mission",
          objectives: {
            required: 2,
            completedRequired: 2,
          },
        },
      ],
    });

    expect(isAwaitingMissionCompletion(progress.missions[0])).toBe(true);
    expect(getMissionTitle(progress.missions[0], "en")).toBe("Test mission");
  });
});
