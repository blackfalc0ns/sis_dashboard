# Academics API Contract

Status: `Adapter-backed`

Base paths already referenced by the frontend:

- `/academics/overview`
- `/academics/structure`
- `/academics/subjects`
- `/academics/teacher-allocation`
- `/academics/rooms`
- `/academics/calendar`
- `/academics/curriculum`
- `/academics/lesson-plans`
- `/academics/timetable`

## Key Models

```ts
interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}
interface Term {
  id: string;
  yearId: string;
  name: string;
  status: "open" | "closed";
  startDate: string;
  endDate: string;
}
interface Stage {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  description?: string;
}
interface Grade {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  stageId: string;
  order: number;
  notes?: string;
}
interface Section {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  gradeId: string;
  capacity: number;
  order: number;
  notes?: string;
}
interface Classroom {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  sectionId: string;
  capacity: number;
  order: number;
  notes?: string;
}
interface StructureTree {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
}

interface Subject {
  id: string;
  termId: string;
  name: string;
  nameAr: string;
  nameEn: string;
  code?: string;
  stage?: string;
  isActive: boolean;
}
interface SubjectAllocation {
  gradeId: string;
  subjectId: string;
  weeklyHours: number;
}

interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
  email?: string;
  maxWeeklyLoad?: number;
  subjects?: string[];
  isActive: boolean;
}
interface TeacherAllocation {
  id: string;
  termId: string;
  sectionId: string;
  classroomId?: string;
  subjectId: string;
  teacherId: string | null;
}

interface Room {
  id: string;
  schoolId: string;
  nameAr: string;
  nameEn: string;
  type: "CLASSROOM" | "LAB" | "OTHER";
  capacity: number;
  isActive: boolean;
}
interface RoomDefaultAssignment {
  id: string;
  schoolId: string;
  scopeType: string;
  scopeId: string;
  roomId: string;
}

interface AcademicEvent {
  id: string;
  termId: string;
  titleAr: string;
  titleEn: string;
  type: "HOLIDAY" | "EXAM" | "ACTIVITY" | "OTHER";
  allDay: boolean;
  startDate: string;
  endDate: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
  scopeId?: string;
  notesAr?: string;
  notesEn?: string;
  notify?: boolean;
  createdAt: string;
}

interface Curriculum {
  id: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  name?: string;
  createdAt: string;
}
interface Unit {
  id: string;
  curriculumId: string;
  title: string;
  titleAr: string;
  titleEn: string;
  description?: string;
  order: number;
}
interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleAr: string;
  titleEn: string;
  objectives?: string;
  resources?: string;
  durationMinutes?: number;
  plannedWeek: number;
  status: "planned" | "done";
  doneAt?: string;
  order: number;
}

interface LessonPlanItem {
  id: string;
  planId: string;
  lessonId: string;
  unitId?: string;
  status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  order: number;
  notesAr?: string;
  notesEn?: string;
}

interface TimetableEntry {
  id: string;
  termId: string;
  sectionId: string;
  classroomId?: string;
  dayKey: string;
  periodIndex: number;
  subjectId: string | null;
  teacherId: string | null;
  roomId: string | null;
  status?: "DRAFT" | "PUBLISHED";
}
```

## Core Request DTOs

```ts
interface CarryOverOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  copyCapacities?: boolean;
  copyOrdering?: boolean;
}

interface CarryOverSubjectsOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  options: { copySubjects: boolean; copyAllocations: boolean };
}

interface CarryOverCurriculumOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  gradeId: string;
  subjectId: string;
  options: { copyOutline: boolean; copySchedule: boolean };
}

interface LessonPlanItemUpsertPayload {
  termId: string;
  sectionId: string;
  subjectId: string;
  classroomId?: string;
  teacherId?: string;
  weekIndex: number;
  lessonId: string;
  unitId?: string;
  status?: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  order?: number;
  notesAr?: string;
  notesEn?: string;
}
```

## Endpoints

### Overview

| Method | Path                          | Request                   | Response          |
| ------ | ----------------------------- | ------------------------- | ----------------- |
| `GET`  | `/academics/overview/metrics` | query: `yearId`, `termId` | `OverviewMetrics` |

### Academic Structure

