# Attendance API Contract

Status: `Service-derived`

The attendance feature currently runs through local services, so the backend contract below is inferred from current types and service signatures.

Base path: `/attendance`

## Main Response Models

```ts
interface AttendancePolicy {
  id: string;
  yearId: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string; classroomId?: string };
  mode: "DAILY" | "PERIOD";
  dailyComputationStrategy?: "MANUAL" | "DERIVED_FROM_PERIODS";
  selectedPeriodIds?: string[];
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
  autoAbsentAfterMinutes?: number;
  absentIfMissedPeriodsCount?: number;
  allowExcuses: boolean;
  requireExcuseReason: boolean;
  requireAttachmentForExcuse: boolean;
  notifyTeachers: boolean;
  notifyStudents: boolean;
  notifyGuardians: boolean;
  notifyOnAbsent: boolean;
  notifyOnLate: boolean;
  notifyOnEarlyLeave: boolean;
  effectiveStartDate: string;
  effectiveEndDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceSession {
  id: string;
  yearId: string;
  termId: string;
  date: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string; classroomId?: string };
  mode: "DAILY" | "PERIOD";
  periodId?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  status: "DRAFT" | "SUBMITTED";
  createdAt: string;
  updatedAt: string;
}

interface AttendanceEntry {
  id: string;
  sessionId: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "EARLY_LEAVE" | "UNMARKED";
  minutesLate?: number;
  minutesEarlyLeave?: number;
  excuseReason?: string;
  excuseAttachments?: Array<{ id: string; name: string; size: number; type: string; uploadedAt?: string }>;
  note?: string;
  hasAttachment?: boolean;
  updatedAt: string;
}

interface AbsenceRecord {
  id: string;
  yearId: string;
  termId: string;
  date: string;
  studentId: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
  status: "ABSENT" | "LATE" | "EARLY_LEAVE" | "EXCUSED" | "UNMARKED";
  granularity: "PERIOD" | "DAILY_DERIVED";
  periodIndex?: number;
  minutesLate?: number;
  minutesEarlyLeave?: number;
  sourceSessionId?: string;
  updatedAt: string;
}

interface Incident {
  id: string;
  yearId: string;
  termId: string;
  date: string;
  periodIndex: number;
  sessionId: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  type: "LATE" | "EARLY_LEAVE";
  minutes: number;
  threshold?: number;
  isViolation: boolean;
  policyScopeSummary: string;
  updatedAt: string;
}

interface ExcuseRequest {
  id: string;
  yearId: string;
  termId: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: { stageId?: string; gradeId?: string; sectionId?: string; classroomId?: string };
  type: "ABSENCE" | "LATE" | "EARLY_LEAVE";
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds?: string[];
  periodIndexes?: number[];
  minutesLate?: number;
  minutesEarlyLeave?: number;
  reasonAr: string;
  reasonEn: string;
  attachments: Array<{ id: string; name: string; size: number; type: string; url?: string }>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionNote?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
  linkedSessionIds?: string[];
}
```

## Core Request DTOs

```ts
type PolicyFormData = Omit<AttendancePolicy, "id" | "createdAt" | "updatedAt">;

interface GetOrCreateSessionRequest {
  yearId: string;
  termId: string;
  date: string;
  scopeType: AttendanceSession["scopeType"];
  scopeIds?: AttendanceSession["scopeIds"];
  mode: AttendanceSession["mode"];
  periodId?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
}

interface UpsertAttendanceEntryRequest {
  yearId: string;
  termId: string;
  sessionId: string;
  studentId: string;
  patch: Partial<AttendanceEntry>;
}

type CreateExcuseRequest = Omit<
  ExcuseRequest,
  "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds"
>;
```

## Endpoints

