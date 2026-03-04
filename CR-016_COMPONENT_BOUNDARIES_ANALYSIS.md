# CR-016: Component Boundaries Analysis - Architecture Review

## Overview
Analysis of component boundaries and separation of concerns across the codebase to identify areas where container/presenter patterns could improve maintainability.

## Current Architecture Assessment

### Directory Structure
```
src/
├── app/[lang]/(dashboard)/**/page.tsx    # Route pages (thin wrappers)
├── components/
│   ├── ui/                                # Pure presentational components
│   ├── layout/                            # Layout components
│   ├── features/                          # Feature-specific components
│   │   ├── students-guardians/
│   │   ├── dashboard/
│   │   └── academics/
│   └── shared/                            # Shared components
├── features/
│   ├── admissions/                        # Admissions feature module
│   └── academics/                         # Academics feature module
└── services/                              # Data/business logic layer
```

### Current Patterns Observed

#### ✅ Good Patterns (Already Implemented)

1. **Thin Page Components**
   - Pages act as route handlers only
   - Delegate to feature components
   - No business logic in pages
   
   ```tsx
   // src/app/[lang]/(dashboard)/students-guardians/page.tsx
   export default function StudentsGuardiansPage() {
     return (
       <main className="flex-1 p-4 sm:p-6">
         <StudentsGuardiansDashboard />
       </main>
     );
   }
   ```

2. **Service Layer Separation**
   - Business logic in `/services`
   - Data fetching abstracted
   - Reusable across components
   
   ```tsx
   // Services handle data operations
   import * as studentsService from "@/services/studentsService";
   const allStudents = studentsService.getStudentsWithEnrollment();
   ```

3. **Pure UI Components**
   - `/components/ui` contains presentational components
   - No business logic
   - Reusable across features
   
   Examples: `DataTable`, `Button`, `KPICard`, `Modal`

4. **Feature Modules**
   - Features organized by domain
   - Self-contained with own components, types, utils
   - Clear boundaries between features

#### ⚠️ Areas for Improvement

1. **Mixed Concerns in Dashboard Components**
   
   **Issue**: Dashboard components mix data fetching, state management, filtering logic, and presentation.
   
   **Example**: `StudentsGuardiansDashboard.tsx`
   - 300+ lines mixing concerns
   - Data filtering logic
   - KPI calculations
   - State management
   - Presentation markup
   
   ```tsx
   // All in one component:
   const [filterValues, setFilterValues] = useState(...);
   const allStudents = studentsService.getStudentsWithEnrollment();
   const filteredStudents = useMemo(() => { /* filtering logic */ }, []);
   const stats = useMemo(() => { /* KPI calculations */ }, []);
   return <div>{/* 200+ lines of JSX */}</div>
   ```

2. **Complex Calculation Logic in Components**
   
   **Issue**: Business logic embedded in component files
   
   Examples:
   - KPI calculations in dashboard components
   - Date range filtering logic
   - Data transformations
   - Risk distribution calculations

3. **Large Component Files**
   
   **Issue**: Some components exceed 300-400 lines
   
   Files:
   - `StudentsGuardiansDashboard.tsx` - 350+ lines
   - `AdmissionsDashboardContent.tsx` - 400+ lines
   - `ApplicationDetailsPage.tsx` - 300+ lines

## Recommended Architecture Pattern

### Container/Presenter Split

#### Container Components (Smart Components)
**Responsibilities:**
- Data fetching
- State management
- Business logic
- Event handlers
- Passing props to presenters

**Location:** `src/features/[feature]/containers/`

#### Presenter Components (Dumb Components)
**Responsibilities:**
- Rendering UI
- Receiving props
- Emitting events
- No business logic
- No state (except UI state)

**Location:** `src/features/[feature]/components/`

### Proposed Refactoring Example

#### Before (Mixed Concerns)
```tsx
// src/components/features/students-guardians/components/pages/StudentsGuardiansDashboard.tsx
export default function StudentsGuardiansDashboard() {
  const [filterValues, setFilterValues] = useState(...);
  const allStudents = studentsService.getStudentsWithEnrollment();
  
  const filteredStudents = useMemo(() => {
    // 30 lines of filtering logic
  }, [allStudents, filterValues]);
  
  const stats = useMemo(() => {
    // 50 lines of KPI calculations
  }, [filteredStudents]);
  
  const riskDistribution = useMemo(() => {
    // 20 lines of risk calculations
  }, [filteredStudents]);
  
  return (
    <div>
      {/* 200+ lines of JSX */}
    </div>
  );
}
```

