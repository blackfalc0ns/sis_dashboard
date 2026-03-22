import type { OverviewMetrics } from "@/features/academics/overview/services/overviewService";

export interface OverviewAdapter {
  fetchOverviewMetrics(yearId: string, termId: string): Promise<OverviewMetrics>;
}
