# Students & Guardians API Contract

Status: `Adapter-backed` for core student and enrollment paths, `Service-derived` for extra support endpoints.

Base paths:

- `/students-guardians/students`
- `/students-guardians/enrollments`
- `/students-guardians/documents`
- `/students-guardians/transfers-withdrawals`

## Main Response Models

```ts
interface StudentContact {
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;
}

interface Student {
  id: string;
  applicationId?: string;
  leadId?: string;
  student_id?: string;
  full_name_ar: string;
  full_name_en: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  gradeRequested: string;
  stage?: string;
  status: "Active" | "Suspended" | "Withdrawn" | "Graduated";
  source?: "in_app" | "referral" | "walk_in" | "other";
  submittedDate: string;
  contact: StudentContact;
}

interface StudentGuardian {
  guardianId: string;
  full_name: string;
  relation: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  national_id: string;
  job_title: string;
  workplace: string;
  is_primary: boolean;
  can_pickup: boolean;
  can_receive_notifications: boolean;
}

interface StudentDocument {
  id: string;
  studentId: string;
  type: string;
  name: string;
  status: "complete" | "missing";
  uploadedDate?: string;
}

interface StudentMedicalProfile {
  studentId: string;
  blood_type?: string;
  allergies?: string;
  notes?: string;
  emergency_plan?: string;
}

interface StudentNote {
  id: string;
  studentId: string;
  date: string;
  category: "academic" | "behavioral" | "medical" | "general";
  note: string;
  visibility: "visible_to_guardian" | "internal";
  created_by: string;
}

interface StudentTimelineEvent {
  id: string;
  studentId: string;
  type: string;
  date: string;
  title: string;
  meta?: Record<string, unknown>;
}

interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  academicYearId?: string;
  academicYear: string;
  grade: string;
  gradeId?: string;
  section: string;
  sectionId?: string;
  classroom?: string;
  classroomId?: string;
  enrollmentDate: string;
  status: "active" | "completed" | "withdrawn";
}

interface EnrollmentMovement {
  id: string;
  studentId: string;
  academicYear: string;
  actionType:
    | "enrolled"
    | "transferred_internal"
    | "transferred_external"
    | "withdrawn"
    | "promoted"
    | "reassigned_bulk";
  effectiveDate: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

interface StudentDocumentCenterItem extends StudentDocument {
  studentName: string;
  grade: string;
}

interface StudentDocumentsStats {
  total: number;
  complete: number;
  missing: number;
  completionRate: number;
}
```

## Request DTOs

```ts
interface UpdateStudentPayload {
  full_name_en?: string;
  full_name_ar?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  status?: Student["status"];
  contact?: StudentContact;
}

interface EnrollmentPlacementPayload {
  studentId: string;
  academicYear: string;
  grade: string;
  section: string;
  classroom?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  enrollmentDate?: string;
  status?: StudentEnrollment["status"];
}

interface TransferStudentPayload {
  studentId: string;
  targetSectionId: string;
  targetClassroomId?: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  sourceRequestId?: string;
}

interface WithdrawStudentPayload {
  studentId: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  actionType?: "withdrawn" | "transferred_external";
  sourceRequestId?: string;
}

interface PromoteStudentEnrollmentPayload {
  studentId: string;
  targetAcademicYear: string;
  effectiveDate: string;
  notes?: string;
}

interface BulkAssignStudentsPayload {
  academicYear: string;
  sectionId: string;
  allowOverflow?: boolean;
}
```

## Endpoints

### Students