| Method   | Path                                      | Request                                              | Response         |
| -------- | ----------------------------------------- | ---------------------------------------------------- | ---------------- |
| `GET`    | `/academics/structure/years`              | none                                                 | `AcademicYear[]` |
| `POST`   | `/academics/structure/years`              | `Omit<AcademicYear, "id">`                           | `AcademicYear`   |
| `PATCH`  | `/academics/structure/years/:id`          | `Partial<Omit<AcademicYear, "id">>`                  | `AcademicYear`   |
| `GET`    | `/academics/structure/terms`              | query: `yearId`                                      | `Term[]`         |
| `POST`   | `/academics/structure/terms`              | `Omit<Term, "id">`                                   | `Term`           |
| `PATCH`  | `/academics/structure/terms/:id`          | `Partial<Omit<Term, "id">>`                          | `Term`           |
| `GET`    | `/academics/structure/tree`               | query: `yearId`, `termId`                            | `StructureTree`  |
| `POST`   | `/academics/structure/stages`             | `{ yearId, termId, ...stage }`                       | `Stage`          |
| `PATCH`  | `/academics/structure/stages/:id`         | `{ yearId, termId, ...partialStage }`                | `Stage`          |
| `DELETE` | `/academics/structure/stages/:id`         | query: `yearId`, `termId`                            | `void`           |
| `POST`   | `/academics/structure/grades`             | `{ yearId, termId, ...grade }`                       | `Grade`          |
| `PATCH`  | `/academics/structure/grades/:id`         | `{ yearId, termId, ...partialGrade }`                | `Grade`          |
| `DELETE` | `/academics/structure/grades/:id`         | query: `yearId`, `termId`                            | `void`           |
| `POST`   | `/academics/structure/sections`           | `{ yearId, termId, ...section }`                     | `Section`        |
| `PATCH`  | `/academics/structure/sections/:id`       | `{ yearId, termId, ...partialSection }`              | `Section`        |
| `DELETE` | `/academics/structure/sections/:id`       | query: `yearId`, `termId`                            | `void`           |
| `POST`   | `/academics/structure/classrooms`         | `{ yearId, termId, ...classroom }`                   | `Classroom`      |
| `PATCH`  | `/academics/structure/classrooms/:id`     | `{ yearId, termId, ...partialClassroom }`            | `Classroom`      |
| `DELETE` | `/academics/structure/classrooms/:id`     | query: `yearId`, `termId`                            | `void`           |
| `POST`   | `/academics/structure/grades/reorder`     | `{ yearId, termId, stageId, orderedGradeIds }`       | `void`           |
| `POST`   | `/academics/structure/sections/reorder`   | `{ yearId, termId, gradeId, orderedSectionIds }`     | `void`           |
| `POST`   | `/academics/structure/classrooms/reorder` | `{ yearId, termId, sectionId, orderedClassroomIds }` | `void`           |
| `POST`   | `/academics/structure/carry-over`         | `CarryOverOptions`                                   | `void`           |

### Subjects

| Method   | Path                              | Request                                                         | Response              |
| -------- | --------------------------------- | --------------------------------------------------------------- | --------------------- |
| `GET`    | `/academics/subjects`             | query: `termId`                                                 | `Subject[]`           |
| `POST`   | `/academics/subjects`             | `{ termId, nameAr, nameEn, code?, stage?, isActive }`           | `Subject`             |
| `PATCH`  | `/academics/subjects/:id`         | `{ termId, ...partialSubject }`                                 | `Subject`             |
| `DELETE` | `/academics/subjects/:id`         | query: `termId`                                                 | `void`                |
| `GET`    | `/academics/subjects/allocations` | query: `termId`                                                 | `SubjectAllocation[]` |
| `PUT`    | `/academics/subjects/allocations` | `{ termId, items: Array<{ gradeId, subjectId, weeklyHours }> }` | `void`                |
| `POST`   | `/academics/subjects/carry-over`  | `CarryOverSubjectsOptions`                                      | `void`                |

### Teacher Allocation

