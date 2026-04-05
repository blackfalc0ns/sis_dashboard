# Dashboard API Contract

Status: `Service-derived`

This file covers read-only overview endpoints used by home pages and top-level summary cards.

## Main Response Models

```ts
interface DashboardAlert {
  id: string;
  scope: "global" | "admissions" | "students" | "academics" | "grades" | "attendance" | "reinforcement" | "settings";
  severity: "info" | "warning" | "error";
  title: string;
  description: string;
  href?: string;
  count?: number;
}

interface DashboardActivityItem {
  id: string;
  scope: string;
  title: string;
  description: string;
  createdAt: string;
}

interface DashboardSummaryResponse {
  admissions?: {
    funnel: { leads: number; applications: number; accepted: number; enrolled: number };
    weeklyInquiries: Array<{ weekStart: string; count: number }>;
    gradeDistribution: Array<{ grade: string; count: number }>;
  };
  students?: {
    total: number;
    active: number;
    withdrawn: number;
    atRisk: number;
    avgAttendance: number;
    avgGrade: number;
  };
  academics?: {
    structure: {
      totalStages: number;
      totalGrades: number;
      totalSections: number;
      sectionsWithoutCapacity: number;
      gradesWithoutSections: number;
    };
    subjects: {
      totalSubjects: number;
      totalAllocations: number;
      expectedAllocations: number;
      completionPercentage: number;
      missingAllocations: number;
    };
    teacherAllocation: {
      totalAllocations: number;
      missingAllocations: number;
      overloadedTeachers: number;
      averageLoad: number;
    };
    calendar: {
      upcomingEvents: number;
      nextHolidayDate: string | null;
      nextExamDate: string | null;
    };
    lessonPlans: {
      totalPlanned: number;
      totalDone: number;
      completionPercentage: number;
    };
  };
  grades?: {
    kpis: {
      classAverage: number;
      passRate: number;
      completionRate: number;
      failingStudents: number;
    };
  };
  reinforcement?: {
    activeTasks: number;
    underReview: number;
    completionRate: number;
  };
  settings?: {
    profileCompleteness: number;
    activeIntegrations: number;
    activeUsers: number;
    pendingInvites: number;
    recentAuditEvents: number;
    templateHealth: number;
  };
}
```

## Endpoints

### Global Dashboard

| Method | Path | Query | Response |
| --- | --- | --- | --- |
| `GET` | `/dashboard/summary` | `academicYearId?`, `termId?`, `daysBack?` | `DashboardSummaryResponse` |
| `GET` | `/dashboard/alerts` | `academicYearId?`, `termId?` | `DashboardAlert[]` |
| `GET` | `/dashboard/activity-feed` | `limit?` | `DashboardActivityItem[]` |

### Feature-Specific Overview Endpoints

| Method | Path | Query | Response | Status |
| --- | --- | --- | --- | --- |
| `GET` | `/admissions/dashboard/metrics` | `daysBack?` | `AdmissionsAnalyticsData["funnel"]` | Service-derived |
| `GET` | `/admissions/dashboard/charts` | `daysBack?` | `AdmissionsAnalyticsData` | Service-derived |
| `GET` | `/students-guardians/dashboard/metrics` | `academicYearId?`, `termId?` | student dashboard metrics | Service-derived |
| `GET` | `/academics/overview/metrics` | `yearId`, `termId` | `OverviewMetrics` | Adapter-backed |
| `GET` | `/grades/analytics` | `academicYearId`, `termId`, `scopeType?`, `scopeId?`, `subjectId?` | `GradesAnalyticsReport` | Service-derived |
| `GET` | `/reinforcement/summary-card` | none | `{ activeTasks, underReview, completionRate }` | Service-derived |
| `GET` | `/settings/overview` | none | `SettingsOverviewMetrics` | Service-derived |

## Notes

- The home dashboard can either aggregate everything in `/dashboard/summary` or let the frontend load per-feature summary endpoints in parallel.
- If you choose the aggregated endpoint, keep each feature block optional so the UI can degrade gracefully.
