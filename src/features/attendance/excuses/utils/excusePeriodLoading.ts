import type { ExcuseType } from "../types";

export function shouldLoadExcusePeriods(
  type: ExcuseType,
  isModalOpening = false,
): boolean {
  return !isModalOpening && (type === "LATE" || type === "EARLY_LEAVE");
}
