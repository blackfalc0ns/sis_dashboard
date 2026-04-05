# Admissions API Contract

Status: `Service-derived`

The admissions feature is still frontend-mock based, so the backend contract below is inferred from current types, pages, and workflow.

Base path: `/admissions`

## Main Response Models

```ts
type LeadChannel = "In-app" | "Referral" | "Walk-in" | "Other";
type LeadStatus = "New" | "Contacted" | "Converted" | "Closed";
type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "test_scheduled"
  | "interview_scheduled"
  | "waitlisted"
  | "accepted"
  | "rejected";
type DecisionType = "accept" | "waitlist" | "reject";
type DocumentStatus = "complete" | "missing";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  createdAt: string;
  gradeInterest?: string;
  source?: string;
  notes?: string;
}

interface ActivityLogItem {
  id: string;
  leadId: string;
  type: "call" | "message" | "meeting" | "note" | "status_change";
  message: string;
  createdAt: string;
  createdBy: string;
}

interface Note {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

interface Guardian {
  id?: string;
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

interface Document {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  uploadedDate?: string;
  url?: string;
  fileType?: "pdf" | "image" | "doc";
}

interface Test {
  id: string;
  applicationId: string;
  type: string;
  subject: string;
  date: string;
  time: string;
  duration?: string;
  location: string;
  proctor?: string;
  status: "scheduled" | "completed" | "cancelled";
  score?: number;
  maxScore?: number;
  notes?: string;
}

interface Interview {
  id: string;
  applicationId: string;
  date: string;
  time: string;
  duration?: string;
  interviewer: string;
  location: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  rating?: number;
}

interface Decision {
  id: string;
  applicationId: string;
  decision: DecisionType;
  reason: string;
  decisionDate: string;
  decidedBy: string;
}

interface Application {
  id: string;
  leadId?: string;
  source?: "in_app" | "referral" | "walk_in" | "other";
  status: ApplicationStatus;
  submittedDate: string;
  full_name_ar: string;
  full_name_en: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;
  grade_requested: string;
  stage?: string;
  previous_school?: string;
  join_date?: string;
  medical_conditions?: string;
  notes?: string;
  guardians: Guardian[];
  documents: Document[];
  tests: Test[];
  interviews: Interview[];
  decision?: Decision;
}
```

## Request DTOs

```ts
interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  gradeInterest?: string;
  source?: string;
  notes?: string;
}

interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: LeadStatus;
}

interface CreateApplicationRequest {
  leadId?: string;
  source?: "in_app" | "referral" | "walk_in" | "other";
  full_name_ar: string;
  full_name_en: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  address_line?: string;
  city?: string;
  district?: string;
  student_phone?: string;
  student_email?: string;
  grade_requested: string;
  stage?: string;
  previous_school?: string;
  join_date?: string;
  medical_conditions?: string;
  notes?: string;
  guardians: Guardian[];
}

interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {
  status?: ApplicationStatus;
}

interface CreateApplicationTestRequest extends Omit<Test, "id" | "applicationId"> {}
interface CreateApplicationInterviewRequest extends Omit<Interview, "id" | "applicationId"> {}
interface UpsertDecisionRequest extends Omit<Decision, "id" | "applicationId"> {}

interface EnrollmentSubmission {
  academicYear: string;
  grade: string;
  section: string;
  classroom: string;
  startDate: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}
```

## Endpoints

### Leads

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/admissions/leads` | query: `status?`, `channel?`, `gradeInterest?`, `search?` | `Lead[]` |
| `POST` | `/admissions/leads` | `CreateLeadRequest` | `Lead` |
| `GET` | `/admissions/leads/:id` | none | `Lead` |
| `PATCH` | `/admissions/leads/:id` | `UpdateLeadRequest` | `Lead` |
| `GET` | `/admissions/leads/:id/activities` | none | `ActivityLogItem[]` |
| `POST` | `/admissions/leads/:id/activities` | `{ type, message }` | `ActivityLogItem` |
| `GET` | `/admissions/leads/:id/notes` | none | `Note[]` |
| `POST` | `/admissions/leads/:id/notes` | `{ body }` | `Note` |
| `GET` | `/admissions/leads/:id/messages` | none | `Array<{ id, body, createdAt, createdBy, isRead }>` |
| `POST` | `/admissions/leads/:id/messages` | `{ body }` | `{ id, body, createdAt, createdBy, isRead }` |
| `POST` | `/admissions/leads/:id/mark-read` | empty body | `{ success: true }` |
| `POST` | `/admissions/leads/:id/convert` | `{ studentName, gradeRequested? }` | `Application` or `{ id, leadId, studentName, gradeRequested, status: "Draft" }` |
| `POST` | `/admissions/leads/import` | `multipart/form-data` or CSV file | `{ imported: number, failed: number, errors?: string[] }` |

### Applications

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/admissions/applications` | query: `status?`, `gradeRequested?`, `source?`, `search?` | `Application[]` |
| `POST` | `/admissions/applications` | `CreateApplicationRequest` | `Application` |
| `GET` | `/admissions/applications/:id` | none | `Application` |
| `PATCH` | `/admissions/applications/:id` | `UpdateApplicationRequest` | `Application` |
| `GET` | `/admissions/applications/:id/guardians` | none | `Guardian[]` |
| `POST` | `/admissions/applications/:id/guardians` | `Guardian` | `Guardian` |
| `GET` | `/admissions/applications/:id/documents` | none | `Document[]` |
| `POST` | `/admissions/applications/:id/documents` | `multipart/form-data` plus `type` | `Document` |
| `GET` | `/admissions/applications/:id/tests` | none | `Test[]` |
| `POST` | `/admissions/applications/:id/tests` | `CreateApplicationTestRequest` | `Test` |
| `GET` | `/admissions/applications/:id/interviews` | none | `Interview[]` |
| `POST` | `/admissions/applications/:id/interviews` | `CreateApplicationInterviewRequest` | `Interview` |
| `GET` | `/admissions/applications/:id/decision` | none | `Decision \| null` |
| `PUT` | `/admissions/applications/:id/decision` | `UpsertDecisionRequest` | `Decision` |
| `GET` | `/admissions/applications/:id/timeline` | none | `Array<{ id, type, title, date, meta? }>` |
| `POST` | `/admissions/applications/:id/enroll` | `EnrollmentSubmission` | `StudentEnrollment` |

### Dashboard Analytics

| Method | Path | Query | Response |
| --- | --- | --- | --- |
| `GET` | `/admissions/dashboard/metrics` | `daysBack?` | `{ leads, applications, accepted, enrolled }` |
| `GET` | `/admissions/dashboard/funnel` | `daysBack?` | `{ leads, applications, accepted, enrolled }` |
| `GET` | `/admissions/dashboard/charts` | `daysBack?` | `{ weeklyInquiries, gradeDistribution }` |

## Notes

- The frontend expects nested data on `Application`, but the database itself should stay normalized.
- A clean backend design is `lead -> application -> decision -> student -> enrollment`.
