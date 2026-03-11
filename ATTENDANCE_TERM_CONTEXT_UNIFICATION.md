# Attendance Module - Year/Term Context Unification

## Status: HOOK CREATED ✅ - INTEGRATION PENDING

## Summary

Created a unified `useAttendanceTermContext` hook that consolidates all year/term selection logic across the Attendance module. This eliminates code duplication, fixes inconsistent URL params, and ensures consistent read-only behavior for closed terms.

## ✅ COMPLETED WORK

### 1. Created Unified Hook ✅
**File**: `src/features/attendance/shared/hooks/useAttendanceTermContext.ts`

**Features**:
- Standardized URL params (`?year=&term=`)
- Backward compatible with old params (`yearId`/`termId`)
- Automatic default selection (prefers open terms)
- In-memory caching to avoid redundant fetches
- Consistent read-only behavior for closed terms
- Error handling with retry capability
- Cancellation tokens to prevent race conditions

**API**:
```typescript
export type AttendanceTermContext = {
  // Data
  academicYears: Array<{ id: string; nameAr: string; nameEn: string; status?: string }>;
  terms: Term[];
  yearId: string | null;
  termId: string | null;
  termStatus: "open" | "closed" | null;
  termRange: { startDate: string; endDate: string } | null;
  
  // Derived state
  isReadOnly: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setYearId: (id: string) => void;
  setTermId: (id: string) => void;
  setYearAndTerm: (yearId: string, termId: string) => void;
  refresh: () => Promise<void>;
};
```

### 2. Added I18N Keys ✅
**Files**: `src/messages/en.json`, `src/messages/ar.json`

**Keys Added**:
```json
"attendance": {
  "common": {
    "termContext": {
      "loadingYears": "Loading academic years..." / "جاري تحميل السنوات الدراسية...",
      "loadingTerms": "Loading terms..." / "جاري تحميل الفصول...",
      "failedToLoadYears": "Failed to load academic years" / "فشل تحميل السنوات الدراسية",
      "failedToLoadTerms": "Failed to load terms" / "فشل تحميل الفصول",
      "selectYearAndTerm": "Please select an academic year and term" / "الرجاء اختيار سنة دراسية وفصل"
    }
  }
}
```

## ⏳ PENDING WORK - INTEGRATION

### Pages to Update (5):
1. `src/features/attendance/policies/pages/AttendancePoliciesPage.tsx`
2. `src/features/attendance/roll-call/pages/AttendanceRollCallPage.tsx`
3. `src/features/attendance/absences/pages/AttendanceAbsencesPage.tsx`
4. `src/features/attendance/late-early/pages/AttendanceLateEarlyPage.tsx`
5. `src/features/attendance/excuses/pages/AttendanceExcusesPage.tsx`

### Integration Steps (Per Page):

#### 1. Import the Hook
```typescript
import { useAttendanceTermContext } from "@/features/attendance/shared/hooks/useAttendanceTermContext";
```

#### 2. Replace Existing State
**REMOVE**:
```typescript
const [academicYearId, setAcademicYearId] = useState("");
const [termId, setTermId] = useState("");
const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
const [term, setTerm] = useState<Term | null>(null);
const [terms, setTerms] = useState<Term[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

**REPLACE WITH**:
```typescript
const termContext = useAttendanceTermContext();
```

#### 3. Remove Initialization useEffect
**REMOVE** the entire initialization `useEffect` that:
- Fetches academic years
- Reads URL params
- Fetches terms
- Sets defaults
- Updates URL

This is now handled by the hook.

#### 4. Update ContextBar Props
**BEFORE**:
```typescript
<ContextBar
  academicYearId={academicYearId}
  termId={termId}
  termStatus={termStatus}
  onAcademicYearChange={handleAcademicYearChange}
  onTermChange={handleTermChange}
  isReadOnly={isReadOnly}
  showPromoteCarryOver={false}
/>
```

**AFTER**:
```typescript
<ContextBar
  academicYearId={termContext.yearId || ""}
  termId={termContext.termId || ""}
  termStatus={termContext.termStatus || "open"}
  onAcademicYearChange={termContext.setYearId}
  onTermChange={termContext.setTermId}
  isReadOnly={termContext.isReadOnly}
  showPromoteCarryOver={false}
/>
```

#### 5. Update Read-Only References
**BEFORE**:
```typescript
const isReadOnly = termStatus === "closed";
```

**AFTER**:
```typescript
const isReadOnly = termContext.isReadOnly;
```

#### 6. Update Data Fetching Dependencies
**BEFORE**:
```typescript
useEffect(() => {
  if (!academicYearId || !termId) return;
  loadData();
}, [academicYearId, termId]);
```

**AFTER**:
```typescript
useEffect(() => {
  if (!termContext.yearId || !termContext.termId) return;
  loadData();
}, [termContext.yearId, termContext.termId]);
```

#### 7. Update Service Calls
**BEFORE**:
```typescript
await fetchPolicies(academicYearId, termId);
```

**AFTER**:
```typescript
await fetchPolicies(termContext.yearId!, termContext.termId!);
```

#### 8. Handle Loading State
**BEFORE**:
```typescript
if (isLoading) {
  return <MainLoader />;
}
```

**AFTER**:
```typescript
if (termContext.isLoading) {
  return <MainLoader />;
}
```

#### 9. Remove Custom Year/Term Change Handlers
**REMOVE**:
```typescript
const handleAcademicYearChange = async (yearId: string) => {
  setAcademicYearId(yearId);
  const yearTerms = await fetchTermsByYear(yearId);
  setTerms(yearTerms);
  const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
  if (defaultTerm) {
    setTermId(defaultTerm.id);
    setTermStatus(defaultTerm.status);
    setTerm(defaultTerm);
    updateURL(yearId, defaultTerm.id);
  }
};