| Method   | Path                                                      | Request                                                                         | Response              |
| -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------- |
| `GET`    | `/academics/teacher-allocation/teachers`                  | none                                                                            | `Teacher[]`           |
| `POST`   | `/academics/teacher-allocation/teachers`                  | `Omit<Teacher, "id">`                                                           | `Teacher`             |
| `PATCH`  | `/academics/teacher-allocation/teachers/:id`              | `Partial<Omit<Teacher, "id">>`                                                  | `Teacher`             |
| `DELETE` | `/academics/teacher-allocation/teachers/:id`              | none                                                                            | `void`                |
| `GET`    | `/academics/teacher-allocation/allocations`               | query: `termId`                                                                 | `TeacherAllocation[]` |
| `PUT`    | `/academics/teacher-allocation/allocations`               | `{ termId, items }`                                                             | `void`                |
| `POST`   | `/academics/teacher-allocation/allocations/clear`         | `{ termId, gradeId, subjectId }`                                                | `void`                |
| `POST`   | `/academics/teacher-allocation/allocations/apply-teacher` | `{ termId, gradeId, subjectId, teacherId, sectionIds, classroomIdsBySection? }` | `void`                |
| `POST`   | `/academics/teacher-allocation/analytics/teacher-loads`   | `{ termId, structureData, subjectAllocations, teacherAllocations }`             | `TeacherLoad[]`       |
| `POST`   | `/academics/teacher-allocation/validation`                | `{ termId, structureData, subjectAllocations }`                                 | `ValidationResult`    |
| `POST`   | `/academics/teacher-allocation/carry-over`                | `{ fromYearId, fromTermId, toYearId, toTermId }`                                | `void`                |

### Rooms

| Method   | Path                            | Request                                                  | Response                  |
| -------- | ------------------------------- | -------------------------------------------------------- | ------------------------- |
| `GET`    | `/academics/rooms`              | query: `schoolId`                                        | `Room[]`                  |
| `POST`   | `/academics/rooms`              | `{ schoolId, nameAr, nameEn, type, capacity, isActive }` | `Room`                    |
| `PATCH`  | `/academics/rooms/:id`          | `Partial<Room>`                                          | `Room`                    |
| `DELETE` | `/academics/rooms/:id`          | none                                                     | `void`                    |
| `GET`    | `/academics/rooms/defaults`     | query: `schoolId`                                        | `RoomDefaultAssignment[]` |
| `POST`   | `/academics/rooms/defaults`     | `{ schoolId, scopeType, scopeId, roomId }`               | `RoomDefaultAssignment`   |
| `PATCH`  | `/academics/rooms/defaults/:id` | `Partial<RoomDefaultAssignment>`                         | `RoomDefaultAssignment`   |
| `DELETE` | `/academics/rooms/defaults/:id` | none                                                     | `void`                    |

### Calendar

| Method   | Path                             | Request                  | Response          |
| -------- | -------------------------------- | ------------------------ | ----------------- |
| `GET`    | `/academics/calendar`            | query: `termId`          | `AcademicEvent[]` |
| `POST`   | `/academics/calendar`            | `{ termId, ...event }`   | `AcademicEvent`   |
| `PATCH`  | `/academics/calendar/:id`        | `Partial<AcademicEvent>` | `AcademicEvent`   |
| `DELETE` | `/academics/calendar/:id`        | none                     | `void`            |
| `POST`   | `/academics/calendar/:id/notify` | empty body               | `void`            |

### Curriculum

| Method   | Path                                                  | Request                                                                        | Response             |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| `GET`    | `/academics/curriculum`                               | query: `termId`, `gradeId`, `subjectId`                                        | `Curriculum \| null` |
| `POST`   | `/academics/curriculum`                               | `{ termId, gradeId, subjectId, name? }`                                        | `Curriculum`         |
| `PATCH`  | `/academics/curriculum/:id`                           | `Partial<{ name?: string }>`                                                   | `Curriculum`         |
| `GET`    | `/academics/curriculum/:curriculumId/units`           | none                                                                           | `Unit[]`             |
| `POST`   | `/academics/curriculum/:curriculumId/units`           | `{ titleAr, titleEn, description? }`                                           | `Unit`               |
| `PATCH`  | `/academics/curriculum/units/:unitId`                 | `Partial<Unit>`                                                                | `Unit`               |
| `DELETE` | `/academics/curriculum/units/:unitId`                 | none                                                                           | `void`               |
| `POST`   | `/academics/curriculum/:curriculumId/units/reorder`   | `{ orderedUnitIds }`                                                           | `void`               |
| `GET`    | `/academics/curriculum/units/:unitId/lessons`         | none                                                                           | `Lesson[]`           |
| `GET`    | `/academics/curriculum/:curriculumId/lessons`         | none                                                                           | `Lesson[]`           |
| `POST`   | `/academics/curriculum/units/:unitId/lessons`         | `{ titleAr, titleEn, objectives?, resources?, durationMinutes?, plannedWeek }` | `Lesson`             |
| `PATCH`  | `/academics/curriculum/lessons/:lessonId`             | `Partial<Lesson>`                                                              | `Lesson`             |
| `DELETE` | `/academics/curriculum/lessons/:lessonId`             | none                                                                           | `void`               |
| `POST`   | `/academics/curriculum/units/:unitId/lessons/reorder` | `{ orderedLessonIds }`                                                         | `void`               |
| `PATCH`  | `/academics/curriculum/lessons/:lessonId/schedule`    | `{ plannedWeek }`                                                              | `Lesson`             |
| `POST`   | `/academics/curriculum/lessons/:lessonId/done`        | empty body                                                                     | `Lesson`             |
| `DELETE` | `/academics/curriculum/lessons/:lessonId/done`        | none                                                                           | `Lesson`             |
| `POST`   | `/academics/curriculum/carry-over`                    | `CarryOverCurriculumOptions`                                                   | `void`               |

