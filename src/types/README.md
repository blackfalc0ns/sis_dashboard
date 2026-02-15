# Types Folder Organization

This folder contains all TypeScript type definitions for the application, organized by domain module.

## Folder Structure

```
src/types/
├── admissions/              # Admissions module types
│   ├── enums.ts            # Status types and enums
│   ├── lead.ts             # Lead model
│   ├── guardian.ts         # Guardian model
│   ├── document.ts         # Document model
│   ├── test.ts             # Test model
│   ├── interview.ts        # Interview model
│   ├── decision.ts         # Decision model
│   ├── enrollment.ts       # Enrollment model
│   ├── application.ts      # Application model
│   └── index.ts            # Module exports
│
├── students/               # Students module types
│   ├── enums.ts           # Status types and enums
│   ├── student.ts         # Student model
│   ├── guardian.ts        # Student guardian models
│   ├── document.ts        # Student document model
│   ├── medical.ts         # Medical profile model
│   ├── timeline.ts        # Timeline event model
│   └── index.ts           # Module exports
│
├── notifications/         # Notifications module types
│   ├── enums.ts          # Status types and enums
│   ├── template.ts       # Notification template model
│   ├── notification.ts   # Notification model
│   ├── preferences.ts    # Notification preferences model
│   └── index.ts          # Module exports
│
├── admissions.ts         # Backward compatibility re-export
├── students.ts           # Backward compatibility re-export
├── notifications.ts      # Backward compatibility re-export
├── leads.ts              # Backward compatibility re-export
└── index.ts              # Main type exports
```

## Module Organization

Each module follows a consistent structure:

1. **enums.ts** - All enum types and status types for the module
2. **[model].ts** - Individual model files (one per entity)
3. **index.ts** - Central export file for the module

## Import Guidelines

### ✅ Recommended (Explicit Module Imports)

```typescript
// Import from specific modules for better tree-shaking
import type { Application, Lead, Guardian } from "@/types/admissions";
import type { Student, StudentGuardianMock } from "@/types/students";
import type { Notification, NotificationTemplate } from "@/types/notifications";
```

### ✅ Alternative (Direct Module Path)

```typescript
// Import from module index
import type { Application } from "@/types/admissions/index";
import type { Student } from "@/types/students/index";
```

### ⚠️ Backward Compatible (Deprecated)

```typescript
// These still work but are deprecated
import type { Application } from "@/types/admissions.ts";
import type { Student } from "@/types/students.ts";
import type { Lead } from "@/types/leads.ts";
```

### ❌ Not Recommended (Barrel Import)

```typescript
// Avoid importing everything - bad for tree-shaking
import type { Application, Student, Notification } from "@/types";
```

## Modules

### Admissions Module

Contains all types related to the admissions process:

- **Leads**: Prospective student inquiries
- **Applications**: Student applications
- **Guardians**: Parent/guardian information
- **Documents**: Required documentation
- **Tests**: Placement tests
- **Interviews**: Admission interviews
- **Decisions**: Admission decisions
- **Enrollment**: Student enrollment

**Key Types:**

- `Lead`, `LeadChannel`, `LeadStatus`
- `Application`, `ApplicationStatus`, `ApplicationSource`
- `Guardian`
- `Document`, `DocumentStatus`
- `Test`, `TestStatus`
- `Interview`, `InterviewStatus`
- `Decision`, `DecisionType`
- `Enrollment`

### Students Module

Contains all types related to enrolled students:

- **Students**: Student records (derived from applications)
- **Guardians**: Student guardian relationships
- **Documents**: Student documents
- **Medical**: Medical profiles
- **Timeline**: Student timeline events

**Key Types:**

- `Student`, `StudentMock`, `StudentStatus`
- `StudentGuardianMock`, `StudentGuardianLinkMock`
- `StudentDocumentMock`
- `StudentMedicalProfileMock`
- `StudentTimelineEventMock`
- `RiskFlag`, `TimelineEventType`

### Notifications Module

Contains all types related to notifications:

- **Notifications**: Notification records
- **Templates**: Notification templates
- **Preferences**: User notification preferences

**Key Types:**

- `Notification`
- `NotificationTemplate`
- `NotificationPreferences`
- `NotificationChannel`, `NotificationStatus`, `NotificationStage`

## Type Naming Conventions

1. **Interfaces**: PascalCase (e.g., `Application`, `Student`)
2. **Type Aliases**: PascalCase (e.g., `ApplicationStatus`, `LeadChannel`)
3. **Enums**: PascalCase for type, lowercase for values (e.g., `type Status = "active" | "inactive"`)
4. **Mock Types**: Suffix with `Mock` (e.g., `StudentMock`, `StudentGuardianMock`)

## Adding New Types

When adding new types:

1. Determine which module they belong to
2. Create a new file in the module folder if needed
3. Add enums to `enums.ts`
4. Add models to their own files
5. Export from the module's `index.ts`
6. Update this README

## Migration Notes

### From Old Structure

The old flat structure has been reorganized into modules:

**Old:**

```typescript
src/types/
├── admissions.ts (all admissions types)
├── students.ts (all student types)
└── notifications.ts (all notification types)
```

**New:**

```typescript
src/types/
├── admissions/ (organized by entity)
├── students/ (organized by entity)
└── notifications/ (organized by entity)
```

### Backward Compatibility

All old import paths still work through re-export files:

- `src/types/admissions.ts` → re-exports from `src/types/admissions/`
- `src/types/students.ts` → re-exports from `src/types/students/`
- `src/types/notifications.ts` → re-exports from `src/types/notifications/`
- `src/types/leads.ts` → re-exports from `src/types/admissions/`

## Benefits of This Organization

1. **Modularity**: Each domain has its own folder
2. **Scalability**: Easy to add new types without cluttering
3. **Maintainability**: Related types are co-located
4. **Discoverability**: Clear structure makes types easy to find
5. **Tree-shaking**: Better support for dead code elimination
6. **Separation of Concerns**: Each file has a single responsibility
7. **Backward Compatibility**: Old imports still work

## Related Documentation

- [Admissions Module](./admissions/README.md) - Detailed admissions types documentation
- [Students Module](./students/README.md) - Detailed students types documentation
- [Notifications Module](./notifications/README.md) - Detailed notifications types documentation