### Policies

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/attendance/policies` | query: `yearId`, `termId` | `AttendancePolicy[]` |
| `POST` | `/attendance/policies` | `PolicyFormData` | `AttendancePolicy` |
| `PATCH` | `/attendance/policies/:id` | `Partial<PolicyFormData>` | `AttendancePolicy` |
| `DELETE` | `/attendance/policies/:id` | none | `void` |
| `GET` | `/attendance/policies/effective` | query: `yearId`, `termId`, `scopeType`, `date`, `stageId?`, `gradeId?`, `sectionId?`, `classroomId?` | `AttendancePolicy \| null` |

### Roll Call

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/attendance/roll-call/roster` | query: `scopeType`, `stageId?`, `gradeId?`, `sectionId?`, `classroomId?` | `RosterStudent[]` |
| `GET` | `/attendance/roll-call/sessions` | query: `yearId`, `termId`, `startDate?`, `endDate?`, `scopeType?`, scope ids | `AttendanceSession[]` |
| `POST` | `/attendance/roll-call/sessions` | `GetOrCreateSessionRequest` | `{ session: AttendanceSession, entries: AttendanceEntry[] }` |
| `PUT` | `/attendance/roll-call/sessions/:id` | `{ session: AttendanceSession, entries: AttendanceEntry[] }` | `{ session, entries }` |
| `POST` | `/attendance/roll-call/sessions/:id/submit` | `{ yearId, termId }` | `AttendanceSession` |
| `POST` | `/attendance/roll-call/sessions/:id/unsubmit` | `{ yearId, termId }` | `AttendanceSession` |
| `DELETE` | `/attendance/roll-call/sessions/:id` | query: `yearId`, `termId` | `void` |
| `GET` | `/attendance/roll-call/sessions/:id/entries` | query: `yearId`, `termId` | `AttendanceEntry[]` |
| `PUT` | `/attendance/roll-call/entries` | `UpsertAttendanceEntryRequest` | `AttendanceEntry` |

### Absences and Late/Early

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/attendance/absences` | filters from `AbsencesFilters` | `{ rows: AbsenceRecord[], kpis: AbsencesKPIs }` |
| `PATCH` | `/attendance/absences/:id/excuse` | `{ excuseReason?, excuseAttachments? }` | `AbsenceRecord` |
| `PATCH` | `/attendance/absences/:id/early-leave` | `{ minutesEarlyLeave }` | `AbsenceRecord` |
| `GET` | `/attendance/late-early` | filters from `LateEarlyFilters` | `{ rows: Incident[], kpis: LateEarlyKpis }` |
| `PATCH` | `/attendance/late-early/:id/minutes` | `{ minutes }` | `Incident` |

### Excuses

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/attendance/excuses` | filters from `ExcuseRequestFilters` plus `yearId`, `termId` | `ExcuseRequest[]` |
| `POST` | `/attendance/excuses` | `CreateExcuseRequest` | `ExcuseRequest` |
| `PATCH` | `/attendance/excuses/:id` | partial editable fields from `ExcuseRequest` | `ExcuseRequest` |
| `DELETE` | `/attendance/excuses/:id` | none | `void` |
| `POST` | `/attendance/excuses/:id/approve` | `{ decisionNote?, decidedBy? }` | `ExcuseRequest` |
| `POST` | `/attendance/excuses/:id/reject` | `{ decisionNote?, decidedBy? }` | `ExcuseRequest` |
| `POST` | `/attendance/excuses/validate` | `{ payload, effectivePolicy, termRange }` | `ExcuseValidationErrors` |
| `GET` | `/attendance/excuses/policy-range` | query: `yearId`, `termId`, `dateFrom`, `dateTo`, `scopeType`, scope ids | `{ code, severity, message } \| null` |
| `GET` | `/attendance/excuses/effective-policy` | query: `yearId`, `termId`, `scopeType`, `date`, scope ids | `AttendancePolicy \| null` |

### Reports

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/attendance/reports` | filters from `AttendanceReportsFilters` | `AttendanceReportsData` |

## Notes

- Policy resolution is hierarchical: `CLASSROOM > SECTION > GRADE > STAGE > SCHOOL`.
- `periodId` should be the canonical timetable period identifier; `periodIndex` is display-only.