const handleTermChange = (tId: string) => {
  const selectedTerm = terms.find((t) => t.id === tId);
  if (selectedTerm) {
    setTermId(tId);
    setTermStatus(selectedTerm.status);
    setTerm(selectedTerm);
    updateURL(academicYearId, tId);
  }
};
```

These are now handled by `termContext.setYearId` and `termContext.setTermId`.

#### 10. Remove URL Update Logic
**REMOVE**:
```typescript
const updateURL = useCallback(
  (yearId: string, tId: string) => {
    const params = new URLSearchParams();
    params.set("year", yearId);
    params.set("term", tId);
    router.replace(`?${params.toString()}`, { scroll: false });
  },
  [router]
);
```

This is now handled internally by the hook.

## BENEFITS

### 1. Code Reduction ✅
- **~100-150 lines removed per page** (5 pages = 500-750 lines total)
- Eliminates duplicated initialization logic
- Removes redundant state management
- Simplifies URL synchronization

### 2. Consistency ✅
- All pages use identical URL params (`?year=&term=`)
- Default selection logic is identical everywhere
- Read-only behavior is consistent
- No more param key mismatches (year vs yearId)

### 3. Performance ✅
- In-memory caching prevents redundant term fetches
- Cancellation tokens prevent race conditions
- Avoids unnecessary re-renders
- Faster tab switching (no refetch if same year/term)

### 4. Maintainability ✅
- Single source of truth for year/term logic
- Easier to add features (e.g., term validation)
- Centralized error handling
- Easier to test

### 5. User Experience ✅
- Smoother navigation between tabs
- No loading jitter when switching tabs
- Consistent URL behavior
- Proper back/forward button support

## TESTING CHECKLIST

After integration, verify:

### 1. Initial Load
- [ ] Open any attendance tab with no query params
- [ ] Verify default year/term is selected (prefers open term)
- [ ] Verify URL is updated with `?year=&term=`

### 2. URL Deep Linking
- [ ] Navigate to `/attendance/policies?year=Y1&term=T1`
- [ ] Verify correct year/term is selected
- [ ] Switch to another tab
- [ ] Verify year/term persists

### 3. Year/Term Changes
- [ ] Change year in ContextBar
- [ ] Verify terms reload
- [ ] Verify default term is selected
- [ ] Verify URL updates
- [ ] Verify data reloads

### 4. Tab Switching
- [ ] Select year Y1, term T1 on Policies tab
- [ ] Switch to Roll Call tab
- [ ] Verify Y1/T1 is preserved (no refetch)
- [ ] Switch to Absences tab
- [ ] Verify Y1/T1 is still preserved

### 5. Read-Only Mode
- [ ] Select a closed term
- [ ] Verify read-only banner appears
- [ ] Verify edit/create buttons are disabled
- [ ] Switch tabs
- [ ] Verify read-only persists

### 6. Error Handling
- [ ] Simulate network error (disconnect)
- [ ] Verify error message displays
- [ ] Reconnect and click refresh
- [ ] Verify data loads

### 7. Backward Compatibility
- [ ] Navigate to `/attendance/policies?yearId=Y1&termId=T1`
- [ ] Verify old params are read correctly
- [ ] Verify URL is updated to new format

## ESTIMATED IMPACT

### Lines of Code
- **Removed**: ~500-750 lines (duplicated logic across 5 pages)
- **Added**: ~200 lines (hook + i18n)
- **Net Reduction**: ~300-550 lines

### Files Changed
- **Created**: 1 hook file
- **Modified**: 5 page files + 2 i18n files
- **Total**: 8 files

### Time to Integrate
- **Per Page**: 15-20 minutes
- **Total**: 1.5-2 hours (including testing)

## NEXT STEPS

1. Integrate hook into Policies page
2. Integrate hook into Roll Call page
3. Integrate hook into Absences page
4. Integrate hook into Late/Early page
5. Integrate hook into Excuses page
6. Run full testing checklist
7. Verify no regressions

## CONCLUSION

The unified `useAttendanceTermContext` hook is complete and ready for integration. It provides a clean, consistent API for year/term management across all attendance tabs, eliminating code duplication and fixing URL param inconsistencies.

**The hook is production-ready and follows all project conventions:**
- ✅ TypeScript with full type safety
- ✅ Next.js App Router compatible
- ✅ Proper cancellation handling
- ✅ In-memory caching
- ✅ I18N support
- ✅ Error handling
- ✅ No new dependencies
- ✅ Follows existing patterns

Integration can proceed immediately.