These paths are already referenced directly by the frontend adapter.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/students-guardians/students` | query: `status?`, `gradeId?`, `search?` | `Student[]` |
| `GET` | `/students-guardians/students/:id` | none | `Student \| null` |
| `PATCH` | `/students-guardians/students/:id` | `UpdateStudentPayload` | `Student` |
| `GET` | `/students-guardians/students/:id/guardians` | none | `StudentGuardian[]` |
| `GET` | `/students-guardians/students/:id/guardians/primary` | none | `StudentGuardian \| null` |
| `GET` | `/students-guardians/students/guardians` | none | `StudentGuardian[]` |
| `GET` | `/students-guardians/students/guardians/:id` | none | `StudentGuardian \| null` |
| `GET` | `/students-guardians/students/guardians/:id/students` | none | `Student[]` |
| `GET` | `/students-guardians/students/with-enrollment` | `academicYearId?`, `termId?` | `Array<Student & { enrollment?: StudentEnrollment }>` |

### Student Support Endpoints

These are recommended to complete the student workspace.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/students-guardians/students/:id/documents` | none | `StudentDocument[]` |
| `POST` | `/students-guardians/students/:id/documents` | `multipart/form-data` plus `type` | `StudentDocument` |
| `GET` | `/students-guardians/students/:id/medical-profile` | none | `StudentMedicalProfile \| null` |
| `PUT` | `/students-guardians/students/:id/medical-profile` | `StudentMedicalProfile` | `StudentMedicalProfile` |
| `GET` | `/students-guardians/students/:id/notes` | none | `StudentNote[]` |
| `POST` | `/students-guardians/students/:id/notes` | `Omit<StudentNote, "id" | "studentId" | "date">` | `StudentNote` |
| `GET` | `/students-guardians/students/:id/timeline` | none | `StudentTimelineEvent[]` |

### Enrollment

The following paths are already used by the enrollment adapter.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/students-guardians/enrollments` | `EnrollmentPlacementPayload` | `StudentEnrollment` |
| `PATCH` | `/students-guardians/enrollments/:id` | `Partial<EnrollmentPlacementPayload> & { status?: StudentEnrollment["status"] }` | `StudentEnrollment` |
| `POST` | `/students-guardians/enrollments/upsert` | `EnrollmentPlacementPayload` | `StudentEnrollment` |
| `POST` | `/students-guardians/enrollments/transfer` | `TransferStudentPayload` | `StudentEnrollment` |
| `POST` | `/students-guardians/enrollments/withdraw` | `WithdrawStudentPayload` | `StudentEnrollment` |
| `POST` | `/students-guardians/enrollments/promote` | `PromoteStudentEnrollmentPayload` | `StudentEnrollment` |
| `POST` | `/students-guardians/enrollments/bulk-assign` | `BulkAssignStudentsPayload` | `{ assignedCount, unassignedCount, perClassroomCounts }` |
| `POST` | `/students-guardians/enrollments/promote-active` | `{ targetAcademicYear: string, effectiveDate: string }` | `StudentEnrollment[]` |
| `GET` | `/students-guardians/enrollments/academic-years` | none | `string[]` |

Recommended support endpoints:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/students-guardians/enrollments/current` | query: `studentId`, `academicYear?` | `StudentEnrollment \| null` |
| `GET` | `/students-guardians/enrollments/history` | query: `studentId` | `StudentEnrollment[]` |
| `GET` | `/students-guardians/enrollments/movements` | query: `studentId` | `EnrollmentMovement[]` |
| `POST` | `/students-guardians/enrollments/validate` | `EnrollmentPlacementPayload` | `{ valid: boolean, errors: string[] }` |

### Documents Center

These paths are already used by the documents adapter.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/students-guardians/documents` | query: `status?`, `gradeId?`, `search?` | `StudentDocumentCenterItem[]` |
| `GET` | `/students-guardians/documents/stats` | none | `StudentDocumentsStats` |

### Transfers and Withdrawals

The create and analytics paths are already used by the adapter.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/students-guardians/transfers-withdrawals/transfers` | `TransferApplication` without `id` and system fields | `TransferApplication` |
| `POST` | `/students-guardians/transfers-withdrawals/withdrawals` | `WithdrawalApplication` without `id` and system fields | `WithdrawalApplication` |
| `PATCH` | `/students-guardians/transfers-withdrawals/transfers/:id/status` | `{ status, rejectionReason? }` | `TransferApplication` |
| `PATCH` | `/students-guardians/transfers-withdrawals/withdrawals/:id/status` | `{ status, rejectionReason? }` | `WithdrawalApplication` |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/overview` | none | overview metrics |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/trend` | `stage=all|primary|preparatory|secondary` | trend points |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/stage-breakdown` | none | stage breakdown |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/withdrawal-reasons` | `stage=all|primary|preparatory|secondary` | reason breakdown |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/behavior-breakdown` | none | behavior breakdown |
| `GET` | `/students-guardians/transfers-withdrawals/analytics/request-rows` | none | table rows |

## Notes

- `with-enrollment` is important because several student pages expect student rows with current placement already joined.
- Keep enrollment placement normalized in storage and derive display labels in the API response.