### Curriculum Attachments and Video

These paths are already hardcoded in the frontend adapter and should be implemented as-is.

| Method   | Path                                                       | Request                                                  | Response              |
| -------- | ---------------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| `GET`    | `/academics/curriculum/lessons/:lessonId/attachments`      | none                                                     | `LessonAttachment[]`  |
| `POST`   | `/academics/curriculum/lessons/:lessonId/attachments/file` | `multipart/form-data` with `file`, `title?`, `category?` | `LessonAttachment`    |
| `POST`   | `/academics/curriculum/lessons/:lessonId/attachments/link` | `{ title, url, category? }`                              | `LessonAttachment`    |
| `DELETE` | `/academics/curriculum/attachments/:attachmentId`          | none                                                     | `void`                |
| `GET`    | `/academics/curriculum/lessons/:lessonId/video`            | none                                                     | `LessonVideo \| null` |
| `PUT`    | `/academics/curriculum/lessons/:lessonId/video/link`       | `{ titleAr, titleEn, url }`                              | `LessonVideo`         |
| `PUT`    | `/academics/curriculum/lessons/:lessonId/video/file`       | `multipart/form-data` with `file`, `titleAr`, `titleEn`  | `LessonVideo`         |
| `DELETE` | `/academics/curriculum/lessons/:lessonId/video`            | none                                                     | `void`                |

### Curriculum Assignments

| Method   | Path                                                                | Request                                                                                   | Response             |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------- |
| `GET`    | `/academics/curriculum/lessons/:lessonId/assignments`               | none                                                                                      | `Assignment[]`       |
| `GET`    | `/academics/curriculum/lessons/:lessonId/assignments/:assignmentId` | none                                                                                      | `Assignment \| null` |
| `POST`   | `/academics/curriculum/lessons/:lessonId/assignments`               | `{ titleAr, titleEn, descriptionAr?, descriptionEn?, dueDate?, maxScore?, isPublished? }` | `Assignment`         |
| `PATCH`  | `/academics/curriculum/assignments/:assignmentId`                   | `Partial<Assignment>`                                                                     | `Assignment`         |
| `DELETE` | `/academics/curriculum/assignments/:assignmentId`                   | none                                                                                      | `void`               |

### Assignment Attachments

| Method   | Path                                                               | Request                                     | Response                 |
| -------- | ------------------------------------------------------------------ | ------------------------------------------- | ------------------------ |
| `GET`    | `/academics/curriculum/assignments/:assignmentId/attachments`      | none                                        | `AssignmentAttachment[]` |
| `POST`   | `/academics/curriculum/assignments/:assignmentId/attachments/file` | `multipart/form-data` with `file`, `title?` | `AssignmentAttachment`   |
| `POST`   | `/academics/curriculum/assignments/:assignmentId/attachments/link` | `{ title, url }`                            | `AssignmentAttachment`   |
| `DELETE` | `/academics/curriculum/assignments/attachments/:attachmentId`      | none                                        | `void`                   |

### Assignment Questions