#### After (Separated Concerns)

**1. Container Component**
```tsx
// src/features/students-guardians/containers/StudentsGuardiansDashboardContainer.tsx
"use client";

import { useState, useMemo } from "react";
import * as studentsService from "@/services/studentsService";
import { calculateStudentStats, calculateRiskDistribution } from "@/utils/studentUtils";
import { filterStudentsByDateRange } from "@/utils/dateFilters";
import StudentsGuardiansDashboardView from "../components/StudentsGuardiansDashboardView";
import type { ChartFilterValues } from "../types";

export default function StudentsGuardiansDashboardContainer() {
  // State management
  const [filterValues, setFilterValues] = useState<ChartFilterValues>({
    academicYear: "all",
    term: "all",
    dateRange: "all",
  });

  // Data fetching
  const allStudents = useMemo(
    () => studentsService.getStudentsWithEnrollment(),
    []
  );

  // Data transformation
  const filteredStudents = useMemo(
    () => filterStudentsByDateRange(allStudents, filterValues),
    [allStudents, filterValues]
  );

  // Business logic
  const stats = useMemo(
    () => calculateStudentStats(filteredStudents),
    [filteredStudents]
  );

  const riskDistribution = useMemo(
    () => calculateRiskDistribution(filteredStudents),
    [filteredStudents]
  );

  // Filter options
  const { academicYears, terms } = useMemo(() => {
    const years = new Set(allStudents.map(s => s.enrollment?.academicYear).filter(Boolean));
    const termSet = new Set(allStudents.map(s => s.currentTerm?.term).filter(Boolean));
    return {
      academicYears: Array.from(years).sort(),
      terms: Array.from(termSet).sort(),
    };
  }, [allStudents]);

  // Event handlers
  const handleFilterChange = (newFilters: ChartFilterValues) => {
    setFilterValues(newFilters);
  };

  // Pass everything to presenter
  return (
    <StudentsGuardiansDashboardView
      stats={stats}
      riskDistribution={riskDistribution}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      academicYears={academicYears}
      terms={terms}
    />
  );
}
```

**2. Presenter Component**
```tsx
// src/features/students-guardians/components/StudentsGuardiansDashboardView.tsx
import { Users, UserCheck, AlertTriangle, TrendingUp, GraduationCap, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import ChartFilter from "../shared/ChartFilter";
import AbsenceHeatmap from "../charts/AbsenceHeatmap";
import StudentsByStatusChart from "../charts/StudentsByStatusChart";
import type { StudentStats, RiskDistribution, ChartFilterValues } from "../types";

interface StudentsGuardiansDashboardViewProps {
  stats: StudentStats;
  riskDistribution: RiskDistribution;
  filterValues: ChartFilterValues;
  onFilterChange: (values: ChartFilterValues) => void;
  academicYears: string[];
  terms: string[];
}

export default function StudentsGuardiansDashboardView({
  stats,
  riskDistribution,
  filterValues,
  onFilterChange,
  academicYears,
  terms,
}: StudentsGuardiansDashboardViewProps) {
  const t = useTranslations("students_guardians.overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      {/* Chart Filter */}
      <ChartFilter
        values={filterValues}
        onChange={onFilterChange}
        academicYears={academicYears}
        terms={terms}
        showAdvancedFilters={true}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={t("kpis.total_students")}
          value={stats.total}
          subtitle={t("kpis.active_count", { count: stats.active })}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={stats.totalTrend}
          chartColor="#3b82f6"
        />
        {/* More KPI cards... */}
      </div>

      {/* Risk Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t("risk.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk cards... */}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsByStatusChart />
        <StudentsByGradeChart />
      </div>
    </div>
  );
}
```

