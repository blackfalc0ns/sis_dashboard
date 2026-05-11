import type {
  AttendanceBehaviorFilters,
  AttendanceBehaviorResponse,
} from "../types";

export async function fetchAttendanceBehavior(
  params: AttendanceBehaviorFilters,
): Promise<AttendanceBehaviorResponse> {
  void params;

  return {
    rows: [],
    total: 0,
  };
}
