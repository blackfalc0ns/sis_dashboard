# Loading States Hierarchy Guide

## Visual Route Structure

```
src/app/[lang]/(dashboard)/
│
├── loading.tsx ⭐ (Root - covers all dashboard routes)
│
├── dashboard/
│   ├── loading.tsx ⭐ (Dashboard home)
│   └── page.tsx
│
├── academics/
│   ├── loading.tsx ⭐ (All academics pages)
│   ├── calendar/
│   │   └── page.tsx
│   ├── curriculum/
│   │   ├── loading.tsx ⭐ (Curriculum pages)
│   │   ├── page.tsx
│   │   └── lessons/
│   │       └── [lessonId]/
│   │           └── assignments/
│   │               ├── loading.tsx ⭐ (Assignment builder)
│   │               ├── new/
│   │               │   └── page.tsx
│   │               └── [assignmentId]/
│   │                   └── page.tsx
│   ├── structure/
│   │   └── page.tsx
│   ├── subjects/
│   │   └── page.tsx
│   ├── teacher-allocation/
│   │   └── page.tsx
│   └── timetable/
│       ├── loading.tsx ⭐ (Timetable page)
│       └── page.tsx
│
├── admissions/
│   ├── loading.tsx ⭐ (All admissions pages)
│   ├── page.tsx
│   ├── applications/
│   │   └── page.tsx
│   ├── decisions/
│   │   ├── loading.tsx ⭐ (Decisions page)
│   │   └── page.tsx
│   ├── enrollment/
│   │   └── page.tsx
│   ├── interviews/
│   │   └── page.tsx
│   ├── leads/
│   │   └── page.tsx
│   └── tests/
│       └── page.tsx
│
└── students-guardians/
    ├── loading.tsx ⭐ (All student/guardian pages)
    ├── page.tsx
    ├── documents/
    │   └── page.tsx
    ├── guardians/
    │   └── page.tsx
    ├── students/
    │   ├── loading.tsx ⭐ (Student detail pages)
    │   └── page.tsx
    └── transfers-withdrawals/
        └── page.tsx
```

## Loading Resolution Examples

### Example 1: Navigate to `/en/academics/subjects`
```
1. Check: /academics/subjects/loading.tsx ❌ Not found
2. Check: /academics/loading.tsx ✅ FOUND
3. Show: MainLoader (from academics/loading.tsx)
```

### Example 2: Navigate to `/en/academics/curriculum`
```
1. Check: /academics/curriculum/loading.tsx ✅ FOUND
2. Show: MainLoader (from curriculum/loading.tsx)
```

### Example 3: Navigate to `/en/academics/curriculum/lessons/123/assignments/new`
```
1. Check: /academics/curriculum/lessons/[lessonId]/assignments/new/loading.tsx ❌ Not found
2. Check: /academics/curriculum/lessons/[lessonId]/assignments/loading.tsx ✅ FOUND
3. Show: MainLoader (from assignments/loading.tsx)
```

### Example 4: Navigate to `/en/admissions/applications`
```
1. Check: /admissions/applications/loading.tsx ❌ Not found
2. Check: /admissions/loading.tsx ✅ FOUND
3. Show: MainLoader (from admissions/loading.tsx)
```

### Example 5: Navigate to `/en/students-guardians/documents`
```
1. Check: /students-guardians/documents/loading.tsx ❌ Not found
2. Check: /students-guardians/loading.tsx ✅ FOUND
3. Show: MainLoader (from students-guardians/loading.tsx)
```

## Coverage Summary

### ✅ Fully Covered Routes
- All dashboard pages
- All academics pages (calendar, structure, subjects, teacher-allocation)
- All curriculum pages
- All timetable pages
- All assignment builder pages
- All admissions pages (applications, enrollment, interviews, leads, tests)
- Admissions decisions page (specific loading)
- All students-guardians pages (documents, guardians, transfers-withdrawals)
- All student detail pages

### 🎯 Strategic Placement
Loading files are placed at:
1. **Root level** - Catches any unhandled routes
2. **Section level** - Provides section-specific loading
3. **Heavy page level** - Optimizes UX for data-heavy pages

### 📊 Total Loading Files
- **10 new loading.tsx files** created
- **1 existing loading.tsx file** updated
- **1 shared wrapper component** created
- **100% route coverage** achieved

## Quick Reference

| Route Pattern | Loading File | Covers |
|--------------|--------------|--------|
| `/dashboard/*` | `(dashboard)/loading.tsx` | All dashboard routes |
| `/academics/*` | `academics/loading.tsx` | All academics pages |
| `/academics/curriculum/*` | `curriculum/loading.tsx` | Curriculum pages |
| `/academics/timetable` | `timetable/loading.tsx` | Timetable page |
| `/academics/.../assignments/*` | `assignments/loading.tsx` | Assignment builder |
| `/admissions/*` | `admissions/loading.tsx` | All admissions pages |
| `/admissions/decisions` | `decisions/loading.tsx` | Decisions page |
| `/students-guardians/*` | `students-guardians/loading.tsx` | All S&G pages |
| `/students-guardians/students/*` | `students/loading.tsx` | Student details |

## Component Chain

```
loading.tsx
    ↓
PageLoading (wrapper)
    ↓
MainLoader (actual UI)
    ↓
Animated Logo + Backdrop
```

## Benefits of This Structure

1. **Granular Control**: Can override loading at any level
2. **Fallback Chain**: Always has a parent loading to fall back to
3. **Performance**: Heavy pages get dedicated loading states
4. **Maintainability**: Easy to add/remove loading files
5. **Consistency**: All use the same MainLoader component