| Method   | Path                                                                | Request                                                                                                                | Response               |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `GET`    | `/academics/curriculum/assignments/:assignmentId/questions`         | none                                                                                                                   | `AssignmentQuestion[]` |
| `POST`   | `/academics/curriculum/assignments/:assignmentId/questions`         | `{ questionTextAr, questionTextEn, questionType, points, options?, correctAnswer?, sampleAnswerAr?, sampleAnswerEn? }` | `AssignmentQuestion`   |
| `PATCH`  | `/academics/curriculum/questions/:questionId`                       | `Partial<AssignmentQuestion>`                                                                                          | `AssignmentQuestion`   |
| `DELETE` | `/academics/curriculum/questions/:questionId`                       | none                                                                                                                   | `void`                 |
| `POST`   | `/academics/curriculum/assignments/:assignmentId/questions/reorder` | `{ orderedQuestionIds }`                                                                                               | `void`                 |
| `PATCH`  | `/academics/curriculum/assignments/:assignmentId/questions/points`  | `{ updates: Array<{ questionId, points }> }`                                                                           | `void`                 |

### Lesson Plans

| Method   | Path                                           | Request                                                                            | Response            |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `GET`    | `/academics/lesson-plans`                      | query: `termId`, `sectionId`, `subjectId`, `classroomId?`                          | `LessonPlan[]`      |
| `PUT`    | `/academics/lesson-plans/items`                | `LessonPlanItemUpsertPayload`                                                      | `LessonPlanItem`    |
| `DELETE` | `/academics/lesson-plans/items`                | query: `termId`, `sectionId`, `subjectId`, `itemId`, `classroomId?`                | `void`              |
| `POST`   | `/academics/lesson-plans/items/reorder`        | `{ termId, sectionId, subjectId, weekIndex, orderedItemIds, classroomId? }`        | `void`              |
| `POST`   | `/academics/lesson-plans/items/move`           | `{ termId, sectionId, subjectId, itemId, toWeekIndex, toOrder?, classroomId? }`    | `void`              |
| `PATCH`  | `/academics/lesson-plans/items/:itemId/status` | `{ termId, sectionId, subjectId, status, classroomId? }`                           | `void`              |
| `PATCH`  | `/academics/lesson-plans/items/:itemId/notes`  | `{ termId, sectionId, subjectId, notesAr?, notesEn?, classroomId? }`               | `void`              |
| `GET`    | `/academics/lesson-plans/summary`              | query: `termId`, `sectionId`, `subjectId`, `classroomId?`                          | `LessonPlanSummary` |
| `POST`   | `/academics/lesson-plans/auto-plan`            | `{ termId, sectionId, subjectId, classroomId?, teacherId?, lessonIds, weekCount }` | `void`              |

### Timetable

| Method   | Path                             | Request                                                       | Response                    |
| -------- | -------------------------------- | ------------------------------------------------------------- | --------------------------- |
| `GET`    | `/academics/timetable`           | query: `termId`, `sectionId`, `classroomId?`                  | `TimetableEntry[]`          |
| `GET`    | `/academics/timetable/all`       | query: `termId`                                               | `TimetableEntry[]`          |
| `PUT`    | `/academics/timetable/entries`   | `{ termId, sectionId, classroomId?, entries }`                | `TimetableEntry[]`          |
| `DELETE` | `/academics/timetable/entry`     | query: `termId`, `sectionId`, `day`, `period`, `classroomId?` | `void`                      |
| `POST`   | `/academics/timetable/validate`  | optional full timetable payload                               | `TimetableValidationResult` |
| `POST`   | `/academics/timetable/publish`   | `{ termId, sectionId, classroomId? }`                         | `void`                      |
| `POST`   | `/academics/timetable/unpublish` | `{ termId, sectionId, classroomId? }`                         | `void`                      |

Recommended config endpoints used by the timetable configuration service:

| Method   | Path                                | Request                                  | Response                  |
| -------- | ----------------------------------- | ---------------------------------------- | ------------------------- | ----------------- |
| `GET`    | `/academics/timetable/configs`      | query: `termId`                          | `TimetableConfig[]`       |
| `GET`    | `/academics/timetable/config`       | query: `termId`, `scopeType`, `scopeId?` | `TimetableConfig \| null` |
| `PUT`    | `/academics/timetable/config`       | `Omit<TimetableConfig, "id"              | "updatedAt">`             | `TimetableConfig` |
| `DELETE` | `/academics/timetable/config/:id`   | none                                     | `void`                    |
| `POST`   | `/academics/timetable/config/reset` | `{ termId, scopeType, scopeId }`         | `void`                    |

## Notes

- All paths above should stay stable because the frontend already hardcodes most of them inside adapters.
- Curriculum and lesson plan features are deeply nested; returning normalized DB rows directly will not match the current UI well.