**3. Utility Functions**
```tsx
// src/utils/studentUtils.ts
import type { Student, StudentStats, RiskDistribution } from "@/types/students";

export function calculateStudentStats(students: Student[]): StudentStats {
  const total = students.length;
  const active = students.filter(s => s.status === "Active").length;
  const suspended = students.filter(s => s.status === "Suspended").length;
  const withdrawn = students.filter(s => s.status === "Withdrawn").length;
  const atRisk = students.filter(s => s.ytdPerformance?.riskFlags.length > 0).length;

  // Calculate averages
  const studentsWithAttendance = students.filter(s => s.ytdPerformance?.attendance);
  const avgAttendance = studentsWithAttendance.length > 0
    ? Math.round(
        studentsWithAttendance.reduce((sum, s) => sum + (s.ytdPerformance?.attendance || 0), 0) /
        studentsWithAttendance.length
      )
    : 0;

  const studentsWithGrades = students.filter(s => s.ytdPerformance?.gradeAverage);
  const avgGrade = studentsWithGrades.length > 0
    ? Math.round(
        studentsWithGrades.reduce((sum, s) => sum + (s.ytdPerformance?.gradeAverage || 0), 0) /
        studentsWithGrades.length
      )
    : 0;

  return {
    total,
    active,
    suspended,
    withdrawn,
    atRisk,
    avgAttendance,
    avgGrade,
    totalTrend: generateTrendData(total),
    activeTrend: generateTrendData(active),
    atRiskTrend: generateTrendData(atRisk),
  };
}

export function calculateRiskDistribution(students: Student[]): RiskDistribution {
  const distribution = {
    attendance: 0,
    grades: 0,
    behavior: 0,
  };

  students.forEach(student => {
    student.ytdPerformance?.riskFlags?.forEach(flag => {
      if (flag === "attendance") distribution.attendance++;
      if (flag === "grades") distribution.grades++;
      if (flag === "behavior") distribution.behavior++;
    });
  });

  return distribution;
}

function generateTrendData(currentValue: number) {
  return [
    { label: "M1", value: Math.max(0, currentValue - 30) },
    { label: "M2", value: Math.max(0, currentValue - 20) },
    { label: "M3", value: Math.max(0, currentValue - 10) },
    { label: "M4", value: currentValue },
  ];
}
```

## Benefits of Container/Presenter Pattern

### 1. Separation of Concerns
✅ Business logic separated from presentation
✅ Easier to understand component responsibilities
✅ Clear data flow

### 2. Testability
✅ Test business logic independently (containers)
✅ Test UI rendering independently (presenters)
✅ Mock data easily for presenter tests

### 3. Reusability
✅ Presenters can be reused with different data sources
✅ Business logic can be shared across components
✅ Easier to create variations

### 4. Maintainability
✅ Smaller, focused files
✅ Easier to locate and fix bugs
✅ Reduced cognitive load

### 5. Performance
✅ Easier to optimize re-renders
✅ Clear memoization boundaries
✅ Better React.memo opportunities

## Implementation Priority

### High Priority (Complex Dashboards)
1. ✅ `StudentsGuardiansDashboard` - 350+ lines, complex filtering
2. ✅ `AdmissionsDashboardContent` - 400+ lines, multiple calculations
3. ✅ `ApplicationDetailsPage` - 300+ lines, mixed concerns

### Medium Priority (Feature Pages)
4. `InterviewDetailsPage` - 250+ lines
5. `TestDetailsPage` - 250+ lines
6. `LeadDetailsPage` - 200+ lines

### Low Priority (Simple Pages)
7. List pages (already relatively clean)
8. Simple detail pages
9. Modal components

## Refactoring Strategy

### Phase 1: Extract Business Logic
1. Move calculations to utility functions
2. Move data transformations to services
3. Keep components focused on rendering

### Phase 2: Create Container Components
1. Identify components with mixed concerns
2. Extract state management to containers
3. Create presenter components for UI

### Phase 3: Optimize and Test
1. Add unit tests for utilities
2. Add component tests for presenters
3. Optimize re-renders with React.memo

## File Organization

### Proposed Structure
```
src/features/[feature]/
├── containers/              # Container components (smart)
│   ├── DashboardContainer.tsx
│   └── DetailsContainer.tsx
├── components/              # Presenter components (dumb)
│   ├── DashboardView.tsx
│   ├── DetailsView.tsx
│   ├── KPISection.tsx
│   └── ChartsSection.tsx
├── hooks/                   # Custom hooks
│   ├── useStudentFilters.ts
│   └── useStudentStats.ts
├── utils/                   # Business logic utilities
│   ├── calculations.ts
│   ├── filters.ts
│   └── transformers.ts
├── types/                   # TypeScript types
│   └── index.ts
└── index.ts                 # Public exports
```

