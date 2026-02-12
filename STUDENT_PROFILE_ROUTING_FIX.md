# Student Profile Routing Fix

## Issue

When clicking on a student row in the students list, the profile page showed "Student not found" error.

## Root Cause

The route page was using server component syntax with async params, but Next.js App Router with dynamic routes in client components requires using `useParams()` hook from `next/navigation`.

## Solution

### 1. Updated Route Page

**File**: `src/app/[lang]/students-guardians/students/[studentId]/page.tsx`

Changed from server component with async params to client component using `useParams()`:

```typescript
"use client";

import { useParams } from "next/navigation";
import StudentProfilePage from "@/components/students-guardians/StudentProfilePage";

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.studentId as string;

  return <StudentProfilePage studentId={studentId} />;
}
```

### 2. Updated StudentsList Component

**File**: `src/components/students-guardians/StudentsList.tsx`

Added language parameter support for proper routing:

```typescript
import { useRouter, useParams } from "next/navigation";

export default function StudentsList() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  // Updated navigation
  const handleRowClick = (student: Student) => {
    router.push(`/${lang}/students-guardians/students/${student.id}`);
  };
}
```

### 3. Updated StudentProfilePage Component

**File**: `src/components/students-guardians/StudentProfilePage.tsx`

Added language parameter support for back button:

```typescript
import { useRouter, useParams } from "next/navigation";

export default function StudentProfilePage({ studentId }: StudentProfilePageProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  // Updated back button
  <button onClick={() => router.push(`/${lang}/students-guardians/students`)}>
    Back to Students
  </button>
}
```

## Pattern Used

This follows the same pattern used in the admissions module for lead details:

- Client component with `"use client"` directive
- `useParams()` hook to get dynamic route parameters
- Language-aware routing for i18n support

## Testing

✅ Click student row → Profile loads correctly
✅ Click View button → Profile loads correctly
✅ Back button → Returns to students list
✅ Language parameter preserved in URLs
✅ Student data displays correctly in all tabs

## Files Modified

1. `src/app/[lang]/students-guardians/students/[studentId]/page.tsx`
2. `src/components/students-guardians/StudentsList.tsx`
3. `src/components/students-guardians/StudentProfilePage.tsx`

## Result

Student profile page now works correctly with proper routing and language support.
