# Leads Integrated into Admissions Types

## Summary

Successfully integrated Lead-related types into the admissions module structure. All lead types are now part of the unified admissions type system.

## Changes Made

### 1. Added Lead Types to Admissions Enums

**File**: `src/types/admissions/enums.ts`

Added new enum types:

- `LeadChannel`: "In-app" | "Referral" | "Walk-in" | "Other"
- `LeadStatus`: "New" | "Contacted" (already existed)
- `ActivityType`: "Call" | "WhatsApp" | "Email" | "Note" | "StatusChange"

### 2. Created Lead Model File

**File**: `src/types/admissions/lead.ts` (NEW)

Defined interfaces:

- `Lead`: Main lead model with contact info, channel, status, owner
- `ActivityLogItem`: Activity log entries for leads
- `Note`: Notes attached to leads
- `ApplicationDraft`: Draft applications linked to leads

### 3. Updated Admissions Index

**File**: `src/types/admissions/index.ts`

Added exports for:

- `LeadChannel`
- `ActivityType`
- `Lead`
- `ActivityLogItem`
- `Note`
- `ApplicationDraft`

### 4. Updated Leads Type File for Backward Compatibility

**File**: `src/types/leads.ts`

Changed from defining types to re-exporting from admissions:

```typescript
// @deprecated - Import from "@/types/admissions" instead
export type {
  Lead,
  LeadChannel,
  LeadStatus,
  ActivityType,
  ActivityLogItem,
  Note,
  ApplicationDraft,
} from "./admissions";
```

## Type Structure

### Lead Interface

```typescript
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  channel: LeadChannel;
  status: LeadStatus;
  owner: string;
  createdAt: string;
  gradeInterest?: string;
  source?: string;
  notes?: string;
}
```

### ActivityLogItem Interface

```typescript
interface ActivityLogItem {
  id: string;
  leadId: string;
  type: ActivityType;
  message: string;
  createdAt: string;
  createdBy: string;
}
```

### Note Interface

```typescript
interface Note {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  createdBy: string;
}
```

### ApplicationDraft Interface

```typescript
interface ApplicationDraft {
  id: string;
  leadId: string;
  studentName: string;
  gradeRequested?: string;
  status: "Draft";
  createdAt: string;
}
```

## Import Paths

### Recommended (New)

```typescript
import type { Lead, LeadChannel, LeadStatus } from "@/types/admissions";
```

### Backward Compatible (Deprecated)

```typescript
import type { Lead, LeadChannel, LeadStatus } from "@/types/leads";
```

Both import paths work, but the admissions path is recommended going forward.

## Benefits

1. **Unified Type System**: All admissions-related types (leads, applications, tests, interviews, decisions) are now in one module
2. **Better Organization**: Types are organized by domain in separate files
3. **Backward Compatibility**: Existing imports from `@/types/leads` still work
4. **Single Source of Truth**: Lead types are defined once in the admissions module
5. **Easier Maintenance**: All related types are co-located

## Files Modified

1. `src/types/admissions/enums.ts` - Added LeadChannel and ActivityType
2. `src/types/admissions/lead.ts` - Created new file with Lead models
3. `src/types/admissions/index.ts` - Added Lead type exports
4. `src/types/leads.ts` - Changed to re-export from admissions

## Verification

✅ All TypeScript files compile without errors
✅ No breaking changes to existing code
✅ Backward compatibility maintained

## Status

✅ **COMPLETE** - Lead types successfully integrated into admissions module