## Custom Hooks Pattern

### Alternative to Containers
For simpler cases, custom hooks can separate logic:

```tsx
// src/features/students-guardians/hooks/useStudentDashboard.ts
export function useStudentDashboard() {
  const [filterValues, setFilterValues] = useState<ChartFilterValues>({
    academicYear: "all",
    term: "all",
  });

  const allStudents = useMemo(
    () => studentsService.getStudentsWithEnrollment(),
    []
  );

  const filteredStudents = useMemo(
    () => filterStudentsByDateRange(allStudents, filterValues),
    [allStudents, filterValues]
  );

  const stats = useMemo(
    () => calculateStudentStats(filteredStudents),
    [filteredStudents]
  );

  return {
    stats,
    filterValues,
    setFilterValues,
    // ... other data
  };
}

// Component becomes simpler
export default function StudentsGuardiansDashboard() {
  const {
    stats,
    filterValues,
    setFilterValues,
  } = useStudentDashboard();

  return (
    <StudentsGuardiansDashboardView
      stats={stats}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
    />
  );
}
```

## Best Practices

### 1. Keep Presenters Pure
```tsx
// ✅ Good - Pure presenter
interface Props {
  data: Data;
  onAction: () => void;
}

function Presenter({ data, onAction }: Props) {
  return <div onClick={onAction}>{data.value}</div>;
}

// ❌ Bad - Mixed concerns
function Component() {
  const [data, setData] = useState();
  const fetchData = async () => { /* ... */ };
  
  useEffect(() => { fetchData(); }, []);
  
  return <div>{data?.value}</div>;
}
```

### 2. Use TypeScript Interfaces
```tsx
// Define clear contracts
interface DashboardViewProps {
  stats: StudentStats;
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
}
```

### 3. Colocate Related Code
```tsx
// Keep related components together
src/features/students/
├── containers/
│   └── DashboardContainer.tsx
├── components/
│   ├── DashboardView.tsx
│   ├── StatsSection.tsx
│   └── ChartsSection.tsx
└── utils/
    └── calculations.ts
```

### 4. Use Composition
```tsx
// Break down large components
<DashboardView>
  <HeaderSection />
  <FilterSection />
  <StatsSection stats={stats} />
  <ChartsSection data={data} />
</DashboardView>
```

## Migration Checklist

### For Each Component
- [ ] Identify mixed concerns
- [ ] Extract business logic to utilities
- [ ] Create TypeScript interfaces
- [ ] Create container component
- [ ] Create presenter component
- [ ] Add unit tests for utilities
- [ ] Add component tests for presenter
- [ ] Update imports
- [ ] Verify functionality
- [ ] Check performance

## Status

### Current State
⚠️ **Mixed Concerns** - Dashboard components mix data, logic, and presentation
⚠️ **Large Files** - Some components exceed 300-400 lines
⚠️ **Difficult Testing** - Business logic embedded in components
⚠️ **Reusability Limited** - Hard to reuse logic or UI separately

### Recommended Actions
1. ✅ Extract business logic to utility functions
2. ✅ Create container/presenter splits for complex dashboards
3. ✅ Use custom hooks for simpler cases
4. ✅ Add TypeScript interfaces for props
5. ✅ Write tests for separated concerns

### Benefits After Refactoring
✅ Clearer separation of concerns
✅ Easier to test
✅ Better reusability
✅ Improved maintainability
✅ Smaller, focused files
✅ Better performance optimization opportunities

## Conclusion

The codebase has a good foundation with:
- Thin page components
- Service layer separation
- Pure UI components
- Feature modules

However, dashboard and detail page components would benefit from container/presenter pattern to:
- Separate business logic from presentation
- Improve testability
- Enhance maintainability
- Enable better performance optimization

Recommended approach:
1. Start with high-priority complex dashboards
2. Extract business logic to utilities first
3. Create container/presenter splits
4. Add tests for separated concerns
5. Gradually refactor other components

This is a medium-severity issue that should be addressed incrementally to avoid disrupting current functionality while improving long-term maintainability.
