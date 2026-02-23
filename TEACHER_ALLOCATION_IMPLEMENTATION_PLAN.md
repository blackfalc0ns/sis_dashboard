# Teacher Allocation - Implementation Plan

## Overview
Tab 7 "Teacher Allocation / توزيع المعلمين" - A comprehensive term-scoped feature for assigning teachers to Section × Subject combinations with workload analytics and validation.

## Architecture

### Two Internal Views
1. **Allocation Matrix** - Assign teachers to section-subject combinations
2. **Teacher Load** - Analytics and workload visualization

### Data Flow
```
URL Params (year, term) 
  → Context Bar 
  → Load Data (structure, subjects, teachers, allocations)
  → Matrix View / Load View
  → Bulk Actions / Validation
```

## Files to Create

### 1. Service Layer
- `src/services/academics/teacherAllocationService.ts`
  - Teacher CRUD
  - Allocation CRUD
  - Bulk operations
  - Carry over
  - Validation logic

### 2. Page Component
- `src/app/[lang]/(dashboard)/academics/teacher-allocation/page.tsx`
  - Route wrapper

- `src/components/features/academics/components/pages/TeacherAllocationPage.tsx`
  - Main page with Context Bar
  - Tab switching (Matrix / Load)
  - Data loading
  - Filter state management

### 3. Matrix View Components
- `src/components/features/academics/components/teacher-allocation/AllocationMatrix.tsx`
  - DataTable-based matrix
  - Rows: Sections
  - Columns: Subjects (with weeklyHours > 0)
  - Cells: Teacher Autocomplete

- `src/components/features/academics/components/teacher-allocation/TeacherSelect.tsx`
  - Reusable teacher autocomplete
  - Shows current load
  - Filtered by availability

### 4. Load View Components
- `src/components/features/academics/components/teacher-allocation/TeacherLoadView.tsx`
  - KPI cards
  - Load chart/table
  - Expandable rows with breakdown

### 5. Dialogs
- `src/components/features/academics/components/teacher-allocation/ValidationPanel.tsx`
  - Drawer/Panel showing validation results
  - Missing assignments
  - Overloaded teachers
  - Quick-fix actions

- `src/components/features/academics/components/teacher-allocation/CarryOverDialog.tsx`
  - Copy allocations from another term
  - Source term selection
  - Options

- `src/components/features/academics/components/teacher-allocation/BulkActionDialog.tsx`
  - Apply teacher to all sections in grade
  - Confirmation with impact preview

### 6. Shared Components
- `src/components/features/academics/components/teacher-allocation/FilterBar.tsx`
  - Stage/Grade/Section filters
  - Subject filter
  - Teacher search
  - Action buttons (Validate, Copy)

## Data Models

### Teacher
```typescript
interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
  email?: string;
  maxWeeklyLoad?: number; // Optional constraint
  subjects?: string[]; // Qualified subject IDs
  isActive: boolean;
}
```

### TeacherAllocation
```typescript
interface TeacherAllocation {
  id: string;
  termId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string | null;
}
```

### TeacherLoad
```typescript
interface TeacherLoad {
  teacherId: string;
  teacherName: string;
  totalWeeklyPeriods: number;
  assignments: {
    sectionId: string;
    sectionName: string;
    gradeId: string;
    gradeName: string;
    subjectId: string;
    subjectName: string;
    weeklyHours: number;
  }[];
}
```

### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;
  missingCount: number;
  overloadedCount: number;
  issues: {
    type: 'missing' | 'overloaded' | 'unqualified';
    sectionId: string;
    sectionName: string;
    gradeId: string;
    gradeName: string;
    subjectId?: string;
    subjectName?: string;
    teacherId?: string;
    teacherName?: string;
    details: string;
  }[];
}
```

## Service Functions

### Teacher Management
- `fetchTeachers(): Promise<Teacher[]>`
- `createTeacher(payload): Promise<Teacher>`
- `updateTeacher(id, payload): Promise<Teacher>`
- `deleteTeacher(id): Promise<void>`

### Allocation Management
- `fetchTeacherAllocations(termId): Promise<TeacherAllocation[]>`
- `bulkUpsertTeacherAllocations(termId, items): Promise<void>`
- `clearAllocationsForSubject(termId, gradeId, subjectId): Promise<void>`
- `applyTeacherToGrade(termId, gradeId, subjectId, teacherId): Promise<void>`

### Analytics
- `calculateTeacherLoads(termId): Promise<TeacherLoad[]>`
- `validateAllocations(termId): Promise<ValidationResult>`

### Carry Over
- `carryOverTeacherAllocations(params): Promise<void>`

## UI Components Structure

### AllocationMatrix
```
FilterBar
  ├─ Stage Select
  ├─ Grade Select (required)
  ├─ Section Select (optional)
  ├─ Subject Filter
  ├─ Show Only Missing Toggle
  └─ Actions (Validate, Copy)

DataTable
  ├─ Columns
  │   ├─ Section (pinned)
  │   ├─ Subject 1 (dynamic)
  │   ├─ Subject 2 (dynamic)
  │   ├─ ...
  │   └─ Missing Count (pinned)
  └─ Rows (Sections)
      └─ Cells (TeacherSelect)
```

### TeacherLoadView
```
KPI Cards
  ├─ Total Teachers
  ├─ Teachers with 0 Load
  ├─ Average Load
  └─ Max Load

Chart/Table
  └─ Teacher Load Bars

DataTable
  ├─ Teacher Name
  ├─ Weekly Load
  ├─ Sections Count
  ├─ Subjects Count
  └─ Expandable Row (Breakdown)
```

## Translation Keys

### English (en.json)
```json
"academics": {
  "teacherAllocation": {
    "title": "Teacher Allocation",
    "tabs": {
      "matrix": "Allocation Matrix",
      "load": "Teacher Load"
    },
    "filters": {
      "stage": "Stage",
      "grade": "Grade",
      "section": "Section",
      "subject": "Subject",
      "searchTeacher": "Search teacher",
      "allStages": "All Stages",
      "allGrades": "All Grades",
      "allSections": "All Sections",
      "allSubjects": "All Subjects",
      "showOnlyMissing": "Show only missing"
    },
    "actions": {
      "validate": "Validate",
      "copyFromTerm": "Copy from Term",
      "applyToAllSections": "Apply to All Sections",
      "clearSelection": "Clear",
      "save": "Save Changes",
      "saving": "Saving...",
      "reset": "Reset"
    },
    "matrix": {
      "section": "Section",
      "missingCount": "Missing",
      "selectTeacher": "Select teacher",
      "noTeacher": "No teacher assigned",
      "currentLoad": "{hours}/wk"
    },
    "load": {
      "title": "Teacher Workload",
      "kpi": {
        "totalTeachers": "Total Teachers",
        "teachersWithZeroLoad": "Unassigned",
        "avgLoad": "Average Load",
        "maxLoad": "Max Load"
      },
      "table": {
        "teacher": "Teacher",
        "weeklyLoad": "Weekly Load",
        "sections": "Sections",
        "subjects": "Subjects"
      },
      "breakdown": {
        "grade": "Grade",
        "section": "Section",
        "subject": "Subject",
        "hours": "Hours"
      }
    },
    "validation": {
      "title": "Validation Results",
      "summary": {
        "missingAssignments": "Missing Assignments",
        "sectionsWithMissing": "Sections with Missing",
        "overloadedTeachers": "Overloaded Teachers"
      },
      "issues": {
        "missing": "Missing teacher for {subject} in {section}",
        "overloaded": "{teacher} exceeds max load ({current}/{max})",
        "unqualified": "{teacher} not qualified for {subject}"
      },
      "noIssues": "All allocations are valid"
    },
    "bulkAction": {
      "title": "Apply Teacher to All Sections",
      "message": "Apply {teacher} to {subject} for all sections in {grade}?",
      "impact": "This will affect {count} sections",
      "confirm": "Apply",
      "cancel": "Cancel"
    },
    "carryOver": {
      "title": "Copy Allocations from Term",
      "sourceYear": "Source Year",
      "sourceTerm": "Source Term",
      "options": {
        "includeAllocations": "Include teacher allocations"
      },
      "confirm": "Copy",
      "success": "Allocations copied successfully"
    },
    "readOnlyBanner": "This term is closed. Teacher allocation is read-only.",
    "emptyState": {
      "noGrades": {
        "title": "No Grades Found",
        "message": "Please create grades in Academic Structure first"
      },
      "noSubjects": {
        "title": "No Subjects Found",
        "message": "Please create subjects in Subjects & Allocation first"
      },
      "noTeachers": {
        "title": "No Teachers Found",
        "message": "Please add teachers to the system first"
      }
    }
  }
}
```

### Arabic (ar.json)
```json
"academics": {
  "teacherAllocation": {
    "title": "توزيع المعلمين",
    "tabs": {
      "matrix": "جدول التوزيع",
      "load": "حمل المعلمين"
    },
    "filters": {
      "stage": "المرحلة",
      "grade": "الصف",
      "section": "الشعبة",
      "subject": "المادة",
      "searchTeacher": "بحث عن معلم",
      "allStages": "كل المراحل",
      "allGrades": "كل الصفوف",
      "allSections": "كل الشعب",
      "allSubjects": "كل المواد",
      "showOnlyMissing": "إظهار الناقص فقط"
    },
    "actions": {
      "validate": "التحقق",
      "copyFromTerm": "نسخ من ترم",
      "applyToAllSections": "تطبيق على كل الشعب",
      "clearSelection": "مسح",
      "save": "حفظ التغييرات",
      "saving": "جاري الحفظ...",
      "reset": "إعادة تعيين"
    },
    "matrix": {
      "section": "الشعبة",
      "missingCount": "ناقص",
      "selectTeacher": "اختر معلم",
      "noTeacher": "لا يوجد معلم",
      "currentLoad": "{hours}/أسبوع"
    },
    "load": {
      "title": "حمل المعلمين",
      "kpi": {
        "totalTeachers": "إجمالي المعلمين",
        "teachersWithZeroLoad": "غير مخصصين",
        "avgLoad": "متوسط الحمل",
        "maxLoad": "أقصى حمل"
      },
      "table": {
        "teacher": "المعلم",
        "weeklyLoad": "الحمل الأسبوعي",
        "sections": "الشعب",
        "subjects": "المواد"
      },
      "breakdown": {
        "grade": "الصف",
        "section": "الشعبة",
        "subject": "المادة",
        "hours": "الساعات"
      }
    },
    "validation": {
      "title": "نتائج التحقق",
      "summary": {
        "missingAssignments": "التخصيصات الناقصة",
        "sectionsWithMissing": "الشعب الناقصة",
        "overloadedTeachers": "المعلمون المحملون"
      },
      "issues": {
        "missing": "معلم ناقص لـ {subject} في {section}",
        "overloaded": "{teacher} يتجاوز الحمل الأقصى ({current}/{max})",
        "unqualified": "{teacher} غير مؤهل لـ {subject}"
      },
      "noIssues": "جميع التخصيصات صحيحة"
    },
    "bulkAction": {
      "title": "تطبيق المعلم على كل الشعب",
      "message": "تطبيق {teacher} على {subject} لكل الشعب في {grade}؟",
      "impact": "سيؤثر هذا على {count} شعبة",
      "confirm": "تطبيق",
      "cancel": "إلغاء"
    },
    "carryOver": {
      "title": "نسخ التوزيعات من ترم",
      "sourceYear": "السنة المصدر",
      "sourceTerm": "الترم المصدر",
      "options": {
        "includeAllocations": "تضمين توزيعات المعلمين"
      },
      "confirm": "نسخ",
      "success": "تم نسخ التوزيعات بنجاح"
    },
    "readOnlyBanner": "هذا الترم مغلق. توزيع المعلمين للعرض فقط.",
    "emptyState": {
      "noGrades": {
        "title": "لا توجد صفوف",
        "message": "يرجى إنشاء الصفوف في الهيكل الأكاديمي أولاً"
      },
      "noSubjects": {
        "title": "لا توجد مواد",
        "message": "يرجى إنشاء المواد في المواد وتوزيعها أولاً"
      },
      "noTeachers": {
        "title": "لا يوجد معلمون",
        "message": "يرجى إضافة معلمين إلى النظام أولاً"
      }
    }
  }
}
```

## Implementation Steps

### Phase 1: Foundation (Priority 1)
1. Create service layer with mock data
2. Add navigation item
3. Create page route
4. Add translation keys

### Phase 2: Matrix View (Priority 1)
1. Create FilterBar component
2. Create TeacherSelect component
3. Create AllocationMatrix with DataTable
4. Implement cell editing
5. Implement save/reset

### Phase 3: Bulk Actions (Priority 2)
1. Create BulkActionDialog
2. Implement "Apply to all sections"
3. Implement "Clear allocations"

### Phase 4: Validation (Priority 2)
1. Implement validation logic in service
2. Create ValidationPanel component
3. Add validation button and results display

### Phase 5: Load View (Priority 2)
1. Implement load calculation in service
2. Create TeacherLoadView component
3. Add KPI cards
4. Add load table with breakdown

### Phase 6: Carry Over (Priority 3)
1. Create CarryOverDialog
2. Implement carry over logic
3. Test cross-term copying

### Phase 7: Polish (Priority 3)
1. Add loading states
2. Add error handling
3. Optimize performance
4. Test RTL layout
5. Test read-only mode

## Testing Checklist

- [ ] Matrix loads correctly with sections and subjects
- [ ] Teacher select shows available teachers with load
- [ ] Saving allocations persists data
- [ ] Bulk "Apply to all sections" works
- [ ] Validation identifies missing assignments
- [ ] Load view calculates correctly
- [ ] Carry over copies allocations
- [ ] Read-only mode disables editing
- [ ] RTL layout works correctly
- [ ] Mobile responsive
- [ ] Filters work correctly
- [ ] URL params persist

## Notes

- Use existing DataTable component for matrix
- Use existing Select/Autocomplete for teacher selection
- Follow existing service patterns (mock data keyed by termId)
- Use global CSS tokens with fallbacks
- Keep RTL-safe with pinned columns
- Implement optimistic updates for better UX
